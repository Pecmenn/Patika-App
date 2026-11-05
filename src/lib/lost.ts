const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function timeAgoLabel(date: Date, now = new Date()) {
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE_MS) {
    return 'Az önce';
  }
  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)} dk önce`;
  }
  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)} sa önce`;
  }
  return `${Math.floor(elapsed / DAY_MS)} gün önce`;
}

export function durationLabel(start: Date, end: Date) {
  const elapsed = Math.max(end.getTime() - start.getTime(), 0);
  if (elapsed < HOUR_MS) {
    return `${Math.max(Math.round(elapsed / MINUTE_MS), 1)} dk`;
  }
  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);
    const minutes = Math.round((elapsed - hours * HOUR_MS) / MINUTE_MS);
    return minutes > 0 ? `${hours} sa ${minutes} dk` : `${hours} sa`;
  }
  return `${Math.round(elapsed / DAY_MS)} gün`;
}

type AddressParts = {
  district?: string | null;
  subregion?: string | null;
  city?: string | null;
  region?: string | null;
};

// Herkese görünecek yazı. Sokak ve bina bilgisi bilerek alınmaz, evin yerini ele vermesin.
export function areaFromAddress({ district, subregion, city, region }: AddressParts) {
  const wide = subregion ?? city ?? region ?? null;
  const parts = [district, wide].filter((part): part is string => Boolean(part));
  return [...new Set(parts)].join(', ');
}

export type Point = { latitude: number; longitude: number };

const MIN_DELTA = 0.012;
// Yaklaşık 50 metre. Harita bir noktaya gittiğinde tam aynı sayıda durmayabiliyor.
const SAME_SPOT_DEGREES = 0.0005;

export function isSameSpot(a: Point, b: Point) {
  return (
    Math.abs(a.latitude - b.latitude) <= SAME_SPOT_DEGREES &&
    Math.abs(a.longitude - b.longitude) <= SAME_SPOT_DEGREES
  );
}

// Tüm noktaları içine alan harita görünümü.
export function regionFor(points: Point[]) {
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 2, MIN_DELTA),
    longitudeDelta: Math.max((maxLng - minLng) * 2, MIN_DELTA),
  };
}

// QR kodunun ve ilanın gösterdiği sayfa. Sayfa, uygulamanın istek attığı sunucudan yayınlanır.
export function lostPageLink(code: string, base: string) {
  return `${base}/p/${code}`;
}

// İlanda yazılı görünen hali.
export function shortLink(link: string) {
  return link.replace(/^https?:\/\//, '');
}

// İlan yokken gelen haberler hayvan başına bir kartta toplanır, yeni gelen hayvan önde durur.
export function groupMessagesByPet<T extends { petId: string }>(messages: T[]) {
  const groups = new Map<string, T[]>();
  for (const message of messages) {
    groups.set(message.petId, [...(groups.get(message.petId) ?? []), message]);
  }
  return [...groups.entries()].map(([petId, items]) => ({ petId, items }));
}

// Girilen saat şu andan sonraysa dün demektir: gece yarısından sonra "23.00'te gördüm" gibi.
export function lastSeenDate(hours: number, minutes: number, now = new Date()) {
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  if (date > now) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}
