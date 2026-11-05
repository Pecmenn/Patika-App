import { useLocalSearchParams } from 'expo-router';

import { TaskForm } from '@/components/task-form';
import { listTasks } from '@/data/tasks';
import { useFocusData } from '@/hooks/use-focus-data';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tasks = useFocusData(listTasks);
  const task = tasks?.find((candidate) => candidate.id === id);

  if (!task) {
    return null;
  }

  return <TaskForm task={task} />;
}
