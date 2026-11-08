import { StyleSheet, Text } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Tappable } from '@/components/tappable';
import { cardShadow, colors, fonts } from '@/constants/theme';
import type { Pet } from '@/data/pets';
import type { WeightEntry, WeightRange } from '@/data/weights';
import { formatShortDate, fromDateKey } from '@/lib/dates';
import { formatDelta, formatKg, rangeLabel, sortByDate, withDeltas } from '@/lib/weights';

const SPARK_WIDTH = 120;
const SPARK_HEIGHT = 34;
const SPARK_POINTS = 7;

// En az iki tartıyla çizilir.
function Sparkline({ entries }: { entries: WeightEntry[] }) {
  const recent = sortByDate(entries).slice(-SPARK_POINTS);
  const values = recent.map((entry) => entry.kg);
  const low = Math.min(...values);
  const span = Math.max(...values) - low;
  const inset = 5;

  const points = recent.map((entry, index) => ({
    x: inset + (index / (recent.length - 1)) * (SPARK_WIDTH - inset * 2),
    y: span === 0 ? SPARK_HEIGHT / 2 : SPARK_HEIGHT - inset - ((entry.kg - low) / span) * (SPARK_HEIGHT - inset * 2),
  }));
  const last = points[points.length - 1];

  return (
    <Svg height={SPARK_HEIGHT} style={styles.spark} viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} width="100%">
      <Polyline
        fill="none"
        points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        stroke={colors.ink}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
      <Circle cx={last.x} cy={last.y} fill={colors.ink} r={4} />
    </Svg>
  );
}

type WeightCardProps = {
  pet: Pet;
  // Bu hayvanın kayıtları, en az bir tane.
  entries: WeightEntry[];
  range: WeightRange | null;
  onPress: () => void;
};

export function WeightCard({ pet, entries, range, onPress }: WeightCardProps) {
  const [latest] = withDeltas(entries);
  let foot: string | null = null;
  if (range) {
    foot = rangeLabel(latest.kg, range);
  } else if (latest.delta !== null) {
    foot = `Önceki tartıya göre ${formatDelta(latest.delta)} kg`;
  } else {
    foot = `İlk tartı, ${formatShortDate(fromDateKey(latest.date))}`;
  }

  return (
    <Tappable
      accessibilityHint="Kilo kayıtlarını açmak için dokun"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}>
      <Text style={styles.label}>{pet.name}, son tartı</Text>
      <Text style={styles.value}>
        {formatKg(latest.kg)}
        <Text style={styles.unit}> kg</Text>
      </Text>
      {/* Tek tartıda çizgi olmaz, boşlukta yalnız bir nokta kalırdı. */}
      {entries.length > 1 && <Sparkline entries={entries} />}
      {foot && <Text style={styles.foot}>{foot}</Text>}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.skySoft,
    boxShadow: cardShadow,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink2,
  },
  value: {
    marginTop: 4,
    fontFamily: fonts.displaySemi,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  unit: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    letterSpacing: 0,
  },
  spark: {
    marginTop: 4,
  },
  foot: {
    marginTop: 6,
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink2,
  },
});
