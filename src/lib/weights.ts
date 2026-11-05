import type { WeightEntry, WeightRange } from '@/data/weights';
import {
  addMonths,
  addYears,
  formatShortMonth,
  fromDateKey,
  toDateKey,
} from '@/lib/dates';

const MAX_KG = 200;

const kgFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 });

export function formatKg(kg: number) {
  return kgFormat.format(kg);
}

export function kgToInput(kg: number) {
  return String(kg).replace('.', ',');
}

// Kuş gibi küçük hayvanlar için üç ondalığa kadar kabul edilir (0,035 kg).
export function parseKg(text: string) {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) {
    return null;
  }
  const kg = Number(normalized);
  return kg > 0 && kg <= MAX_KG ? kg : null;
}

function roundKg(kg: number) {
  return Number(kg.toFixed(3));
}

// Eskiden yeniye. Aynı gündeki tartılarda sonradan eklenen sonra gelir.
export function sortByDate(entries: WeightEntry[]) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date) || a.index - b.index)
    .map(({ entry }) => entry);
}

export type WeightWithDelta = WeightEntry & { delta: number | null };

// Yeniden eskiye liste. Her kayıt kendinden önceki tartıyla karşılaştırılır.
export function withDeltas(entries: WeightEntry[]): WeightWithDelta[] {
  const sorted = sortByDate(entries);
  return sorted
    .map((entry, index) => ({
      ...entry,
      delta: index === 0 ? null : roundKg(entry.kg - sorted[index - 1].kg),
    }))
    .reverse();
}

export function formatDelta(delta: number) {
  if (delta === 0) {
    return '0';
  }
  return `${delta > 0 ? '+' : '-'}${formatKg(Math.abs(delta))}`;
}

export type RangeStatus = 'below' | 'inside' | 'above';

export function rangeStatus(kg: number, range: WeightRange): RangeStatus {
  if (kg < range.min) {
    return 'below';
  }
  return kg > range.max ? 'above' : 'inside';
}

const RANGE_LABELS: Record<RangeStatus, string> = {
  below: 'sağlıklı aralığın altında',
  inside: 'sağlıklı aralıkta',
  above: 'sağlıklı aralığın üstünde',
};

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
}

export function rangeLabel(kg: number, range: WeightRange) {
  return capitalize(RANGE_LABELS[rangeStatus(kg, range)]);
}

// Tasarımdaki gibi tek cümle: "Önceki tartıdan bu yana 0,3 kg arttı, sağlıklı aralıkta."
export function weightSummary(entries: WeightEntry[], range: WeightRange | null) {
  const [latest, previous] = withDeltas(entries);
  if (!latest) {
    return null;
  }
  const parts: string[] = [];
  if (previous && latest.delta !== null) {
    if (latest.delta === 0) {
      parts.push('Önceki tartıdan bu yana değişmedi');
    } else {
      const change = latest.delta > 0 ? 'arttı' : 'azaldı';
      parts.push(`Önceki tartıdan bu yana ${formatKg(Math.abs(latest.delta))} kg ${change}`);
    }
  }
  if (range) {
    parts.push(RANGE_LABELS[rangeStatus(latest.kg, range)]);
  }
  return parts.length > 0 ? `${capitalize(parts.join(', '))}.` : null;
}

export type WeightPeriod = '1m' | '6m' | '1y' | 'all';

export const WEIGHT_PERIODS: { value: WeightPeriod; label: string }[] = [
  { value: '1m', label: '1 ay' },
  { value: '6m', label: '6 ay' },
  { value: '1y', label: '1 yıl' },
  { value: 'all', label: 'Tümü' },
];

export function filterByPeriod(entries: WeightEntry[], period: WeightPeriod, now = new Date()) {
  if (period === 'all') {
    return entries;
  }
  const start =
    period === '1y' ? addYears(now, -1) : addMonths(now, period === '6m' ? -6 : -1);
  const startKey = toDateKey(start);
  return entries.filter((entry) => entry.date >= startKey);
}

const PADDING = { left: 30, right: 16, top: 38, bottom: 24 };
const TICK_STEPS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
const MAX_TICK_INTERVALS = 4.5;
const MAX_X_LABELS = 5;
const MONTH_ONLY_AFTER_DAYS = 62;
const DAY_MS = 86_400_000;

function buildXLabels(firstTime: number, lastTime: number, xOf: (time: number) => number) {
  const spanDays = (lastTime - firstTime) / DAY_MS;
  const labelFor = (time: number) => {
    const date = new Date(time);
    return spanDays > MONTH_ONLY_AFTER_DAYS
      ? formatShortMonth(date)
      : `${date.getDate()} ${formatShortMonth(date)}`;
  };

  if (firstTime === lastTime) {
    return [{ x: xOf(firstTime), label: labelFor(firstTime) }];
  }
  const labels: { x: number; label: string }[] = [];
  for (let index = 0; index < MAX_X_LABELS; index += 1) {
    const time = firstTime + ((lastTime - firstTime) * index) / (MAX_X_LABELS - 1);
    const label = labelFor(time);
    if (labels[labels.length - 1]?.label !== label) {
      labels.push({ x: xOf(time), label });
    }
  }
  return labels;
}

// Grafiğin çizim hesabı. entries eskiden yeniye sıralı olmalı ve en az bir kayıt içermeli.
export function buildWeightChart(
  entries: WeightEntry[],
  range: WeightRange | null,
  width: number,
  height: number,
) {
  const values = entries.map((entry) => entry.kg);
  const low = Math.min(...values, ...(range ? [range.min] : []));
  const high = Math.max(...values, ...(range ? [range.max] : []));
  const span = high - low;
  const margin = span > 0 ? span * 0.12 : Math.max(high * 0.1, 0.05);
  const yMin = Math.max(low - margin, 0);
  const yMax = high + margin;

  const plot = {
    left: PADDING.left,
    right: width - PADDING.right,
    top: PADDING.top,
    bottom: height - PADDING.bottom,
  };
  const yOf = (kg: number) =>
    plot.bottom - ((kg - yMin) / (yMax - yMin)) * (plot.bottom - plot.top);

  const times = entries.map((entry) => fromDateKey(entry.date).getTime());
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  const xOf = (time: number) =>
    firstTime === lastTime
      ? (plot.left + plot.right) / 2
      : plot.left + ((time - firstTime) / (lastTime - firstTime)) * (plot.right - plot.left);

  const points = entries.map((entry, index) => ({ x: xOf(times[index]), y: yOf(entry.kg) }));
  const last = points[points.length - 1];

  const step =
    TICK_STEPS.find((candidate) => (yMax - yMin) / candidate <= MAX_TICK_INTERVALS) ?? 100;
  const ticks: { y: number; label: string }[] = [];
  for (let tick = Math.ceil(yMin / step) * step; tick <= yMax; tick += step) {
    const rounded = roundKg(tick);
    ticks.push({ y: yOf(rounded), label: formatKg(rounded) });
  }

  return {
    plot,
    points,
    ticks,
    xLabels: buildXLabels(firstTime, lastTime, xOf),
    band: range ? { top: yOf(range.max), bottom: yOf(range.min) } : null,
    last,
  };
}
