import { newId, readCollection, updateCollection } from '@/data/local-store';

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

// Sağlıklı aralık hayvan başına bir tane olduğu için kimliği hayvanın kimliğidir.
type StoredRange = WeightRange & { id: string };

export function listWeights(): Promise<WeightEntry[]> {
  return readCollection<WeightEntry>('weights');
}

export async function addWeight(newEntry: NewWeightEntry): Promise<void> {
  await updateCollection<WeightEntry>('weights', (entries) => [
    ...entries,
    { ...newEntry, id: newId() },
  ]);
}

export async function updateWeight(id: string, changes: NewWeightEntry): Promise<void> {
  await updateCollection<WeightEntry>('weights', (entries) =>
    entries.map((entry) => (entry.id === id ? { ...changes, id } : entry)),
  );
}

export async function deleteWeight(id: string): Promise<void> {
  await updateCollection<WeightEntry>('weights', (entries) =>
    entries.filter((entry) => entry.id !== id),
  );
}

export async function listWeightRanges(): Promise<Record<string, WeightRange>> {
  const ranges = await readCollection<StoredRange>('weight_ranges');
  return Object.fromEntries(ranges.map(({ id, min, max }) => [id, { min, max }]));
}

// range boş verilirse aralık kaldırılır.
export async function setWeightRange(petId: string, range: WeightRange | null): Promise<void> {
  await updateCollection<StoredRange>('weight_ranges', (ranges) => {
    const others = ranges.filter((item) => item.id !== petId);
    return range ? [...others, { ...range, id: petId }] : others;
  });
}

export async function deleteWeightsOfPet(petId: string): Promise<void> {
  await updateCollection<WeightEntry>('weights', (entries) =>
    entries.filter((entry) => entry.petId !== petId),
  );
  await setWeightRange(petId, null);
}
