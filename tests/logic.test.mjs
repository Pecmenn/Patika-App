// Tarih, görev, hatırlatma, kilo ve eşitleme kuralları. Çalıştırmak için: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

const { occursOn, nextOccurrence, pendingOccurrence, tasksForToday, scheduleLabel } = await import('@/lib/tasks');
const { planReminders, hasUpcomingReminder } = await import('@/lib/reminder-plan');
const { isUpcomingVisit, splitVisits, visitWhenLabel } = await import('@/lib/visits');
const { splitRecords } = await import('@/lib/health-records');

const pet = { id: 'p1', name: 'Zeytin', species: 'dog', breed: null, photo: null, birthDate: null, birthDateIsApproximate: false };
const task = (over) => ({
  id: 't1', petId: 'p1', name: 'Tiroid hapı', time: '09:00', repeat: 'daily',
  startDate: '2026-11-05', endDate: null, note: null, completedDates: [], snooze: null, ...over,
});
const at = (s) => new Date(s);
const keys = (rs) => rs.map((r) => r.date);

test('haftalık: yalnızca aynı hafta günü', () => {
  const t = task({ repeat: 'weekly' }); // 5 Kasım 2026 perşembe
  assert.equal(occursOn(t, '2026-11-05'), true);
  assert.equal(occursOn(t, '2026-11-12'), true);
  assert.equal(occursOn(t, '2026-11-06'), false);
  assert.equal(occursOn(t, '2026-10-29'), false, 'başlangıçtan önce olmaz');
});

test('aylık: ayın 31inde başlayan görev kısa ayda son güne iner', () => {
  const t = task({ repeat: 'monthly', startDate: '2027-01-31' });
  assert.equal(occursOn(t, '2027-01-31'), true);
  assert.equal(occursOn(t, '2027-02-28'), true);
  assert.equal(occursOn(t, '2027-02-27'), false);
  assert.equal(occursOn(t, '2027-03-31'), true);
  assert.equal(occursOn(t, '2027-03-30'), false);
  assert.equal(occursOn(t, '2027-04-30'), true);
});

test('artık yılda şubat 29', () => {
  const t = task({ repeat: 'monthly', startDate: '2028-01-30' });
  assert.equal(occursOn(t, '2028-02-29'), true);
  assert.equal(occursOn(t, '2028-02-28'), false);
});

test('bitiş tarihi: son gün dahil, sonrası yok', () => {
  const t = task({ endDate: '2026-11-11' });
  assert.equal(occursOn(t, '2026-11-11'), true);
  assert.equal(occursOn(t, '2026-11-12'), false);
  assert.equal(nextOccurrence(t, '2026-11-12'), null);
});

test('sonraki tekrar: yapılanı atlar, uzak başlangıcı bulur', () => {
  assert.equal(nextOccurrence(task({ completedDates: ['2026-11-05'] }), '2026-11-05'), '2026-11-06');
  assert.equal(nextOccurrence(task({ startDate: '2027-06-01' }), '2026-11-05'), '2027-06-01');
  assert.equal(nextOccurrence(task({ repeat: 'once', completedDates: ['2026-11-05'] }), '2026-11-05'), null);
});

test('Bugün: günlük kaçan doz geri gelmez', () => {
  const items = tasksForToday([task({ startDate: '2026-11-01' })], at('2026-11-05T12:00'));
  assert.equal(items.length, 1);
  assert.equal(items[0].date, '2026-11-05');
  assert.equal(items[0].isOverdue, false);
});

test('Bugün: kaçan tek seferlik, haftalık ve aylık gecikmiş görünür, yapılınca kaybolur', () => {
  const now = at('2026-11-05T12:00');
  const once = task({ repeat: 'once', startDate: '2026-10-01' });
  const weekly = task({ id: 't2', repeat: 'weekly', startDate: '2026-11-02' });
  const monthly = task({ id: 't3', repeat: 'monthly', startDate: '2026-10-15' });
  const items = tasksForToday([once, weekly, monthly], now);
  assert.deepEqual(items.map((i) => [i.task.id, i.date, i.isOverdue]), [
    ['t1', '2026-10-01', true], ['t2', '2026-11-02', true], ['t3', '2026-10-15', true],
  ]);
  assert.equal(tasksForToday([{ ...once, completedDates: ['2026-10-01'] }], now).length, 0);
});

test('Bugün: gelecek görevler görünmez, gecikmiş en üstte, sonra saat sırası', () => {
  const now = at('2026-11-05T12:00');
  const items = tasksForToday([
    task({ id: 'a', time: '19:00' }),
    task({ id: 'b', time: '08:30' }),
    task({ id: 'c', repeat: 'once', startDate: '2026-11-01', time: '23:00' }),
    task({ id: 'd', repeat: 'once', startDate: '2026-11-20' }),
  ], now);
  assert.deepEqual(items.map((i) => i.task.id), ['c', 'b', 'a']);
});

test('plan: günlük görev 14 gün, geçmiş saat ve yapılan gün atlanır', () => {
  const now = at('2026-11-05T10:00');
  const plan = planReminders([pet], [], [task({ completedDates: ['2026-11-07'] })], [], now);
  const dates = plan.filter((r) => r.task).map((r) => r.task.occurrence);
  assert.equal(dates[0], '2026-11-06', 'bugünün 09.00ı geçti');
  assert.ok(!dates.includes('2026-11-07'), 'yapılan gün yok');
  assert.equal(dates.at(-1), '2026-11-18', '14. gün');
  assert.equal(dates.length, 12);
});

test('plan: son gün uyarısı son bildirimden 1 dakika sonra', () => {
  const now = at('2026-11-05T08:00');
  const plan = planReminders([pet], [], [task()], [], now);
  const warn = plan.filter((r) => !r.task);
  assert.equal(warn.length, 1);
  assert.equal(warn[0].title, 'Hatırlatmalar bitmek üzere');
  assert.equal(warn[0].date.getTime(), at('2026-11-18T09:01').getTime());
});

test('plan: biten veya tek seferlik görevde uyarı yok', () => {
  const now = at('2026-11-05T08:00');
  assert.equal(planReminders([pet], [], [task({ endDate: '2026-11-08' })], [], now).filter((r) => !r.task).length, 0);
  assert.equal(planReminders([pet], [], [task({ repeat: 'once' })], [], now).filter((r) => !r.task).length, 0);
});

