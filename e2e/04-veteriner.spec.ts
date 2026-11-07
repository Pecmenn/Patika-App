// Veteriner hesabı, işletme profili, yakınlık listesi ve randevu. İki taraf da aynı taklitçide denenir:
// biri ekrandan sürülürken karşı taraf sunucuya doğrudan istek atar.
import { execFileSync } from 'node:child_process';

import { expect, test } from '@playwright/test';
import { _android, type AndroidDevice } from 'playwright';

import { callPanel, query } from './backend';
import { ADB, API_URL } from './config';
import { Phone } from './phone';

test.describe.configure({ mode: 'serial' });

const CLINIC = 'Patika Deneme Kliniği';
const EMAIL = `e2e-${Date.now()}@example.com`;
const PASSWORD = 'deneme-sifre-1';
const OK_BUTTON = /^(TAMAM|Tamam)$/;
const CANCEL_BUTTON = /^V[Aa][Zz][Gg].*/;
const SIGN_OUT_BUTTON = 'ÇIKIŞ YAP';
const TUESDAY = /^[0-9]+ \S+ Sal$/;
const WEEK = [
  { open: '09:00', close: '18:00' },
  { open: '09:00', close: '18:00' },
  { open: '09:00', close: '18:00' },
  { open: '09:00', close: '18:00' },
  { open: '09:00', close: '18:00' },
  null,
  null,
];

let device: AndroidDevice;
let phone: Phone;
let vetId = '';
let clinicId = '';
let ownerId = '';
const helpers: string[] = [];
let deviceNow = new Date();

function adb(...args: string[]) {
  return execFileSync(ADB, args, { encoding: 'utf8' }).trim();
}

// `geo fix` yalnızca biri GPS isterken işler: soğuk açılan taklitçide telefonun bildiği konum boş kalır,
// uygulama da Google'ın Konum Doğruluğu izin penceresine düşer. O izin verilmez, Android'in test sağlayıcısı kullanılır.
function setDeviceLocation(latitude: number, longitude: number) {
  adb('shell', 'appops', 'set', 'com.android.shell', 'android:mock_location', 'allow');
  adb('shell', 'cmd', 'location', 'providers', 'add-test-provider', 'gps', '--supportsAltitude', '--supportsSpeed', '--supportsBearing');
  adb('shell', 'cmd', 'location', 'providers', 'set-test-provider-enabled', 'gps', 'true');
  adb('shell', 'cmd', 'location', 'providers', 'set-test-provider-location', 'gps', '--location', `${latitude},${longitude}`, '--accuracy', '5');
}

async function call(method: string, path: string, { token, body }: { token?: string; body?: unknown } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null };
}

function clinicBody(name: string, lat: number, lng: number) {
  return {
    name,
    vet_name: 'Dr. Yardımcı',
    license_no: 'E2E-1',
    phone: '0216 000 00 00',
    address: 'Deneme Sokak No: 1',
    area: 'Deneme',
    lat,
    lng,
    hours: WEEK,
    slot_minutes: 30,
    species: ['cat'],
    services: [],
  };
}

async function approvedHelperClinic(name: string, lat: number, lng: number) {
  const register = await call('POST', '/v1/auth/vet/register', {
    body: { email: `e2e-${Date.now()}-${helpers.length}@example.com`, password: PASSWORD },
  });
  expect(register.status).toBe(201);
  helpers.push(register.json.token);
  const saved = await call('PUT', '/v1/clinic', { token: register.json.token, body: clinicBody(name, lat, lng) });
  await query(`UPDATE clinics SET status = 'approved' WHERE id = ?`, [saved.json.clinic.id]);
}

async function vetToken() {
  const { json } = await call('POST', '/v1/auth/vet/login', { body: { email: EMAIL, password: PASSWORD } });
  return json.token as string;
}

async function appointmentOf(reason: string) {
  const rows = await query(
    'SELECT id, status, cancelled_by FROM appointments WHERE owner_id = ? AND reason = ? ORDER BY created_at DESC',
    [ownerId, reason],
  );
  return rows[0] as { id: string; status: string; cancelled_by: string | null };
}

async function focus() {
  return (await device.shell('dumpsys window | grep mCurrentFocus')).toString();
}

