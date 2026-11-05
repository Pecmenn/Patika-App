import { newId, readCollection, updateCollection } from '@/data/local-store';

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

export function listVisits(): Promise<Visit[]> {
  return readCollection<Visit>('visits');
}

export async function addVisit(newVisit: NewVisit): Promise<void> {
  await updateCollection<Visit>('visits', (visits) => [...visits, { ...newVisit, id: newId() }]);
}

export async function updateVisit(id: string, changes: NewVisit): Promise<void> {
  await updateCollection<Visit>('visits', (visits) =>
    visits.map((visit) => (visit.id === id ? { ...changes, id } : visit)),
  );
}

export async function deleteVisit(id: string): Promise<void> {
  await updateCollection<Visit>('visits', (visits) => visits.filter((visit) => visit.id !== id));
}

export async function deleteVisitsOfPet(petId: string): Promise<void> {
  await updateCollection<Visit>('visits', (visits) =>
    visits.filter((visit) => visit.petId !== petId),
  );
}
