import AsyncStorage from '@react-native-async-storage/async-storage';

import { createChangeSignal } from '@/lib/change-signal';
import {
  addToOutbox,
  diffItems,
  queuePhotoChanges,
  type Outbox,
  type PhotoQueue,
  type SyncItem,
} from '@/lib/sync-logic';

export type CollectionName =
  | 'pets'
  | 'health_records'
  | 'visits'
  | 'tasks'
  | 'weights'
  | 'weight_ranges';

// Kayıtlar önce telefona yazılır, internet olunca sunucuya gider.
// health_records'un anahtarı eski adıyla kaldı: önceden yalnızca aşılar vardı, kayıtlar kaybolmasın.
const COLLECTION_KEYS: Record<CollectionName, string> = {
  pets: 'patika.pets.v1',
  health_records: 'patika.vaccines.v1',
  visits: 'patika.visits.v1',
  tasks: 'patika.tasks.v1',
  weights: 'patika.weights.v1',
  weight_ranges: 'patika.weight-ranges.v1',
};

export const COLLECTION_NAMES = Object.keys(COLLECTION_KEYS) as CollectionName[];

const OUTBOX_KEY = 'patika.sync.outbox.v1';
const PHOTO_QUEUE_KEY = 'patika.sync.photos.v1';
const OWNER_KEY = 'patika.sync.owner.v1';
const CURSOR_KEY = 'patika.sync.cursor.v1';

const dataChanges = createChangeSignal();
// Kayıtlar değişince açık ekranlar kendini yeniler.
export const subscribeToData = dataChanges.subscribe;
export const notifyDataChanged = dataChanges.notify;

const localChanges = createChangeSignal();
// Kullanıcı bir kayıt değiştirince eşitleme başlasın diye.
export const subscribeToLocalChanges = localChanges.subscribe;

let queue: Promise<unknown> = Promise.resolve();

// Yazmalar sırayla çalışır. Yoksa araya giren bir eşitleme, kaydın silindiği sanılmasına yol açabilir.
export function runExclusive<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.catch(() => undefined);
  return run;
}

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readCollection<T extends SyncItem>(name: CollectionName): Promise<T[]> {
  const stored = await AsyncStorage.getItem(COLLECTION_KEYS[name]);
  if (!stored) {
    return [];
  }
  const parsed = JSON.parse(stored) as T[] | Record<string, object>;
  if (Array.isArray(parsed)) {
    return parsed;
  }
  // Sağlıklı aralıklar önceden hayvan kimliğine göre sözlük olarak tutuluyordu.
  return Object.entries(parsed).map(([id, value]) => ({ ...value, id })) as unknown as T[];
}

export async function writeCollection(name: CollectionName, items: SyncItem[]) {
  await AsyncStorage.setItem(COLLECTION_KEYS[name], JSON.stringify(items));
}

export async function readOutbox(): Promise<Outbox> {
  const stored = await AsyncStorage.getItem(OUTBOX_KEY);
  return stored ? (JSON.parse(stored) as Outbox) : {};
}

export async function writeOutbox(outbox: Outbox) {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
}

export async function readPhotoQueue(): Promise<PhotoQueue> {
  const stored = await AsyncStorage.getItem(PHOTO_QUEUE_KEY);
  return stored ? (JSON.parse(stored) as PhotoQueue) : { upload: [], remove: [] };
}

export async function writePhotoQueue(photoQueue: PhotoQueue) {
  await AsyncStorage.setItem(PHOTO_QUEUE_KEY, JSON.stringify(photoQueue));
}

// Telefondaki kayıtların hangi hesaba ait olduğu. Giriş yapılmamışsa boştur.
export function readOwner() {
  return AsyncStorage.getItem(OWNER_KEY);
}

export async function writeOwner(ownerId: string) {
  await AsyncStorage.setItem(OWNER_KEY, ownerId);
}

export function readCursor() {
  return AsyncStorage.getItem(CURSOR_KEY);
}

export async function writeCursor(cursor: string) {
  await AsyncStorage.setItem(CURSOR_KEY, cursor);
}

export async function clearLocalKeys() {
  await AsyncStorage.multiRemove([
    ...Object.values(COLLECTION_KEYS),
    OUTBOX_KEY,
    PHOTO_QUEUE_KEY,
    OWNER_KEY,
    CURSOR_KEY,
  ]);
}

// Bir koleksiyonu değiştirmenin tek yolu. Giriş yapılmışsa değişiklik sunucuya gönderilmek üzere not edilir.
export async function updateCollection<T extends SyncItem>(
  name: CollectionName,
  change: (items: T[]) => T[],
) {
  await runExclusive(async () => {
    const before = await readCollection<T>(name);
    const after = change(before);
    await writeCollection(name, after);

    if (await readOwner()) {
      const changes = diffItems(name, before, after, new Date().toISOString());
      await writeOutbox(addToOutbox(await readOutbox(), changes));
      if (name === 'pets') {
        await writePhotoQueue(
          queuePhotoChanges(
            await readPhotoQueue(),
            before as unknown as { photo: string | null }[],
            after as unknown as { photo: string | null }[],
          ),
        );
      }
    }
  });
  dataChanges.notify();
  localChanges.notify();
}
