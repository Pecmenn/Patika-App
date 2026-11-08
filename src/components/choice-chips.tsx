import { StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';
import { selectionHaptic } from '@/lib/haptics';

type ChoiceChipsProps<T extends string> = {
  options: { value: T; label: string }[];
  value: string | null;
  onChange: (value: T) => void;
};

// Görünür boy 36, dokunma alanı 44: altta ve üstte 4'er nokta pay.
const HIT_SLOP = { top: 4, bottom: 4 };

export function ChoiceChips<T extends string>({ options, value, onChange }: ChoiceChipsProps<T>) {
  return (
    <View accessibilityRole="radiogroup" style={styles.chips}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Tappable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            hitSlop={HIT_SLOP}
            onPress={() => {
              if (!isSelected) {
                selectionHaptic();
              }
              onChange(option.value);
            }}
            pressedScale={0.94}
            style={[styles.chip, isSelected && styles.chipSelected]}>
            <Text maxFontSizeMultiplier={1.4} style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

type MultiChoiceChipsProps<T extends string> = {
  options: { value: T; label: string }[];
  values: T[];
  onChange: (values: T[]) => void;
};

// Birden çok seçim: dokununca eklenir, yeniden dokununca çıkar.
export function MultiChoiceChips<T extends string>({ options, values, onChange }: MultiChoiceChipsProps<T>) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const isSelected = values.includes(option.value);
        return (
          <Tappable
            key={option.value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            hitSlop={HIT_SLOP}
            onPress={() => {
              selectionHaptic();
              onChange(
                isSelected
                  ? values.filter((value) => value !== option.value)
                  : [...values, option.value],
              );
            }}
            pressedScale={0.94}
            style={[styles.chip, isSelected && styles.chipSelected]}>
            <Text maxFontSizeMultiplier={1.4} style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    justifyContent: 'center',
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  labelSelected: {
    color: colors.card,
  },
});
