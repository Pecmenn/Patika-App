import type { Task, TaskRepeat } from '@/data/tasks';
import {
  addDays,
  formatLongDate,
  formatTime,
  formatWeekdayName,
  fromDateKey,
  toDateKey,
} from '@/lib/dates';

export const REPEAT_OPTIONS: { value: TaskRepeat; label: string }[] = [
  { value: 'once', label: 'Bir kez' },
  { value: 'daily', label: 'Her gün' },
  { value: 'weekly', label: 'Her hafta' },
  { value: 'monthly', label: 'Her ay' },
];

export function isCompleted(task: Task, dateKey: string) {
  return task.completedDates.includes(dateKey);
}

// Ayın 31'inde başlayan aylık görev, kısa aylarda ayın son gününe denk gelir.
function monthlyDayIn(start: Date, date: Date) {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.min(start.getDate(), lastDayOfMonth);
}

export function occursOn(task: Task, dateKey: string) {
  if (dateKey < task.startDate || (task.endDate !== null && dateKey > task.endDate)) {
    return false;
  }
  const date = fromDateKey(dateKey);
  const start = fromDateKey(task.startDate);

  switch (task.repeat) {
    case 'once':
      return dateKey === task.startDate;
    case 'daily':
      return true;
    case 'weekly':
      return date.getDay() === start.getDay();
    case 'monthly':
      return date.getDate() === monthlyDayIn(start, date);
  }
}

// Verilen günden itibaren, henüz yapılmamış ilk tekrar. Görev bittiyse null döner.
export function nextOccurrence(task: Task, fromKey: string) {
  if (task.repeat === 'once') {
    return task.startDate >= fromKey && !isCompleted(task, task.startDate) ? task.startDate : null;
  }
  const first = fromDateKey(fromKey > task.startDate ? fromKey : task.startDate);
  for (let offset = 0; offset <= 62; offset += 1) {
    const key = toDateKey(addDays(first, offset));
    if (task.endDate !== null && key > task.endDate) {
      return null;
    }
    if (occursOn(task, key) && !isCompleted(task, key)) {
      return key;
    }
  }
  return null;
}

// Yapılmadan geçen tekrar. Günlük görevlerde yok: kaçan doz telafi edilmez, bugünkü geçerlidir.
function missedOccurrence(task: Task, todayKey: string) {
  if (task.repeat === 'daily') {
    return null;
  }
  if (task.repeat === 'once') {
    return task.startDate < todayKey ? task.startDate : null;
  }
  const today = fromDateKey(todayKey);
  for (let back = 1; back <= 31; back += 1) {
    const key = toDateKey(addDays(today, -back));
    if (occursOn(task, key)) {
      return key;
    }
  }
  return null;
}

// Görevin sıradaki işi: yapılmadan geçen tekrar, yoksa ilk yeni tekrar. Görev bittiyse null döner.
export function pendingOccurrence(task: Task, todayKey: string) {
  const missed = occursOn(task, todayKey) ? null : missedOccurrence(task, todayKey);
  return missed !== null && !isCompleted(task, missed) ? missed : nextOccurrence(task, todayKey);
}

export type TodayTask = {
  task: Task;
  // Hangi günün tekrarı olduğu. Gecikmiş görevde geçmiş bir gündür.
  date: string;
  isDone: boolean;
  isOverdue: boolean;
};

export function tasksForToday(tasks: Task[], now = new Date()): TodayTask[] {
  const todayKey = toDateKey(now);
  const items: TodayTask[] = [];

  for (const task of tasks) {
    if (occursOn(task, todayKey)) {
      items.push({ task, date: todayKey, isDone: isCompleted(task, todayKey), isOverdue: false });
      continue;
    }
    const missed = missedOccurrence(task, todayKey);
    if (missed !== null && !isCompleted(task, missed)) {
      items.push({ task, date: missed, isDone: false, isOverdue: true });
    }
  }

  return items.sort(
    (a, b) =>
      Number(b.isOverdue) - Number(a.isOverdue) || a.task.time.localeCompare(b.task.time),
  );
}

export function scheduleLabel({
  repeat,
  startDate,
  time,
}: Pick<Task, 'repeat' | 'startDate' | 'time'>) {
  const start = fromDateKey(startDate);
  const clock = `saat ${formatTime(time)}`;

  switch (repeat) {
    case 'once':
      return `${formatLongDate(start)}, ${clock}`;
    case 'daily':
      return `Her gün, ${clock}`;
    case 'weekly':
      return `Her ${formatWeekdayName(start)}, ${clock}`;
    case 'monthly':
      return `Her ayın ${start.getDate()}. günü, ${clock}`;
  }
}