test('plan: aylık görevin ilk tekrarı 14 günden uzakta olsa da kurulur', () => {
  const now = at('2026-11-05T08:00');
  const plan = planReminders([pet], [], [task({ repeat: 'monthly', startDate: '2026-12-01' })], [], now);
  assert.equal(plan.filter((r) => r.task)[0].task.occurrence, '2026-12-01');
});

test('plan: 1 saat sonra, yeni saatte bir bildirim ekler; yapılınca düşer; geçmişse yok', () => {
  const now = at('2026-11-05T09:05');
  const snoozed = task({ endDate: '2026-11-05', snooze: { date: '2026-11-05', until: at('2026-11-05T10:05').toISOString() } });
  const plan = planReminders([pet], [], [snoozed], [], now);
  assert.deepEqual(keys(plan).map((d) => d.getTime()), [at('2026-11-05T10:05').getTime()]);
  assert.equal(plan[0].task.occurrence, '2026-11-05');
  assert.equal(planReminders([pet], [], [{ ...snoozed, completedDates: ['2026-11-05'] }], [], now).length, 0);
  assert.equal(planReminders([pet], [], [snoozed], [], at('2026-11-05T11:00')).length, 0);
});

test('plan: üst sınır 60 ve en yakınlar kalır, uyarı erken gelir', () => {
  const now = at('2026-11-05T08:00');
  const many = Array.from({ length: 8 }, (_, i) => task({ id: `t${i}`, time: `1${i}:00` }));
  const plan = planReminders([pet], [], many, [], now);
  assert.equal(plan.length, 60);
  const warn = plan.find((r) => !r.task);
  assert.ok(warn, 'uyarı var');
  const lastTask = Math.max(...plan.filter((r) => r.task).map((r) => r.date.getTime()));
  assert.ok(warn.date.getTime() <= lastTask + 60_000, 'uyarı, bildirimler bitmeden gelir');
  assert.ok(lastTask < at('2026-11-19T00:00').getTime());
});

test('plan: hayvanı silinmiş görev atlanır; metin ve not doğru', () => {
  const now = at('2026-11-05T08:00');
  assert.equal(planReminders([], [], [task()], [], now).length, 0);
  const r = planReminders([pet], [], [task({ repeat: 'once', note: 'Banyo dolabında' })], [], now)[0];
  assert.equal(r.title, 'Zeytin için Tiroid hapı');
  assert.equal(r.body, 'Saat 09.00. Notun: Banyo dolabında');
  assert.equal(r.url, '/today');
});

test('plan: aşı hatırlatmaları eskisi gibi', () => {
  const now = at('2026-11-05T08:00');
  const vaccine = { id: 'v', petId: 'p1', kind: 'vaccine', name: 'Kuduz', givenDate: '2026-01-01', nextDueDate: '2026-12-01', batch: null, note: null };
  const plan = planReminders([pet], [vaccine], [], [], now);
  assert.deepEqual(plan.map((r) => [r.date.getTime(), r.url, r.task]), [
    [at('2026-11-24T09:00').getTime(), '/pet/p1', undefined],
    [at('2026-12-01T09:00').getTime(), '/pet/p1', undefined],
  ]);
  assert.equal(plan[0].body, '7 gün kaldı. Son tarih: 1 Aralık 2026.');
  assert.equal(plan[1].body, 'Son tarih bugün.');
});

test('izin kartı: yaklaşan görev veya aşı varsa görünür', () => {
  const now = at('2026-11-05T08:00');
  assert.equal(hasUpcomingReminder([], [], [], now), false);
  assert.equal(hasUpcomingReminder([], [task()], [], now), true);
  assert.equal(hasUpcomingReminder([], [task({ endDate: '2026-11-01', startDate: '2026-10-01' })], [], now), false);
});

test('Bitenler: yapılmamış gecikmiş görev bitmiş sayılmaz', () => {
  const today = '2026-11-08';
  const once = task({ repeat: 'once', startDate: '2026-11-07' });
  assert.equal(pendingOccurrence(once, today), '2026-11-07');
  assert.equal(pendingOccurrence({ ...once, completedDates: ['2026-11-07'] }, today), null);
  const monthly = task({ repeat: 'monthly', startDate: '2026-11-07', endDate: '2026-11-28' });
  assert.equal(pendingOccurrence(monthly, today), '2026-11-07');
  assert.equal(pendingOccurrence({ ...monthly, completedDates: ['2026-11-07'] }, today), null);
  const daily = task({ startDate: '2026-11-01', endDate: '2026-11-05' });
  assert.equal(pendingOccurrence(daily, today), null, 'süresi dolan günlük görev biter');
  assert.equal(pendingOccurrence(task({ startDate: '2026-11-20' }), today), '2026-11-20');
});

test('etiketler Türkçe', () => {
  assert.equal(scheduleLabel(task()), 'Her gün, saat 09.00');
  assert.equal(scheduleLabel(task({ repeat: 'weekly' })), 'Her perşembe, saat 09.00');
  assert.equal(scheduleLabel(task({ repeat: 'monthly' })), 'Her ayın 5. günü, saat 09.00');
  assert.equal(scheduleLabel(task({ repeat: 'once' })), '5 Kasım 2026, saat 09.00');
});

const visit = (over) => ({ id: 'z1', petId: 'p1', reason: 'Diş kontrolü', date: '2026-11-11', time: '10:30', clinic: 'Moda Veteriner', note: null, ...over });
const record = (over) => ({ id: 'r1', petId: 'p1', kind: 'treatment', name: 'İç parazit', givenDate: '2026-09-01', nextDueDate: '2026-12-01', batch: null, note: null, ...over });

test('ziyaret: bir gün önce 09.00 ve iki saat önce hatırlatır', () => {
  const plan = planReminders([pet], [], [], [visit()], at('2026-11-05T08:00'));
  assert.deepEqual(plan.map((r) => [r.date.getTime(), r.body, r.url]), [
    [at('2026-11-10T09:00').getTime(), 'Yarın, saat 10.30. Moda Veteriner.', '/pet/p1?tab=visits'],
    [at('2026-11-11T08:30').getTime(), 'Saat 10.30. Moda Veteriner.', '/pet/p1?tab=visits'],
  ]);
  assert.equal(plan[0].title, 'Zeytin için Diş kontrolü');
  assert.equal(plan[0].task, undefined, 'düğmesiz bildirim');
});

