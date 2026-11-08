import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { PetAvatar } from '@/components/pet-avatar';
import { SPECIES } from '@/constants/species';
import { colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import type { HealthRecord } from '@/data/health-records';
import type { Pet } from '@/data/pets';
import { daysUntil, formatLongDate, fromDateKey } from '@/lib/dates';
import { dueCountLabel } from '@/lib/health-records';

type UpNextCardProps = {
  pet: Pet;
  record: HealthRecord;
  // Uygulama ertesi gün açılınca sayaç yenilensin diye dışarıdan geliyor.
  now: Date;
  onDone: () => void;
};

export function UpNextCard({ pet, record, now, onDone }: UpNextCardProps) {
  const dueDate = record.nextDueDate ?? record.givenDate;
  const days = daysUntil(dueDate, now);

  return (
    <View style={[styles.card, { backgroundColor: SPECIES[pet.species].color }]}>
      {/* Solda kimin için, ne ve ne zaman alt alta; sağda sayaç. Sayacın alt satırı tarih satırıyla aynı
          çizgide durur, kısa adda sol üstte boşluk kalmaz. */}
      <View style={styles.main}>
        <View style={styles.text}>
          <View style={styles.who}>
            <View style={styles.avatarRing}>
              <PetAvatar
                name={pet.name}
                photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
                size={28}
                species={pet.species}
              />
            </View>
            <Text style={styles.whoLabel}>{pet.name} için sırada</Text>
          </View>
          <Text style={styles.name}>{record.name}</Text>
          <Text style={styles.sub}>Son tarih: {formatLongDate(fromDateKey(dueDate))}</Text>
        </View>
        <View style={styles.count}>
          <Text maxFontSizeMultiplier={1.2} style={styles.countValue}>{Math.abs(days)}</Text>
          <Text style={styles.countLabel}>{dueCountLabel(days)}</Text>
        </View>
      </View>

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
  main: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  text: {
    flex: 1,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
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
  name: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.6,
    color: colors.ink,
    marginBottom: 4,
  },
  sub: {
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
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
  // Tarih satırıyla aynı satır yüksekliği: ikisinin alt çizgisi aynı hizaya gelir.
  // Rakamın altındaki boşluk kısılır, "gün kaldı" sayıya yapışık durur.
  countLabel: {
    marginTop: -8,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
  },
});
