import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type ButtonProps = {
  label: string;
  variant?: 'ink' | 'white' | 'text';
  size?: 'large' | 'small';
  disabled?: boolean;
  onPress?: () => void;
};

export function Button({
  label,
  variant = 'ink',
  size = 'large',
  disabled = false,
  onPress,
}: ButtonProps) {
  const isInk = variant === 'ink';
  const isSmall = size === 'small';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isSmall && styles.small,
        isInk && styles.ink,
        variant === 'white' && styles.white,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, isSmall && styles.labelSmall, isInk && styles.labelOnInk]}>
        {label}
      </Text>
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
  small: {
    height: 44,
  },
  ink: {
    backgroundColor: colors.ink,
  },
  white: {
    backgroundColor: colors.card,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 16.5,
    color: colors.ink,
  },
  labelSmall: {
    fontSize: 15,
  },
  labelOnInk: {
    color: colors.card,
  },
});
