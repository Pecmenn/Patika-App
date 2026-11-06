// Kayıp modu, ilan, QR ve haberler. 01 numaralı dosyanın bıraktığı deneme hesabı ve hayvanla devam eder.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

import { expect, test } from '@playwright/test';
import jpeg from 'jpeg-js';
import jsQR from 'jsqr';
import { _android, type AndroidDevice } from 'playwright';
import { PNG } from 'pngjs';

import { ADB, API_URL, BACKEND_DIR } from './config';
import {
  compose,
  newestDevAccountId,
  pinPublicCode,
  pinReportTimes,
  publicPage,
  query,
  sendSighting,
  waitForApi,
} from './backend';
import { Phone } from './phone';

test.describe.configure({ mode: 'serial' });

const APP_DATA = '/data/data/host.exp.exponent';
const FIXTURE_PHOTO = join(BACKEND_DIR, 'e2e', 'fixtures', 'pet.jpg');
const HOLD_BUTTON = 'Basılı tut, dolunca bırak';
const CODE = 'e2e000000001';
const LINK = `${API_URL}/p/${CODE}`;
const DELETE_BUTTON = /^S[İIiı][Ll]$/;
const CANCEL_BUTTON = /^V[Aa][Zz][Gg].*/;
const FOUND_BUTTON = 'EVET, BULUNDU';
const DELETE_ACCOUNT_BUTTON = /^HESABI S[İI]L$/;
const OK_BUTTON = /^(TAMAM|Tamam)$/;
const SESSION_CARD = 'Oturumun kapandı';
// Mesaj birden çok satır: Android eşleştirmesi "." ile satır sonunu geçemiyor.
const LOST_WARNING = /[\s\S]*Silinecek için açık kayıp ilanın var[\s\S]*/;
// Haritanın başlangıç noktası. Geçmişte seçilen yer yerine hep bu nokta kaydoluyordu.
const MAP_START = { latitude: 41.015, longitude: 28.979 };

let device: AndroidDevice;
let phone: Phone;
let owner = '';

function adb(...args: string[]) {
  return execFileSync(ADB, args, { encoding: 'utf8' }).trim();
}

function readQrFromRgba(data: Uint8Array | Buffer, width: number, height: number) {
  return jsQR(new Uint8ClampedArray(data), width, height)?.data ?? null;
}

function readQr(png: Buffer) {
  const image = PNG.sync.read(png);
  return readQrFromRgba(image.data, image.width, image.height);
}

async function focus() {
  return (await device.shell('dumpsys window | grep mCurrentFocus')).toString();
}

async function goToToday() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if ((await phone.has('Hayvanım kayıp', 800)) || ((await phone.has(/.* kayıp/, 300)) && (await phone.has('Bugün', 200)))) {
      return;
    }
    if (!(await focus()).includes('host.exp.exponent')) {
      await phone.openApp();
      continue;
    }
    await phone.back();
  }
  throw new Error('Bugün ekranına dönülemedi');
}

async function selectPlaceOnMap() {
  await phone.see('Haritayı kaydırıp yeri işaretle');
  const { x, y, width } = await phone.boundsOf({ text: 'Haritayı kaydırıp yeri işaretle' });
  const cx = Math.round(x + width / 2);
  const cy = y + 240;
  await device.shell(`input swipe ${cx} ${cy} ${cx - 150} ${cy + 90} 500`);
  await phone.gone('Haritayı kaydırıp yeri işaretle');
}

async function fillAreaAndStart(area: string) {
  await phone.scrollTo('Son görülme saati');
  await phone.fill('Semt (herkese görünür)', area);
  await phone.hideKeyboard();
  await phone.scrollTo(HOLD_BUTTON);
  await phone.hold(HOLD_BUTTON);
}

// Kayıp ilanındaki harita canlı içerik taşıdığı için piksel karşılaştırmasında kapatılır.
async function mapMask() {
  const anchor = (await phone.has('Henüz ihbar yok', 500)) ? 'Henüz ihbar yok' : /[0-9]+ ihbar/;
  const { y } = await phone.boundsOf({ text: anchor });
  return [{ x: 0, y: y - 620, width: 1080, height: 580 }];
}

async function closeShareSheet() {
  await expect.poll(focus, { timeout: 30_000 }).toContain('intentresolver');
  // Büyük önizlemede ilk "geri" pencereyi yalnızca küçültebiliyor.
  for (let attempt = 0; attempt < 4 && (await focus()).includes('intentresolver'); attempt += 1) {
    await phone.back();
    await phone.wait(800);
  }
  await phone.see('Bağlantıyı kopyala');
}

