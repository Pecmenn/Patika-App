// Yazdırılacak sayfalar gerçek tarayıcı motorunda PDF'e dökülür. Telefon gerekmez.
// Android ve iPhone'un yazıcısı farklı motorlardır, bu test yerleşimi ve QR'ı sınar, yazıcının kendisini değil.
import { expect, test } from '@playwright/test';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

import { a4PosterHtml, qrSheetHtml } from '../src/lib/poster';

const LINK = 'https://patika.pet/p/e2e000000001';
const INK = '#1D2452';

function pageCount(pdf: Buffer) {
  return pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
}

test.use({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });

test('QR yazdırma sayfası tek A4 sayfaya sığar, 24 kart var', async ({ page }) => {
  await page.setContent(qrSheetHtml('Şanslı', LINK, INK));
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  expect(pageCount(pdf)).toBe(1);
  await expect(page.locator('.tag')).toHaveCount(24);
  await expect(page.locator('h1')).toHaveText('Şanslı için QR kodları');
});

test('kartlardaki QR kodu okunur, tasmaya uyacak boyutta (30 mm)', async ({ page }) => {
  await page.setContent(qrSheetHtml('Şanslı', LINK, INK));
  const tag = page.locator('.tag').first();
  const image = PNG.sync.read(await tag.screenshot());
  expect(jsQR(new Uint8ClampedArray(image.data), image.width, image.height)?.data).toBe(LINK);

  const box = await tag.locator('svg').boundingBox();
  // 96 piksel = 25,4 mm.
  expect(box!.width * 25.4 / 96).toBeCloseTo(30, 0);
});

test('hayvan adı sayfada kod olarak çalışmaz, uzun ad sayfayı taşırmaz', async ({ page }) => {
  await page.setContent(qrSheetHtml('<img src=x onerror="window.hacked=1">Çokuzunadlıbirkedi', LINK, INK));
  expect(await page.evaluate(() => (window as unknown as { hacked?: number }).hacked)).toBeUndefined();
  await expect(page.locator('.tag img')).toHaveCount(0);
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
  expect(pageCount(pdf)).toBe(1);
});

test('A4 ilan görseli tek sayfada sayfayı doldurur', async ({ page }) => {
  const pixel =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  await page.setContent(a4PosterHtml(pixel));
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  expect(pageCount(pdf)).toBe(1);
  const box = await page.locator('img').boundingBox();
  expect(box!.width).toBe(794);
  expect(box!.height).toBeGreaterThan(1120);
});
