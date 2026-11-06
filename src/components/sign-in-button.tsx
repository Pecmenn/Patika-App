import { Platform } from 'react-native';

import { AppleSignInButton } from '@/components/apple-sign-in-button';
import { DevSignInButton } from '@/components/dev-sign-in-button';

// Apple ile giriş yalnızca iPhone'da var. Taklitçi ve tarayıcıda yalnızca geliştirirken deneme hesabı.
export function SignInButton() {
  if (Platform.OS === 'ios') {
    return <AppleSignInButton />;
  }
  return __DEV__ ? <DevSignInButton /> : null;
}
