// Eşitlemenin karar kuralları. Telefona ya da sunucuya dokunmaz, bu yüzden tek başına denenebilir.

export type SyncItem = { id: string };

// Henüz sunucuya gitmemiş bir değişiklik. data boşsa kayıt silinmiştir.
export type PendingChange = {
  collection: string;
  id: string;
  data: SyncItem | null;
  updatedAt: string;
};

export type Outbox = Record<string, PendingChange>;

export type RemoteRow = {
  collection: string;
  id: string;
  data: SyncItem | null;
  deleted: boolean;
  updated_at: string;
};

function outboxKey(collection: string, id: string) {
  return `${collection}/${id}`;
}

function isSame(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function diffItems(
  collection: string,
  before: SyncItem[],
  after: SyncItem[],
  updatedAt: string,
): PendingChange[] {
  const beforeById = new Map(before.map((item) => [item.id, item]));
  const afterIds = new Set(after.map((item) => item.id));

  const changed = after
    .filter((item) => !isSame(beforeById.get(item.id), item))
    .map((item) => ({ collection, id: item.id, data: item, updatedAt }));
  const removed = before
    .filter((item) => !afterIds.has(item.id))
    .map((item) => ({ collection, id: item.id, data: null, updatedAt }));

  return [...changed, ...removed];
}

// Aynı kaydın yeni değişikliği eskisinin yerini alır.
export function addToOutbox(outbox: Outbox, changes: PendingChange[]): Outbox {
  const next = { ...outbox };
  for (const change of changes) {
    next[outboxKey(change.collection, change.id)] = change;
  }
  return next;
}

// Gönderilen değişiklikleri çıkarır. Gönderim sırasında aynı kayıt yeniden değiştiyse o kalır.
export function removeFromOutbox(outbox: Outbox, sent: PendingChange[]): Outbox {
  const next = { ...outbox };
  for (const change of sent) {
    const key = outboxKey(change.collection, change.id);
    if (next[key]?.updatedAt === change.updatedAt) {
      delete next[key];
    }
  }
  return next;
}

// Sunucudan gelen satırları telefondakilerle birleştirir.
// Telefonda gönderilmemiş bir değişiklik varsa hangisi daha yeniyse o kazanır.
export function mergeRemote(
  collection: string,
  local: SyncItem[],
  rows: RemoteRow[],
  outbox: Outbox,
) {
  const items = [...local];
  const nextOutbox = { ...outbox };
  let changed = false;

  for (const row of rows) {
    const key = outboxKey(collection, row.id);
    const pending = nextOutbox[key];
    if (pending) {
      if (Date.parse(pending.updatedAt) >= Date.parse(row.updated_at)) {
        continue;
      }
      delete nextOutbox[key];
    }

    const index = items.findIndex((item) => item.id === row.id);
    if (row.deleted || row.data === null) {
      if (index !== -1) {
        items.splice(index, 1);
        changed = true;
      }
    } else if (index === -1) {
      items.push(row.data);
      changed = true;
    } else if (!isSame(items[index], row.data)) {
      items[index] = row.data;
      changed = true;
    }
  }

  return { items, outbox: nextOutbox, changed };
}

export type PhotoQueue = {
  upload: string[];
  remove: string[];
};

type WithPhoto = { photo: string | null };

// Hayvan kayıtları değişince hangi fotoğrafın yüklenip hangisinin silineceğini bulur.
export function queuePhotoChanges(
  queue: PhotoQueue,
  before: WithPhoto[],
  after: WithPhoto[],
): PhotoQueue {
  const names = (pets: WithPhoto[]) =>
    new Set(pets.flatMap((pet) => (pet.photo ? [pet.photo] : [])));
  const beforeNames = names(before);
  const afterNames = names(after);

  const added = [...afterNames].filter((name) => !beforeNames.has(name));
  const dropped = [...beforeNames].filter((name) => !afterNames.has(name));

  return {
    upload: [...new Set([...queue.upload, ...added])].filter((name) => !dropped.includes(name)),
    remove: [...new Set([...queue.remove, ...dropped])].filter((name) => !added.includes(name)),
  };
}
