import { AppState } from 'react-native';

import {
  clearLocalKeys,
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
import { createChangeSignal } from '@/lib/change-signal';
import { refreshReminders } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';
import {
  addToOutbox,
  diffItems,
  mergeRemote,
  queuePhotoChanges,
  removeFromOutbox,
  type RemoteRow,
  type SyncItem,
} from '@/lib/sync-logic';

const TABLE = 'user_items';
const PHOTO_BUCKET = 'pet-photos';
const PAGE_SIZE = 1000;
const PUSH_CHUNK = 200;
const DEBOUNCE_MS = 1500;
// Aynı anda yazılan satırlar kaçmasın diye son görülen zamanın biraz gerisinden okunur.
const CURSOR_OVERLAP_MS = 5000;
const SIGNED_URL_SECONDS = 300;

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
    if (owner) {
      // Başka hesabın kayıtları karışmasın.
      await clearLocalKeys();
      deleteAllPetPhotos();
    } else {
      // Hesap açılmadan önce girilen kayıtlar bu hesaba geçer.
      const now = new Date().toISOString();
      let outbox = await readOutbox();
      for (const name of COLLECTION_NAMES) {
        outbox = addToOutbox(outbox, diffItems(name, [], await readCollection(name), now));
      }
      await writeOutbox(outbox);
      const pets = await readCollection<SyncItem & { photo: string | null }>('pets');
      await writePhotoQueue(queuePhotoChanges(await readPhotoQueue(), [], pets));
    }
    await writeOwner(userId);
  });
}

async function applyRemote(rows: RemoteRow[]) {
  return runExclusive(async () => {
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

async function pull() {
  const cursor = await readCursor();
  const since = cursor ? new Date(Date.parse(cursor) - CURSOR_OVERLAP_MS).toISOString() : null;
  let changed = false;
  let newest = cursor;

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from(TABLE)
      .select('collection, id, data, deleted, updated_at, synced_at')
      .order('synced_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (since) {
      query = query.gt('synced_at', since);
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    const rows = data as (RemoteRow & { synced_at: string })[];
    if (rows.length > 0) {
      changed = (await applyRemote(rows)) || changed;
      newest = rows[rows.length - 1].synced_at;
    }
    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  if (newest) {
    await writeCursor(newest);
  } else {
    // Sunucuda hiç kayıt yok. Yine de bir kez okundu sayılır.
    await writeCursor(new Date(0).toISOString());
  }
  return changed;
}

async function push(userId: string) {
  const pending = Object.values(await readOutbox());
  for (let start = 0; start < pending.length; start += PUSH_CHUNK) {
    const chunk = pending.slice(start, start + PUSH_CHUNK);
    const { error } = await supabase.from(TABLE).upsert(
      chunk.map((change) => ({
        owner_id: userId,
        collection: change.collection,
        id: change.id,
        data: change.data,
        deleted: change.data === null,
        updated_at: change.updatedAt,
      })),
    );
    if (error) {
      throw error;
    }
    await runExclusive(async () => {
      await writeOutbox(removeFromOutbox(await readOutbox(), chunk));
    });
  }
}

async function syncPhotos(userId: string) {
  const storage = supabase.storage.from(PHOTO_BUCKET);
  const pathOf = (name: string) => `${userId}/${name}`;
  const { upload, remove } = await readPhotoQueue();

  for (const name of upload) {
    if (petPhotoExists(name)) {
      const { error } = await storage.upload(pathOf(name), await readPetPhotoBytes(name), {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (error) {
        throw error;
      }
    }
    await runExclusive(async () => {
      const current = await readPhotoQueue();
      await writePhotoQueue({ ...current, upload: current.upload.filter((item) => item !== name) });
    });
  }

  if (remove.length > 0) {
    const { error } = await storage.remove(remove.map(pathOf));
    if (error) {
      throw error;
    }
    await runExclusive(async () => {
      const current = await readPhotoQueue();
      await writePhotoQueue({
        ...current,
        remove: current.remove.filter((item) => !remove.includes(item)),
      });
    });
  }

  // Başka telefondan gelen ya da yeniden girişte eksik kalan fotoğraflar indirilir.
  const pets = await readCollection<SyncItem & { photo: string | null }>('pets');
  let downloaded = false;
  for (const { photo } of pets) {
    if (photo && !petPhotoExists(photo)) {
      const { data, error } = await storage.createSignedUrl(pathOf(photo), SIGNED_URL_SECONDS);
      // Diğer telefon fotoğrafı henüz yüklememiş olabilir, sonraki eşitlemede yine bakılır.
      if (!error && data) {
        await downloadPetPhoto(data.signedUrl, photo);
        downloaded = true;
      }
    }
  }
  return downloaded;
}

async function runCycle() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return;
  }
  const userId = session.user.id;

  await bindOwner(userId);
  // Önce okunur: telefondaki eski bir değişiklik sunucudaki yenisinin üstüne yazılmasın.
  const pulled = await pull();
  await push(userId);
  const downloaded = await syncPhotos(userId);

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

export async function clearLocalData() {
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
  // Oturum olayının içinden Supabase çağrılmamalı, bu yüzden sonraya bırakılır.
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      setTimeout(syncNow, 0);
    }
  });

  syncNow();

  return () => {
    clearTimeout(timer);
    unsubscribeLocal();
    appState.remove();
    subscription.unsubscribe();
  };
}