// Arama düğmesi telefonun arama uygulamasını açmalı. Oradan birkaç "geri" ile dönülür.
async function leaveDialer() {
  await expect.poll(focus, { timeout: 20_000 }).toContain('dialer');
  for (let attempt = 0; attempt < 5 && !(await focus()).includes('ExperienceActivity'); attempt += 1) {
    await phone.back();
    await phone.wait(800);
  }
  expect(await focus()).toContain('ExperienceActivity');
}

async function goToTab(tab: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await phone.has(tab, 600)) {
      await phone.tap(tab);
      await phone.wait(500);
      return;
    }
    await phone.back();
  }
  throw new Error(`${tab} sekmesine dönülemedi`);
}

// Yazı ekranın altındaysa yukarı alır: harita gibi parçalar tamamen görünsün.
async function bringIntoView(text: string) {
  await phone.scrollTo(text);
  const { y } = await phone.boundsOf({ text });
  if (y > 900) {
    await device.shell(`input swipe 25 ${y} 25 ${y - 650} 500`);
    await phone.wait(500);
  }
}

// Kliniğin haritası canlı içerik taşıdığı için piksel karşılaştırmasında kapatılır.
async function clinicMapMask() {
  const { y, height } = await phone.boundsOf({ text: 'Yol tarifi' });
  return [{ x: 0, y: y + height + 20, width: 1080, height: 460 }];
}

async function ask(reason: string, time: string) {
  await phone.tap(reason);
  await phone.tapLabel(TUESDAY);
  await phone.scrollTo(time);
  await phone.tap(time);
}

test.beforeAll(async () => {
  [device] = await _android.devices();
  phone = new Phone(device);
  await query(`DELETE FROM users WHERE role = 'vet' AND email LIKE 'e2e-%@example.com'`);

  // Sunucu gerçek saati kullanır, randevu günleri gelecekte kalmalı. Her çalıştırmada aynı görünsün diye
  // telefon gelecek pazartesi 10.00'a alınır: "Şimdi açık" yazısı değişmez.
  const monday = new Date();
  do {
    monday.setDate(monday.getDate() + 1);
  } while (monday.getDay() !== 1);
  const pad = (value: number) => String(value).padStart(2, '0');
  adb('shell', 'date', `${pad(monday.getMonth() + 1)}${pad(monday.getDate())}1000${monday.getFullYear()}.00`);
  deviceNow = monday;
  // Kadıköy. Klinikler bu noktaya göre sıralanır.
  setDeviceLocation(40.99, 29.03);
});

test.afterAll(async () => {
  for (const token of helpers) {
    await call('DELETE', '/v1/me', { token });
  }
  adb('shell', 'cmd', 'location', 'providers', 'remove-test-provider', 'gps');
  await device.close();
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('ekran', { body: await device.screenshot(), contentType: 'image/png' });
  }
});

test('girişsiz sahip hayvan ekler, veteriner girişi ayrı bir kapıdır', async () => {
  await phone.openApp({ clearData: true });
  await phone.see('Veteriner girişi', 120_000);
  await phone.tap('İlk hayvanını ekle');
  await phone.fill('Ad', 'Mia');
  await phone.hideKeyboard();
  await phone.tap('Kedi');
  await phone.tap('Kaydet');
  await phone.see('Hayvanım kayıp');
  await phone.see('Veterinerler');
});

test('veteriner: yanlış şifreyle girilemez, kısa şifreyle hesap açılamaz, doğrusuyla açılır', async () => {
  await goToTab('Ayarlar');
  await phone.tap('Veteriner girişi');
  await phone.see(/Kliniğinin hesabıyla gir.*/);
  await phone.wait(400);
  expect(await phone.screenshot()).toMatchSnapshot('veteriner-giris.png');

  await phone.fill('E-posta', EMAIL);
  await phone.hideKeyboard();
  await phone.fill('Şifre', 'yanlis-sifre');
  await phone.hideKeyboard();
  await phone.tap('Giriş yap');
  await phone.see('E-posta ya da şifre yanlış.');
  await phone.tap(OK_BUTTON);

  await phone.tap('Hesabım yok, klinik hesabı aç');
  await phone.see('Klinik hesabı aç');
  await phone.fill('Şifre', 'kisa');
  await phone.hideKeyboard();
  await phone.tap('Hesap aç');
  await phone.wait(800);
  expect(await phone.has('Klinik hesabı aç'), 'kısa şifre kabul edilmez').toBe(true);

  await phone.fill('Şifre', PASSWORD);
  await phone.hideKeyboard();
  await phone.tap('Hesap aç');
  await phone.see('İşletme bilgilerin eksik', 40_000);
  await phone.see('Randevular');
  await phone.wait(500);
  expect(await phone.screenshot()).toMatchSnapshot('veteriner-panel-bos.png');

  const [login] = await query('SELECT user_id, password_hash FROM vet_logins WHERE email = ?', [EMAIL]);
  vetId = login.user_id;
  expect(login.password_hash).toMatch(/^scrypt\$/);
  const items = await query('SELECT id FROM user_items WHERE owner_id = ?', [vetId]);
  expect(items, 'telefondaki sahip kayıtları veteriner hesabına gitmez').toHaveLength(0);
});

