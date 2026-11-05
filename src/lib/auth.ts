import * as AppleAuthentication from 'expo-apple-authentication';

import { supabase } from '@/lib/supabase';

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
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) {
    throw error;
  }

  // Apple adı yalnızca ilk girişte gönderir, o yüzden hemen saklanır.
  // Kaydedilemezse giriş yine geçerli, yalnızca selamlamada ad görünmez.
  const { givenName, middleName, familyName } = credential.fullName ?? {};
  if (givenName || familyName) {
    const { error: nameError } = await supabase.auth.updateUser({
      data: {
        full_name: [givenName, middleName, familyName].filter(Boolean).join(' '),
        given_name: givenName,
        family_name: familyName,
      },
    });
    if (nameError) {
      console.warn('Ad kaydedilemedi', nameError);
    }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
