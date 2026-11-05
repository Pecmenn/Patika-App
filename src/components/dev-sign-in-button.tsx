import { Alert } from 'react-native';

import { Button } from '@/components/button';
import { signInForDevelopment } from '@/lib/auth';

// Yalnızca geliştirirken gösterilir: gerçek Apple hesabına dokunmadan denemek için.
export function DevSignInButton() {
  return (
    <Button
      label="Deneme hesabıyla gir"
      size="small"
      variant="text"
      onPress={() =>
        signInForDevelopment().catch((error) => {
          console.warn('Deneme girişi başarısız', error);
          Alert.alert('Deneme girişi başarısız', String(error), [{ text: 'Tamam' }]);
        })
      }
    />
  );
}
