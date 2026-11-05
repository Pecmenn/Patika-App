import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Şimdilik telefonda saklanıyor. Sunucuya geçince yalnızca bu dosya değişecek.
// Burada önce yalnızca aşılar vardı. Eski kayıtlar kaybolmasın diye anahtar aynı kaldı.
const STORAGE_KEY = 'patika.vaccines.v1';

export async function listHealthRecords(): Promise<HealthRecord[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const records = stored ? (JSON.parse(stored) as Partial<HealthRecord>[]) : [];
  return records.map((record) => ({ kind: 'vaccine', note: null, ...record }) as HealthRecord);
}

async function saveHealthRecords(records: HealthRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function addHealthRecord(newRecord: NewHealthRecord): Promise<void> {
  const records = await listHealthRecords();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await saveHealthRecords([...records, { ...newRecord, id }]);
}

export async function updateHealthRecord(id: string, changes: NewHealthRecord): Promise<void> {
  const records = await listHealthRecords();
  await saveHealthRecords(
    records.map((record) => (record.id === id ? { ...changes, id } : record)),
  );
}

export async function deleteHealthRecord(id: string): Promise<void> {
  const records = await listHealthRecords();
  await saveHealthRecords(records.filter((record) => record.id !== id));
}

export async function deleteHealthRecordsOfPet(petId: string): Promise<void> {
  const records = await listHealthRecords();
  await saveHealthRecords(records.filter((record) => record.petId !== petId));
}
