const longDateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const weekdayFormat = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const weekdayNameFormat = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' });
const shortWeekdayFormat = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });
const shortMonthFormat = new Intl.DateTimeFormat('tr-TR', { month: 'short' });

export function formatShortWeekday(date: Date) {
  return shortWeekdayFormat.format(date);
}

export function formatShortMonth(date: Date) {
  return shortMonthFormat.format(date);
}

export function formatWeekdayName(date: Date) {
  return weekdayNameFormat.format(date).toLocaleLowerCase('tr-TR');
}

export function formatLongDate(date: Date) {
  return longDateFormat.format(date);
}

export function formatShortDate(date: Date) {
  return shortDateFormat.format(date);
}

export function formatWeekday(date: Date) {
  return weekdayFormat.format(date);
}

// Tarihler saat dilimi kaymasın diye YYYY-AA-GG biçiminde saklanır.
export function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Saatler SS:DD biçiminde saklanır, ekranda Türkçe yazımıyla (09.00) görünür.
export function toTimeKey(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatTime(timeKey: string) {
  return timeKey.replace(':', '.');
}

export function atTime(dateKey: string, timeKey: string) {
  const [hours, minutes] = timeKey.split(':').map(Number);
  const result = fromDateKey(dateKey);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Ayın 31'inden bir ay sonrası, kısa aylarda ayın son günüdür.
export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfMonth));
  return result;
}

export function addYears(date: Date, years: number) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function yearsSince(dateKey: string, now = new Date()) {
  const date = fromDateKey(dateKey);
  const hadAnniversary =
    now.getMonth() > date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  return Math.max(now.getFullYear() - date.getFullYear() - (hadAnniversary ? 0 : 1), 0);
}

export function yearsAgo(years: number) {
  return addYears(new Date(), -years);
}

// Bugünden o tarihe kaç gün var. Geçmişteyse eksi döner.
export function daysUntil(key: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((fromDateKey(key).getTime() - today.getTime()) / 86_400_000);
}

export function ageLabel(birthDateKey: string, isApproximate: boolean) {
  const birth = fromDateKey(birthDateKey);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }
  const age = months < 12 ? `${Math.max(months, 0)} aylık` : `${Math.floor(months / 12)} yaş`;
  return isApproximate ? `yaklaşık ${age}` : age;
}

export function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Günaydın';
  if (hour >= 12 && hour < 18) return 'İyi günler';
  if (hour >= 18 && hour < 22) return 'İyi akşamlar';
  return 'İyi geceler';
}