test('ziyaret: saatsiz ve kliniksiz hali, geçmiş bildirim kurulmaz', () => {
  const v = visit({ time: null, clinic: null });
  const plan = planReminders([pet], [], [], [v], at('2026-11-05T08:00'));
  assert.deepEqual(plan.map((r) => [r.date.getTime(), r.body]), [
    [at('2026-11-10T09:00').getTime(), 'Yarın.'],
    [at('2026-11-11T09:00').getTime(), 'Bugün.'],
  ]);
  assert.equal(planReminders([pet], [], [], [v], at('2026-11-10T12:00')).length, 1, 'yalnızca o gün kalır');
  assert.equal(planReminders([pet], [], [], [v], at('2026-11-11T12:00')).length, 0);
});

test('ziyaret: yaklaşan ve geçmiş ayrımı, sıralama', () => {
  const now = at('2026-11-11T12:00');
  assert.equal(isUpcomingVisit(visit({ time: '10:30' }), now), false, 'saati geçti');
  assert.equal(isUpcomingVisit(visit({ time: '15:00' }), now), true);
  assert.equal(isUpcomingVisit(visit({ time: null }), now), true, 'saatsiz bugün yaklaşan');
  assert.equal(isUpcomingVisit(visit({ date: '2026-11-10', time: null }), now), false);
  const { upcoming, past } = splitVisits([
    visit({ id: 'a', date: '2026-12-01' }), visit({ id: 'b', date: '2026-11-20' }),
    visit({ id: 'c', date: '2026-10-01' }), visit({ id: 'd', date: '2026-11-01' }),
  ], now);
  assert.deepEqual(upcoming.map((v) => v.id), ['b', 'a'], 'en yakın üstte');
  assert.deepEqual(past.map((v) => v.id), ['d', 'c'], 'en yeni üstte');
  assert.equal(visitWhenLabel(visit()), '11 Kasım 2026, saat 10.30');
  assert.equal(visitWhenLabel(visit({ time: null })), '11 Kasım 2026');
});

test('tedavi: hatırlatması tedavi sekmesini açar, aşı eskisi gibi', () => {
  const now = at('2026-11-05T08:00');
  const plan = planReminders([pet], [record()], [], [], now);
  assert.equal(plan.length, 2);
  assert.equal(plan[0].url, '/pet/p1?tab=treatments');
  assert.equal(plan[0].title, 'Zeytin için İç parazit');
  assert.equal(planReminders([pet], [record({ kind: 'vaccine' })], [], [], now)[0].url, '/pet/p1');
});

test('seri: aynı adlı aşı ve tedavi birbirini geçersiz kılmaz', () => {
  const now = at('2026-11-05T08:00');
  const a = record({ id: 'a', kind: 'vaccine', name: 'Karma', givenDate: '2026-01-01', nextDueDate: '2026-11-20' });
  const b = record({ id: 'b', kind: 'treatment', name: 'Karma', givenDate: '2026-02-01', nextDueDate: '2026-11-25' });
  assert.deepEqual(splitRecords([a, b], now).due.map((r) => r.id), ['a', 'b']);
  const yeni = record({ id: 'c', kind: 'vaccine', name: 'karma ', givenDate: '2026-03-01', nextDueDate: null });
  assert.deepEqual(splitRecords([a, b, yeni], now).due.map((r) => r.id), ['b'], 'yeni doz eskisini kapatır');
});

test('izin kartı: yaklaşan ziyaret de sayılır', () => {
  const now = at('2026-11-05T08:00');
  assert.equal(hasUpcomingReminder([], [], [visit()], now), true);
  assert.equal(hasUpcomingReminder([], [], [visit({ date: '2026-10-01' })], now), false);
});

const petsLib = await import('@/lib/pet-facts');

test('sıradaki: aşı ve ziyaretin en erkeni, eski doz ve geçmiş ziyaret sayılmaz', () => {
  const now = at('2026-11-05T08:00');
  const eski = record({ id: 'e', kind: 'vaccine', name: 'Kuduz', givenDate: '2025-11-01', nextDueDate: '2026-11-01' });
  const yeni = record({ id: 'y', kind: 'vaccine', name: 'Kuduz', givenDate: '2026-11-02', nextDueDate: '2027-11-02' });
  const karma = record({ id: 'k', kind: 'vaccine', name: 'Karma', givenDate: '2026-01-10', nextDueDate: '2027-01-10' });
  const gecmis = visit({ id: 'g', date: '2026-10-01' });
  const yakin = visit({ id: 'v', reason: 'Diş kontrolü', date: '2026-11-20' });
  assert.deepEqual(petsLib.nextUpFor('p1', [eski, yeni, karma], [gecmis, yakin], now), {
    title: 'Diş kontrolü',
    date: '2026-11-20',
  });
  assert.deepEqual(petsLib.nextUpFor('p1', [eski, yeni, karma], [gecmis], now), { title: 'Karma', date: '2027-01-10' });
  assert.equal(petsLib.nextUpFor('p2', [karma], [yakin], now), null, 'başka hayvanın kaydı sayılmaz');
  const geciken = record({ id: 'x', name: 'İç parazit', givenDate: '2026-08-01', nextDueDate: '2026-11-01' });
  assert.equal(petsLib.nextUpFor('p1', [geciken, karma], [], now).title, 'İç parazit', 'geciken en üstte');
});

test('sıradaki: zaman yazısı', () => {
  const now = at('2026-11-05T08:00');
  assert.equal(petsLib.nextUpWhen('2026-11-01', now), '4 gün gecikti');
  assert.equal(petsLib.nextUpWhen('2026-11-05', now), 'Bugün');
  assert.equal(petsLib.nextUpWhen('2026-11-06', now), 'Yarın');
  assert.equal(petsLib.nextUpWhen('2026-12-05', now), '30 gün sonra');
  assert.equal(petsLib.nextUpWhen('2027-01-10', now), '10 Oca 2027');
});

