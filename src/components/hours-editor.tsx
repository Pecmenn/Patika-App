import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { Tappable } from '@/components/tappable';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { DAY_NAMES, type DayHours } from '@/lib/clinics';
import { atTime, formatTime, toDateKey, toTimeKey } from '@/lib/dates';

const DEFAULT_DAY = { open: '09:00', close: '18:00' };

type Edge = 'open' | 'close';

type HoursEditorProps = {
  hours: DayHours[];
  onChange: (hours: DayHours[]) => void;
};

// Haftanın her günü için açık-kapalı ve saatler.
export function HoursEditor({ hours, onChange }: HoursEditorProps) {
  const [picking, setPicking] = useState<{ index: number; edge: Edge } | null>(null);
  const pickingDay = picking ? hours[picking.index] : null;

  function setDay(index: number, day: DayHours) {
    onChange(hours.map((current, position) => (position === index ? day : current)));
  }

  function applyFirstToAll() {
    const first = hours.find(Boolean);
    if (first) {
      onChange(hours.map((day) => (day ? first : null)));
    }
  }

  return (
    <View style={styles.card}>
      {DAY_NAMES.map((name, index) => {
        const day = hours[index] ?? null;
        const isInvalid = day !== null && day.open >= day.close;
        return (
          <View key={name} style={styles.day}>
            <View style={styles.row}>
              <Text style={styles.name}>{name}</Text>
              {day ? (
                <View style={styles.times}>
                  <TimeButton
                    label={`${name} açılış`}
                    time={day.open}
                    onPress={() => setPicking({ index, edge: 'open' })}
                  />
                  <Text style={styles.dash}>-</Text>
                  <TimeButton
                    label={`${name} kapanış`}
                    time={day.close}
                    onPress={() => setPicking({ index, edge: 'close' })}
                  />
                </View>
              ) : (
                <Text style={styles.closed}>Kapalı</Text>
              )}
              <Switch
                accessibilityLabel={`${name} açık`}
                onValueChange={(isOpen) => setDay(index, isOpen ? DEFAULT_DAY : null)}
                thumbColor={colors.card}
                trackColor={{ false: colors.line, true: colors.ink }}
                value={day !== null}
              />
            </View>
            {isInvalid && <Text style={styles.error}>Kapanış saati açılıştan sonra olmalı.</Text>}
          </View>
        );
      })}
      <Tappable accessibilityRole="button" onPress={applyFirstToAll} hitSlop={10} style={styles.shortcut}>
        <Text style={styles.shortcutLabel}>İlk günün saatlerini açık günlere uygula</Text>
      </Tappable>

      {picking && pickingDay && (
        <DatePickerSheet
          mode="time"
          value={atTime(toDateKey(new Date()), pickingDay[picking.edge])}
          onCancel={() => setPicking(null)}
          onConfirm={(picked) => {
            setDay(picking.index, { ...pickingDay, [picking.edge]: toTimeKey(picked) });
            setPicking(null);
          }}
        />
      )}
    </View>
  );
}

function TimeButton({ label, time, onPress }: { label: string; time: string; onPress: () => void }) {
  return (
    <Tappable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} hitSlop={4} style={styles.time}>
      <Text style={styles.timeLabel}>{formatTime(time)}</Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  day: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    gap: 8,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.uiBold,
    fontSize: 14.5,
    color: colors.ink,
  },
  times: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: colors.paper,
  },
  timeLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  dash: {
    fontFamily: fonts.uiBold,
    color: colors.ink3,
  },
  closed: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.ink3,
  },
  error: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: colors.alertText,
  },
  shortcut: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  shortcutLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
