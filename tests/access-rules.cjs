// Erişim kurallarını gerçek sunucuda iki ayrı anonim hesapla sınar: biri diğerinin verisine ulaşamamalı.
// Çalıştırmak için önce Supabase'te anonim girişi geçici olarak aç, sonra: npm run test:access
// Bittikten sonra anonim girişi yeniden kapat.
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const client = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'GECTI' : 'KALDI'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures += 1;
}

const row = (owner_id, id, data = { id, name: 'gizli' }) => ({
  owner_id, collection: 'pets', id, data, deleted: false, updated_at: new Date().toISOString(),
});
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

(async () => {
  const a = client();
  const b = client();
  const anon = client();
  const { data: da, error: ea } = await a.auth.signInAnonymously();
  const { data: db, error: eb } = await b.auth.signInAnonymously();
  if (ea || eb) { console.log('Anonim giris acilamadi:', ea?.message || eb?.message); process.exit(2); }
  const A = da.user.id; const B = db.user.id;
  check('iki farkli hesap acildi', A !== B);

  // --- tablo ---
  let r = await a.from('user_items').upsert(row(A, 'a1'));
  check('A kendi kaydini yazar', !r.error, r.error?.message);
  r = await a.from('user_items').select('id, data');
  check('A kendi kaydini okur', !r.error && r.data.length === 1 && r.data[0].data.name === 'gizli');

  r = await b.from('user_items').select('id');
  check('B, A kaydini GOREMEZ', !r.error && r.data.length === 0, `gordugu satir: ${r.data?.length}`);
  r = await b.from('user_items').select('id').eq('owner_id', A);
  check('B, A kimligiyle arasa da GOREMEZ', !r.error && r.data.length === 0);

  r = await b.from('user_items').upsert(row(A, 'b-sahte'));
  check('B, A adina kayit YAZAMAZ', !!r.error, r.error?.code);
  r = await b.from('user_items').upsert(row(A, 'a1', { id: 'a1', name: 'degisti' }));
  check('B, A kaydinin ustune YAZAMAZ', !!r.error, r.error?.code);
  r = await b.from('user_items').update({ data: { id: 'a1', name: 'degisti' } }).eq('owner_id', A).select();
  check('B, A kaydini GUNCELLEYEMEZ', !r.error && r.data.length === 0);
  r = await b.from('user_items').delete().eq('owner_id', A).select();
  check('B, A kaydini SILEMEZ', !r.error && r.data.length === 0);
  r = await a.from('user_items').select('data').eq('id', 'a1').single();
  check('A kaydi saglam kaldi', r.data?.data?.name === 'gizli');

  r = await anon.from('user_items').select('id');
  check('giris yapmayan OKUYAMAZ', !!r.error || r.data.length === 0, r.error?.code ?? `satir: ${r.data?.length}`);
  r = await anon.from('user_items').upsert(row(A, 'anon'));
  check('giris yapmayan YAZAMAZ', !!r.error, r.error?.code);

  // --- sinirlar ---
  r = await a.from('user_items').upsert({ ...row(A, 'x'), collection: 'gecersiz' });
  check('gecersiz koleksiyon reddedilir', !!r.error, r.error?.code);
  r = await a.from('user_items').upsert(row(A, 'buyuk', { id: 'buyuk', blob: 'x'.repeat(50000).split('').map((c, i) => c + i).join('') }));
  check('cok buyuk kayit reddedilir', !!r.error, r.error?.code);

  // --- tarih alanlari ---
  r = await a.from('user_items').select('updated_at, synced_at').eq('id', 'a1').single();
  check('sunucu zamani yazildi', !!r.data?.synced_at);
  const before = r.data.synced_at;
  await new Promise((d) => setTimeout(d, 50));
  await a.from('user_items').upsert(row(A, 'a1'));
  r = await a.from('user_items').select('synced_at').eq('id', 'a1').single();
  check('guncellemede sunucu zamani ilerler', r.data.synced_at > before);
  r = await a.from('user_items').upsert({ ...row(A, 'zaman'), synced_at: '2000-01-01T00:00:00Z' }).select('synced_at').single();
  check('telefon sunucu zamanini degistiremez', !r.error && !r.data.synced_at.startsWith('2000'), r.data?.synced_at);

  // --- fotograflar ---
  const sa = a.storage.from('pet-photos'); const sb = b.storage.from('pet-photos');
  r = await sa.upload(`${A}/test.jpg`, jpg, { contentType: 'image/jpeg', upsert: true });
  check('A kendi klasorune yukler', !r.error, r.error?.message);
  r = await sa.upload(`${A}/test.jpg`, jpg, { contentType: 'image/jpeg', upsert: true });
  check('A ayni dosyanin ustune yazar', !r.error, r.error?.message);
  r = await sa.createSignedUrl(`${A}/test.jpg`, 60);
  check('A kendi fotografina baglanti alir', !r.error && !!r.data?.signedUrl);
  if (r.data?.signedUrl) {
    const res = await fetch(r.data.signedUrl);
    check('baglantidan fotograf iner', res.ok, `HTTP ${res.status}`);
  }
  const pub = await fetch(`${URL}/storage/v1/object/public/pet-photos/${A}/test.jpg`);
  check('fotograf herkese acik DEGIL', !pub.ok, `HTTP ${pub.status}`);

  r = await sb.upload(`${A}/sahte.jpg`, jpg, { contentType: 'image/jpeg' });
  check('B, A klasorune YUKLEYEMEZ', !!r.error, r.error?.message);
  r = await sb.download(`${A}/test.jpg`);
  check('B, A fotografini INDIREMEZ', !!r.error, r.error?.message);
  r = await sb.createSignedUrl(`${A}/test.jpg`, 60);
  check('B, A fotografina BAGLANTI ALAMAZ', !!r.error, r.error?.message);
  r = await sb.remove([`${A}/test.jpg`]);
  check('B, A fotografini SILEMEZ', !r.error && (r.data ?? []).length === 0, `silinen: ${r.data?.length}`);
  r = await sa.createSignedUrl(`${A}/test.jpg`, 60);
  check('A fotografi saglam kaldi', !r.error);
  r = await anon.storage.from('pet-photos').download(`${A}/test.jpg`);
  check('giris yapmayan INDIREMEZ', !!r.error);
  r = await sa.upload(`${A}/test.png`, jpg, { contentType: 'image/png' });
  check('JPEG olmayan reddedilir', !!r.error, r.error?.message);

  // --- temizlik ---
  r = await sa.remove([`${A}/test.jpg`]);
  check('A kendi fotografini siler', !r.error && r.data.length === 1);
  await a.from('user_items').delete().eq('owner_id', A);
  r = await a.from('user_items').select('id');
  check('A kendi kayitlarini siler', !r.error && r.data.length === 0);

  console.log(failures === 0 ? '\nHEPSI GECTI' : `\n${failures} SINAMA KALDI`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((error) => { console.error('BEKLENMEYEN HATA', error); process.exit(3); });
