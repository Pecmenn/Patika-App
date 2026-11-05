import { useLocalSearchParams } from 'expo-router';

import { PetForm } from '@/components/pet-form';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pets = useFocusData(listPets);
  const pet = pets?.find((candidate) => candidate.id === id);

  if (!pet) {
    return null;
  }

  return <PetForm pet={pet} />;
}
