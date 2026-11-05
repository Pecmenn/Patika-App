import AsyncStorage from '@react-native-async-storage/async-storage';

import { createChangeSignal } from '@/lib/change-signal';

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

// Şimdilik telefonda saklanıyor. Sunucuya geçince yalnızca bu dosya değişecek.
const STORAGE_KEY = 'patika.tasks.v1';

const changes = createChangeSignal();
export const subscribeToTasks = changes.subscribe;

export async function listTasks(): Promise<Task[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Task[]) : [];
}

async function saveTasks(tasks: Task[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  changes.notify();
}

async function changeTask(id: string, change: (task: Task) => Task) {
  const tasks = await listTasks();
  await saveTasks(tasks.map((task) => (task.id === id ? change(task) : task)));
}

export async function addTask(fields: TaskFields): Promise<void> {
  const tasks = await listTasks();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await saveTasks([...tasks, { ...fields, id, completedDates: [], snooze: null }]);
}

export async function updateTask(id: string, fields: TaskFields): Promise<void> {
  await changeTask(id, (task) => ({ ...task, ...fields, snooze: null }));
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = await listTasks();
  await saveTasks(tasks.filter((task) => task.id !== id));
}

export async function deleteTasksOfPet(petId: string): Promise<void> {
  const tasks = await listTasks();
  await saveTasks(tasks.filter((task) => task.petId !== petId));
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
