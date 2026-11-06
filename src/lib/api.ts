import Constants from 'expo-constants';

import { endRejectedSession, getSession } from '@/lib/session';

const DEV_API_PORT = 4000;
const REQUEST_TIMEOUT_MS = 20000;
const PHOTO_TIMEOUT_MS = 60000;

// Gerçek sunucunun adresi EXPO_PUBLIC_API_URL ile verilir.
// Geliştirirken backend, uygulama kodunu sunan bilgisayarda çalışır: adres oradan öğrenilir,
// bilgisayarın ağ adresi değişse de ayar değiştirmek gerekmez.
function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  // Mağaza sürümü sessizce telefonun kendisine bağlanmaya çalışmasın, hata hemen görünsün.
  if (!__DEV__) {
    throw new Error('EXPO_PUBLIC_API_URL ayarlanmamış');
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:${DEV_API_PORT}`;
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(`${status} ${code}`);
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  // Fotoğraf yüklerken JSON yerine dosyanın kendisi gider.
  photo?: ArrayBuffer;
  isPublic?: boolean;
  // Henüz kaydedilmemiş bir oturumun anahtarı (girişten vazgeçilince kapatmak için).
  token?: string;
};

export async function apiRequest<T = void>(
  path: string,
  { method = 'GET', body, photo, isPublic = false, token }: RequestOptions = {},
): Promise<T> {
  const session = isPublic || token ? null : await getSession();
  if (!isPublic && !token && !session) {
    throw new ApiError(401, 'unauthorized');
  }

  const headers: Record<string, string> = {};
  const authToken = token ?? session?.token;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (photo) {
    headers['Content-Type'] = 'image/jpeg';
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Sunucu kapalıysa ya da ağ koptuysa uygulama uzun süre beklemesin.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), photo ? PHOTO_TIMEOUT_MS : REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      signal: controller.signal,
      body: photo ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    if (response.status === 204) {
      return undefined as T;
    }
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      // Oturum geçersizse kapatılır. Telefondaki kayıtlar durur, yeniden girince devam eder.
      if (response.status === 401 && session) {
        await endRejectedSession(session.token);
      }
      throw new ApiError(response.status, data?.error ?? 'server_error');
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
