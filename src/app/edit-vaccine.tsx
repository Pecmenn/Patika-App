import { useLocalSearchParams } from 'expo-router';

import { VaccineForm } from '@/components/vaccine-form';
import { listVaccines } from '@/data/vaccines';
import { useFocusData } from '@/hooks/use-focus-data';

export default function EditVaccineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vaccines = useFocusData(listVaccines);
  const vaccine = vaccines?.find((candidate) => candidate.id === id);

  if (!vaccine) {
    return null;
  }

  return <VaccineForm petId={vaccine.petId} vaccine={vaccine} />;
}
