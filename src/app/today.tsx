import { router } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetAvatar } from '@/components/pet-avatar';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { usePets } from '@/hooks/use-pets';
import { formatWeekday, greetingFor } from '@/lib/dates';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const pets = usePets();
  const now = new Date();

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <Text style={styles.date}>{formatWeekday(now)}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {greetingFor(now)}
      </Text>

      <ScrollView
        horizontal
        contentContainerStyle={styles.chips}
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}>
        {pets?.map((pet) => (
          <View key={pet.id} style={styles.chip}>
            <PetAvatar
              photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
              size={28}
              species={pet.species}
            />
            <Text style={styles.chipLabel}>{pet.name}</Text>
          </View>
        ))}
        <Pressable
          accessibilityLabel="Hayvan ekle"
          accessibilityRole="button"
          onPress={() => router.push('/add-pet')}
          style={styles.addChip}>
          <PlusIcon size={17} weight="bold" color={colors.ink} />
        </Pressable>
      </ScrollView>

      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Yaklaşan bir şey yok</Text>
        <Text style={styles.emptyBody}>Aşı ve görev ekledikçe burada görünecek.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  date: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink3,
  },
  title: {
    marginTop: 4,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  chipsRow: {
    marginTop: 16,
    marginHorizontal: -20,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  addChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  emptyCard: {
    marginTop: 16,
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
});
