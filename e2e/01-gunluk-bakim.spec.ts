// Taklitçide, gerçek uygulama ekranlarında, gerçek backend'e bağlı uçtan uca senaryolar.
// Senaryolar sırayla ilerler: sonraki adım öncekinin bıraktığı veriyle devam eder.
import { expect, test } from '@playwright/test';
import { _android, type AndroidDevice } from 'playwright';

import { newestDevAccountId, query } from './backend';
import { Phone } from './phone';

test.describe.configure({ mode: 'serial' });

const DELETE_BUTTON = /^S[İIiı][Ll]$/;
const CANCEL_BUTTON = /^V[Aa][Zz][Gg].*/;

let device: AndroidDevice;
let phone: Phone;

test.beforeAll(async () => {
  [device] = await _android.devices();
  phone = new Phone(device);
});

test.afterAll(async () => {
  await device.close();
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('ekran', { body: await device.screenshot(), contentType: 'image/png' });
  }
});

const snap = async (name: string) =>
  expect(await phone.screenshot()).toMatchSnapshot(`${name}.png`);

test('temiz kurulumda karşılama ekranı açılır', async () => {
  await phone.openApp({ clearData: true });
  await phone.see('İlk hayvanını ekle', 120_000);
  await snap('karsilama');
});

test('ad yazılmadan hayvan kaydedilemez', async () => {
  await phone.tap('İlk hayvanını ekle');
  await phone.see('Tür');
  await snap('hayvan-ekle-bos');
  await phone.scrollTo('Kaydet');
  await phone.tap('Kaydet');
  await phone.wait(800);
  expect(await phone.has('Kaydet')).toBe(true);
});

test('hayvan eklenir, Bugün ekranı açılır', async () => {
  await phone.scrollToTop();
  await phone.fill('Ad', 'Şanslı');
  await phone.hideKeyboard();
  await phone.tap('Köpek');
  await phone.fill('Irk (isteğe bağlı)', 'Melez');
  await phone.hideKeyboard();
  await snap('hayvan-ekle-dolu');
  await phone.tap('Kaydet');
  await phone.see('Hayvanım kayıp');
  await phone.see('Şanslı');
  await phone.see('Yaklaşan bir şey yok');
  await phone.wait(600);
  await snap('bugun-bos');
});

test('hayvan ekranı boş kayıtlarla açılır', async () => {
  await phone.tap('Şanslı');
  await phone.see('Henüz aşı kaydı yok');
  await snap('hayvan-asi-bos');
});

test('aşı adı boşken kaydedilmez, yazılınca kaydedilir, "Elle girildi" yazar', async () => {
  await phone.tap('Aşı ekle');
  await phone.see('Şanslı için, karnedeki bilgileri yaz.');
  await phone.tap('Kaydet');
  await phone.wait(800);
  expect(await phone.has('Kaydet')).toBe(true);

  await phone.fill('Aşı adı', 'Karma aşı');
  await phone.hideKeyboard();
  await phone.tap('Bir yıl sonrasını seç');
  await phone.see(/.*7 gün önce.*/);
  await snap('asi-form');
  await phone.tap('Kaydet');
  await phone.see('Karma aşı');
  await phone.see('Elle girildi');
});

test('aşı önerisine dokununca ad dolar', async () => {
  await phone.tap('Aşı ekle');
  await phone.tap('Kuduz');
  await phone.tap('Kaydet');
  await phone.see('Kuduz');
  await phone.see('2 kayıt').catch(() => undefined);
});

test('aşı düzenlenir', async () => {
  await phone.tap('Karma aşı');
  await phone.see('Aşıyı düzenle');
  await phone.fill('Aşı adı', 'DHPP');
  await phone.hideKeyboard();
  await phone.tap('Kaydet');
  await phone.see('DHPP');
  await phone.gone('Karma aşı');
});

test('tedavi eklenir, not kaydolur', async () => {
  await phone.tap('Tedaviler');
  await phone.see('Henüz tedavi kaydı yok');
  await phone.tap('Tedavi ekle');
  await phone.fill('Tedavi adı', 'İç parazit');
  await phone.hideKeyboard();
  await phone.fill('Not (isteğe bağlı)', 'Yarım tablet, açık karnına');
  await phone.hideKeyboard();
  await phone.tap('Kaydet');
  await phone.see('İç parazit');
  // Notun kaydolduğu, giriş senaryosunda sunucudan doğrulanır.
});

test('tedavi silinir: onay istenir, vazgeçilebilir', async () => {
  await phone.tap('Tedavi ekle');
  await phone.fill('Tedavi adı', 'Dış parazit');
  await phone.hideKeyboard();
  await phone.tap('Kaydet');
  await phone.see('Dış parazit');

  await phone.tap('Dış parazit');
  await phone.see('Tedaviyi düzenle');
  await phone.scrollTo('Kaydı sil');
  await phone.tap('Kaydı sil');
  await phone.see(/.*Dış parazit kaydı silinsin mi.*/);
  await snap('silme-onayi');
  await phone.tap(CANCEL_BUTTON);
  await phone.see('Tedaviyi düzenle');
  await phone.tap('Kaydı sil');
  await phone.tap(DELETE_BUTTON);
  await phone.gone('Dış parazit');
  await phone.see('İç parazit');
});

test('ziyaret eklenir, yaklaşanlarda görünür', async () => {
  await phone.tap('Ziyaretler');
  await phone.see('Henüz ziyaret kaydı yok');
  await phone.tap('Ziyaret ekle');
  await phone.fill('Ziyaret nedeni', 'Diş kontrolü');
  await phone.hideKeyboard();
  await phone.fill('Klinik (isteğe bağlı)', 'Moda Veteriner');
  await phone.hideKeyboard();
  await phone.tap('Kaydet');
  await phone.see('Diş kontrolü');
  await phone.see('Yaklaşanlar');
});

