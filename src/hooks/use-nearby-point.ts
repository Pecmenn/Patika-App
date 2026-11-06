import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

import type { Point } from '@/lib/lost';

const MAX_LAST_KNOWN_AGE_MS = 10 * 60 * 1000;

async function readPoint(): Promise<Point> {
  const last = await Location.getLastKnownPositionAsync({ maxAge: MAX_LAST_KNOWN_AGE_MS });
  if (last) {
    return last.coords;
  }
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return coords;
}

// Yakınlık sıralaması için kullanıcının konumu. Yalnızca telefonda kullanılır, sunucuya gitmez.
// İzin kendiliğinden sorulmaz: kullanıcı neden istendiğini gördükten sonra düğmeye basar.
export function useNearbyPoint() {
  const [point, setPoint] = useState<Point | null>(null);
  // Henüz okunmadıysa null.
  const [isGranted, setIsGranted] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!isActive) {
          return;
        }
        setIsGranted(granted);
        if (granted) {
          const next = await readPoint();
          if (isActive) {
            setPoint(next);
          }
        }
      })().catch((error) => console.warn('Konum alınamadı', error));
      return () => {
        isActive = false;
      };
    }, []),
  );

  async function askPermission() {
    try {
      const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      setIsGranted(granted);
      if (granted) {
        setPoint(await readPoint());
        return;
      }
      Alert.alert(
        'Konum izni yok',
        'Klinikler ad sırasıyla gösterilecek.',
        canAskAgain
          ? [{ text: 'Tamam' }]
          : [
              { text: 'Tamam', style: 'cancel' },
              { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
            ],
      );
    } catch (error) {
      console.warn('Konum alınamadı', error);
      Alert.alert('Konum alınamadı', 'Klinikler ad sırasıyla gösterilecek.', [{ text: 'Tamam' }]);
    }
  }

  return { point, isGranted, askPermission };
}