test('işletme formu: eksikler yazar, doldurulunca onaya gider, onaysız listede görünmez', async () => {
  await phone.tap('Bilgileri doldur');
  await phone.see('İşletme bilgileri');
  await phone.see(/Eksik: .*/);
  await phone.wait(400);
  // Altta görünen harita canlı içerik taşıyor.
  const mapTop = (await phone.boundsOf({ text: 'Konum' })).y;
  expect(await phone.screenshot([{ x: 0, y: mapTop, width: 1080, height: 2400 - mapTop }])).toMatchSnapshot(
    'isletme-form-bos.png',
  );

  await phone.fill('Klinik adı', CLINIC);
  await phone.hideKeyboard();
  await phone.fill('Sorumlu hekim', 'Dr. Selin Aydın');
  await phone.hideKeyboard();
  await phone.fill('Oda sicil numarası', 'IST-12345');
  await phone.hideKeyboard();
  await phone.fill('Telefon', 'ara beni');
  await phone.hideKeyboard();
  await phone.see(/Eksik: .*telefon.*/);
  await phone.fill('Telefon', '0216 555 11 22');
  await phone.hideKeyboard();
  await phone.gone(/Eksik: .*telefon.*/);

  await bringIntoView('Haritayı kaydırıp yeri işaretle');
  const { x, y, width } = await phone.boundsOf({ text: 'Haritayı kaydırıp yeri işaretle' });
  const cx = Math.round(x + width / 2);
  await device.shell(`input swipe ${cx} ${y + 240} ${cx - 150} ${y + 330} 500`);
  await phone.gone('Haritayı kaydırıp yeri işaretle');

  // Alanlar ekranın üst yarısına alınır: klavye açılınca altında kalmasınlar.
  await bringIntoView('Açık adres');
  await phone.fill('Açık adres', 'Moda Caddesi No: 10');
  await phone.hideKeyboard();
  await phone.fill('Semt, ilçe', 'Moda, Kadıköy');
  await phone.hideKeyboard();

  await phone.scrollTo('Çalışma saatleri');
  await phone.scrollTo(/İlk günün saatlerini.*/);
  await phone.tapLabel('Cumartesi açık');
  await phone.wait(300);

  await phone.scrollTo('Hizmetler');
  await phone.tap('Kedi');
  await phone.tap('Köpek');
  await phone.tap('Muayene');
  await phone.tap('Aşı');

  await phone.scrollTo('Web adresi (isteğe bağlı)');
  await phone.fill('Web adresi (isteğe bağlı)', 'moda.example');
  await phone.hideKeyboard();
  await phone.see(/Eksik: web adresi.*/);
  await phone.fill('Web adresi (isteğe bağlı)', 'https://moda.example');
  await phone.hideKeyboard();
  await phone.gone(/Eksik: .*/);

  await phone.tap('Onaya gönder');
  await phone.see('Onaya gönderildi');
  await phone.tap(OK_BUTTON);
  await phone.see('Onay bekliyor');

  const [clinic] = await query('SELECT * FROM clinics WHERE owner_id = ?', [vetId]);
  clinicId = clinic.id;
  expect(clinic.status).toBe('pending');
  expect(clinic.name).toBe(CLINIC);
  expect(clinic.license_no).toBe('IST-12345');
  expect(clinic.area).toBe('Moda, Kadıköy');
  expect(clinic.hours[0]).toEqual({ open: '09:00', close: '18:00' });
  expect(clinic.hours[5], 'cumartesi kapatıldı').toBeNull();
  expect(clinic.hours[6], 'pazar kapalı').toBeNull();
  expect(clinic.species).toEqual(['cat', 'dog']);
  expect(clinic.services).toEqual(['exam', 'vaccine']);
  expect(Math.abs(clinic.lat - 41.015)).toBeLessThan(0.2);

  const { json } = await call('GET', '/v1/public/clinics');
  expect(json.clinics.map((row: { id: string }) => row.id)).not.toContain(clinicId);
});

