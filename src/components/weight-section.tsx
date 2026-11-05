import { router } from 'expo-router';
import { TrendDownIcon } from 'phosphor-react-native/src/icons/TrendDown';
import { TrendUpIcon } from 'phosphor-react-native/src/icons/TrendUp';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyCard } from '@/components/empty-card';
import { SegmentedControl } from '@/components/segmented-control';
import { WeightChart } from '@/components/weight-chart';
import { cardShadow, colors, fonts } from '@/constants/theme';
import type { WeightEntry, WeightRange } from '@/data/weights';
import { formatShortDate, fromDateKey } from '@/lib/dates';
import {
  filterByPeriod,
  formatDelta,
  formatKg,
  sortByDate,
  WEIGHT_PERIODS,
  weightSummary,
  withDeltas,
  type WeightPeriod,
} from '@/lib/weights';

const DELTA_COLOR = '#3346A8';

type WeightSectionProps = {
  petId: string;
  entries: WeightEntry[];
  range: WeightRange | null;
  now: Date;
};

export function WeightSection({ petId, entries, range, now }: WeightSectionProps) {
  const [period, setPeriod] = useState<WeightPeriod>('6m');

  const rows = withDeltas(entries);
  const latest = rows[0];
  const summary = weightSummary(entries, range);
  const visible = sortByDate(filterByPeriod(entries, period, now));

  const rangeAction = (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/weight-range', params: { petId } })}
      style={styles.rangeAction}>
      <Text style={styles.rangeActionLabel}>
        {range
          ? `Sağlıklı aralık: ${formatKg(range.min)} - ${formatKg(range.max)} kg`
          : 'Sağlıklı aralık ekle'}
      </Text>
    </Pressable>
  );

  if (!latest) {
    return (
      <>
        <EmptyCard
          body="Tartı sonuçlarını ekle, zaman içindeki değişimi burada gör."
          title="Henüz kilo kaydı yok"
        />
        {rangeAction}
      </>
    );
  }

  return (
    <>
      <View style={styles.head}>
        <Text style={styles.headLabel}>Son tartı: {formatShortDate(fromDateKey(latest.date))}</Text>
        <Text accessibilityRole="header" style={styles.value}>
          {formatKg(latest.kg)}
          <Text style={styles.unit}> kg</Text>
        </Text>
        {summary && (
          <View style={styles.summary}>
            {latest.delta !== null && latest.delta > 0 && (
              <TrendUpIcon size={18} weight="bold" color={colors.ink2} />
            )}
            {latest.delta !== null && latest.delta < 0 && (
              <TrendDownIcon size={18} weight="bold" color={colors.ink2} />
            )}
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}
      </View>

      <View style={styles.periods}>
        <SegmentedControl options={WEIGHT_PERIODS} value={period} onChange={setPeriod} />
      </View>

      <View style={styles.chartCard}>
        {visible.length > 0 ? (
          <WeightChart entries={visible} range={range} />
        ) : (
          <Text style={styles.noData}>Bu dönemde kilo kaydı yok.</Text>
        )}
      </View>

      {rangeAction}

      <Text style={styles.sectionTitle}>Kayıtlar</Text>
      <View style={styles.list}>
        {rows.map((row, index) => (
          <Pressable
            key={row.id}
            accessibilityHint="Düzenlemek için dokun"
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/edit-weight', params: { id: row.id } })}
            style={({ pressed }) => [
              styles.row,
              index < rows.length - 1 && styles.rowDivider,
              pressed && styles.pressed,
            ]}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowValue}>{formatKg(row.kg)} kg</Text>
              <Text style={styles.rowDetail}>
                {formatShortDate(fromDateKey(row.date))}
                {row.note ? `, ${row.note}` : ''}
              </Text>
            </View>
            {row.delta !== null && (
              <View style={styles.delta}>
                <Text style={styles.deltaLabel}>{formatDelta(row.delta)}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  head: {
    marginTop: 18,
    marginHorizontal: 4,
  },
  headLabel: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.ink3,
  },
  value: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.6,
    color: colors.ink,
  },
  unit: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    letterSpacing: 0,
  },
  summary: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.uiSemi,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink2,
  },
  periods: {
    marginTop: 14,
  },
  chartCard: {
    marginTop: 12,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  noData: {
    paddingTop: 12,
    paddingBottom: 18,
    textAlign: 'center',
    fontFamily: fonts.uiSemi,
    fontSize: 14.5,
    color: colors.ink2,
  },
  rangeAction: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginHorizontal: 4,
    paddingVertical: 4,
  },
  rangeActionLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 4,
    fontFamily: fonts.uiHeavy,
    fontSize: 19,
    color: colors.ink,
  },
  list: {
    paddingVertical: 2,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pressed: {
    opacity: 0.6,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowValue: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16,
    color: colors.ink,
  },
  rowDetail: {
    marginTop: 1,
    fontFamily: fonts.ui,
    fontSize: 13.5,
    color: colors.ink3,
  },
  delta: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.skySoft,
  },
  deltaLabel: {
    fontFamily: fonts.uiHeavy,
    fontSize: 13,
    color: DELTA_COLOR,
  },
});
