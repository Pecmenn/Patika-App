import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type ButtonProps = {
  label: string;
  variant?: 'ink' | 'text';
  onPress?: () => void;
};

export function Button({ label, variant = 'ink', onPress }: ButtonProps) {
  const isInk = variant === 'ink';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.base, isInk && styles.ink, pressed && styles.pressed]}>
      <Text style={[styles.label, isInk && styles.labelOnInk]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  ink: {
    backgroundColor: colors.ink,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 16.5,
    color: colors.ink,
  },
  labelOnInk: {
    color: colors.card,
  },
});