test('onaylanınca profil listede görünür, kimlik değişirse yeniden onay uyarısı çıkar', async () => {
  // Sıralama ve görsel sabit olsun diye konum kesinleştirilir: Kadıköy'den yaklaşık 5 km.
  await query(`UPDATE clinics SET status = 'approved', lat = 41.03, lng = 29.0 WHERE id = ?`, [clinicId]);
  await phone.tap('İşletme');
  await phone.see('Listede görünüyorsun', 40_000);
  await phone.see('Şimdi açık, kapanış 18.00');
  await phone.wait(800);
  expect(await phone.screenshot(await clinicMapMask())).toMatchSnapshot('isletme-profil.png');

  await phone.tap('Bilgileri düzenle');
  await phone.see('İşletme bilgileri');
  await phone.fill('Klinik adı', 'Başka Bir Klinik');
  await phone.hideKeyboard();
  await phone.tap('Kaydet');
  await phone.see('Yeniden onay gerekecek');
  await phone.tap(CANCEL_BUTTON);
  await phone.tapLabel('Kapat');
  await phone.see('Listede görünüyorsun');
  const [clinic] = await query('SELECT status, name FROM clinics WHERE id = ?', [clinicId]);
  expect(clinic).toEqual({ status: 'approved', name: CLINIC });
});

test('veteriner çıkınca telefondaki sahip kayıtları yerinde kalır', async () => {
  await phone.tap('Ayarlar');
  await phone.see('E-posta ile giriş');
  expect(await phone.has('Hayvanım kayıp', 500), 'veteriner menüsünde kayıp düğmesi yok').toBe(false);
  await phone.see(EMAIL);
  expect(await phone.has('Yedekleme', 500), 'veteriner için yedekleme satırı yok').toBe(false);
  await phone.tap('Çıkış yap');
  await phone.see('Çıkış yapılsın mı?');
  await phone.tap(SIGN_OUT_BUTTON);
  await phone.see('Hayvanım kayıp', 30_000);
  await phone.see('Mia');
});

test('sahip: klinikler yakınlığa göre sıralanır, girişsiz de görünür', async () => {
  await approvedHelperClinic('Yakın Klinik', 40.992, 29.03);
  await approvedHelperClinic('Uzak Klinik', 39.92, 32.85);
  await goToTab('Veterinerler');
  await phone.see('Yakın Klinik');
  await phone.see(CLINIC);
  await phone.see('Uzak Klinik');
  const top = async (text: string) => (await phone.boundsOf({ text })).y;

  // Konum izni kendiliğinden sorulmaz. İzin yokken ad sırası, mesafe yazmaz.
  await phone.see(/En yakın klinikleri görmek için.*/);
  expect(await top(CLINIC)).toBeLessThan(await top('Uzak Klinik'));
  expect(await top('Uzak Klinik')).toBeLessThan(await top('Yakın Klinik'));

  setDeviceLocation(40.99, 29.03);
  await phone.wait(1500);
  await phone.tap('Konumumu kullan');
  await phone.see(/.* km, Moda, Kadıköy/, 40_000);
  await phone.gone(/En yakın klinikleri görmek için.*/);
  expect(await top('Yakın Klinik'), 'en yakın en üstte').toBeLessThan(await top(CLINIC));
  await phone.see(/.* m, Deneme/);
  await phone.wait(600);
  // Üçüncü kart karşılaştırılmaz: elle açılmış gerçek klinikler sıraya girebilir.
  const belowTwoCards = [{ x: 0, y: 1040, width: 1080, height: 1120 }];
  expect(await phone.screenshot(belowTwoCards)).toMatchSnapshot('veterinerler-liste.png');
});

