import type { HealthRecord } from '@/data/health-records';
import { daysUntil } from '@/lib/dates';

const DUE_SOON_DAYS = 30;

function seriesKey(record: HealthRecord) {
  return `${record.petId}:${record.kind}:${record.name.trim().toLocaleLowerCase('tr-TR')}`;
}

// Aynı aşı ya da tedavinin yalnızca en son kaydı geçerlidir: yeni doz eklenince eskisi "sırada" sayılmaz.
export function latestInSeries(records: HealthRecord[]) {
  const latestBySeries = new Map<string, HealthRecord>();
  for (const record of records) {
    const key = seriesKey(record);
    const current = latestBySeries.get(key);
    if (!current || record.givenDate >= current.givenDate) {
      latestBySeries.set(key, record);
    }
  }
  return [...latestBySeries.values()];
}

export function splitRecords(records: HealthRecord[], now = new Date()) {
  const due = latestInSeries(records)
    .filter(
      (record) =>
        record.nextDueDate !== null && daysUntil(record.nextDueDate, now) <= DUE_SOON_DAYS,
    )
    .sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));

  const dueIds = new Set(due.map((record) => record.id));
  const others = records
    .filter((record) => !dueIds.has(record.id))
    .sort((a, b) => b.givenDate.localeCompare(a.givenDate));

  return { due, others };
}

export function dueCountLabel(days: number) {
  return days < 0 ? 'gün gecikti' : 'gün kaldı';
}
