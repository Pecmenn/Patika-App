import { newId, readCollection, updateCollection } from '@/data/local-store';

export type RecordKind = 'vaccine' | 'treatment';

export type HealthRecord = {
  id: string;
  petId: string;
  kind: RecordKind;
  name: string;
  // YYYY-AA-GG biçiminde.
  givenDate: string;
  nextDueDate: string | null;
  // Aşılarda seri no, tedavilerde not tutuluyor.
  batch: string | null;
  note: string | null;
};

export type NewHealthRecord = Omit<HealthRecord, 'id'>;

export async function listHealthRecords(): Promise<HealthRecord[]> {
  const records = await readCollection<HealthRecord>('health_records');
  // Önceden yalnızca aşılar vardı, eski kayıtlarda bu alanlar yok.
  return records.map((record) => ({ ...record, kind: record.kind ?? 'vaccine', note: record.note ?? null }));
}

export async function addHealthRecord(newRecord: NewHealthRecord): Promise<void> {
  await updateCollection<HealthRecord>('health_records', (records) => [
    ...records,
    { ...newRecord, id: newId() },
  ]);
}

export async function updateHealthRecord(id: string, changes: NewHealthRecord): Promise<void> {
  await updateCollection<HealthRecord>('health_records', (records) =>
    records.map((record) => (record.id === id ? { ...changes, id } : record)),
  );
}

export async function deleteHealthRecord(id: string): Promise<void> {
  await updateCollection<HealthRecord>('health_records', (records) =>
    records.filter((record) => record.id !== id),
  );
}

export async function deleteHealthRecordsOfPet(petId: string): Promise<void> {
  await updateCollection<HealthRecord>('health_records', (records) =>
    records.filter((record) => record.petId !== petId),
  );
}