test('son kilo: hayvanın en son tartısı', () => {
  const kayitlar = [
    { id: 'a', petId: 'p1', kg: 18, date: '2026-10-01', note: null },
    { id: 'b', petId: 'p1', kg: 18.4, date: '2026-11-01', note: null },
    { id: 'c', petId: 'p2', kg: 4, date: '2026-11-04', note: null },
  ];
  assert.equal(petsLib.latestWeightFor('p1', kayitlar).kg, 18.4);
  assert.equal(petsLib.latestWeightFor('p3', kayitlar), undefined);
});

const w = await import('@/lib/weights');
const entry = (date, kg, id = date) => ({ id, petId: 'p1', kg, date, note: null });

test('kilo: girişler virgül ve noktayla okunur, saçma değer reddedilir', () => {
  assert.equal(w.parseKg('18,4'), 18.4);
  assert.equal(w.parseKg(' 18.4 '), 18.4);
  assert.equal(w.parseKg('0,035'), 0.035);
  for (const bad of ['', 'abc', '0', '0,0', '-3', '201', '18,4,2', '1,2345', '18,']) {
    assert.equal(w.parseKg(bad), null, bad);
  }
  assert.equal(w.parseKg('200'), 200);
  assert.equal(w.formatKg(18.4), '18,4');
  assert.equal(w.kgToInput(18.4), '18,4');
});

test('kilo: fark kesirli sayı hatası taşımaz, sıra tarihe göre', () => {
  const list = w.withDeltas([entry('2026-11-01', 18.4), entry('2026-09-12', 17.9), entry('2026-10-14', 18.1)]);
  assert.deepEqual(list.map((e) => [e.date, e.delta]), [
    ['2026-11-01', 0.3], ['2026-10-14', 0.2], ['2026-09-12', null],
  ]);
  assert.equal(w.formatDelta(0.3), '+0,3');
  assert.equal(w.formatDelta(-0.25), '-0,25');
  assert.equal(w.formatDelta(0), '0');
});

test('kilo: aynı gündeki iki tartıda sonraki geçerli', () => {
  const list = w.withDeltas([entry('2026-11-01', 18, 'a'), entry('2026-11-01', 18.5, 'b')]);
  assert.equal(list[0].id, 'b');
  assert.equal(list[0].delta, 0.5);
});

test('kilo: özet cümlesi', () => {
  const two = [entry('2026-10-14', 18.1), entry('2026-11-01', 18.4)];
  const range = { min: 17, max: 19.5 };
  assert.equal(w.weightSummary(two, range), 'Önceki tartıdan bu yana 0,3 kg arttı, sağlıklı aralıkta.');
  assert.equal(w.weightSummary(two, null), 'Önceki tartıdan bu yana 0,3 kg arttı.');
  assert.equal(w.weightSummary([two[1], entry('2026-11-02', 18)], null), 'Önceki tartıdan bu yana 0,4 kg azaldı.');
  assert.equal(w.weightSummary([two[1], entry('2026-11-02', 18.4)], null), 'Önceki tartıdan bu yana değişmedi.');
  assert.equal(w.weightSummary([two[1]], range), 'Sağlıklı aralıkta.');
  assert.equal(w.weightSummary([two[1]], null), null, 'tek kayıt, aralık yok: cümle yok');
  assert.equal(w.weightSummary([], range), null);
});

test('kilo: aralık sınırları dahil', () => {
  const range = { min: 17, max: 19.5 };
  assert.equal(w.rangeStatus(17, range), 'inside');
  assert.equal(w.rangeStatus(19.5, range), 'inside');
  assert.equal(w.rangeStatus(16.9, range), 'below');
  assert.equal(w.rangeStatus(19.6, range), 'above');
  assert.equal(w.rangeLabel(16.9, range), 'Sağlıklı aralığın altında');
});

test('kilo: dönem filtresi', () => {
  const now = at('2026-11-05T12:00');
  const all = [entry('2025-01-01', 1), entry('2026-02-01', 2), entry('2026-06-01', 3), entry('2026-10-20', 4)];
  assert.deepEqual(w.filterByPeriod(all, '1m', now).map((e) => e.kg), [4]);
  assert.deepEqual(w.filterByPeriod(all, '6m', now).map((e) => e.kg), [3, 4]);
  assert.deepEqual(w.filterByPeriod(all, '1y', now).map((e) => e.kg), [2, 3, 4]);
  assert.equal(w.filterByPeriod(all, 'all', now).length, 4);
});

test('grafik: noktalar alanın içinde, zaman oranlı, aralık bandı doğru yerde', () => {
  const entries = [entry('2026-05-01', 17.2), entry('2026-06-01', 17.5), entry('2026-11-01', 18.4)];
  const c = w.buildWeightChart(entries, { min: 17, max: 19.5 }, 320, 200);
  for (const p of c.points) {
    assert.ok(p.x >= c.plot.left && p.x <= c.plot.right, 'x içeride');
    assert.ok(p.y >= c.plot.top && p.y <= c.plot.bottom, 'y içeride');
  }
  assert.equal(c.points[0].x, c.plot.left);
  assert.equal(c.points[2].x, c.plot.right);
  const oran = (c.points[1].x - c.plot.left) / (c.plot.right - c.plot.left);
  assert.ok(oran > 0.15 && oran < 0.2, 'bir ay, altı ayın yaklaşık altıda biri');
  assert.ok(c.points[2].y < c.points[0].y, 'ağır olan yukarıda');
  assert.ok(c.band.top < c.band.bottom);
  assert.ok(c.points[2].y > c.band.top && c.points[2].y < c.band.bottom, '18,4 bant içinde');
  assert.ok(c.ticks.length >= 2 && c.ticks.length <= 6, `çizgi sayısı ${c.ticks.length}`);
  assert.ok(c.ticks.some((t) => t.label === '18'));
});

