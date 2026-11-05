import { createChangeSignal } from '@/lib/change-signal';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '@/lib/session-storage';

export type SessionUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  given_name: string | null;
  family_name: string | null;
  provider: 'apple' | 'development';
};

export type Session = {
  token: string;
  user: SessionUser;
};

// undefined: henüz okunmadı. null: giriş yapılmamış.
let current: Session | null | undefined;

const changes = createChangeSignal();
export const subscribeToSession = changes.subscribe;

function parseStored(stored: string | null) {
  try {
    return stored ? (JSON.parse(stored) as Session) : null;
  } catch {
    return null;
  }
}

// Kasa okunamazsa hata fırlatır ve sonuç saklanmaz: sonraki okuma yeniden dener.
export async function getSession(): Promise<Session | null> {
  if (current === undefined) {
    const stored = await readStoredSession();
    // Aşağıdaki await sırasında giriş ya da çıkış olduysa o sonuç geçerli kalır.
    if (current === undefined) {
      current = parseStored(stored);
    }
  }
  return current;
}

export async function saveSession(session: Session) {
  current = session;
  await writeStoredSession(JSON.stringify(session));
  changes.notify();
}

// expectedToken verilirse yalnızca oturum hâlâ o anahtarsa kapatılır:
// eski bir isteğin hatası, o arada yapılan yeni girişi kapatmasın.
export async function clearSession(expectedToken?: string) {
  if (expectedToken && current?.token !== expectedToken) {
    return;
  }
  current = null;
  await clearStoredSession();
  changes.notify();
}
