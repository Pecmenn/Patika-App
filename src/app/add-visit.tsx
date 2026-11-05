import { useLocalSearchParams } from 'expo-router';

import { VisitForm } from '@/components/visit-form';

export default function AddVisitScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();

  return <VisitForm petId={petId} />;
}
