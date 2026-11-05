import AsyncStorage from '@react-native-async-storage/async-storage';

export type Visit = {
  id: string;
  petId: string;
  reason: string;
  // YYYY-AA-GG biçiminde.
  date: string;
  // SS:DD biçiminde.
  time: string | null;
  clinic: string | null;
  note: string | null;
};

export type NewVisit = Omit<Visit, 'id'>;

// Şimdilik telefonda saklanıyor. Sunucuya geçince yalnızca bu dosya değişecek.
const STORAGE_KEY = 'patika.visits.v1';

export async function listVisits(): Promise<Visit[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Visit[]) : [];
}

async function saveVisits(visits: Visit[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
}

export async function addVisit(newVisit: NewVisit): Promise<void> {
  const visits = await listVisits();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await saveVisits([...visits, { ...newVisit, id }]);
}

export async function updateVisit(id: string, changes: NewVisit): Promise<void> {
  const visits = await listVisits();
  await saveVisits(visits.map((visit) => (visit.id === id ? { ...changes, id } : visit)));
}

export async function deleteVisit(id: string): Promise<void> {
  const visits = await listVisits();
  await saveVisits(visits.filter((visit) => visit.id !== id));
}
