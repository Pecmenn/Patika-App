import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { LostReport, Sighting } from '@/data/lost-reports';

// Tarayıcı önizlemesinde harita yok.
export function LostMap(_props: { report: LostReport; sightings: Sighting[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Harita yalnızca telefonda görünür.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink2,
  },
});
