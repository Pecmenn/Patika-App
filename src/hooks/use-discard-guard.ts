import { usePreventRemove } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

// Yarım kalan form sorulmadan kaybolmasın: kapatma düğmesi, Android'in geri tuşu ve
// iPhone'da kaydırarak geri dönme, değişiklik varsa önce sorar.
// values formun kaydedilecek alanlarıdır. İlk hâli saklanır, farklılaşınca form "değişti" sayılır.
// Dönen allowLeave, kaydettikten ya da sildikten sonra form kendini kapatmadan hemen önce çağrılır.
//
// Çıkış her zaman kütüphanenin verdiği repeat ile sürdürülür: aynı komutu yeniden göndermek
// korumayı yeniden tetikliyor ve sonsuz döngüye giriyordu (taklitçide görüldü).
export function useDiscardGuard(values: unknown) {
  const snapshot = JSON.stringify(values);
  const [initial] = useState(snapshot);
  const [isLeaving, setIsLeaving] = useState(false);
  const isAllowed = useRef(false);

  usePreventRemove(snapshot !== initial && !isLeaving, ({ repeat }) => {
    if (isAllowed.current) {
      setIsLeaving(true);
      repeat();
      return;
    }
    Alert.alert('Değişiklikler kaydedilmedi', 'Şimdi çıkarsan yazdıkların silinir.', [
      { text: 'Düzenlemeye dön', style: 'cancel' },
      {
        text: 'Kaydetmeden çık',
        style: 'destructive',
        onPress: () => {
          setIsLeaving(true);
          repeat();
        },
      },
    ]);
  });

  return useCallback(() => {
    isAllowed.current = true;
    setIsLeaving(true);
  }, []);
}
