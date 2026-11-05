import { AppState } from 'react-native';

import {
  clearLocalKeys,
  clearOwnership,
  COLLECTION_NAMES,
  notifyDataChanged,
  readCollection,
  readCursor,
  readOutbox,
  readOwner,
  readPhotoQueue,
  runExclusive,
  subscribeToLocalChanges,
  writeCollection,
  writeCursor,
  writeOutbox,
  writeOwner,
  writePhotoQueue,
  type CollectionName,
} from '@/data/local-store';
import {
  deleteAllPetPhotos,
  downloadPetPhoto,
  petPhotoExists,
  readPetPhotoBytes,
} from '@/data/pet-photo-storage';
import { API_URL, ApiError, apiRequest, authHeaders } from '@/lib/api';
import { createChangeSignal } from '@/lib/change-signal';
import { refreshReminders } from '@/lib/reminders';
import { getSession, subscribeToSession } from '@/lib/session';
import {
  addToOutbox,
  diffItems,
  mergeRemote,
  queuePhotoChanges,
  removeFromOutbox,
  type Outbox,
  type RemoteRow,
  type SyncItem,
} from '@/lib/sync-logic';

const PAGE_SIZE = 1000;
const PUSH_CHUNK = 200;
const DEBOUNCE_MS = 1500;
// Aynı anda yazılan satırlar kaçmasın diye son görülen zamanın biraz gerisinden okunur.
const CURSOR_OVERLAP_MS = 5000;

type PulledPage = {
  items: (RemoteRow & { synced_at: string })[];
  next: string | null;
};

export type SyncStatus = {
  isSyncing: boolean;
  // Sunucuya henüz gitmemiş değişiklik sayısı.
  pendingCount: number;
  hasError: boolean;
  // Bu hesabın kayıtları en az bir kez sunucudan okundu mu?
  hasPulled: boolean;
};

let status: SyncStatus = { isSyncing: false, pendingCount: 0, hasError: false, hasPulled: false };

const statusChanges = createChangeSignal();
export const subscribeToSyncStatus = statusChanges.subscribe;

export function getSyncStatus() {
  return status;
}

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  statusChanges.notify();
}

async function countPending() {
  const [outbox, photos] = await Promise.all([readOutbox(), readPhotoQueue()]);
  return Object.keys(outbox).length + photos.upload.length + photos.remove.length;
}

// Telefondaki kayıtları giriş yapan hesapla eşleştirir.
async function bindOwner(userId: string) {
  await runExclusive(async () => {
    const owner = await readOwner();
    if (owner === userId) {
      return;
    }
    // Girişte kullanıcıya sorulur (isLocalDataOfAnotherAccount). Buraya düşerse kayıt silinmez,
    // eşitleme durur: yanlış hesaba gönderilmez, sessizce de kaybolmaz.
    if (owner) {
      throw new Error('Telefondaki kayıtlar başka hesaba ait');
    }
    // Hesap açılmadan önce girilen kayıtlar bu hesaba geçer.
    const now = new Date().toISOString();
    let outbox = await readOutbox();
    for (const name of COLLECTION_NAMES) {
      outbox = addToOutbox(outbox, diffItems(name, [], await readCollection(name), now));
    }
    await writeOutbox(outbox);
    const pets = await readCollection<SyncItem & { photo: string | null }>('pets');
    await writePhotoQueue(queuePhotoChanges(await readPhotoQueue(), [], pets));
    await writeOwner(userId);
  });
}

// Eşitleme sürerken hesap değiştiyse eski hesabın verisi telefona yazılmaz.
async function assertOwner(userId: string) {
  if ((await readOwner()) !== userId) {
    throw new Error('Eşitleme sırasında hesap değişti');
  }
}

async function applyRemote(rows: RemoteRow[], userId: string) {
  return runExclusive(async () => {
    await assertOwner(userId);
    let outbox = await readOutbox();
    let changed = false;

    for (const name of COLLECTION_NAMES) {
      const own = rows.filter((row) => row.collection === name);
      if (own.length === 0) {
        continue;
      }
      const merged = mergeRemote(name, await readCollection(name), own, outbox);
      outbox = merged.outbox;
      if (merged.changed) {
        await writeCollection(name as CollectionName, merged.items);
        changed = true;
      }
    }
    await writeOutbox(outbox);
    return changed;
  });
}

async function pull(userId: string) {
  const cursor = await readCursor();
  const since = cursor ? new Date(Date.parse(cursor) - CURSOR_OVERLAP_MS).toISOString() : null;
  let changed = false;
  let newest = cursor;
  let after: string | null = null;

  do {
    const position: string = after
      ? `&after=${encodeURIComponent(after)}`
      : since
        ? `&since=${encodeURIComponent(since)}`
        : '';
    const page: PulledPage = await apiRequest<PulledPage>(`/v1/items?limit=${PAGE_SIZE}${position}`);
    if (page.items.length > 0) {
      changed = (await applyRemote(page.items, userId)) || changed;
      newest = page.items[page.items.length - 1].synced_at;
    }
    after = page.next;
  } while (after);

  await runExclusive(async () => {
    await assertOwner(userId);
    // Sunucuda hiç kayıt yoksa da bir kez okundu sayılır.
    await writeCursor(newest ?? new Date(0).toISOString());
  });
  return changed;
}

type OutboxChange = Outbox[string];

