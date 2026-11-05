import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { A4_PAGE, a4PosterHtml, type PosterFormat } from '@/lib/poster';

export type PosterView = ComponentRef<typeof View>;

const PDF_NAME = 'patika-kayip-ilani.pdf';

// iPhone'daki varsayılan yöntem, küçültülerek gösterilen görünümün üstüne çizim yapıyor.
// Bu yöntem görünümü kendi boyutunda çizer, önizleme ölçeği görsele yansımaz.
const CAPTURE = { useRenderInContext: true } as const;

async function buildPdf(view: RefObject<PosterView | null>) {
  const image = await captureRef(view, {
    ...CAPTURE,
    format: 'jpg',
    quality: 0.95,
    result: 'base64',
  });
  const { base64 } = await Print.printToFileAsync({
    html: a4PosterHtml(image),
    width: A4_PAGE.width,
    height: A4_PAGE.height,
    base64: true,
  });
  if (!base64) {
    throw new Error('PDF oluşturulamadı');
  }
  // PDF'in yazıldığı klasöre paylaşım modülü her zaman erişemiyor (Android'de Expo Go).
  // İçerik kendi klasörümüze yazılır, karşı tarafa da anlaşılır bir dosya adı gider.
  const file = new File(Paths.cache, PDF_NAME);
  file.create({ overwrite: true });
  await file.write(base64, { encoding: 'base64' });
  return file.uri;
}

// İlanı telefonun paylaşım menüsüyle açar: WhatsApp, Instagram, yazdırma ve diğerleri oradan seçilir.
export async function sharePoster(view: RefObject<PosterView | null>, format: PosterFormat) {
  if (format === 'a4') {
    await Sharing.shareAsync(await buildPdf(view), {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
    return;
  }
  const uri = await captureRef(view, { ...CAPTURE, format: 'png', quality: 1, result: 'tmpfile' });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
}

const PRINT_CANCELLED = 'Printing did not complete';

// Kullanıcı yazdırma ekranından vazgeçerse hata sayılmaz.
export async function printQrSheet(html: string) {
  try {
    await Print.printAsync({ html, width: A4_PAGE.width, height: A4_PAGE.height });
  } catch (error) {
    if (!String(error).includes(PRINT_CANCELLED)) {
      throw error;
    }
  }
}