test('sahip: klinik bilgileri açılır, arama düğmesi telefonu açar', async () => {
  await phone.tap(CLINIC);
  await phone.see('Yol tarifi');
  await phone.see('Dr. Selin Aydın');
  await phone.see('Şimdi açık, kapanış 18.00');
  await phone.wait(800);
  expect(await phone.screenshot(await clinicMapMask())).toMatchSnapshot('klinik-detay.png');

  await phone.scrollTo('Çalışma saatleri');
  await phone.see('Cumartesi');
  await phone.scrollTo('Hizmetler');
  await phone.see('Muayene');
  await phone.scrollToTop();

  await phone.tap('Ara');
  await leaveDialer();
  await phone.see('Yol tarifi');
});

test('sahip: girişsiz randevu istenemez, girince form açılır, istek gönderilir', async () => {
  await phone.tap('Randevu al');
  await phone.see('Giriş gerekiyor');
  await phone.tap('Deneme hesabıyla gir');
  await phone.see('Randevu iste', 30_000);
  await phone.see('Mia');
  await phone.see('Gün ve saat seç');

  const [{ user_id: userId }] = await query(
    `SELECT s.user_id FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE u.apple_sub IS NULL AND u.role = 'owner' ORDER BY s.created_at DESC LIMIT 1`,
  );
  ownerId = userId;
  await expect
    .poll(async () => (await query(`SELECT id FROM user_items WHERE owner_id = ? AND collection = 'pets'`, [ownerId])).length)
    .toBe(1);

  // Cumartesi kapalı: seçilemez, saatler değişmez.
  await phone.tapLabel(TUESDAY);
  await phone.see('09.00');
  await phone.tapLabel(/.*Cmt, kapalı$/);
  await phone.see('09.00');

  await ask('Aşı', '15.30');
  await phone.scrollTo('Adın soyadın');
  await phone.fill('Adın soyadın', 'Emir Yılmaz');
  await phone.hideKeyboard();
  await phone.scrollTo('Telefonun');
  await phone.fill('Telefonun', 'yok');
  await phone.hideKeyboard();
  await phone.tap(/.*için istek gönder/);
  await phone.wait(800);
  expect(await phone.has(/.*için istek gönder/), 'geçersiz telefonla gönderilmez').toBe(true);
  await phone.fill('Telefonun', '0532 555 00 11');
  await phone.hideKeyboard();
  await phone.fill('Not (isteğe bağlı)', 'İki gündür yemiyor');
  await phone.hideKeyboard();
  await phone.tap(/.*için istek gönder/);

  await phone.see('Randevularım', 30_000);
  await phone.see('Onay bekliyor');
  await phone.see(CLINIC);
  await phone.see('Klinik onaylayınca ziyaretlerine düşer.');

  const [row] = await query('SELECT * FROM appointments WHERE owner_id = ?', [ownerId]);
  expect(row.owner_name).toBe('Emir Yılmaz');
  expect(row.owner_phone).toBe('0532 555 00 11');
  expect(row.pet_name).toBe('Mia');
  expect(row.species).toBe('cat');
  expect(row.note).toBe('İki gündür yemiyor');
  expect(row.status).toBe('pending');
});

test('veteriner onaylayınca sahibin ekranı kendiliğinden değişir, ziyaretlerine düşer', async () => {
  const { id } = await appointmentOf('Aşı');
  const { status } = await call('POST', `/v1/clinic/appointments/${id}/confirm`, {
    token: await vetToken(),
    body: { note: 'Aç karnına gelin' },
  });
  expect(status).toBe(200);
  await phone.see('Onaylandı', 30_000);
  await phone.see('Klinik notu: Aç karnına gelin');

  await goToTab('Hayvanlar');
  await phone.tap('Mia');
  await phone.tap('Ziyaretler');
  await phone.see('Aşı', 40_000);
  await phone.see('Yaklaşanlar');
  await phone.see(CLINIC);
  await goToTab('Bugün');
  await phone.see('Sonraki ziyaret', 20_000);
});