test('grafik: tek kayıt, aynı değerler ve kuş ölçeği bozulmaz', () => {
  const one = w.buildWeightChart([entry('2026-11-01', 18.4)], null, 320, 200);
  assert.equal(one.points[0].x, (one.plot.left + one.plot.right) / 2);
  assert.ok(Number.isFinite(one.points[0].y));
  assert.equal(one.xLabels.length, 1);
  const flat = w.buildWeightChart([entry('2026-10-01', 5), entry('2026-11-01', 5)], null, 320, 200);
  assert.ok(flat.points.every((p) => Number.isFinite(p.y)));
  const bird = w.buildWeightChart([entry('2026-10-01', 0.035), entry('2026-11-01', 0.04)], null, 320, 200);
  assert.ok(bird.points.every((p) => p.y >= bird.plot.top && p.y <= bird.plot.bottom));
  assert.ok(bird.ticks.length >= 1 && bird.ticks.length <= 6, `kuş çizgi sayısı ${bird.ticks.length}`);
});

test('grafik: alt etiketler tekrar etmez, kısa dönemde gün yazar', () => {
  const uzun = w.buildWeightChart([entry('2026-05-01', 17), entry('2026-11-01', 18)], null, 320, 200);
  assert.equal(new Set(uzun.xLabels.map((l) => l.label)).size, uzun.xLabels.length);
  assert.ok(uzun.xLabels.every((l) => !/\d/.test(l.label)), 'yalnızca ay');
  const kisa = w.buildWeightChart([entry('2026-11-01', 17), entry('2026-11-05', 18)], null, 320, 200);
  assert.ok(kisa.xLabels.every((l) => /\d/.test(l.label)), 'gün ve ay');
});

const s = await import('@/lib/sync-logic');
const T1 = '2026-11-05T10:00:00.000Z';
const T2 = '2026-11-05T11:00:00.000Z';
const T3 = '2026-11-05T12:00:00.000Z';
const row = (id, data, updated_at, deleted = false) => ({ collection: 'pets', id, data, deleted, updated_at });

test('eşitleme: fark bulma ekleneni, değişeni, sileni ayırır, değişmeyene dokunmaz', () => {
  const before = [{ id: 'a', v: 1 }, { id: 'b', v: 1 }, { id: 'c', v: 1 }];
  const after = [{ id: 'a', v: 1 }, { id: 'b', v: 2 }, { id: 'd', v: 1 }];
  const changes = s.diffItems('pets', before, after, T1);
  assert.deepEqual(changes.map((c) => [c.id, c.data?.v ?? null]), [['b', 2], ['d', 1], ['c', null]]);
  assert.equal(s.diffItems('pets', before, before, T1).length, 0);
});

test('eşitleme: bekleyen kutusu aynı kaydın son halini tutar', () => {
  let box = s.addToOutbox({}, s.diffItems('pets', [], [{ id: 'a', v: 1 }], T1));
  box = s.addToOutbox(box, s.diffItems('pets', [{ id: 'a', v: 1 }], [{ id: 'a', v: 2 }], T2));
  assert.equal(Object.keys(box).length, 1);
  assert.equal(box['pets/a'].data.v, 2);
});

test('eşitleme: gönderim sırasında yeniden değişen kayıt kaybolmaz', () => {
  const sent = s.diffItems('pets', [], [{ id: 'a', v: 1 }], T1);
  let box = s.addToOutbox({}, sent);
  box = s.addToOutbox(box, s.diffItems('pets', [{ id: 'a', v: 1 }], [{ id: 'a', v: 2 }], T2));
  const after = s.removeFromOutbox(box, sent);
  assert.equal(after['pets/a'].data.v, 2, 'yeni hal bekliyor');
  assert.equal(Object.keys(s.removeFromOutbox(s.addToOutbox({}, sent), sent)).length, 0);
});

test('birleştirme: yeni kayıt eklenir, silinen gider, aynısı değişiklik saymaz', () => {
  const local = [{ id: 'a', v: 1 }, { id: 'b', v: 1 }];
  const r = s.mergeRemote('pets', local, [
    row('c', { id: 'c', v: 1 }, T1), row('b', null, T1, true), row('a', { id: 'a', v: 1 }, T1),
  ], {});
  assert.deepEqual(r.items.map((i) => i.id), ['a', 'c']);
  assert.equal(r.changed, true);
  const same = s.mergeRemote('pets', [{ id: 'a', v: 1 }], [row('a', { id: 'a', v: 1 }, T1)], {});
  assert.equal(same.changed, false, 'kendi gönderdiğimiz geri gelince değişiklik sayılmaz');
  assert.equal(local.length, 2, 'girdi dizisi bozulmaz');
});

test('birleştirme: telefondaki daha yeni değişiklik kazanır ve gönderilmeyi bekler', () => {
  const box = s.addToOutbox({}, s.diffItems('pets', [{ id: 'a', v: 1 }], [{ id: 'a', v: 2 }], T2));
  const r = s.mergeRemote('pets', [{ id: 'a', v: 2 }], [row('a', { id: 'a', v: 9 }, T1)], box);
  assert.equal(r.items[0].v, 2);
  assert.ok(r.outbox['pets/a'], 'bekleyen duruyor');
  assert.equal(r.changed, false);
});

test('birleştirme: sunucudaki daha yeni değişiklik kazanır, eski bekleyen düşer', () => {
  const box = s.addToOutbox({}, s.diffItems('pets', [{ id: 'a', v: 1 }], [{ id: 'a', v: 2 }], T1));
  const r = s.mergeRemote('pets', [{ id: 'a', v: 2 }], [row('a', { id: 'a', v: 9 }, T2)], box);
  assert.equal(r.items[0].v, 9);
  assert.equal(r.outbox['pets/a'], undefined);
});

test('birleştirme: telefonda silinen kayıt, eski sunucu satırıyla geri gelmez', () => {
  const box = s.addToOutbox({}, s.diffItems('pets', [{ id: 'a', v: 1 }], [], T2));
  const r = s.mergeRemote('pets', [], [row('a', { id: 'a', v: 1 }, T1)], box);
  assert.equal(r.items.length, 0);
  assert.equal(box['pets/a'].data, null);
});

test('birleştirme: başka cihazda silinen, burada değiştirilmemiş kayıt silinir', () => {
  const r = s.mergeRemote('pets', [{ id: 'a', v: 1 }], [row('a', null, T3, true)], {});
  assert.equal(r.items.length, 0);
});

