import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listPets, type Pet } from '@/data/pets';

// Ekran her açıldığında listeyi yeniden okur. Yüklenirken null döner.
export function usePets() {
  const [pets, setPets] = useState<Pet[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      listPets().then((storedPets) => {
        if (isActive) {
          setPets(storedPets);
        }
      });
      return () => {
        isActive = false;
      };
    }, []),
  );

  return pets;
}
