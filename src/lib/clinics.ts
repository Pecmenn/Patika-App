import type { Species } from '@/data/pets';
import { formatTime } from '@/lib/dates';
import type { Point } from '@/lib/lost';

// Klinik saatleri Türkiye saatiyle tutuluyor, telefon başka saat dilimindeyse de doğru görünsün.
const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const EARTH_RADIUS_KM = 6371;

export type DayHours = { open: string; close: string } | null;
export type ClinicService =
  | 'exam'
  | 'vaccine'
  | 'surgery'
  | 'dental'
  | 'lab'
  | 'imaging'
  | 'grooming'
  | 'emergency';

export type Clinic = {
  id: string;
  name: string;
  vetName: string;
  phone: string;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  hours: DayHours[];
  slotMinutes: number;
  species: Species[];
  services: ClinicService[];
  description: string | null;
  website: string | null;
  instagram: string | null;
  photoUrl: string | null;
};

export const SERVICE_OPTIONS: { value: ClinicService; label: string }[] = [
  { value: 'exam', label: 'Muayene' },
  { value: 'vaccine', label: 'Aşı' },
  { value: 'surgery', label: 'Ameliyat' },
  { value: 'dental', label: 'Diş' },
  { value: 'lab', label: 'Laboratuvar' },
  { value: 'imaging', label: 'Röntgen ve ultrason' },
  { value: 'grooming', label: 'Tıraş ve bakım' },
  { value: 'emergency', label: '7/24 acil' },
];

export const SLOT_OPTIONS = [15, 20, 30, 45, 60];
export const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SHORT_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const SHORT_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function distanceKm(a: Point, b: Point) {
  const latitudeGap = toRadians(b.latitude - a.latitude);
  const longitudeGap = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(latitudeGap / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(longitudeGap / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number) {
  if (km < 1) {
    return `${Math.max(Math.round(km * 100) * 10, 10)} m`;
  }
  return km < 10 ? `${km.toFixed(1).replace('.', ',')} km` : `${Math.round(km)} km`;
}

export type ClinicWithDistance<T> = T & { distance: number | null };

// Konum varsa en yakından uzağa, yoksa ad sırasına göre.
export function sortClinics<T extends { name: string; latitude: number; longitude: number }>(
  clinics: T[],
  from: Point | null,
): ClinicWithDistance<T>[] {
  const withDistance = clinics.map((clinic) => ({
    ...clinic,
    distance: from ? distanceKm(from, clinic) : null,
  }));
  return withDistance.sort((a, b) =>
    a.distance !== null && b.distance !== null
      ? a.distance - b.distance
      : a.name.localeCompare(b.name, 'tr'),
  );
}

// Pazartesi 0, pazar 6.
function weekdayOf(shifted: Date) {
  return (shifted.getUTCDay() + 6) % 7;
}

function nextOpening(hours: DayHours[], shifted: Date) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const weekday = (weekdayOf(shifted) + offset) % 7;
    const day = hours[weekday];
    if (day) {
      return { day, label: offset === 1 ? 'yarın' : (SHORT_DAYS[weekday] as string) };
    }
  }
  return null;
}

export function openStatus(hours: DayHours[], now = new Date()) {
  const shifted = new Date(now.getTime() + TURKEY_OFFSET_MS);
  const time = shifted.toISOString().slice(11, 16);
  const today = hours[weekdayOf(shifted)];
  if (today && time >= today.open && time < today.close) {
    return { isOpen: true, label: `Şimdi açık, kapanış ${formatTime(today.close)}` };
  }
  if (today && time < today.open) {
    return { isOpen: false, label: `Kapalı, açılış ${formatTime(today.open)}` };
  }
  const next = nextOpening(hours, shifted);
  return {
    isOpen: false,
    label: next ? `Kapalı, ${next.label} ${formatTime(next.day.open)}` : 'Kapalı',
  };
}

export type BookingDay = {
  date: string;
  weekday: string;
  dayOfMonth: number;
  month: string;
  isClosed: boolean;
};

export function bookingDays(hours: DayHours[], now = new Date(), count = 14): BookingDay[] {
  const start = now.getTime() + TURKEY_OFFSET_MS;
  return Array.from({ length: count }, (_, offset) => {
    const shifted = new Date(start + offset * DAY_MS);
    const weekday = weekdayOf(shifted);
    return {
      date: shifted.toISOString().slice(0, 10),
      weekday: SHORT_DAYS[weekday] as string,
      dayOfMonth: shifted.getUTCDate(),
      month: SHORT_MONTHS[shifted.getUTCMonth()] as string,
      isClosed: !hours[weekday],
    };
  });
}

// Örneğin "5 Kas Per, 15.30".
export function formatAppointmentWhen(date: string, time: string) {
  const day = new Date(`${date}T12:00:00Z`);
  const month = SHORT_MONTHS[day.getUTCMonth()];
  return `${day.getUTCDate()} ${month} ${SHORT_DAYS[weekdayOf(day)]}, ${formatTime(time)}`;
}

export function todayIndex(now = new Date()) {
  return weekdayOf(new Date(now.getTime() + TURKEY_OFFSET_MS));
}

export function defaultHours(): DayHours[] {
  const workday = { open: '09:00', close: '18:00' };
  return [workday, workday, workday, workday, workday, workday, null];
}

export function hasValidHours(hours: DayHours[]) {
  return hours.some(Boolean) && hours.every((day) => !day || day.open < day.close);
}

export function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

// Sunucudaki kuralla aynı.
export function isValidPhone(value: string) {
  return /^[0-9+() -]{7,24}$/.test(value.trim());
}

export function isValidWebsite(value: string) {
  const trimmed = value.trim();
  return trimmed === '' || /^https?:\/\/\S+$/i.test(trimmed);
}

export function isValidInstagram(value: string) {
  const trimmed = value.trim();
  return trimmed === '' || /^@?[A-Za-z0-9._]{1,30}$/.test(trimmed);
}

export function instagramUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, '')}`;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'expired';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Onay bekliyor',
  confirmed: 'Onaylandı',
  rejected: 'Reddedildi',
  cancelled: 'İptal edildi',
  expired: 'Süresi doldu',
};

type NoticeSource = {
  clinicName: string;
  petName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  cancelledBy: 'owner' | 'vet' | null;
  respondedAt: Date | null;
};

// Klinik reddettiyse ya da iptal ettiyse sahip bunu birkaç gün Bugün ekranında görür.
const NOTICE_DAYS = 3;

export function appointmentNotice(appointments: NoticeSource[], now = new Date()) {
  const isRecent = ({ respondedAt }: NoticeSource) =>
    respondedAt !== null && now.getTime() - respondedAt.getTime() < NOTICE_DAYS * DAY_MS;
  const bad = appointments.find(
    (item) =>
      isRecent(item) &&
      (item.status === 'rejected' || (item.status === 'cancelled' && item.cancelledBy === 'vet')),
  );
  if (bad) {
    return {
      title:
        bad.status === 'rejected'
          ? `${bad.clinicName} randevu isteğini reddetti`
          : `${bad.clinicName} randevunu iptal etti`,
      body: `${bad.petName}, ${formatAppointmentWhen(bad.date, bad.time)}. Görmek için dokun.`,
    };
  }
  const pending = appointments.filter((item) => item.status === 'pending');
  const first = pending[0];
  if (!first) {
    return null;
  }
  return {
    title: pending.length > 1 ? `${pending.length} randevu isteğin cevap bekliyor` : 'Randevu isteğin cevap bekliyor',
    body: `${first.clinicName}, ${first.petName}, ${formatAppointmentWhen(first.date, first.time)}`,
  };
}
