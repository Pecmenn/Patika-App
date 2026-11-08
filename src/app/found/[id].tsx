import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { LoadingState } from '@/components/loading-state';
import { PetAvatar } from '@/components/pet-avatar';
import { colors, fonts } from '@/constants/theme';
import { getLostDetails } from '@/data/lost-reports';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';
import { durationLabel } from '@/lib/lost';

const STAT_BACKGROUND = 'rgba(255, 255, 255, 0.55)';

async function loadFoundScreen(id: string) {
  try {
    const [details, pets] = await Promise.all([getLostDetails(id), listPets()]);
    return { ...details, pet: pets.find((pet) => pet.id === details.report.petId) ?? null };
  } catch (error) {
    console.warn('Sonuç okunamadı', error);
    return { report: null, pet: null, sightings: [] };
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function FoundScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback(() => loadFoundScreen(id), [id]);
  const data = useFocusData(load);

  const report = data?.report;
  const pet = data?.pet;
  const duration =
    report?.foundAt && report ? durationLabel(report.startedAt, report.foundAt) : null;

  // Veri gelmeden "Kayıp modu kapandı" yazıp sonra adı göstermesin.
  if (!data) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.frame}>
          <PetAvatar
            photoUri={pet?.photo ? resolvePetPhotoUri(pet.photo) : null}
            size={150}
            species={pet?.species ?? null}
          />
        </View>

        <Text accessibilityRole="header" style={styles.heading}>
          {report ? `${report.petName} evde` : 'Kayıp modu kapandı'}
        </Text>
        {duration && (
          <Text style={styles.body}>
            Kayıp modunu başlattıktan {duration} sonra bulundu. Kayıp modu kapandı, sayfa artık
            ihbar almıyor.
          </Text>
        )}

        {data && duration && (
          <View style={styles.stats}>
            <Stat label="sürede bulundu" value={duration} />
            <Stat label="ihbar geldi" value={String(data.sightings.length)} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label="Bugün'e dön" onPress={() => router.dismissTo('/today')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ball,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  frame: {
    padding: 8,
    borderRadius: 90,
    backgroundColor: colors.card,
    transform: [{ rotate: '-3deg' }],
  },
  heading: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    color: colors.ink,
  },
  body: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.ui,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink2,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: STAT_BACKGROUND,
  },
  statValue: {
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  statLabel: {
    marginTop: 3,
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.ink2,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
