import createQr from 'qrcode-generator';

// Standardın istediği beyaz kenar: 4 kare. Bu boşluk olmazsa telefon kodu okumakta zorlanır.
export const QR_QUIET_ZONE = 4;

// QR kodunun koyu ve açık karelerini hesaplar. Boyut, yazının uzunluğuna göre kendiliğinden seçilir.
// M düzeyi: kodun yaklaşık %15'i yıpransa da okunur, kâğıda basılan kod için iyi bir denge.
export function qrModules(text: string) {
  const code = createQr(0, 'M');
  code.addData(text);
  code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_row, row) =>
    Array.from({ length: size }, (_column, column) => code.isDark(row, column)),
  );
}

// Yan yana koyu kareler tek parça çizilir, aralarında ince beyaz çizgi kalmasın.
export function qrPath(modules: boolean[][]) {
  let path = '';
  modules.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < row.length && row[end]) {
        end += 1;
      }
      path += `M${x} ${y}h${end - x}v1h${x - end}z`;
      x = end;
    }
  });
  return path;
}

// Yazdırılacak sayfalar için SVG metni. Karelerin rengi siyah yakın olmalı, açık renk okunmaz.
export function qrSvg(text: string, color: string) {
  const modules = qrModules(text);
  const total = modules.length + QR_QUIET_ZONE * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-QR_QUIET_ZONE} ${-QR_QUIET_ZONE} ${total} ${total}">` +
    `<path fill="${color}" d="${qrPath(modules)}"/></svg>`
  );
}