test('ikinci istekte telefon hazır gelir, reddedilince sahip Bugün ekranında görür', async () => {
  await goToTab('Veterinerler');
  await phone.tap(CLINIC);
  // Listede de "Randevu al" var: kliniğin sayfası açılmadan dokunulursa başka kliniğe gider.
  await phone.see('Yol tarifi');
  await phone.tap('Randevu al');
  await phone.see('Randevu iste');
  await phone.see(CLINIC);
  await ask('Kontrol', '10.00');
  // Ad ve telefon yazılmadan gönderilebiliyor: önceki randevudan geldi.
  await phone.tap(/.*için istek gönder/);
  await phone.see('Randevularım', 30_000);

  const { id } = await appointmentOf('Kontrol');
  const rejected = await call('POST', `/v1/clinic/appointments/${id}/reject`, {
    token: await vetToken(),
    body: { note: 'O gün doluyuz' },
  });
  expect(rejected.status).toBe(200);
  await phone.see('Reddedildi', 30_000);
  await phone.see('Klinik notu: O gün doluyuz');
  // Telefonun saati ileri alındı. Bugün kartı son günlerdeki cevabı gösterdiği için cevap zamanı da taşınır.
  await query('UPDATE appointments SET responded_at = ? WHERE id = ?', [deviceNow, id]);
  await goToTab('Bugün');
  await phone.see(`${CLINIC} randevu isteğini reddetti`, 20_000);
});

test('sahip onaylı randevuyu iptal eder: vazgeçilebilir, ziyaret de kalkar', async () => {
  await phone.tap(`${CLINIC} randevu isteğini reddetti`);
  await phone.see('Randevularım');
  await phone.tap('İptal et');
  await phone.see('Randevu iptal edilsin mi?');
  await phone.tap(CANCEL_BUTTON);
  expect((await appointmentOf('Aşı')).status).toBe('confirmed');

  await phone.tap('İptal et');
  await phone.tap(/^[İI]PTAL ET$/);
  await phone.see('Sen iptal ettin.', 20_000);
  const row = await appointmentOf('Aşı');
  expect(row).toMatchObject({ status: 'cancelled', cancelled_by: 'owner' });

  await goToTab('Hayvanlar');
  await phone.tap('Mia');
  await phone.tap('Ziyaretler');
  await phone.see('Henüz ziyaret kaydı yok', 30_000);
});

