import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { API_URL, BACKEND_DIR } from './config';

// Telefonun gönderdiği verinin sunucuya gerçekten ulaştığını veritabanından doğrular.
// Yalnızca Docker'daki yerel geliştirme veritabanına bağlanır.
const backendRequire = createRequire(join(BACKEND_DIR, 'package.json'));
const mysql = backendRequire('mysql2/promise') as {
  createConnection: (options: { uri: string; timezone: string }) => Promise<{
    query: (sql: string, values?: unknown[]) => Promise<[any[], unknown]>;
    end: () => Promise<void>;
  }>;
};

function databaseUrl() {
  const env = readFileSync(join(BACKEND_DIR, '.env'), 'utf8');
  const url = /^DATABASE_URL=(.+)$/m.exec(env)?.[1]?.trim();
  if (!url || !url.includes('127.0.0.1')) {
    throw new Error('Testler yalnızca yerel veritabanına bağlanır');
  }
  return url;
}

export async function query(sql: string, values: unknown[] = []) {
  const connection = await mysql.createConnection({ uri: databaseUrl(), timezone: 'Z' });
  try {
    const [rows] = await connection.query(sql, values);
    return rows;
  } finally {
    await connection.end();
  }
}

export function compose(...args: string[]) {
  execFileSync('docker', ['compose', ...args], { cwd: BACKEND_DIR, stdio: 'ignore' });
}

export async function waitForApi() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ok = await fetch(`${API_URL}/health`).then((response) => response.ok, () => false);
    if (ok) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Backend açılmadı');
}

export async function sendSighting(code: string, body: object) {
  const response = await fetch(`${API_URL}/v1/public/pets/${code}/sightings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status !== 201) {
    throw new Error(`İhbar gönderilemedi: ${response.status}`);
  }
}

export async function publicPage(code: string) {
  const response = await fetch(`${API_URL}/v1/public/pets/${code}`);
  return (await response.json()) as Record<string, unknown>;
}

// Yalnızca deneme hesapları: testler bu hesabın oturumunu siler ve kayıtlarını taşır.
// iPhone'dan Apple ile açılan gerçek hesaba asla dokunulmaz.
export async function newestDevAccountId() {
  const rows = await query(
    'SELECT id FROM users WHERE apple_sub IS NULL ORDER BY created_at DESC LIMIT 1',
  );
  if (!rows[0]) {
    throw new Error('Deneme hesabı bulunamadı');
  }
  return rows[0].id as string;
}

// QR kodu ve bağlantı her hesapta farklı. Ekran görüntüleri karşılaştırılabilsin diye sabitlenir.
export async function pinPublicCode(ownerId: string, code: string) {
  await query(
    'DELETE t FROM pet_tags t JOIN users u ON u.id = t.owner_id WHERE t.public_code = ? AND u.apple_sub IS NULL',
    [code],
  );
  await query('UPDATE pet_tags SET public_code = ? WHERE owner_id = ?', [code, ownerId]);
}

// Ekranda görünen saatler sabitlenir: 10.00 ve 09.30 (Türkiye saati).
export async function pinReportTimes(ownerId: string) {
  await query(
    `UPDATE lost_reports SET last_seen_at = '2026-11-05 07:00:00', started_at = '2026-11-05 06:30:00'
     WHERE owner_id = ? AND found_at IS NULL`,
    [ownerId],
  );
}
