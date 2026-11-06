import { defineConfig } from '@playwright/test';

// Uçtan uca testler: npm run test:e2e
// Önce gerekenler: taklitçi açık, `npx expo start` çalışıyor, Patika-Backend Docker'da çalışıyor.
// iPhone simülatörü yalnızca Mac'te çalıştığı ve Playwright iOS'u süremediği için iPhone burada yok.
// Senaryo listesi ve kapsanmayanlar: e2e/SENARYOLAR.md
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  // Tek telefon var, senaryolar sırayla çalışır.
  workers: 1,
  fullyParallel: false,
  timeout: 180_000,
  expect: {
    timeout: 20_000,
    // Oran değil piksel sayısı: %0,1 bu ekranda 2592 piksel ediyor, yeni eklenen düğme altında kalmıştı.
    toMatchSnapshot: { maxDiffPixels: 100, threshold: 0.1 },
  },
  reporter: [['list']],
  outputDir: './e2e/test-results',
  projects: [
    // Yazdırılacak sayfalar: telefona gerek yok, gerçek tarayıcı motorunda PDF'e dökülür.
    { name: 'baski', testMatch: /03-baski\.spec\.ts/ },
    // Hesap ve kayıtları hazırlar. Kırılırsa kayıp modu senaryoları yanıltıcı hata vermek yerine çalışmaz.
    { name: 'gunluk-bakim', testMatch: /01-gunluk-bakim\.spec\.ts/ },
    { name: 'kayip-modu', testMatch: /02-kayip-modu\.spec\.ts/, dependencies: ['gunluk-bakim'] },
    // Telefonun saatini değiştirir, bu yüzden en sonda çalışır.
    { name: 'veteriner', testMatch: /04-veteriner\.spec\.ts/, dependencies: ['kayip-modu'] },
  ],
});
