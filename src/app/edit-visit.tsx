import { useLocalSearchParams } from 'expo-router';

import { VisitForm } from '@/components/visit-form';
import { listVisits } from '@/data/visits';
import { useFocusData } from '@/hooks/use-focus-data';

export default function EditVisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visits = useFocusData(listVisits);
  const visit = visits?.find((candidate) => candidate.id === id);

  if (!visit) {
    return null;
  }

  return <VisitForm petId={visit.petId} visit={visit} />;
}