test('birleştirme: saat biçimi farkı karşılaştırmayı bozmaz', () => {
  const box = s.addToOutbox({}, s.diffItems('pets', [], [{ id: 'a', v: 2 }], '2026-11-05T11:00:00.000Z'));
  const r = s.mergeRemote('pets', [{ id: 'a', v: 2 }], [row('a', { id: 'a', v: 9 }, '2026-11-05T10:30:00+00:00')], box);
  assert.equal(r.items[0].v, 2);
  const older = s.mergeRemote('pets', [{ id: 'a', v: 2 }], [row('a', { id: 'a', v: 9 }, '2026-11-05T13:30:00+03:00')], box);
  assert.equal(older.items[0].v, 2, '13.30 +03:00 = 10.30 UTC, telefondan eski');
  const newer = s.mergeRemote('pets', [{ id: 'a', v: 2 }], [row('a', { id: 'a', v: 9 }, '2026-11-05T14:30:00+03:00')], box);
  assert.equal(newer.items[0].v, 9, '14.30 +03:00 = 11.30 UTC, telefondan yeni');
});

test('fotoğraf: yeni yüklenir, eski silinir, yüklenmeden silinen gönderilmez', () => {
  const empty = { upload: [], remove: [] };
  assert.deepEqual(s.queuePhotoChanges(empty, [], [{ photo: 'a.jpg' }]), { upload: ['a.jpg'], remove: [] });
  assert.deepEqual(s.queuePhotoChanges(empty, [{ photo: 'a.jpg' }], [{ photo: 'b.jpg' }]), { upload: ['b.jpg'], remove: ['a.jpg'] });
  assert.deepEqual(s.queuePhotoChanges(empty, [{ photo: 'a.jpg' }], [{ photo: 'a.jpg' }]), empty);
  assert.deepEqual(s.queuePhotoChanges({ upload: ['a.jpg'], remove: [] }, [{ photo: 'a.jpg' }], []), { upload: [], remove: ['a.jpg'] });
  assert.deepEqual(s.queuePhotoChanges(empty, [{ photo: null }], [{ photo: null }]), empty);
});

const lost = await import('@/lib/lost');

test('kayıp: geçen süre yazıları', () => {
  const now = at('2026-11-05T12:00');
  assert.equal(lost.timeAgoLabel(at('2026-11-05T11:59:30'), now), 'Az önce');
  assert.equal(lost.timeAgoLabel(at('2026-11-05T11:54'), now), '6 dk önce');
  assert.equal(lost.timeAgoLabel(at('2026-11-05T09:30'), now), '2 sa önce');
  assert.equal(lost.timeAgoLabel(at('2026-11-02T12:00'), now), '3 gün önce');
  assert.equal(lost.durationLabel(at('2026-11-05T11:25'), now), '35 dk');
  assert.equal(lost.durationLabel(at('2026-11-05T11:59:50'), now), '1 dk');
  assert.equal(lost.durationLabel(at('2026-11-05T09:50'), now), '2 sa 10 dk');
  assert.equal(lost.durationLabel(at('2026-11-05T10:00'), now), '2 sa');
  assert.equal(lost.durationLabel(at('2026-11-02T12:00'), now), '3 gün');
});

test('kayıp: herkese görünen semt yazısı sokak ve bina içermez', () => {
  const address = { name: 'Bahariye Cd. No:12', street: 'Bahariye Cd.', streetNumber: '12', district: 'Moda', subregion: 'Kadıköy', city: 'İstanbul', region: 'İstanbul' };
  const area = lost.areaFromAddress(address);
  assert.equal(area, 'Moda, Kadıköy');
  assert.ok(!area.includes('Bahariye') && !area.includes('12'));
  assert.equal(lost.areaFromAddress({ district: null, subregion: null, city: 'İstanbul' }), 'İstanbul');
  assert.equal(lost.areaFromAddress({ district: 'Kadıköy', subregion: 'Kadıköy' }), 'Kadıköy', 'tekrar etmez');
  assert.equal(lost.areaFromAddress({}), '');
});

test('kayıp: harita görünümü tüm noktaları içine alır', () => {
  const one = lost.regionFor([{ latitude: 41, longitude: 29 }]);
  assert.equal(one.latitude, 41);
  assert.ok(one.latitudeDelta > 0, 'tek noktada da yakınlık sıfır olmaz');
  const pts = [{ latitude: 40.98, longitude: 29.02 }, { latitude: 41.02, longitude: 29.06 }];
  const r = lost.regionFor(pts);
  for (const p of pts) {
    assert.ok(Math.abs(p.latitude - r.latitude) <= r.latitudeDelta / 2);
    assert.ok(Math.abs(p.longitude - r.longitude) <= r.longitudeDelta / 2);
  }
});

test('kayıp: gelecekte kalan saat dünkü sayılır', () => {
  const now = at('2026-11-05T00:30');
  const d = lost.lastSeenDate(23, 0, now);
  assert.equal(d.getDate(), 4);
  assert.equal(d.getHours(), 23);
  const noon = at('2026-11-05T12:00');
  assert.equal(lost.lastSeenDate(11, 30, noon).getDate(), 5);
  assert.equal(lost.lastSeenDate(12, 0, noon).getDate(), 5, 'şu an aynı gün');
});

test('kayıp: harita duraklarında aynı nokta denetimi', () => {
  const target = { latitude: 40.9877, longitude: 29.0262 };
  assert.equal(lost.isSameSpot({ latitude: 40.98771, longitude: 29.02619 }, target), true, 'hedefe vardı');
  assert.equal(lost.isSameSpot({ latitude: 41.015, longitude: 28.979 }, target), false, 'haritanın açılış noktası seçim sayılmaz');
  assert.equal(lost.isSameSpot({ latitude: 40.9877, longitude: 29.0272 }, target), false, 'yaklaşık 100 metre öte aynı değil');
});

// --- QR ve ilan ---
const { qrModules, qrPath, qrSvg } = await import('@/lib/qr');
const { posterHeading, posterLastSeen, posterDescription, qrSheetHtml, a4PosterHtml, isDescriptionCut } =
  await import('@/lib/poster');
const { lostPageLink, shortLink, groupMessagesByPet } = await import('@/lib/lost');

