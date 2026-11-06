import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useEffect } from 'react';

import { ClinicForm } from '@/components/clinic-form';
import { fetchOwnClinic } from '@/data/own-clinic';
import { useFocusData } from '@/hooks/use-focus-data';

async function loadClinic() {
  try {
    return { clinic: await fetchOwnClinic(), hasFailed: false };
  } catch (error) {
    console.warn('Klinik okunamadı', error);
    return { clinic: null, hasFailed: true };
  }
}

export default function VetClinicFormScreen() {
  const data = useFocusData(loadClinic);
  const hasFailed = data?.hasFailed ?? false;

  // Var olan bilgiler okunamadan form açılırsa boş form eskisinin üstüne yazabilir.
  useEffect(() => {
    if (hasFailed) {
      Alert.alert('Sunucuya ulaşılamadı', 'İnternet bağlantını kontrol edip tekrar dene.', [{ text: 'Tamam' }]);
      router.back();
    }
  }, [hasFailed]);

  if (!data || hasFailed) {
    return null;
  }
  return <ClinicForm clinic={data.clinic} />;
}