async function goBackToLost() {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await phone.has('Kayıp modu açık', 1000)) {
      return;
    }
    await phone.back();
  }
  throw new Error('Kayıp ekranına dönülemedi');
}

// PDF içindeki görselin sayfa genişliğine oranı (Android'in PDF yazıcısına göre).
function pdfImageCoverage(pdf: Buffer) {
  const text = pdf.toString('latin1');
  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/.exec(text);
  const pageWidth = Number(box?.[1]);
  const pageHeight = Number(box?.[2]);
  let coverage = 0;
  for (const match of text.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length;
    const end = text.indexOf('endstream', start);
    let content = '';
    try {
      content = inflateSync(pdf.subarray(start, end)).toString('latin1');
    } catch {
      continue;
    }
    if (!content.includes(' Do')) {
      continue;
    }
    const scales = [...content.matchAll(/(-?[\d.]+) 0 0 (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) cm/g)];
    const width = scales.reduce((product, scale) => product * Math.abs(Number(scale[1])), 1);
    coverage = Math.max(coverage, width / pageWidth);
  }
  return { pageWidth, pageHeight, coverage };
}

test.beforeAll(async () => {
  [device] = await _android.devices();
  phone = new Phone(device);
  owner = await newestDevAccountId();
});

test.afterAll(async () => {
  await device.close();
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('ekran', { body: await device.screenshot(), contentType: 'image/png' });
  }
});

