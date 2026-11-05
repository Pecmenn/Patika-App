const KEY = 'patika.session.v1';

// Yalnızca tarayıcı önizlemesi için: tarayıcıda şifreli kasa yok.
export async function readStoredSession() {
  return localStorage.getItem(KEY);
}

export async function writeStoredSession(value: string) {
  localStorage.setItem(KEY, value);
}

export async function clearStoredSession() {
  localStorage.removeItem(KEY);
}
