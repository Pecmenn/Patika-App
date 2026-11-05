import { useLocalSearchParams } from 'expo-router';

import { RecordForm } from '@/components/record-form';
import { listHealthRecords } from '@/data/health-records';
import { useFocusData } from '@/hooks/use-focus-data';

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const records = useFocusData(listHealthRecords);
  const record = records?.find((candidate) => candidate.id === id);

  if (!record) {
    return null;
  }

  return <RecordForm kind={record.kind} petId={record.petId} record={record} />;
}
