import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { PetAvatar } from '@/components/pet-avatar';
import { SPECIES } from '@/constants/species';
import { colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import type { Pet } from '@/data/pets';
import type { Vaccine } from '@/data/vaccines';
import { daysUntil, formatLongDate, fromDateKey } from '@/lib/dates';
import { dueCountLabel } from '@/lib/vaccines';

type UpNextCardProps = {
  pet: Pet;
  vaccine: Vaccine;
  // Uygulama ertesi gün açılınca sayaç yenilensin diye dışarıdan geliyor.
  now: Date;
  onDone: () => void;
};

export function UpNextCard({ pet, vaccine, now, onDone }: UpNextCardProps) {
  const dueDate = vaccine.nextDueDate ?? vaccine.givenDate;
  const days = daysUntil(dueDate, now);

  return (
    <View style={[styles.card, { backgroundColor: SPECIES[pet.species].color }]}>
      <View style={styles.who}>
        <View style={styles.avatarRing}>
          <PetAvatar
            photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
            size={28}
            species={pet.species}
          />
        </View>
        <Text style={styles.whoLabel}>{pet.name} için sırada</Text>
      </View>

      <View style={styles.main}>
        <Text style={styles.name}>{vaccine.name}</Text>
        <View style={styles.count}>
          <Text style={styles.countValue}>{Math.abs(days)}</Text>
          <Text style={styles.countLabel}>{dueCountLabel(days)}</Text>
        </View>
      </View>

      <Text style={styles.sub}>Son tarih: {formatLongDate(fromDateKey(dueDate))}</Text>

      <View style={styles.actions}>
        <Button label="Yapıldı" size="small" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderRadius: 28,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.card,
  },
  whoLabel: {
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  count: {
    alignItems: 'flex-end',
  },
  countValue: {
    fontFamily: fonts.display,
    fontSize: 62,
    lineHeight: 64,
    letterSpacing: -3,
    color: colors.ink,
  },
  countLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
  },
});
