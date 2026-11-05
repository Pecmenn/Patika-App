import * as SecureStore from 'expo-secure-store';

const KEY = 'patika.session.v1';

// Telefon açıldıktan sonra kilitliyken de okunabilir: uygulama kilit ekranındaki bildirim düğmesiyle
// arka planda açıldığında oturumu okuyamazsa ekran boş kalıyordu.
const OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

// Oturum anahtarı telefonun şifreli kasasında durur (iPhone'da Keychain).
export function readStoredSession() {
  return SecureStore.getItemAsync(KEY, OPTIONS);
}

export function writeStoredSession(value: string) {
  return SecureStore.setItemAsync(KEY, value, OPTIONS);
}

export function clearStoredSession() {
  return SecureStore.deleteItemAsync(KEY, OPTIONS);
}
