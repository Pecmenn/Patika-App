import type { HealthRecord } from '@/data/health-records';
import type { Visit } from '@/data/visits';
import type { WeightEntry } from '@/data/weights';
import { daysUntil, formatShortDate, fromDateKey } from '@/lib/dates';
import { latestInSeries } from '@/lib/health-records';
import { splitVisits } from '@/lib/visits';
import { sortByDate } from '@/lib/weights';

const NEAR_DAYS = 30;

export function latestWeightFor(petId: string, weights: WeightEntry[]) {
  return sortByDate(weights.filter((weight) => weight.petId === petId)).at(-1);
}

export type NextUp = { title: string; date: string };

// Hayvanın sıradaki işi: tarihi gelen ya da geçen aşı ve tedavi ile yaklaşan ziyaretlerin en erkeni.
// Aynı aşının eski dozu sayılmaz, yalnızca serinin en son kaydının sonraki tarihi geçerlidir.
export function nextUpFor(petId: string, records: HealthRecord[], visits: Visit[], now = new Date()) {
  const fromRecords = latestInSeries(records.filter((record) => record.petId === petId)).flatMap(
    (record): NextUp[] => (record.nextDueDate ? [{ title: record.name, date: record.nextDueDate }] : []),
  );
  const fromVisits = splitVisits(
    visits.filter((visit) => visit.petId === petId),
    now,
  ).upcoming.map((visit): NextUp => ({ title: visit.reason, date: visit.date }));

  return [...fromRecords, ...fromVisits].sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

// Yakın tarihler gün sayısıyla, uzak olanlar tarihiyle yazılır.
export function nextUpWhen(dateKey: string, now = new Date()) {
  const days = daysUntil(dateKey, now);
  if (days < 0) {
    return `${-days} gün gecikti`;
  }
  if (days === 0) {
    return 'Bugün';
  }
  if (days === 1) {
    return 'Yarın';
  }
  if (days <= NEAR_DAYS) {
    return `${days} gün sonra`;
  }
  return formatShortDate(fromDateKey(dateKey));
}

// Fotoğrafsız avatarda görünen harf. Türkçe büyük harf kuralıyla ("i" → "İ"). Harfle başlamayan adda
// (rakam, emoji) harf yok, avatar türün simgesini gösterir.
export function petInitial(name: string | undefined): string | null {
  const first = Array.from(name?.trim() ?? '')[0];
  return first && /\p{L}/u.test(first) ? first.toLocaleUpperCase('tr-TR') : null;
}
