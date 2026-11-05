import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { cardShadow } from '@/constants/theme';

type GlassButtonProps = {
  label: string;
  onPress: () => void;
  children: ReactNode;
};

export function GlassButton({ label, onPress, children }: GlassButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    boxShadow: cardShadow,
  },
});
