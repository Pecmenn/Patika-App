import AsyncStorage from '@react-native-async-storage/async-storage';

export type Vaccine = {
  id: string;
  petId: string;
  name: string;
  // YYYY-AA-GG biçiminde.
  givenDate: string;
  nextDueDate: string | null;
  batch: string | null;
};

export type NewVaccine = Omit<Vaccine, 'id'>;

// Şimdilik telefonda saklanıyor. Sunucuya geçince yalnızca bu dosya değişecek.
const STORAGE_KEY = 'patika.vaccines.v1';

export async function listVaccines(): Promise<Vaccine[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Vaccine[]) : [];
}

export async function addVaccine(newVaccine: NewVaccine): Promise<void> {
  const vaccines = await listVaccines();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...vaccines, { ...newVaccine, id }]));
}

export async function updateVaccine(id: string, changes: NewVaccine): Promise<void> {
  const vaccines = await listVaccines();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(vaccines.map((vaccine) => (vaccine.id === id ? { ...changes, id } : vaccine))),
  );
}

export async function deleteVaccine(id: string): Promise<void> {
  const vaccines = await listVaccines();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(vaccines.filter((vaccine) => vaccine.id !== id)),
  );
}
