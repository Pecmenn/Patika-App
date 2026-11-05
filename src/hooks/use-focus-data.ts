import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

// Ekran her açıldığında veriyi yeniden okur. Yüklenirken null döner.
// load, dosya düzeyinde tanımlı bir işlev olmalı (örneğin listPets).
export function useFocusData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      load().then((loaded) => {
        if (isActive) {
          setData(loaded);
        }
      });
      return () => {
        isActive = false;
      };
    }, [load]),
  );

  return data;
}