async function sendChanges(changes: OutboxChange[]) {
  try {
    await apiRequest('/v1/items', {
      method: 'PUT',
      body: {
        items: changes.map((change) => ({
          collection: change.collection,
          id: change.id,
          data: change.data,
          updated_at: change.updatedAt,
        })),
      },
    });
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 413)) {
      throw error;
    }
    // Sunucunun kabul etmediği tek bir kayıt, diğerlerinin yedeklenmesini sonsuza dek durdurmasın.
    // O kayıt telefonda kalır, yalnızca yedeklenmez.
    if (changes.length === 1) {
      console.warn('Kayıt sunucuya gönderilemedi', changes[0].collection, error.code);
      return;
    }
    for (const change of changes) {
      await sendChanges([change]);
    }
  }
}

async function push() {
  const pending = Object.values(await readOutbox());
  for (let start = 0; start < pending.length; start += PUSH_CHUNK) {
    const chunk = pending.slice(start, start + PUSH_CHUNK);
    await sendChanges(chunk);
    await runExclusive(async () => {
      await writeOutbox(removeFromOutbox(await readOutbox(), chunk));
    });
  }
}

const photoPath = (name: string) => `/v1/photos/${encodeURIComponent(name)}`;

async function syncPhotos(token: string) {
  const { upload, remove } = await readPhotoQueue();

  for (const name of upload) {
    if (petPhotoExists(name)) {
      const photo = await readPetPhotoBytes(name);
      // Tarayıcı önizlemesinde dosya sistemi yok, boş döner. Telefonda dosya her zaman doludur.
      if (photo.byteLength > 0) {
        await apiRequest(photoPath(name), { method: 'PUT', photo });
      }
    }
    await runExclusive(async () => {
      const current = await readPhotoQueue();
      await writePhotoQueue({ ...current, upload: current.upload.filter((item) => item !== name) });
    });
  }

  for (const name of remove) {
    await apiRequest(photoPath(name), { method: 'DELETE' });
    await runExclusive(async () => {
      const current = await readPhotoQueue();
      await writePhotoQueue({ ...current, remove: current.remove.filter((item) => item !== name) });
    });
  }

  // Başka telefondan gelen ya da yeniden girişte eksik kalan fotoğraflar indirilir.
  const pets = await readCollection<SyncItem & { photo: string | null }>('pets');
  let downloaded = false;
  for (const { photo } of pets) {
    if (photo && !petPhotoExists(photo)) {
      try {
        await downloadPetPhoto(`${API_URL}${photoPath(photo)}`, photo, authHeaders(token));
        downloaded = true;
      } catch (error) {
        // Diğer telefon fotoğrafı henüz yüklememiş olabilir, sonraki eşitlemede yine bakılır.
        console.warn('Fotoğraf indirilemedi', error);
      }
    }
  }
  return downloaded;
}

async function runCycle() {
  const session = await getSession();
  if (!session) {
    return;
  }

  await bindOwner(session.user.id);
  // Önce okunur: telefondaki eski bir değişiklik sunucudaki yenisinin üstüne yazılmasın.
  const pulled = await pull(session.user.id);
  await push();
  const downloaded = await syncPhotos(session.token);

  setStatus({ hasPulled: true });
  if (pulled || downloaded) {
    notifyDataChanged();
  }
  if (pulled) {
    await refreshReminders();
  }
}

let running: Promise<void> | null = null;
let runAgain = false;

// Aynı anda tek eşitleme çalışır. Hata verirse değişiklikler bekler, bir sonrakinde yeniden denenir.
export function syncNow(): Promise<void> {
  if (running) {
    runAgain = true;
    return running;
  }
  running = (async () => {
    setStatus({ isSyncing: true });
    try {
      do {
        runAgain = false;
        await runCycle();
      } while (runAgain);
      setStatus({ hasError: false });
    } catch (error) {
      console.warn('Eşitleme tamamlanamadı', error);
      setStatus({ hasError: true });
    } finally {
      running = null;
      setStatus({ isSyncing: false, pendingCount: await countPending() });
    }
  })();
  return running;
}

// Çıkıştan önce son kez gönderir. Gönderilemeyen değişiklik sayısını döner.
export async function flushBeforeSignOut() {
  await syncNow();
  return countPending();
}

async function waitForRunningSync() {
  while (running) {
    await running;
  }
}

// Telefondaki kayıtlar başka bir hesaba mı ait?
export async function isLocalDataOfAnotherAccount(userId: string) {
  const owner = await readOwner();
  return owner !== null && owner !== userId;
}

// Kayıtlar telefonda kalır, sonraki girişte o hesaba aktarılır.
export async function releaseLocalData() {
  await waitForRunningSync();
  await runExclusive(clearOwnership);
}

export async function clearLocalData() {
  // Süren eşitleme, silinen kayıtları geri yazmasın.
  await waitForRunningSync();
  await runExclusive(async () => {
    await clearLocalKeys();
    deleteAllPetPhotos();
  });
  setStatus({ pendingCount: 0, hasError: false, hasPulled: false });
  notifyDataChanged();
  await refreshReminders();
}

// Uygulama açıkken eşitlemeyi çalıştırır: açılışta, girişte, geri dönüşte ve kayıt değişince.
export function startSync() {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribeLocal = subscribeToLocalChanges(() => {
    clearTimeout(timer);
    timer = setTimeout(syncNow, DEBOUNCE_MS);
  });
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      syncNow();
    }
  });
  // Giriş yapılınca hemen eşitlenir. Çıkışta oturum olmadığı için eşitleme zaten bir şey yapmaz.
  const unsubscribeSession = subscribeToSession(() => {
    syncNow();
  });

  syncNow();

  return () => {
    clearTimeout(timer);
    unsubscribeLocal();
    appState.remove();
    unsubscribeSession();
  };
}
