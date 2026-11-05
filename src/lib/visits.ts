import type { Visit } from '@/data/visits';
import { formatLongDate, formatTime, fromDateKey, toDateKey, toTimeKey } from '@/lib/dates';

function sortKey({ date, time }: Visit) {
  return `${date} ${time ?? '23:59'}`;
}

// Saati yazılmamış bugünkü ziyaret, gün bitene kadar yaklaşan sayılır.
export function isUpcomingVisit(visit: Visit, now = new Date()) {
  const todayKey = toDateKey(now);
  if (visit.date !== todayKey) {
    return visit.date > todayKey;
  }
  return visit.time === null || visit.time >= toTimeKey(now);
}

export function splitVisits(visits: Visit[], now = new Date()) {
  const upcoming = visits
    .filter((visit) => isUpcomingVisit(visit, now))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const past = visits
    .filter((visit) => !isUpcomingVisit(visit, now))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

  return { upcoming, past };
}

export function visitWhenLabel({ date, time }: Pick<Visit, 'date' | 'time'>) {
  const day = formatLongDate(fromDateKey(date));
  return time ? `${day}, saat ${formatTime(time)}` : day;
}
