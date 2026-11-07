import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { ApiError } from '@/lib/api';
import { ACCOUNT_SUSPENDED_MESSAGE, signInWithApple } from '@/lib/auth';

const HEIGHT = 56;

// Apple kendi düğmesinin kullanılmasını ister: yazısını ve rengini sistem belirler.
export function AppleSignInButton() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signIn() {
    if (isSigningIn) {
      return;
    }
    setIsSigningIn(true);
    try {
      await signInWithApple();
    } catch (error) {
      console.warn('Apple ile giriş başarısız', error);
      const isSuspended = error instanceof ApiError && error.code === 'account_suspended';
      Alert.alert(
        'Giriş yapılamadı',
        isSuspended ? ACCOUNT_SUSPENDED_MESSAGE : 'Lütfen bağlantını kontrol edip tekrar dene.',
        [{ text: 'Tamam' }],
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      cornerRadius={HEIGHT / 2}
      onPress={signIn}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: HEIGHT,
  },
});