test('veteriner paneli: bekleyen istekte sahibin bilgileri görünür, reddet ve onayla çalışır', async () => {
  const other = await call('POST', '/v1/auth/dev');
  const pending = (reason: string, time: string) => ({
    clinic_id: clinicId,
    pet_id: 'e2e-pet',
    pet_name: 'Boncuk',
    species: 'dog',
    breed: 'Golden',
    pet_age: '3 yaş',
    owner_name: 'Ayşe Demir',
    owner_phone: '0555 111 22 33',
    reason,
    note: 'Karnesi yanımda',
    date: new Date(Date.now() + 86_400_000 * 15).toISOString().slice(0, 10),
    time,
  });
  // 15 gün sonra hafta sonuna denk gelirse saat yoktur: ilk hafta içi güne kaydırılır.
  const body = pending('Muayene', '09:30');
  while ([0, 6].includes(new Date(`${body.date}T12:00:00Z`).getUTCDay())) {
    body.date = new Date(Date.parse(`${body.date}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  }
  const first = await call('POST', '/v1/appointments', { token: other.json.token, body });
  expect(first.status).toBe(201);
  const second = await call('POST', '/v1/appointments', {
    token: other.json.token,
    body: { ...body, reason: 'Diş', time: '10:00' },
  });
  expect(second.status).toBe(201);

  await goToTab('Ayarlar');
  await phone.tap('Çıkış yap');
  await phone.see('Çıkış yapılsın mı?');
  await phone.tap(SIGN_OUT_BUTTON);
  await phone.see('Veteriner girişi', 30_000);
  await phone.tap('Veteriner girişi');
  await phone.fill('E-posta', EMAIL);
  await phone.hideKeyboard();
  await phone.fill('Şifre', PASSWORD);
  await phone.hideKeyboard();
  await phone.tap('Giriş yap');
  await phone.see('Bekleyen', 30_000);
  await phone.see('Boncuk, Muayene');
  await phone.see('Boncuk, Diş');
  await phone.see('Ayşe Demir');

  await phone.tap('Boncuk, Muayene');
  await phone.see('Karnesi yanımda');
  await phone.see('0555 111 22 33');
  await phone.see('Golden');
  await phone.see('3 yaş');
  expect(await phone.has('Aşı karnesi', 300), 'sağlık kaydı paylaşılmaz').toBe(false);

  await phone.tapLabel('Ayşe Demir ara');
  await leaveDialer();

  await phone.fill('Sahibe not (isteğe bağlı)', 'O saat dolu');
  await phone.hideKeyboard();
  await phone.tap('Reddet');
  await phone.see('İstek reddedilsin mi?');
  await phone.tap(CANCEL_BUTTON);
  await phone.tap('Reddet');
  await phone.tap('REDDET');
  await phone.gone('Boncuk, Muayene', 20_000);

  await phone.tap('Boncuk, Diş');
  await phone.tap('Onayla');
  await phone.see('Bekleyen istek yok', 20_000);

  const rows = await query('SELECT reason, status, vet_note FROM appointments WHERE id IN (?, ?)', [
    first.json.id,
    second.json.id,
  ]);
  expect(rows).toEqual(
    expect.arrayContaining([
      { reason: 'Muayene', status: 'rejected', vet_note: 'O saat dolu' },
      { reason: 'Diş', status: 'confirmed', vet_note: null },
    ]),
  );

  await phone.tap('Yaklaşan');
  await phone.tap('Boncuk, Diş');
  await phone.tap('Randevuyu iptal et');
  await phone.see('Randevu iptal edilsin mi?');
  await phone.tap(/^[İI]PTAL ET$/);
  await phone.see('Yaklaşan randevu yok', 20_000);
  await phone.tap('Geçmiş');
  await phone.see('Boncuk, Diş');
  await phone.see('Boncuk, Muayene');
  await call('DELETE', '/v1/me', { token: other.json.token });
});

test('yönetici hesabı kapatınca oturum düşer, doğru şifreyle bile girilemez, açılınca girer', async () => {
  expect(await callPanel('POST', `/users/${vetId}/suspend`)).toBe(204);
  await phone.backgroundAndReturn();
  // Panel kapanır, Karşılama ekranına dönülür.
  await phone.see('Veteriner girişi', 30_000);
  await phone.tap('Veteriner girişi');
  await phone.see(/Kliniğinin hesabıyla gir.*/);
  await phone.fill('E-posta', EMAIL);
  await phone.hideKeyboard();
  await phone.fill('Şifre', PASSWORD);
  await phone.hideKeyboard();
  await phone.tap('Giriş yap');
  await phone.see('Bu hesap Patika yönetimi tarafından kapatıldı.');
  await phone.tap(OK_BUTTON);

  const closed = await call('GET', '/v1/public/clinics');
  expect(closed.json.clinics.map((row: { name: string }) => row.name)).not.toContain(CLINIC);

  expect(await callPanel('POST', `/users/${vetId}/unsuspend`)).toBe(204);
  await phone.tap('Giriş yap');
  await phone.see('Randevular', 40_000);
});

test('veteriner hesabını siler: klinik listeden kalkar, giriş kapanır, telefon başa döner', async () => {
  await phone.tap('Ayarlar');
  await phone.tap('Hesabı sil');
  await phone.see(/Kliniğin listeden kalkar.*/);
  await phone.tap(CANCEL_BUTTON);
  await phone.tap('Hesabı sil');
  await phone.tap(/^HESABI S[İI]L$/);
  await phone.see('Hesabın silindi', 20_000);
  await phone.tap(OK_BUTTON);
  await phone.see('Veteriner girişi', 30_000);

  expect(await query('SELECT id FROM users WHERE id = ?', [vetId])).toHaveLength(0);
  expect(await query('SELECT id FROM clinics WHERE id = ?', [clinicId])).toHaveLength(0);
  const login = await call('POST', '/v1/auth/vet/login', { body: { email: EMAIL, password: PASSWORD } });
  expect(login.status).toBe(401);
  const { json } = await call('GET', '/v1/public/clinics');
  expect(json.clinics.map((row: { name: string }) => row.name)).not.toContain(CLINIC);

  const history = await query('SELECT clinic_id, clinic_name FROM appointments WHERE owner_id = ?', [ownerId]);
  expect(history.length, 'sahibin geçmişi klinik adıyla kalır').toBeGreaterThan(0);
  expect(history[0]).toEqual({ clinic_id: null, clinic_name: CLINIC });
});
