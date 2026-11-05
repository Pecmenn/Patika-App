import { SirenIcon } from 'phosphor-react-native/src/icons/Siren';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

const HOLD_MS = 1000;
const TRACK_COLOR = '#FFC2AD';

type HoldButtonProps = {
  label: string;
  disabled: boolean;
  onComplete: () => void;
};

// Yanlışlıkla başlamasın diye bir saniye basılı tutmak gerekir.
// Ekran okuyucu kullananlar basılı tutamaz, onlar için çift dokunuş yeter.
export function HoldButton({ label, disabled, onComplete }: HoldButtonProps) {
  const [progress] = useState(() => new Animated.Value(0));

  function startHold() {
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  }

  function cancelHold() {
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  }

  return (
    <Pressable
      accessibilityHint="Başlatmak için bir saniye basılı tut"
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onAccessibilityTap={onComplete}
      onPressIn={startHold}
      onPressOut={cancelHold}
      style={[styles.track, disabled && styles.disabled]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
      <View style={styles.content}>
        <SirenIcon size={20} weight="fill" color={colors.ink} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 60,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: TRACK_COLOR,
  },
  disabled: {
    opacity: 0.45,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.alert,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16.5,
    color: colors.ink,
  },
});
