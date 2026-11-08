import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { subscribeToData } from '@/data/local-store';

type Subscribe = (listener: () => void) => () => void;

// Ekran her açıldığında veriyi yeniden okur. Yüklenirken null döner.
// load ve subscribe, dosya düzeyinde tanımlı işlevler olmalı (örneğin listPets).
// Kayıtlar değişince (ekrandan, bildirimden ya da sunucudan) kendiliğinden yenilenir.
// subscribe verilirse o veri değiştiğinde de yeniden okur.
export function useFocusData<T>(load: () => Promise<T>, subscribe?: Subscribe) {
  return useFocusResource(load, subscribe).data;
}

// Sunucudan gelen ekranlar için: "Tekrar dene" ve aşağı çekerek yenileme de verir.
// refresh, yenileme bitene kadar isRefreshing'i açık tutar.
export function useFocusResource<T>(load: () => Promise<T>, subscribe?: Subscribe) {
  const [data, setData] = useState<T | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const reloadRef = useRef<(() => Promise<void>) | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const reload = () =>
        load().then((loaded) => {
          if (isActive) {
            setData(loaded);
          }
        });
      reloadRef.current = reload;

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
        reloadRef.current = null;
        appState.remove();
        unsubscribeData();
        unsubscribe?.();
      };
    }, [load, subscribe]),
  );

  const refresh = useCallback(async () => {
    const reload = reloadRef.current;
    if (!reload) {
      return;
    }
    setIsRefreshing(true);
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return { data, refresh, isRefreshing };
}
