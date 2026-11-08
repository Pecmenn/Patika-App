import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Tappable } from '@/components/tappable';
import { cardShadow } from '@/constants/theme';

type GlassButtonProps = {
  label: string;
  onPress: () => void;
  children: ReactNode;
};

export function GlassButton({ label, onPress, children }: GlassButtonProps) {
  return (
    <Tappable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      pressedScale={0.92}
      style={styles.button}>
      {children}
    </Tappable>
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
