import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeightEntry = {
  id: string;
  petId: string;
  kg: number;
  // YYYY-AA-GG biçiminde.
  date: string;
  note: string | null;
};

export type NewWeightEntry = Omit<WeightEntry, 'id'>;

// Veterinerin söylediği aralık. Uygulama kendisi aralık önermez.
export type WeightRange = {
  min: number;
  max: number;
};

// Şimdilik telefonda saklanıyor. Sunucuya geçince yalnızca bu dosya değişecek.
const ENTRIES_KEY = 'patika.weights.v1';
const RANGES_KEY = 'patika.weight-ranges.v1';

export async function listWeights(): Promise<WeightEntry[]> {
  const stored = await AsyncStorage.getItem(ENTRIES_KEY);
  return stored ? (JSON.parse(stored) as WeightEntry[]) : [];
}

async function saveWeights(entries: WeightEntry[]) {
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function addWeight(newEntry: NewWeightEntry): Promise<void> {
  const entries = await listWeights();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await saveWeights([...entries, { ...newEntry, id }]);
}

export async function updateWeight(id: string, changes: NewWeightEntry): Promise<void> {
  const entries = await listWeights();
  await saveWeights(entries.map((entry) => (entry.id === id ? { ...changes, id } : entry)));
}

export async function deleteWeight(id: string): Promise<void> {
  const entries = await listWeights();
  await saveWeights(entries.filter((entry) => entry.id !== id));
}

export async function listWeightRanges(): Promise<Record<string, WeightRange>> {
  const stored = await AsyncStorage.getItem(RANGES_KEY);
  return stored ? (JSON.parse(stored) as Record<string, WeightRange>) : {};
}

// range boş verilirse aralık kaldırılır.
export async function setWeightRange(petId: string, range: WeightRange | null): Promise<void> {
  const { [petId]: _removed, ...others } = await listWeightRanges();
  await AsyncStorage.setItem(
    RANGES_KEY,
    JSON.stringify(range ? { ...others, [petId]: range } : others),
  );
}

export async function deleteWeightsOfPet(petId: string): Promise<void> {
  const entries = await listWeights();
  await saveWeights(entries.filter((entry) => entry.petId !== petId));
  await setWeightRange(petId, null);
}
