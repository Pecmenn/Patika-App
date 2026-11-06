import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type ChoiceChipsProps<T extends string> = {
  options: { value: T; label: string }[];
  value: string | null;
  onChange: (value: T) => void;
};

export function ChoiceChips<T extends string>({ options, value, onChange }: ChoiceChipsProps<T>) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
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
          <Pressable
            key={option.value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            onPress={() =>
              onChange(
                isSelected
                  ? values.filter((value) => value !== option.value)
                  : [...values, option.value],
              )
            }
            style={[styles.chip, isSelected && styles.chipSelected]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
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
    height: 36,
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
