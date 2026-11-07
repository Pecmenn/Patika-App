import { Platform } from 'react-native';

import { AppleSignInButton } from '@/components/apple-sign-in-button';
import { DevSignInButton } from '@/components/dev-sign-in-button';

// Yalnızca geliştirirken ve deneme APK'sında. Mağaza sürümünde bu değer verilmez, düğme hiç çıkmaz.
const ALLOWS_TEST_ACCOUNT = __DEV__ || process.env.EXPO_PUBLIC_TEST_SIGN_IN === 'true';

// Apple ile giriş yalnızca iPhone'da var. Diğer yerlerde deneme hesabı.
export function SignInButton() {
  if (Platform.OS === 'ios') {
    return <AppleSignInButton />;
  }
  return ALLOWS_TEST_ACCOUNT ? <DevSignInButton /> : null;
}
