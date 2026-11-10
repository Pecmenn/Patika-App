import { formatTime, toTimeKey } from '@/lib/dates';
import { qrSvg } from '@/lib/qr';

export type PosterFormat = 'story' | 'post' | 'a4';

type FormatSize = {
  label: string;
  // Üretilecek görselin piksel boyutu. A4, 200 DPI'a denk geliyor.
  width: number;
  height: number;
  // Tasarımdaki ölçülerin genişliği. Yazılar ve boşluklar buna göre büyür.
  units: number;
  // Açıklama yaklaşık bu kadar karakterde kesilir. Boşsa tamamı görünür.
  descriptionChars: number | undefined;
};

export const POSTER_FORMATS: Record<PosterFormat, FormatSize> = {
  story: {
    label: 'Story',
    width: 1080,
    height: 1920,
    units: 360,
    descriptionChars: 150,
  },
  post: {
    label: 'Gönderi',
    width: 1080,
    height: 1350,
    units: 360,
    descriptionChars: 130,
  },
  a4: {
    label: 'A4 baskı',
    width: 1654,
    height: 2339,
    units: 420,
    descriptionChars: undefined,
  },
};

export function isDescriptionCut(format: PosterFormat, description: string) {
  const limit = POSTER_FORMATS[format].descriptionChars;
  return limit !== undefined && description.length > limit;
}

export const POSTER_FORMAT_KEYS = Object.keys(POSTER_FORMATS) as PosterFormat[];

const HEADINGS: Record<string, string> = {
  cat: 'KEDİ',
  dog: 'KÖPEK',
  rabbit: 'TAVŞAN',
  bird: 'KUŞ',
};

export function posterHeading(species: string) {
  return `KAYIP ${HEADINGS[species] ?? 'HAYVAN'}`;
}

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

export function posterLastSeen(area: string, date: Date) {
  const clock = formatTime(toTimeKey(date));
  return `Son görülme: ${date.getDate()} ${MONTHS[date.getMonth()]}, ${clock}, ${area}`;
}

export function posterDescription(breed: string | null, description: string | null) {
  return [breed, description].filter(Boolean).join('. ');
}

// A4 ilan tek sayfalık bir PDF olur. Sayfa ölçüsü PDF'in birimiyle: 595 x 842.
export const A4_PAGE = { width: 595, height: 842 };

// Ölçü yüzde olarak verilir: yazıcı motoru pikseli küçülttüğü için sabit piksel sayfayı doldurmuyor.
export function a4PosterHtml(jpegBase64: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
img { display: block; width: 100%; height: 99.8vh; object-fit: fill; }
</style></head><body><img src="data:image/jpeg;base64,${jpegBase64}"></body></html>`;
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const SHEET_TAGS = 24;

// Kesilip tasmaya takılacak küçük QR kartları. 3 cm'den küçük kod kolay okunmaz, daha büyüğü de tasmaya uymaz.
export function qrSheetHtml(petName: string, link: string, color: string) {
  const name = escapeHtml(petName);
  const qr = qrSvg(link, color);
  const tag = `<div class="tag">${qr}<b>${name}</b><span>Beni bulduysan okut</span></div>`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { padding: 9mm 10mm; color: ${color}; font-family: -apple-system, Helvetica, Arial, sans-serif; }
h1 { margin: 0; font-size: 15pt; }
p { margin: 1mm 0 5mm; font-size: 10pt; }
.tags { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1mm; }
.tag { display: flex; flex-direction: column; align-items: center; padding: 1.5mm; border: 0.3mm dashed #9a9ab0; break-inside: avoid; }
svg { width: 30mm; height: 30mm; }
b { font-size: 10pt; }
span { font-size: 7.5pt; }
</style></head><body>
<h1>${name} için QR kodları</h1>
<p>Birini kesip tasmaya tak, ıslanmasın diye üzerini şeffaf bantla kapla.</p>
<div class="tags">${tag.repeat(SHEET_TAGS)}</div>
</body></html>`;
}