test('QR: kare biçiminde ve üç köşesinde konum işareti var', () => {
  const modules = qrModules('https://patika.pages.dev/p/8718cd6c2425');
  const size = modules.length;
  assert.equal(size % 4, 1, 'QR boyutu her zaman 4n+1');
  assert.ok(modules.every((row) => row.length === size));
  for (const [r, c] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    assert.equal(modules[r][c], true);
    assert.equal(modules[r + 1][c + 1], false, 'konum işaretinin içi boş');
    assert.equal(modules[r + 3][c + 3], true, 'konum işaretinin ortası dolu');
  }
});

test('QR: farklı bağlantı farklı kod verir, çizim tüm koyu kareleri kapsar', () => {
  const a = qrModules('https://patika.pages.dev/p/8718cd6c2425');
  const b = qrModules('https://patika.pages.dev/p/000000000000');
  assert.notDeepEqual(a, b);
  const dark = a.flat().filter(Boolean).length;
  const drawn = [...qrPath(a).matchAll(/h(\d+)v1/g)].reduce((sum, m) => sum + Number(m[1]), 0);
  assert.equal(drawn, dark);
});

test('QR yazdırma: SVG beyaz kenar payını içerir', () => {
  const svg = qrSvg('https://patika.pages.dev/p/8718cd6c2425', '#1D2452');
  assert.match(svg, /viewBox="-4 -4 /);
  assert.match(svg, /fill="#1D2452"/);
});

test('sayfa bağlantısı: kod ve adres birleşir, ilanda kısa görünür', () => {
  const link = lostPageLink('8718cd6c2425', 'https://patika.pet');
  assert.equal(link, 'https://patika.pet/p/8718cd6c2425');
  assert.equal(shortLink(link), 'patika.pet/p/8718cd6c2425');
});

test('ilan yazıları: tür başlığı, son görülme ve açıklama', () => {
  assert.equal(posterHeading('dog'), 'KAYIP KÖPEK');
  assert.equal(posterHeading('cat'), 'KAYIP KEDİ');
  assert.equal(posterHeading('rabbit'), 'KAYIP TAVŞAN');
  assert.equal(posterHeading('bird'), 'KAYIP KUŞ');
  assert.equal(
    posterLastSeen('Moda, Kadıköy', new Date(2026, 10, 1, 18, 40)),
    'Son görülme: 1 Kasım, 18.40, Moda, Kadıköy',
  );
  assert.equal(posterDescription('Melez', 'Mavi tasma'), 'Melez. Mavi tasma');
  assert.equal(posterDescription(null, 'Mavi tasma'), 'Mavi tasma');
  assert.equal(posterDescription(null, null), '');
});

test('ilan açıklaması: story ve gönderide uzun yazı kesilir, A4 baskıda tamamı görünür', () => {
  const long = 'a'.repeat(151);
  assert.equal(isDescriptionCut('story', 'a'.repeat(150)), false);
  assert.equal(isDescriptionCut('story', long), true);
  assert.equal(isDescriptionCut('post', 'a'.repeat(131)), true);
  assert.equal(isDescriptionCut('a4', 'a'.repeat(400)), false);
});

test('yazdırma sayfası: hayvan adı HTML olarak çalışamaz', () => {
  const html = qrSheetHtml('<img src=x onerror=alert(1)>', 'https://patika.pet/p/abc', '#000');
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x'));
  assert.equal(html.match(/class="tag"/g).length, 24);
  assert.ok(a4PosterHtml('QUJD').includes('data:image/jpeg;base64,QUJD'));
});

test('haberler: hayvan başına toplanır, en yeni haberin hayvanı önde', () => {
  const groups = groupMessagesByPet([
    { id: 'm3', petId: 'b' },
    { id: 'm2', petId: 'a' },
    { id: 'm1', petId: 'b' },
  ]);
  assert.deepEqual(groups.map((group) => group.petId), ['b', 'a']);
  assert.deepEqual(groups[0].items.map((item) => item.id), ['m3', 'm1']);
});

const { appointmentNotice, bookingDays, distanceKm, formatAppointmentWhen, formatDistance, hasValidHours, isValidInstagram, isValidPhone, isValidWebsite, openStatus, sortClinics } = await import('@/lib/clinics');
const { isAppointmentVisit } = await import('@/lib/visits');

const DAY = { open: '09:00', close: '18:00' };
const WEEK = [DAY, DAY, DAY, DAY, DAY, DAY, null]; // Pazar kapalı

test('mesafe: bilinen iki nokta arası doğru hesaplanır', () => {
  const kadikoy = { latitude: 40.99, longitude: 29.03 };
  const taksim = { latitude: 41.037, longitude: 28.985 };
  const km = distanceKm(kadikoy, taksim);
  assert.ok(km > 6 && km < 7, String(km));
  assert.equal(distanceKm(kadikoy, kadikoy), 0);
});

test('mesafe yazısı: metre, virgüllü kilometre, tam kilometre', () => {
  assert.equal(formatDistance(0.004), '10 m');
  assert.equal(formatDistance(0.65), '650 m');
  assert.equal(formatDistance(1.44), '1,4 km');
  assert.equal(formatDistance(12.6), '13 km');
});

test('klinik sıralaması: konum varsa en yakın başta, yoksa Türkçe ad sırası', () => {
  const clinics = [
    { name: 'Zeytin Vet', latitude: 41.0, longitude: 29.0 },
    { name: 'Çınar Vet', latitude: 40.0, longitude: 29.0 },
    { name: 'Ada Vet', latitude: 42.0, longitude: 29.0 },
  ];
  const here = { latitude: 40.1, longitude: 29.0 };
  assert.deepEqual(sortClinics(clinics, here).map((c) => c.name), ['Çınar Vet', 'Zeytin Vet', 'Ada Vet']);
  assert.ok(sortClinics(clinics, here)[0].distance < 12);
  const named = sortClinics(clinics, null);
  assert.deepEqual(named.map((c) => c.name), ['Ada Vet', 'Çınar Vet', 'Zeytin Vet']);
  assert.equal(named[0].distance, null);
  assert.equal(clinics[0].name, 'Zeytin Vet', 'gelen liste değişmez');
});

test('açık-kapalı: Türkiye saatine göre, telefonun saat diliminden bağımsız', () => {
  // 5 Kasım 2026 perşembe. UTC 07.00, Türkiye 10.00.
  assert.deepEqual(openStatus(WEEK, at('2026-11-05T07:00:00Z')), { isOpen: true, label: 'Şimdi açık, kapanış 18.00' });
  // Türkiye 08.00
  assert.deepEqual(openStatus(WEEK, at('2026-11-05T05:00:00Z')), { isOpen: false, label: 'Kapalı, açılış 09.00' });
  // Türkiye 18.00: kapanış anı kapalı sayılır, ertesi gün açılır.
  assert.deepEqual(openStatus(WEEK, at('2026-11-05T15:00:00Z')), { isOpen: false, label: 'Kapalı, yarın 09.00' });
  // Cumartesi akşamı, pazar kapalı: pazartesi yazar.
  assert.deepEqual(openStatus(WEEK, at('2026-11-07T17:00:00Z')), { isOpen: false, label: 'Kapalı, Pzt 09.00' });
  // Pazar sabahı
  assert.deepEqual(openStatus(WEEK, at('2026-11-08T07:00:00Z')), { isOpen: false, label: 'Kapalı, yarın 09.00' });
  // UTC ile Türkiye günü farklıyken doğru gün: UTC cuma 22.00, Türkiye cumartesi 01.00.
  const onlySaturday = [null, null, null, null, null, { open: '00:30', close: '02:00' }, null];
  assert.equal(openStatus(onlySaturday, at('2026-11-06T22:00:00Z')).isOpen, true);
  assert.equal(openStatus(Array(7).fill(null), at('2026-11-05T07:00:00Z')).label, 'Kapalı');
});

test('randevu günleri: 14 gün, kapalı günler işaretli, Türkiye gününden başlar', () => {
  const days = bookingDays(WEEK, at('2026-11-07T22:30:00Z')); // UTC cumartesi gecesi, Türkiye pazar 01.30
  assert.equal(days.length, 14);
  assert.deepEqual(days[0], { date: '2026-11-08', weekday: 'Paz', dayOfMonth: 8, month: 'Kas', isClosed: true });
  assert.deepEqual(days[1], { date: '2026-11-09', weekday: 'Pzt', dayOfMonth: 9, month: 'Kas', isClosed: false });
  assert.equal(days[7].isClosed, true);
});

test('randevu tarihi yazısı', () => {
  assert.equal(formatAppointmentWhen('2026-11-05', '15:30'), '5 Kas Per, 15.30');
  assert.equal(formatAppointmentWhen('2027-01-03', '09:00'), '3 Oca Paz, 09.00');
});

test('form kuralları: saat, telefon, web, instagram', () => {
  assert.equal(hasValidHours(WEEK), true);
  assert.equal(hasValidHours(Array(7).fill(null)), false, 'en az bir gün açık olmalı');
  assert.equal(hasValidHours([{ open: '18:00', close: '09:00' }, ...WEEK.slice(1)]), false);
  assert.equal(isValidPhone('0532 555 00 11'), true);
  assert.equal(isValidPhone('+90 (532) 555-00-11'), true);
  assert.equal(isValidPhone('ara beni'), false);
  assert.equal(isValidPhone('123'), false);
  assert.equal(isValidWebsite(''), true, 'boş olabilir');
  assert.equal(isValidWebsite('https://moda.example'), true);
  assert.equal(isValidWebsite('javascript:alert(1)'), false);
  assert.equal(isValidWebsite('moda.example'), false);
  assert.equal(isValidInstagram('@moda.vet'), true);
  assert.equal(isValidInstagram('boşluk var'), false);
});

test('Bugün kartı: olumsuz cevap öne çıkar, eski cevap kaybolur, bekleyenler sayılır', () => {
  const now = at('2026-11-05T10:00:00Z');
  const base = { clinicName: 'Moda', petName: 'Mia', date: '2026-11-09', time: '10:00', cancelledBy: null, respondedAt: null };
  assert.equal(appointmentNotice([], now), null);
  assert.equal(appointmentNotice([{ ...base, status: 'confirmed', respondedAt: now }], now), null, 'onaylanan ziyaret kartına düşer');

  const pending = { ...base, status: 'pending' };
  assert.equal(appointmentNotice([pending], now).title, 'Randevu isteğin cevap bekliyor');
  assert.equal(appointmentNotice([pending, pending], now).title, '2 randevu isteğin cevap bekliyor');

  const rejected = { ...base, status: 'rejected', respondedAt: at('2026-11-04T10:00:00Z') };
  assert.equal(appointmentNotice([pending, rejected], now).title, 'Moda randevu isteğini reddetti');

  const old = { ...rejected, respondedAt: at('2026-11-01T10:00:00Z') };
  assert.equal(appointmentNotice([old], now), null, '3 günden eski cevap Bugün ekranını işgal etmez');

  const byVet = { ...base, status: 'cancelled', cancelledBy: 'vet', respondedAt: now };
  assert.equal(appointmentNotice([byVet], now).title, 'Moda randevunu iptal etti');
  const byOwner = { ...base, status: 'cancelled', cancelledBy: 'owner', respondedAt: now };
  assert.equal(appointmentNotice([byOwner], now), null, 'kendi iptalini yeniden söylemeye gerek yok');
});

test('Patika randevusundan gelen ziyaret ayırt edilir', () => {
  assert.equal(isAppointmentVisit({ id: 'appointment-abc' }), true);
  assert.equal(isAppointmentVisit({ id: 'abc' }), false);
});

test('fotoğrafsız avatar: adın baş harfi, Türkçe büyük harfle', () => {
  assert.equal(petsLib.petInitial('şanslı'), 'Ş');
  assert.equal(petsLib.petInitial('ince'), 'İ');
  assert.equal(petsLib.petInitial('  boncuk'), 'B');
  assert.equal(petsLib.petInitial('3 Tekir'), null);
  assert.equal(petsLib.petInitial('🐶 Zeytin'), null);
  assert.equal(petsLib.petInitial(''), null);
  assert.equal(petsLib.petInitial(undefined), null);
});
