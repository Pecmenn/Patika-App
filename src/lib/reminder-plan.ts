import type { Pet } from '@/data/pets';
import type { Vaccine } from '@/data/vaccines';
import { formatLongDate, fromDateKey } from '@/lib/dates';
import { latestInSeries } from '@/lib/vaccines';

const REMINDER_HOUR = 9;
const DAYS_BEFORE = [7, 0];
// iOS aynı anda en fazla 64 planlı bildirim tutuyor, en yakın tarihliler öncelikli.
const MAX_REMINDERS = 60;

export type VaccineReminder = {
  date: Date;
  title: string;
  body: string;
  petId: string;
};

export function planVaccineReminders(pets: Pet[], vaccines: Vaccine[], now = new Date()) {
  const reminders: VaccineReminder[] = [];

  for (const vaccine of latestInSeries(vaccines)) {
    const pet = pets.find((candidate) => candidate.id === vaccine.petId);
    if (!pet || !vaccine.nextDueDate) {
      continue;
    }
    const dueDate = fromDateKey(vaccine.nextDueDate);

    for (const daysBefore of DAYS_BEFORE) {
      const date = new Date(dueDate);
      date.setDate(date.getDate() - daysBefore);
      date.setHours(REMINDER_HOUR, 0, 0, 0);
      if (date > now) {
        reminders.push({
          date,
          title: `${pet.name} için ${vaccine.name}`,
          body:
            daysBefore === 0
              ? 'Son tarih bugün.'
              : `${daysBefore} gün kaldı. Son tarih: ${formatLongDate(dueDate)}.`,
          petId: pet.id,
        });
      }
    }
  }

  return reminders
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_REMINDERS);
}

export function hasUpcomingReminder(vaccines: Vaccine[], now = new Date()) {
  return latestInSeries(vaccines).some(
    (vaccine) => vaccine.nextDueDate !== null && fromDateKey(vaccine.nextDueDate) >= now,
  );
}
