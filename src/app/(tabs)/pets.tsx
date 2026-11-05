import { router } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { PetAvatar } from '@/components/pet-avatar';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';
import { petSummary } from '@/lib/pets';

export default function PetsScreen() {
  const insets = useSafeAreaInsets();
  const pets = useFocusData(listPets);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        Hayvanlar
      </Text>

      <View style={styles.list}>
        {pets?.map((pet) => (
          <Pressable
            key={pet.id}
            accessibilityHint="Sağlık kaydını açmak için dokun"
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <PetAvatar
              photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
              size={56}
              species={pet.species}
            />
            <View style={styles.copy}>
              <Text style={styles.name}>{pet.name}</Text>
              <Text style={styles.summary}>{petSummary(pet)}</Text>
            </View>
            <CaretRightIcon size={16} weight="bold" color={colors.ink3} />
          </Pressable>
        ))}
      </View>

      <View style={styles.action}>
        <Button label="Hayvan ekle" onPress={() => router.push('/add-pet')} />
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
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  list: {
    gap: 10,
    marginTop: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  pressed: {
    opacity: 0.7,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  summary: {
    marginTop: 2,
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.ink2,
  },
  action: {
    marginTop: 16,
  },
});
