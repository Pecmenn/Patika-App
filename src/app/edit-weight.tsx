import { useLocalSearchParams } from 'expo-router';

import { WeightForm } from '@/components/weight-form';
import { listWeights } from '@/data/weights';
import { useFocusData } from '@/hooks/use-focus-data';

export default function EditWeightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useFocusData(listWeights);
  const entry = entries?.find((candidate) => candidate.id === id);

  if (!entry) {
    return null;
  }

  return <WeightForm entry={entry} petId={entry.petId} />;
}
