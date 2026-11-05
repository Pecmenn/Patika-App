import { useLocalSearchParams } from 'expo-router';

import { WeightRangeForm } from '@/components/weight-range-form';
import { listPets } from '@/data/pets';
import { listWeightRanges } from '@/data/weights';
import { useFocusData } from '@/hooks/use-focus-data';

async function loadRangeScreen() {
  const [pets, ranges] = await Promise.all([listPets(), listWeightRanges()]);
  return { pets, ranges };
}

export default function WeightRangeScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const data = useFocusData(loadRangeScreen);
  const pet = data?.pets.find((candidate) => candidate.id === petId);

  if (!data || !pet) {
    return null;
  }

  return <WeightRangeForm petId={pet.id} petName={pet.name} range={data.ranges[pet.id] ?? null} />;
}
