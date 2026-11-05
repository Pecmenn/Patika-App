import type { HealthRecord } from '@/data/health-records';
import type { Pet } from '@/data/pets';
import type { Task, TaskRepeat } from '@/data/tasks';
import type { Visit } from '@/data/visits';
import { addDays, atTime, formatLongDate, formatTime, fromDateKey, toDateKey } from '@/lib/dates';
import { latestInSeries } from '@/lib/health-records';
import { isCompleted, nextOccurrence, occursOn } from '@/lib/tasks';
import { isUpcomingVisit } from '@/lib/visits';

const REMINDER_HOUR = 9;
const DAYS_BEFORE = [7, 0];
const VISIT_HOURS_BEFORE = 2;
// iOS aynı anda en fazla 64 planlı bildirim tutuyor, en yakın tarihliler öncelikli.
const MAX_REMINDERS = 60;
// Tekrarlayan görevler için kaç gün sonrasına kadar bildirim kurulacağı. Haftalık ve aylık
// görevlerde daha uzun, yoksa bazı görevlerin hiç kurulu bildirimi olmazdı.
const TASK_HORIZON_DAYS: Record<Exclude<TaskRepeat, 'once'>, number> = {
  daily: 14,
  weekly: 28,
  monthly: 62,
};

export type PlannedReminder = {
  date: Date;
  title: string;
  body: string;
  url: string;
  // Görev bildirimlerinde "Yapıldı" ve "1 saat sonra" düğmeleri bunu kullanır.
  task?: { id: string; occurrence: string };
};

function planRecordReminders(pets: Pet[], records: HealthRecord[], now: Date) {
  const reminders: PlannedReminder[] = [];

  for (const record of latestInSeries(records)) {
    const pet = pets.find((candidate) => candidate.id === record.petId);
    if (!pet || !record.nextDueDate) {
      continue;
    }
    const dueDate = fromDateKey(record.nextDueDate);

    for (const daysBefore of DAYS_BEFORE) {
      const date = new Date(dueDate);
      date.setDate(date.getDate() - daysBefore);
      date.setHours(REMINDER_HOUR, 0, 0, 0);
      if (date > now) {
        reminders.push({
          date,
          title: `${pet.name} için ${record.name}`,
          body:
            daysBefore === 0
              ? 'Son tarih bugün.'
              : `${daysBefore} gün kaldı. Son tarih: ${formatLongDate(dueDate)}.`,
          url: record.kind === 'treatment' ? `/pet/${pet.id}?tab=treatments` : `/pet/${pet.id}`,
        });
      }
    }
  }

  return reminders;
}

// Bir gün önce sabah ve o gün: saati yazıldıysa 2 saat önce, yazılmadıysa sabah.
function planVisitReminders(pets: Pet[], visits: Visit[], now: Date) {
  const reminders: PlannedReminder[] = [];

  for (const visit of visits) {
    const pet = pets.find((candidate) => candidate.id === visit.petId);
    if (!pet) {
      continue;
    }
    const morning = `${String(REMINDER_HOUR).padStart(2, '0')}:00`;
    const clinic = visit.clinic ? ` ${visit.clinic}.` : '';
    const clock = visit.time ? formatTime(visit.time) : null;
    const shared = {
      title: `${pet.name} için ${visit.reason}`,
      url: `/pet/${pet.id}?tab=visits`,
    };

    const dayBefore = atTime(toDateKey(addDays(fromDateKey(visit.date), -1)), morning);
    if (dayBefore > now) {
      reminders.push({
        ...shared,
        date: dayBefore,
        body: `Yarın${clock ? `, saat ${clock}` : ''}.${clinic}`,
      });
    }

    const sameDay = visit.time
      ? new Date(atTime(visit.date, visit.time).getTime() - VISIT_HOURS_BEFORE * 3_600_000)
      : atTime(visit.date, morning);
    if (sameDay > now) {
      reminders.push({
        ...shared,
        date: sameDay,
        body: `${clock ? `Saat ${clock}` : 'Bugün'}.${clinic}`,
      });
    }
  }

  return reminders;
}

function upcomingOccurrences(task: Task, now: Date) {
  if (task.repeat === 'once') {
    return [task.startDate];
  }
  const occurrences: string[] = [];
  for (let offset = 0; offset < TASK_HORIZON_DAYS[task.repeat]; offset += 1) {
    const key = toDateKey(addDays(now, offset));
    if (occursOn(task, key)) {
      occurrences.push(key);
    }
  }
  return occurrences;
}

function planTaskReminders(pets: Pet[], tasks: Task[], now: Date) {
  const reminders: PlannedReminder[] = [];

  for (const task of tasks) {
    const pet = pets.find((candidate) => candidate.id === task.petId);
    if (!pet) {
      continue;
    }

    const reminderAt = (date: Date, occurrence: string): PlannedReminder => ({
      date,
      title: `${pet.name} için ${task.name}`,
      body: `Saat ${formatTime(task.time)}.${task.note ? ` Notun: ${task.note}` : ''}`,
      url: '/today',
      task: { id: task.id, occurrence },
    });

    for (const occurrence of upcomingOccurrences(task, now)) {
      const date = atTime(occurrence, task.time);
      if (date > now && !isCompleted(task, occurrence)) {
        reminders.push(reminderAt(date, occurrence));
      }
    }

    if (task.snooze && !isCompleted(task, task.snooze.date)) {
      const until = new Date(task.snooze.until);
      if (until > now) {
        reminders.push(reminderAt(until, task.snooze.date));
      }
    }
  }

  return reminders;
}

// Kurulu bildirimi önce biten, ama devam etmesi gereken görevin son bildirim zamanı.
function firstRunOutDate(tasks: Task[], reminders: PlannedReminder[]) {
  let earliest: Date | null = null;

  for (const task of tasks) {
    const dates = reminders
      .filter((reminder) => reminder.task?.id === task.id)
      .map((reminder) => reminder.date.getTime());
    if (dates.length === 0) {
      continue;
    }
    const last = new Date(Math.max(...dates));
    const continues = nextOccurrence(task, toDateKey(addDays(last, 1))) !== null;
    if (continues && (earliest === null || last < earliest)) {
      earliest = last;
    }
  }

  return earliest;
}

export function planReminders(
  pets: Pet[],
  records: HealthRecord[],
  tasks: Task[],
  visits: Visit[],
  now = new Date(),
) {
  const planned = [
    ...planRecordReminders(pets, records, now),
    ...planTaskReminders(pets, tasks, now),
    ...planVisitReminders(pets, visits, now),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_REMINDERS - 1);

  // Bildirimler önceden kuruluyor, uygulama açılınca yenileniyor. Uzun süre açılmazsa uyarıyoruz.
  const runOut = firstRunOutDate(tasks, planned);
  if (runOut) {
    planned.push({
      date: new Date(runOut.getTime() + 60_000),
      title: 'Hatırlatmalar bitmek üzere',
      body: "Görev hatırlatmaların devam etsin diye Patika'yı aç.",
      url: '/today',
    });
  }

  return planned;
}

export function hasUpcomingReminder(
  records: HealthRecord[],
  tasks: Task[],
  visits: Visit[],
  now = new Date(),
) {
  const todayKey = toDateKey(now);
  return (
    latestInSeries(records).some(
      (record) => record.nextDueDate !== null && fromDateKey(record.nextDueDate) >= now,
    ) ||
    tasks.some((task) => nextOccurrence(task, todayKey) !== null) ||
    visits.some((visit) => isUpcomingVisit(visit, now))
  );
}
