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

export function addYears(date: Date, years: number) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function yearsAgo(years: number) {
  return addYears(new Date(), -years);
}

// Bugünden o tarihe kaç gün var. Geçmişteyse eksi döner.
export function daysUntil(key: string) {
  const now = new Date();
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
