import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ADB, API_URL, BACKEND_DIR, METRO_URL } from './config';

function adb(...args: string[]) {
  return execFileSync(ADB, args, { encoding: 'utf8' }).trim();
}

// Taklitçiyi her çalıştırmada aynı duruma getirir, ekran görüntüleri karşılaştırılabilsin.
export default async function globalSetup() {
  for (const [name, url] of [
    ['Backend (docker compose up -d)', `${API_URL}/health`],
    ['Uygulama sunucusu (npx expo start)', `${METRO_URL}/status`],
  ] as const) {
    const ok = await fetch(url).then((response) => response.ok, () => false);
    if (!ok) {
      throw new Error(`${name} çalışmıyor: ${url}`);
    }
  }

  // Docker'daki sayfa koddan eskiyse testler eski sayfayı sınamış olur.
  const served = await fetch(`${API_URL}/app.js`).then((response) => response.text());
  const local = readFileSync(join(BACKEND_DIR, 'public', 'app.js'), 'utf8');
  if (served !== local) {
    throw new Error('Backend eski: Patika-Backend içinde docker compose up -d --build çalıştır');
  }

  adb('root');
  adb('wait-for-device');
  // adb root yönlendirmeleri siler, yeniden kurulur.
  adb('reverse', 'tcp:8081', 'tcp:8081');
  adb('reverse', 'tcp:4000', 'tcp:4000');
  for (const name of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
    adb('shell', 'settings', 'put', 'global', name, '0');
  }
  // Klavyenin "kalemini dene" tanıtımı arada açılıp ekranı kapatıyor.
  adb('shell', 'settings', 'put', 'secure', 'stylus_handwriting_enabled', '0');
  // Tarih ve saat sabit: Bugün ekranındaki tarih ve selamlama her seferinde aynı olsun.
  adb('shell', 'settings', 'put', 'global', 'auto_time', '0');
  adb('shell', 'settings', 'put', 'global', 'auto_time_zone', '0');
  adb('shell', 'cmd', 'alarm', 'set-timezone', 'Europe/Istanbul');
  adb('shell', 'date', '110510002026.00');
  adb('shell', 'pm', 'grant', 'com.android.chrome', 'android.permission.POST_NOTIFICATIONS');
}