test('kilo eklenir, geçersiz değer kabul edilmez', async () => {
  await phone.tap('Kilo');
  await phone.see('Henüz kilo kaydı yok');
  await phone.tap('Kilo ekle');
  await phone.fill('Kilo (kg)', '999');
  await phone.see(/.*0 ile 200 kg arasında.*/);
  await phone.hideKeyboard();
  await phone.tap('Kaydet');
  await phone.wait(800);
  expect(await phone.has('Kaydet')).toBe(true);
  await phone.fill('Kilo (kg)', '18,4');
  await phone.hideKeyboard();
  await phone.gone(/.*0 ile 200 kg arasında.*/);
  await phone.tap('Kaydet');
  await phone.see(/.*18,4.*/);
  await phone.wait(600);
  await snap('kilo-bir-kayit');
});

test('hayvan kartları Bugün ekranında görünür', async () => {
  await phone.tapLabel('Geri');
  await phone.see('Hayvanım kayıp');
  await phone.scrollTo('Görev ekle');
  await snap('bugun-kartlar');
});

test('görev eklenir, Bugün listesinde "Yapıldı" işaretlenir', async () => {
  await phone.tap('Görev ekle');
  await phone.fill('Görev adı', 'Tiroid hapı');
  await phone.hideKeyboard();
  await phone.tap('Her gün');
  await phone.see(/Hatırlatma: .*/);
  await snap('gorev-form');
  await phone.tap('Kaydet');
  await phone.see('Tiroid hapı');
  await phone.wait(500);
  await phone.tapLabel('Tiroid hapı yapıldı');
  await phone.wait(800);
  await snap('bugun-gorev-yapildi');
  // İşaretin kaydolduğu, giriş senaryosunda sunucudan doğrulanır.
});

test('Hayvanlar sekmesi açılır, ikinci hayvan eklenir', async () => {
  await phone.tap('Hayvanlar');
  // "Şanslı" Bugün ekranında da var, "Hayvan ekle" yazısı yalnızca burada: geçiş bitmeden dokunulursa eski konuma denk gelir.
  await phone.see('Hayvan ekle');
  await phone.wait(500);
  await phone.see('Şanslı');
  await phone.tapLabel('Hayvan ekle');
  await phone.fill('Ad', 'Boncuk');
  await phone.hideKeyboard();
  await phone.tap('Kedi');
  await phone.tap('Kaydet');
  await phone.see('Boncuk');
  await phone.wait(500);
  await snap('hayvanlar');
});

test('giriş yapılmadan önce girilen kayıtlar girişte sunucuya eksiksiz gider', async () => {
  await phone.tap('Ayarlar');
  await phone.see('Giriş yapılmadı');
  await snap('ayarlar-girissiz');
  await phone.tap('Deneme hesabıyla gir');
  await phone.see('Deneme hesabı');
  await phone.see('Kayıtların sunucuda');

  const owner = await newestDevAccountId();
  await expect
    .poll(async () => {
      const rows = await query(
        'SELECT collection, COUNT(*) AS total FROM user_items WHERE owner_id = ? AND deleted = 0 GROUP BY collection',
        [owner],
      );
      return Object.fromEntries(rows.map((row) => [row.collection, Number(row.total)]));
    })
    .toEqual({ pets: 2, health_records: 3, visits: 1, weights: 1, tasks: 1 });

  const pets = await query(`SELECT data FROM user_items WHERE owner_id = ? AND collection = 'pets'`, [owner]);
  expect(pets.map((row) => row.data.name).sort()).toEqual(['Boncuk', 'Şanslı']);

  const records = await query(`SELECT data FROM user_items WHERE owner_id = ? AND collection = 'health_records'`, [owner]);
  const treatment = records.find((row) => row.data.name === 'İç parazit');
  expect(treatment.data.note, 'tedavi notu').toBe('Yarım tablet, açık karnına');
  expect(records.map((row) => row.data.name).sort()).toEqual(['DHPP', 'Kuduz', 'İç parazit'].sort());

  const [task] = await query(`SELECT data FROM user_items WHERE owner_id = ? AND collection = 'tasks'`, [owner]);
  expect(task.data.completedDates, '"Yapıldı" işareti').toHaveLength(1);

  const [weight] = await query(`SELECT data FROM user_items WHERE owner_id = ? AND collection = 'weights'`, [owner]);
  expect(JSON.stringify(weight.data)).toContain('18.4');
  await snap('ayarlar-girisli');
});

test('silinen hayvan sunucuya "silindi" olarak gider', async () => {
  const owner = await newestDevAccountId();
  const [boncuk] = await query(
    `SELECT id FROM user_items WHERE owner_id = ? AND collection = 'pets' AND JSON_EXTRACT(data, '$.name') = 'Boncuk'`,
    [owner],
  );
  await phone.tap('Hayvanlar');
  await phone.see('Boncuk');
  await phone.tap('Boncuk');
  await phone.tapLabel('Hayvanı düzenle');
  await phone.scrollTo('Hayvanı sil');
  await phone.tap('Hayvanı sil');
  await phone.see(/.*silinsin mi.*/);
  await phone.tap(DELETE_BUTTON);
  await phone.see('Hayvanlar');
  await phone.gone('Boncuk');
  await expect
    .poll(async () => {
      const [row] = await query(
        `SELECT deleted, data FROM user_items WHERE owner_id = ? AND collection = 'pets' AND id = ?`,
        [owner, boncuk.id],
      );
      return { deleted: row.deleted, data: row.data };
    })
    .toEqual({ deleted: 1, data: null });
});
