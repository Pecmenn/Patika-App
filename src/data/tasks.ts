import { newId, readCollection, updateCollection } from '@/data/local-store';

export type TaskRepeat = 'once' | 'daily' | 'weekly' | 'monthly';

export type Task = {
  id: string;
  petId: string;
  name: string;
  // SS:DD biçiminde.
  time: string;
  repeat: TaskRepeat;
  // YYYY-AA-GG biçiminde. Tek seferlik görevin tarihi, tekrarlayan görevin ilk günü.
  startDate: string;
  endDate: string | null;
  note: string | null;
  // "Yapıldı" işaretlenen günler (YYYY-AA-GG).
  completedDates: string[];
  // "1 saat sonra" denen gün ve bildirimin yeni zamanı.
  snooze: { date: string; until: string } | null;
};

export type TaskFields = Omit<Task, 'id' | 'completedDates' | 'snooze'>;

export function listTasks(): Promise<Task[]> {
  return readCollection<Task>('tasks');
}

async function changeTask(id: string, change: (task: Task) => Task) {
  await updateCollection<Task>('tasks', (tasks) =>
    tasks.map((task) => (task.id === id ? change(task) : task)),
  );
}

export async function addTask(fields: TaskFields): Promise<void> {
  await updateCollection<Task>('tasks', (tasks) => [
    ...tasks,
    { ...fields, id: newId(), completedDates: [], snooze: null },
  ]);
}

export async function updateTask(id: string, fields: TaskFields): Promise<void> {
  await changeTask(id, (task) => ({ ...task, ...fields, snooze: null }));
}

export async function deleteTask(id: string): Promise<void> {
  await updateCollection<Task>('tasks', (tasks) => tasks.filter((task) => task.id !== id));
}

export async function deleteTasksOfPet(petId: string): Promise<void> {
  await updateCollection<Task>('tasks', (tasks) => tasks.filter((task) => task.petId !== petId));
}

export async function setTaskCompleted(id: string, date: string, completed: boolean): Promise<void> {
  await changeTask(id, (task) => ({
    ...task,
    completedDates: completed
      ? [...new Set([...task.completedDates, date])]
      : task.completedDates.filter((completedDate) => completedDate !== date),
    snooze: task.snooze?.date === date ? null : task.snooze,
  }));
}

export async function snoozeTask(id: string, date: string, until: Date): Promise<void> {
  await changeTask(id, (task) => ({ ...task, snooze: { date, until: until.toISOString() } }));
}
