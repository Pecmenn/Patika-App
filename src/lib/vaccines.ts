import type { Vaccine } from '@/data/vaccines';
import { daysUntil } from '@/lib/dates';

const DUE_SOON_DAYS = 30;

function seriesKey(vaccine: Vaccine) {
  return `${vaccine.petId}:${vaccine.name.trim().toLocaleLowerCase('tr-TR')}`;
}

// Aynı aşının yalnızca en son kaydı geçerlidir: yeni doz eklenince eskisi "sırada" sayılmaz.
export function latestInSeries(vaccines: Vaccine[]) {
  const latestBySeries = new Map<string, Vaccine>();
  for (const vaccine of vaccines) {
    const key = seriesKey(vaccine);
    const current = latestBySeries.get(key);
    if (!current || vaccine.givenDate >= current.givenDate) {
      latestBySeries.set(key, vaccine);
    }
  }
  return [...latestBySeries.values()];
}

export function splitVaccines(vaccines: Vaccine[]) {
  const due = latestInSeries(vaccines)
    .filter(
      (vaccine) =>
        vaccine.nextDueDate !== null && daysUntil(vaccine.nextDueDate) <= DUE_SOON_DAYS,
    )
    .sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));

  const dueIds = new Set(due.map((vaccine) => vaccine.id));
  const others = vaccines
    .filter((vaccine) => !dueIds.has(vaccine.id))
    .sort((a, b) => b.givenDate.localeCompare(a.givenDate));

  return { due, others };
}

export function dueCountLabel(days: number) {
  return days < 0 ? 'gün gecikti' : 'gün kaldı';
}
