import { Pressable, StyleSheet, Text } from 'react-native';

import { cardShadow, colors, fonts } from '@/constants/theme';
import type { Pet } from '@/data/pets';
import type { Visit } from '@/data/visits';
import { formatShortMonth, formatShortWeekday, formatTime, fromDateKey } from '@/lib/dates';

type NextVisitCardProps = {
  visit: Visit;
  pet: Pet;
  onPress: () => void;
};

export function NextVisitCard({ visit, pet, onPress }: NextVisitCardProps) {
  const date = fromDateKey(visit.date);
  const clock = visit.time ? `, saat ${formatTime(visit.time)}` : '';
  const clinic = visit.clinic ? `. ${visit.clinic}` : '';

  return (
    <Pressable
      accessibilityHint="Ziyaretleri açmak için dokun"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.label}>Sonraki ziyaret</Text>
      <Text style={styles.date}>
        {formatShortWeekday(date)} {date.getDate()}
        <Text style={styles.month}> {formatShortMonth(date)}</Text>
      </Text>
      <Text style={styles.detail}>
        {pet.name} için {visit.reason}
        {clock}
        {clinic}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink2,
  },
  date: {
    marginTop: 6,
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  month: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    letterSpacing: 0,
    color: colors.ink2,
  },
  detail: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
  },
});
