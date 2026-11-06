import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ClinicDetails } from '@/components/clinic-details';
import { EmptyCard } from '@/components/empty-card';
import { GlassButton } from '@/components/glass-button';
import { colors } from '@/constants/theme';
import { fetchClinic } from '@/data/clinics';
import { useFocusData } from '@/hooks/use-focus-data';
import { useNearbyPoint } from '@/hooks/use-nearby-point';
import { distanceKm } from '@/lib/clinics';

export default function ClinicScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback(async () => {
    try {
      return { clinic: await fetchClinic(id) };
    } catch (error) {
      console.warn('Klinik okunamadı', error);
      return { clinic: null };
    }
  }, [id]);
  const data = useFocusData(load);
  const { point } = useNearbyPoint();
  const clinic = data?.clinic;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassButton label="Geri" onPress={() => router.back()}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>
        {data && !clinic && (
          <EmptyCard
            body="Klinik artık listede olmayabilir ya da internet bağlantısı kopmuş olabilir."
            title="Klinik açılamadı"
          />
        )}
        {clinic && (
          <View style={styles.details}>
            <ClinicDetails
              clinic={clinic}
              distance={point ? distanceKm(point, clinic) : null}
            />
          </View>
        )}
      </ScrollView>

      {clinic && (
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            label="Randevu al"
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: clinic.id } })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  details: {
    marginTop: 18,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
