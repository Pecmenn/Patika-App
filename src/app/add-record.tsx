import { useLocalSearchParams } from 'expo-router';

import { RecordForm } from '@/components/record-form';
import type { RecordKind } from '@/data/health-records';

export default function AddRecordScreen() {
  const { petId, kind, name } = useLocalSearchParams<{
    petId: string;
    kind: RecordKind;
    name?: string;
  }>();

  return <RecordForm initialName={name} kind={kind} petId={petId} />;
}
