import { useLocalSearchParams } from 'expo-router';

import { VaccineForm } from '@/components/vaccine-form';

export default function AddVaccineScreen() {
  const { petId, name } = useLocalSearchParams<{ petId: string; name?: string }>();

  return <VaccineForm initialName={name} petId={petId} />;
}