test('hayvana fotoğraf eklenir, sunucuya yüklenir', async () => {
  // Taklitçinin galerisine deneme fotoğrafı koyulur.
  adb('push', FIXTURE_PHOTO, '/sdcard/Pictures/patika-test.jpg');
  adb('shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', 'file:///sdcard/Pictures/patika-test.jpg');
  await goToToday();
  await phone.tap('Hayvanlar');
  await phone.tap('Şanslı');
  await phone.tapLabel('Hayvanı düzenle');
  await phone.tapLabel('Fotoğraf ekle');
  // Android'in fotoğraf seçicisi: en yeni fotoğrafa dokunulur.
  await phone.tapLabel(/Photo taken on .*/);
  await phone.wait(2500);
  // Kırpma ekranı çıkarsa onaylanır.
  for (const selector of [{ text: 'CROP' }, { text: 'Crop' }, { desc: 'Crop' }, { desc: 'Done' }, { text: 'Done' }]) {
    if (await device.info(selector).then(() => true, () => false)) {
      await device.tap(selector);
      break;
    }
  }
  await phone.wait(1500);
  await phone.scrollTo('Kaydet');
  await phone.tap('Kaydet');
  await phone.see('Şanslı');

  await expect
    .poll(
      async () => {
        const [row] = await query(
          `SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.photo')) AS photo FROM user_items WHERE owner_id = ? AND collection = 'pets' AND JSON_EXTRACT(data, '$.name') = 'Şanslı'`,
          [owner],
        );
        return row?.photo ?? null;
      },
      { timeout: 30_000 },
    )
    .not.toBeNull();
  await expect
    .poll(
      () => {
        try {
          return execFileSync('docker', ['exec', 'patika-api-1', 'ls', `/data/photos/pets/${owner}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().length;
        } catch {
          return 0;
        }
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);
  await phone.tapLabel('Geri');
});

test('kayıp modu: yer seçilmeden başlatılamaz', async () => {
  await goToToday();
  await phone.tap('Bugün');
  await phone.tap('Hayvanım kayıp');
  await phone.see('Kayıp modunu başlat');
  await phone.see('Son görüldüğü yer');
  await phone.scrollTo(HOLD_BUTTON);
  await phone.see('Başlatmak için haritada son görüldüğü yeri işaretle.');
  await phone.hold(HOLD_BUTTON);
  await phone.wait(1000);
  expect(await phone.has('Kayıp modu açık', 500)).toBe(false);
  await phone.scrollToTop();
});

// "Konumumu kullan" burada sınanamıyor: taklitçide Google'ın konum doğruluğu izni gerekiyor.
// iPhone kontrol listesinde (e2e/SENARYOLAR.md).
test('haritadan seçilen yer ve semt sunucuya kaydolur', async () => {
  await selectPlaceOnMap();
  await phone.scrollTo('Son görülme saati');
  await phone.fill('Semt (herkese görünür)', 'Moda, Kadıköy');
  await phone.hideKeyboard();
  await phone.scrollTo(HOLD_BUTTON);
  await phone.fill('Ayırt edici özellikler (isteğe bağlı)', 'Mavi tasma, çekingen');
  await phone.hideKeyboard();
  await phone.scrollTo(HOLD_BUTTON);

  // Kısa dokunuş başlatmaz: yanlışlıkla ilan açılmasın.
  await phone.tap(HOLD_BUTTON);
  await phone.wait(800);
  expect(await phone.has('Kayıp modu açık', 300)).toBe(false);

  await phone.hold(HOLD_BUTTON);
  await phone.see('Kayıp modu açık');
  await phone.see('Şanslı kayıp');
  await phone.see(/.*Biri kayıp sayfasından konum.*/);

  const [report] = await query('SELECT * FROM lost_reports WHERE owner_id = ? AND found_at IS NULL', [owner]);
  expect(report.last_seen_area).toBe('Moda, Kadıköy');
  expect(report.description).toBe('Mavi tasma, çekingen');
  expect(report.species).toBe('dog');
  const moved = Math.abs(report.last_seen_lat - MAP_START.latitude) + Math.abs(report.last_seen_lng - MAP_START.longitude);
  expect(moved, 'kaydedilen nokta haritanın başlangıç noktası değil').toBeGreaterThan(0.0005);
  expect(report.photo_path, 'ilan fotoğrafı sunucuya yüklendi').not.toBeNull();

  await pinPublicCode(owner, CODE);
  await pinReportTimes(owner);
  const page = await publicPage(CODE);
  expect(page.status).toBe('lost');
  expect(JSON.stringify(page)).not.toContain(String(report.last_seen_lat));

  const photo = await fetch(`${API_URL}/v1/public/photos/${page.photo_path as string}`);
  expect(photo.status).toBe(200);
  expect(photo.headers.get('content-type')).toContain('image/jpeg');
  expect((await photo.arrayBuffer()).byteLength).toBeGreaterThan(1000);

  // Sabitlenen saatlerin ekrana gelmesi için ilan yeniden açılır.
  await phone.tapLabel('Geri');
  // Aynı yazı ilan ekranının başlığında da var: Bugün ekranına dönüldüğü görülmeden dokunulmaz.
  await phone.see('Hayvanlar');
  await phone.tap('Şanslı kayıp');
  await phone.see('Başlangıç 09.30');
  await phone.wait(1500);
  await expect(await phone.screenshot(await mapMask())).toMatchSnapshot('kayip-bos.png');
});

test('ihbar gelince ekran kendiliğinden yenilenir, arama düğmesi telefonu açar, bildirim düşer', async () => {
  await sendSighting(CODE, { place: 'Bahariye Caddesi', lat: 40.99, lng: 29.03, message: 'Fırının önünde gördüm', contact: '0555 123 45 67' });
  await phone.see('Bahariye Caddesi');
  await phone.see('1 ihbar');
  await phone.see('Fırının önünde gördüm');
  // Kayıp modu başladıktan sonraki ilk dokunuş: bir kerede çalışmalı.
  await phone.touch({ desc: /.*numarasını ara/ });
  await expect.poll(focus, { timeout: 10_000 }).toMatch(/dialer|contacts/i);
  await goBackToLost();
  await device.shell('cmd statusbar expand-notifications');
  await phone.see(/Yeni ihbar: Şanslı/);
  await device.shell('cmd statusbar collapse');
  await phone.wait(1500);
});

test('birden çok ihbar: yazısız, konumsuz ve iletişimli olanlar doğru görünür', async () => {
  await sendSighting(CODE, { message: 'Yalnız mesaj', contact: 'ali@example.com' });
  await sendSighting(CODE, { lat: 41.0, lng: 29.0 });
  await phone.see('3 ihbar');
  await phone.see('En yeni üstte');
  await phone.see('Konum paylaşıldı');
  await phone.see('Mesaj geldi');
  await phone.see('İletişim: ali@example.com');
  await phone.wait(1000);
  await expect(await phone.screenshot(await mapMask())).toMatchSnapshot('kayip-ihbarlar.png');
});

test('ilan ekranı: üç biçim de görünür, QR kodu ekrandan okunur', async () => {
  await phone.tap('İlanı paylaş');
  await phone.see('KAYIP KÖPEK');
  await phone.see('Gönderi');
  await phone.see(/Son görülme: .*Moda, Kadıköy/);
  await phone.see('Gördün mü? QR kodunu okut, ailesine haber ver');
  await phone.see(/Telefonda görenler QR kodunu okutamaz.*/);
  await phone.wait(1500);
  await expect(await phone.screenshot()).toMatchSnapshot('ilan-gonderi.png');
  expect(readQr(await device.screenshot())).toBe(LINK);

  await phone.tap('Story');
  await phone.wait(800);
  await expect(await phone.screenshot()).toMatchSnapshot('ilan-story.png');

  await phone.tap('A4 baskı');
  await phone.wait(800);
  await phone.gone(/Telefonda görenler QR kodunu okutamaz.*/);
  await expect(await phone.screenshot()).toMatchSnapshot('ilan-a4.png');
});

test('A4 ilan: tek sayfa, gerçek A4, sayfayı dolduruyor, QR kodu PDF içinden okunuyor', async () => {
  const PDF = 'patika-kayip-ilani.pdf';
  await device.shell(`find ${APP_DATA} -name "${PDF}" -delete`);
  await phone.tap('Paylaş');
  await expect
    .poll(async () => (await device.shell(`find ${APP_DATA} -name "${PDF}"`)).toString().trim(), { timeout: 30_000 })
    .not.toBe('');
  const remote = (await device.shell(`find ${APP_DATA} -name "${PDF}"`)).toString().trim().split('\n')[0]!;
  await expect
    .poll(async () => Number((await device.shell(`stat -c %s ${remote}`)).toString().trim()), { timeout: 30_000 })
    .toBeGreaterThan(50_000);
  await closeShareSheet();

  const out = join(mkdtempSync(join(tmpdir(), 'patika-e2e-')), 'ilan.pdf');
  adb('pull', remote, out);
  const pdf = readFileSync(out);
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length, 'sayfa sayısı').toBe(1);

  const { pageWidth, pageHeight, coverage } = pdfImageCoverage(pdf);
  expect(Math.abs(pageWidth - 595), 'A4 genişliği').toBeLessThan(3);
  expect(Math.abs(pageHeight - 842), 'A4 yüksekliği').toBeLessThan(3);
  expect(coverage, 'görsel sayfayı dolduruyor').toBeGreaterThan(0.97);

  const start = pdf.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
  const end = pdf.lastIndexOf(Buffer.from([0xff, 0xd9]));
  const image = jpeg.decode(pdf.subarray(start, end + 2), { useTArray: true, maxMemoryUsageInMB: 1024 });
  expect(image.width, 'baskı çözünürlüğü').toBeGreaterThan(1500);
  expect(readQrFromRgba(image.data, image.width, image.height), 'PDF içindeki QR').toBe(LINK);
});

for (const [format, width, height] of [
  ['Gönderi', 1080, 1350],
  ['Story', 1080, 1920],
] as const) {
  test(`${format} görseli doğru boyutta üretilir, QR kodu görselden okunur`, async () => {
    await device.shell(`find ${APP_DATA}/cache -name "ReactNative-snapshot-image*" -delete`);
    await phone.tap(format);
    await phone.wait(500);
    await phone.tap('Paylaş');
    await expect
      .poll(async () => (await device.shell(`find ${APP_DATA}/cache -name "ReactNative-snapshot-image*.png"`)).toString().trim(), { timeout: 30_000 })
      .not.toBe('');
    const remote = (await device.shell(`find ${APP_DATA}/cache -name "ReactNative-snapshot-image*.png"`)).toString().trim().split('\n')[0]!;
    await expect
      .poll(async () => Number((await device.shell(`stat -c %s ${remote}`)).toString().trim()), { timeout: 30_000 })
      .toBeGreaterThan(10_000);
    await closeShareSheet();
    const out = join(mkdtempSync(join(tmpdir(), 'patika-e2e-')), 'ilan.png');
    adb('pull', remote, out);
    const png = readFileSync(out);
    const image = PNG.sync.read(png);
    expect(Math.abs(image.width - width), 'genişlik').toBeLessThanOrEqual(2);
    expect(Math.abs(image.height - height), 'yükseklik').toBeLessThanOrEqual(2);
    expect(readQr(png), 'üretilen görseldeki QR').toBe(LINK);
  });
}

test('bağlantı kopyalanır', async () => {
  await phone.tap('Bağlantıyı kopyala');
  await phone.see('Bağlantı kopyalandı');
  await phone.see('Bağlantıyı kopyala', 5000);
  await phone.tapLabel('Geri');
  await phone.see('Kayıp modu açık');
});

test('Android Chrome: kayıp sayfası açılır, ihbar uygulamaya düşer', async () => {
  const context = await device.launchBrowser({ pkg: 'com.android.chrome' });
  try {
    await context.grantPermissions(['geolocation'], { origin: API_URL });
    await context.setGeolocation({ latitude: 40.123, longitude: 29.456 });
    const page = await context.newPage();
    await page.goto(LINK);
    await page.getByRole('heading', { name: 'Merhaba, ben Şanslı' }).waitFor();
    await expect(page.getByText('Moda, Kadıköy')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Şanslı fotoğrafı' })).toBeVisible();
    await page.getByRole('button', { name: 'Şu an buradaysa konumumu ekle' }).click();
    await page.getByText('Şu anki konumun eklendi').waitFor();
    await page.getByLabel('Mesajın').fill('Chrome telefonundan gönderildi');
    await page.getByRole('button', { name: 'Aileme gönder' }).click();
    await page.getByRole('heading', { name: 'Teşekkürler!' }).waitFor();
    await page.close();
  } finally {
    await context.close();
    // Chrome sonradan öne gelip uygulamanın üstünü kapatmasın.
    await device.shell('am force-stop com.android.chrome');
  }
  const rows = await query(`SELECT lat, lng, message FROM sightings WHERE owner_id = ? AND message = 'Chrome telefonundan gönderildi'`, [owner]);
  expect(rows).toHaveLength(1);
  expect(rows[0].lat).toBeCloseTo(40.123, 3);
  // Uygulama yeniden açılınca Bugün ekranı gelir, açık ilan oradan görünür.
  await phone.openApp();
  await phone.see('Şanslı kayıp', 60_000);
  await phone.tap('Şanslı kayıp');
  await phone.see('Kayıp modu açık');
  await phone.see('4 ihbar');
});

test('bulundu: vazgeçilebilir, onaylanınca ilan kapanır ve fotoğraf silinir', async () => {
  const before = await publicPage(CODE);
  await phone.tap('Bulundu');
  await phone.see('Şanslı bulundu mu?');
  await phone.tap(CANCEL_BUTTON);
  await phone.see('Kayıp modu açık');
  expect((await publicPage(CODE)).status).toBe('lost');

  await phone.tap('Bulundu');
  await phone.tap(FOUND_BUTTON);
  await phone.see('Şanslı evde');
  await phone.see('ihbar geldi');

  expect(await publicPage(CODE)).toEqual({ status: 'found', pet_name: 'Şanslı' });
  const photo = await fetch(`${API_URL}/v1/public/photos/${before.photo_path as string}`);
  expect(photo.status).toBe(404);

  await phone.tap("Bugün'e dön");
  await phone.see('Hayvanım kayıp');
});

test('QR ekranı: gerçek kod okunur, değişmez, yazdırma açılır', async () => {
  await phone.tap('Şanslı');
  await phone.tapLabel('QR kodu');
  await phone.see('Şanslı için QR kodu');
  await phone.wait(800);
  await expect(await phone.screenshot()).toMatchSnapshot('qr-ekrani.png');
  expect(readQr(await device.screenshot())).toBe(LINK);

  await phone.tap('Yazdır');
  await expect.poll(focus, { timeout: 20_000 }).toContain('printspooler');
  // Pencere yerleşmeden basılan "geri" arada uygulamayı da kapatıyor (yalnızca taklitçide görüldü).
  await phone.wait(2000);
  await phone.back();
  await phone.wait(800);
  if ((await focus()).includes('ExperienceActivity')) {
    await phone.see('Şanslı için QR kodu');
    await phone.tapLabel('Geri');
  } else {
    await phone.openApp();
    await phone.tap('Şanslı');
  }
  await phone.see('Aşı ekle');
});

test('ilan kapalıyken gelen haber Bugün ekranında kart olur, silinebilir', async () => {
  await phone.tapLabel('Geri');
  await phone.see('Hayvanım kayıp');
  await sendSighting(CODE, { message: 'Tasmasındaki QR ile buldum', contact: '0532 000 00 00', lat: 41.05, lng: 29.01 });
  await phone.see('Şanslı için haber var');
  await phone.see('Biri QR kodunu okutup yazdı. Görmek için dokun.');
  await phone.wait(500);
  await expect(await phone.screenshot()).toMatchSnapshot('bugun-haber-karti.png');

  await phone.tap('Şanslı için haber var');
  await phone.see('Tasmasındaki QR ile buldum');
  await phone.wait(500);
  await expect(await phone.screenshot()).toMatchSnapshot('haber-ekrani.png');

  await phone.tap('Haberleri sil');
  await phone.see('Haberler silinsin mi?');
  await phone.tap(DELETE_BUTTON);
  await phone.see('Hayvanım kayıp');
  await phone.gone('Şanslı için haber var');
  const rows = await query('SELECT id FROM sightings WHERE owner_id = ? AND report_id IS NULL', [owner]);
  expect(rows).toHaveLength(0);
});

test('haberden kayıp modu başlatılır, hayvan seçili gelir, haber ilana eklenir', async () => {
  await sendSighting(CODE, { message: 'Yine gördüm', lat: 41.06, lng: 29.02 });
  await phone.tap('Şanslı için haber var');
  await phone.tap('Kayıp modunu başlat');
  await phone.see('Son görüldüğü yer');
  await selectPlaceOnMap();
  await fillAreaAndStart('Üsküdar');
  await phone.see('Kayıp modu açık');
  await phone.see('1 ihbar');
  await phone.see('Yine gördüm');
  await phone.tap('Bulundu');
  await phone.tap(FOUND_BUTTON);
  await phone.tap("Bugün'e dön");
  await phone.see('Hayvanım kayıp');
});

test('sunucu kapalıyken: kayıtlar çalışır, kayıp modu anlaşılır uyarır, açılınca eşitlenir', async () => {
  compose('stop', 'api');
  try {
    await phone.tap('Şanslı');
    await phone.tap('Aşı ekle');
    await phone.fill('Aşı adı', 'Sunucusuz aşı');
    await phone.hideKeyboard();
    await phone.tap('Kaydet');
    await phone.see('Sunucusuz aşı');

    await phone.tapLabel('QR kodu');
    await phone.see(/QR kodu için internet ve giriş gerekiyor.*/);
    await phone.tapLabel('Geri');
    await phone.see('Aşı ekle');
    await phone.tapLabel('Geri');
    await phone.see('Hayvanım kayıp');

    await phone.tap('Hayvanım kayıp');
    await selectPlaceOnMap();
    await fillAreaAndStart('Moda');
    await phone.see('Kayıp modu başlatılamadı');
    await phone.tap(/^(TAMAM|Tamam)$/);
    await phone.scrollToTop();
    await phone.tapLabel('Kapat');

    await phone.tap('Hayvanlar');
    await phone.tapLabel('Ayarlar');
    await phone.see(/.*değişiklik internet bekliyor|Sunucuya ulaşılamadı.*/);
    const before = await query(
      `SELECT id FROM user_items WHERE owner_id = ? AND JSON_EXTRACT(data, '$.name') = 'Sunucusuz aşı'`,
      [owner],
    );
    expect(before).toHaveLength(0);
  } finally {
    compose('start', 'api');
    await waitForApi();
  }
  await phone.backgroundAndReturn();
  await phone.see('Kayıtların sunucuda', 40_000);
  await expect
    .poll(async () => {
      const rows = await query(
        `SELECT id FROM user_items WHERE owner_id = ? AND JSON_EXTRACT(data, '$.name') = 'Sunucusuz aşı'`,
        [owner],
      );
      return rows.length;
    })
    .toBe(1);
});

test('sunucu yeniden başlayınca canlı bağlantı geri gelir', async () => {
  await phone.tapLabel('Geri');
  await phone.see('Hayvanlar');
  await phone.tap('Bugün');
  await phone.see('Hayvanım kayıp');
  await sendSighting(CODE, { message: 'Bağlantı testi' });
  await phone.see('Şanslı için haber var', 45_000);
  await query('DELETE FROM sightings WHERE owner_id = ? AND report_id IS NULL', [owner]);
  await phone.tap('Hayvanlar');
  await phone.tapLabel('Ayarlar');
});

test('oturum geçersiz olursa Bugün ekranında uyarı çıkar, telefondaki kayıtlar silinmez', async () => {
  await query('DELETE FROM sessions WHERE user_id = ?', [owner]);
  await phone.backgroundAndReturn();
  await phone.see('Giriş yapılmadı', 40_000);
  await phone.tapLabel('Geri');
  await phone.see('Şanslı');
  await phone.tap('Bugün');
  await phone.see(SESSION_CARD);
  await phone.see('Şanslı');
  await phone.wait(600);
  await expect(await phone.screenshot()).toMatchSnapshot('oturum-kapandi.png');
  await phone.tap('Hayvanlar');
});

test('başka hesapla girişte sorulur: vazgeçilir, kayıt silinmez; aktarılırsa yeni hesaba gider', async () => {
  await phone.tapLabel('Ayarlar');
  await phone.tap('Deneme hesabıyla gir');
  await phone.see('Bu telefonda başka bir hesabın kayıtları var');
  await expect(await phone.screenshot()).toMatchSnapshot('baska-hesap-sorusu.png');
  await phone.tap(CANCEL_BUTTON);
  await phone.see('Giriş yapılmadı');
  await phone.tapLabel('Geri');
  await phone.see('Şanslı');

  // Bu kez Bugün ekranındaki karttan: giriş yapılınca kart kaybolur.
  await phone.tap('Bugün');
  await phone.see(SESSION_CARD);
  await phone.tap('Deneme hesabıyla gir');
  await phone.tap(/^(Bu hesaba aktar|BU HESABA AKTAR)$/);
  await phone.gone(SESSION_CARD, 40_000);
  await phone.tap('Hayvanlar');
  await phone.tapLabel('Ayarlar');
  await phone.see('Deneme hesabı');
  await phone.see('Kayıtların sunucuda', 40_000);
  const next = await newestDevAccountId();
  expect(next).not.toBe(owner);
  await expect
    .poll(async () => {
      const rows = await query(
        `SELECT id FROM user_items WHERE owner_id = ? AND collection = 'pets' AND JSON_EXTRACT(data, '$.name') = 'Şanslı'`,
        [next],
      );
      return rows.length;
    })
    .toBe(1);
  // Eski deneme hesabı temizlenir ki yeni telefon senaryosu yalnızca bu hesabın verisini kullansın.
  await query('DELETE FROM users WHERE id = ? AND apple_sub IS NULL', [owner]);
  owner = next;
});

test('yeni telefon: kayıtlar ve fotoğraf sunucudan geri gelir', async () => {
  // Fotoğrafın sunucuya ulaşmasını bekler, sonra telefonu sıfırlar.
  await expect
    .poll(
      () => {
        try {
          return execFileSync('docker', ['exec', 'patika-api-1', 'ls', `/data/photos/pets/${owner}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().length;
        } catch {
          return 0;
        }
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);

  await phone.openApp({ clearData: true });
  await phone.see('İlk hayvanını ekle', 120_000);
  await phone.tap('İlk hayvanını ekle');
  await phone.fill('Ad', 'Geçici');
  await phone.hideKeyboard();
  await phone.tap('Kedi');
  await phone.tap('Kaydet');
  await phone.see('Hayvanım kayıp');
  await phone.tap('Hayvanlar');
  await phone.tapLabel('Ayarlar');
  await phone.tap('Deneme hesabıyla gir');
  await phone.see('Kayıtların sunucuda');
  const next = await newestDevAccountId();
  expect(next).not.toBe(owner);

  // Eski hesabın kayıtları bu hesaba bağlanır: başka telefondan aynı hesaba giriş gibi.
  await query('UPDATE user_items SET owner_id = ?, synced_at = CURRENT_TIMESTAMP(3) WHERE owner_id = ?', [next, owner]);
  execFileSync('docker', ['exec', 'patika-api-1', 'cp', '-r', `/data/photos/pets/${owner}/.`, `/data/photos/pets/${next}/`], { stdio: 'ignore' });
  await phone.backgroundAndReturn();
  await phone.tapLabel('Geri');
  await phone.see('Şanslı', 40_000);
  await phone.see('Geçici');
  await expect
    .poll(async () => (await device.shell(`find ${APP_DATA} -path "*pet-photos*" -type f | wc -l`)).toString().trim(), { timeout: 40_000 })
    .not.toBe('0');
  owner = next;
});

test('çıkış: onay istenir, telefon temizlenir, sunucudaki oturum kapanır, kayıtlar sunucuda kalır', async () => {
  await phone.tapLabel('Ayarlar');
  await phone.tap('Çıkış yap');
  await phone.see('Çıkış yapılsın mı?');
  await phone.tap('ÇIKIŞ YAP');
  await phone.see('İlk hayvanını ekle', 30_000);
  const rows = await query('SELECT token_hash FROM sessions WHERE user_id = ?', [owner]);
  expect(rows).toHaveLength(0);
  const items = await query('SELECT id FROM user_items WHERE owner_id = ?', [owner]);
  expect(items.length, 'sunucudaki kayıtlar durur').toBeGreaterThan(0);
});

test('hesap silme: sunucu yokken hiçbir şey silinmez, vazgeçilebilir, onaylanınca her şey gider', async () => {
  test.setTimeout(300_000);
  await phone.tap('İlk hayvanını ekle');
  await phone.fill('Ad', 'Silinecek');
  await phone.hideKeyboard();
  await phone.tap('Kedi');
  await phone.tap('Kaydet');
  await phone.see('Hayvanım kayıp');
  expect(await phone.has(SESSION_CARD, 500), 'kendi isteğiyle çıkınca uyarı çıkmaz').toBe(false);
  await phone.tap('Hayvanlar');
  await phone.tapLabel('Ayarlar');
  await phone.tap('Deneme hesabıyla gir');
  await phone.see('Kayıtların sunucuda');
  const account = await newestDevAccountId();
  expect(account).not.toBe(owner);

  const petRows = () =>
    query(`SELECT id FROM user_items WHERE owner_id = ? AND collection = 'pets' AND deleted = 0`, [account]);
  await expect.poll(async () => (await petRows()).length).toBe(1);
  const [{ id: petId }] = await petRows();

  // Açık ilan ve QR kodu sunucuda hazırlanır: bunların telefondan açılması yukarıda sınandı.
  const code = randomBytes(6).toString('hex');
  await query('INSERT INTO pet_tags (owner_id, pet_id, public_code) VALUES (?, ?, ?)', [account, petId, code]);
  await query(
    `INSERT INTO lost_reports (id, owner_id, pet_id, pet_name, species, last_seen_area, last_seen_lat, last_seen_lng, last_seen_at)
     VALUES (UUID(), ?, ?, 'Silinecek', 'cat', 'Moda', 41, 29, CURRENT_TIMESTAMP(3))`,
    [account, petId],
  );
  const accountRows = () => query('SELECT id FROM users WHERE id = ?', [account]);

  await phone.tap('Hesabı sil');
  await phone.see('Hesabın silinsin mi?');
  await phone.see(LOST_WARNING);
  await phone.wait(500);
  expect(await phone.screenshot()).toMatchSnapshot('hesap-silme-onayi.png');
  await phone.tap(CANCEL_BUTTON);
  await phone.see('Çıkış yap');
  expect(await accountRows(), 'vazgeçince hesap durur').toHaveLength(1);

  // Sunucuya ulaşılamıyorsa onay bile sorulmaz.
  compose('stop', 'api');
  try {
    await phone.tap('Hesabı sil');
    await phone.see('Hesap silinemedi', 40_000);
    await phone.tap(OK_BUTTON);
  } finally {
    compose('start', 'api');
    await waitForApi();
  }

  // Onay penceresi açıkken sunucu giderse: telefondaki kayıtlar ve oturum durur.
  await phone.tap('Hesabı sil');
  await phone.see(LOST_WARNING, 40_000);
  compose('stop', 'api');
  try {
    await phone.tap(DELETE_ACCOUNT_BUTTON);
    await phone.see('Hesap silinemedi', 40_000);
    await phone.tap(OK_BUTTON);
    await phone.see('Çıkış yap');
    await phone.see('Hesabı sil');
  } finally {
    compose('start', 'api');
    await waitForApi();
  }
  expect(await accountRows(), 'silinemeyince hesap durur').toHaveLength(1);
  await phone.tapLabel('Geri');
  await phone.see('Silinecek');
  await phone.tapLabel('Ayarlar');

  await phone.tap('Hesabı sil');
  await phone.see(LOST_WARNING, 40_000);
  await phone.tap(DELETE_ACCOUNT_BUTTON);
  await phone.see('Hesabın silindi', 40_000);
  await phone.tap(OK_BUTTON);
  // Karşılama ancak telefonda hayvan kalmadıysa açılır: telefon da temizlendi demektir.
  await phone.see('İlk hayvanını ekle', 30_000);

  for (const [table, column] of [
    ['users', 'id'],
    ['sessions', 'user_id'],
    ['user_items', 'owner_id'],
    ['pet_tags', 'owner_id'],
    ['lost_reports', 'owner_id'],
  ]) {
    expect(await query(`SELECT 1 FROM ${table} WHERE ${column} = ?`, [account]), table).toHaveLength(0);
  }
  const page = await fetch(`${API_URL}/v1/public/pets/${code}`);
  expect(page.status, 'QR sayfası kapanır').toBe(404);
  const others = await query('SELECT id FROM user_items WHERE owner_id = ?', [owner]);
  expect(others.length, 'başka hesabın kayıtları durur').toBeGreaterThan(0);

  await phone.tap('İlk hayvanını ekle');
  await phone.fill('Ad', 'Yeni');
  await phone.hideKeyboard();
  await phone.tap('Kedi');
  await phone.tap('Kaydet');
  await phone.see('Hayvanım kayıp');
  expect(await phone.has(SESSION_CARD, 500), 'hesap silinince uyarı çıkmaz').toBe(false);
});
