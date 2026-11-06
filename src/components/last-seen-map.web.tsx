import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { Point } from '@/lib/lost';

type LastSeenMapProps = {
  onMove: (point: Point) => void;
  onArea: (area: string) => void;
  initialPoint?: Point;
};

// Tarayıcı önizlemesinde harita yok, deneme için sabit bir nokta seçilir.
export function LastSeenMap({ onMove, onArea }: LastSeenMapProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onMove({ latitude: 41.015, longitude: 28.979 });
        onArea('Fatih, İstanbul');
      }}
      style={styles.card}>
      <Text style={styles.label}>Harita yalnızca telefonda. Deneme noktası seçmek için dokun.</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.card,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink2,
  },
});
