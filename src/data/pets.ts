import { newId, readCollection, updateCollection } from '@/data/local-store';

export type Species = 'cat' | 'dog' | 'rabbit' | 'bird';

export type Pet = {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  // Fotoğrafın kayıtlı adı. Ekranda göstermek için resolvePetPhotoUri kullanılır.
  photo: string | null;
  // YYYY-AA-GG biçiminde.
  birthDate: string | null;
  birthDateIsApproximate: boolean;
};

export type NewPet = Omit<Pet, 'id'>;

export function listPets(): Promise<Pet[]> {
  return readCollection<Pet>('pets');
}

export async function addPet(newPet: NewPet): Promise<void> {
  await updateCollection<Pet>('pets', (pets) => [...pets, { ...newPet, id: newId() }]);
}

export async function updatePet(id: string, changes: NewPet): Promise<void> {
  await updateCollection<Pet>('pets', (pets) =>
    pets.map((pet) => (pet.id === id ? { ...changes, id } : pet)),
  );
}

export async function deletePet(id: string): Promise<void> {
  await updateCollection<Pet>('pets', (pets) => pets.filter((pet) => pet.id !== id));
}
