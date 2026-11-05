import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { PetAvatar } from '@/components/pet-avatar';
import { DueVaccineSticker, VaccineSticker } from '@/components/vaccine-sticker';
import { SPECIES } from '@/constants/species';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets, type Pet } from '@/data/pets';
import { listVaccines } from '@/data/vaccines';
import { useFocusData } from '@/hooks/use-focus-data';
import { ageLabel } from '@/lib/dates';
import { splitVaccines } from '@/lib/vaccines';

function petSummary(pet: Pet) {
  const age = pet.birthDate ? ageLabel(pet.birthDate, pet.birthDateIsApproximate) : null;
  return [pet.breed ?? SPECIES[pet.species].label, age].filter(Boolean).join(', ');
}

export default function PetRecordScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pets = useFocusData(listPets);
  const vaccines = useFocusData(listVaccines);

  const pet = pets?.find((candidate) => candidate.id === id);
  if (!pet || vaccines === null) {
    return null;
  }

  const { due, others } = splitVaccines(vaccines.filter((vaccine) => vaccine.petId === pet.id));
  const hasRecords = due.length > 0 || others.length > 0;

  function openEdit(vaccineId: string) {
    router.push({ pathname: '/edit-vaccine', params: { id: vaccineId } });
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 2 }]}
        showsVerticalScrollIndicator={false}>
        <GlassButton
          label="Geri"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        <View style={styles.head}>
          <PetAvatar
            photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
            size={76}
            species={pet.species}
          />
          <View style={styles.headCopy}>
            <Text accessibilityRole="header" style={styles.name}>
              {pet.name}
            </Text>
            <Text style={styles.summary}>{petSummary(pet)}</Text>
          </View>
        </View>

        {due.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yaklaşanlar</Text>
            {due.map((vaccine) => (
              <DueVaccineSticker
                key={vaccine.id}
                vaccine={vaccine}
                onDone={() =>
                  router.push({
                    pathname: '/add-vaccine',
                    params: { petId: pet.id, name: vaccine.name },
                  })
                }
                onEdit={() => openEdit(vaccine.id)}
              />
            ))}
          </View>
        )}

        {others.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Kayıtlar</Text>
              <Text style={styles.sectionCount}>{others.length} kayıt</Text>
            </View>
            {others.map((vaccine) => (
              <VaccineSticker
                key={vaccine.id}
                vaccine={vaccine}
                onEdit={() => openEdit(vaccine.id)}
              />
            ))}
          </View>
        )}

        {!hasRecords && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz aşı kaydı yok</Text>
            <Text style={styles.emptyBody}>
              Karnedeki aşıları ekle, zamanı yaklaşanlar burada ve Bugün ekranında görünsün.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label="Aşı ekle"
          onPress={() => router.push({ pathname: '/add-vaccine', params: { petId: pet.id } })}
        />
      </View>
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  headCopy: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -1,
    color: colors.ink,
  },
  summary: {
    marginTop: 2,
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink2,
  },
  section: {
    marginTop: 22,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    marginBottom: 10,
    marginHorizontal: 4,
    fontFamily: fonts.uiHeavy,
    fontSize: 19,
    color: colors.ink,
  },
  sectionCount: {
    marginHorizontal: 4,
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink3,
  },
  emptyCard: {
    marginTop: 22,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  emptyTitle: {
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  emptyBody: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
