import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert } from 'react-native';

import { clearLocalData, isLocalDataOfAnotherAccount, releaseLocalData } from '@/data/sync';
import { apiRequest } from '@/lib/api';
import { clearSession, getSession, saveSession, type Session } from '@/lib/session';

const PENDING_NAME_KEY = 'patika.auth.pending-name.v1';

type LocalDataChoice = 'transfer' | 'delete' | 'cancel';

function askAboutLocalData() {
  return new Promise<LocalDataChoice>((resolve) => {
    Alert.alert(
      'Bu telefonda başka bir hesabın kayıtları var',
      'Daha önce farklı bir hesapla giriş yapılmış. Kayıtları bu hesaba aktarabilir ya da telefondan silebilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel', onPress: () => resolve('cancel') },
        { text: 'Sil', style: 'destructive', onPress: () => resolve('delete') },
        { text: 'Bu hesaba aktar', onPress: () => resolve('transfer') },
      ],
      { cancelable: false },
    );
  });
}

// Telefondaki kayıtlar başka hesaba aitse kullanıcıya sorulur, sorulmadan hiçbir şey silinmez.
async function finishSignIn(session: Session) {
  if (await isLocalDataOfAnotherAccount(session.user.id)) {
    const choice = await askAboutLocalData();
    if (choice === 'cancel') {
      await apiRequest('/v1/auth/logout', { method: 'POST', token: session.token }).catch(
        (error) => console.warn('Oturum kapatılamadı', error),
      );
      return;
    }
    await (choice === 'delete' ? clearLocalData() : releaseLocalData());
  }
  await saveSession(session);
}

// Yöneticinin kapattığı hesap giriş yapmak isteyince gösterilir.
export const ACCOUNT_SUSPENDED_MESSAGE = 'Bu hesap Patika yönetimi tarafından kapatıldı.';

// Kullanıcı Apple penceresini kapatırsa hata sayılmaz, sessizce döner.
export async function signInWithApple() {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      return;
    }
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('Apple kimlik bilgisi gelmedi');
  }

  // Apple adı yalnızca ilk girişte verir. Sunucuya ulaşılamazsa kaybolmasın diye önce telefona yazılır.
  const { givenName, middleName, familyName } = credential.fullName ?? {};
  if (givenName || familyName) {
    await AsyncStorage.setItem(
      PENDING_NAME_KEY,
      JSON.stringify({
        full_name: [givenName, middleName, familyName].filter(Boolean).join(' '),
        given_name: givenName ?? null,
        family_name: familyName ?? null,
      }),
    );
  }
  const pendingName = await AsyncStorage.getItem(PENDING_NAME_KEY);

  const session = await apiRequest<Session>('/v1/auth/apple', {
    method: 'POST',
    isPublic: true,
    body: {
      identity_token: credential.identityToken,
      ...(pendingName ? (JSON.parse(pendingName) as object) : {}),
    },
  });
  await AsyncStorage.removeItem(PENDING_NAME_KEY);
  await finishSignIn(session);
}

// Veteriner hesabı telefondaki kayıtlara bağlanmaz, eşitlenmez: telefon temizlenmez, soru da sorulmaz.
export async function signInAsVet(email: string, password: string, isNewAccount: boolean) {
  const session = await apiRequest<Session>(
    isNewAccount ? '/v1/auth/vet/register' : '/v1/auth/vet/login',
    { method: 'POST', isPublic: true, body: { email, password } },
  );
  await saveSession(session);
}

// Yalnızca bu telefondan çıkar. Sunucuya ulaşılamazsa çıkış yine geçerli olur.
export async function signOut() {
  const session = await getSession();
  if (session) {
    await apiRequest('/v1/auth/logout', { method: 'POST' }).catch((error) => {
      console.warn('Sunucudaki oturum kapatılamadı', error);
    });
  }
  await clearSession();
}

// Hesabı ve sunucudaki tüm verileri siler. Sunucu onaylamazsa hata verir, oturum ve kayıtlar durur.
export async function deleteAccount() {
  await apiRequest('/v1/me', { method: 'DELETE' });
  await clearSession();
}

// Yalnızca geliştirirken: tek kullanımlık boş bir hesap açar. Gerçek sunucuda bu giriş kapalıdır.
export async function signInForDevelopment() {
  await finishSignIn(await apiRequest<Session>('/v1/auth/dev', { method: 'POST', isPublic: true }));
}
