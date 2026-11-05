import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Şimdilik telefonda saklanıyor. Sunucuya geçince yalnızca bu dosya değişecek.
const STORAGE_KEY = 'patika.pets.v1';

export async function listPets(): Promise<Pet[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Pet[]) : [];
}

export async function addPet(newPet: NewPet): Promise<void> {
  const pets = await listPets();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...pets, { ...newPet, id }]));
}
