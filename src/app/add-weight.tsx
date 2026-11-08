import { useLocalSearchParams } from 'expo-router';

import { WeightForm } from '@/components/weight-form';

export default function AddWeightScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();

  return <WeightForm petId={petId} />;
}
