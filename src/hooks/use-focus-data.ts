import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { subscribeToData } from '@/data/local-store';

type Subscribe = (listener: () => void) => () => void;

// Ekran her açıldığında veriyi yeniden okur. Yüklenirken null döner.
// load ve subscribe, dosya düzeyinde tanımlı işlevler olmalı (örneğin listPets).
// Kayıtlar değişince (ekrandan, bildirimden ya da sunucudan) kendiliğinden yenilenir.
// subscribe verilirse o veri değiştiğinde de yeniden okur.
export function useFocusData<T>(load: () => Promise<T>, subscribe?: Subscribe) {
  const [data, setData] = useState<T | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const reload = () => {
        load().then((loaded) => {
          if (isActive) {
            setData(loaded);
          }
        });
      };

      reload();
      // Uygulama arka plandan dönünce gün değişmiş veya ayarlardan izin verilmiş olabilir.
      const appState = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          reload();
        }
      });
      const unsubscribeData = subscribeToData(reload);
      const unsubscribe = subscribe?.(reload);

      return () => {
        isActive = false;
        appState.remove();
        unsubscribeData();
        unsubscribe?.();
      };
    }, [load, subscribe]),
  );

  return data;
}
