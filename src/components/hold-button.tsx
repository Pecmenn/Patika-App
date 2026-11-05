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
// İş parmak kalkınca başlar: ekran parmak camdayken değişirse sonraki ilk dokunuş kayboluyor
// (taklitçideki uçtan uca testte görüldü), bu da ihbar geldiğinde arama düğmesini boşa düşürüyordu.
// Ekran okuyucu kullananlar basılı tutamaz, onlar için çift dokunuş yeter.
export function HoldButton({ label, disabled, onComplete }: HoldButtonProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const [isFull, setIsFull] = useState(false);

  function startHold() {
    setIsFull(false);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setIsFull(true);
      }
    });
  }

  function endHold() {
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    // Parmak dolma anıyla aynı anda kalkarsa "Şimdi bırak" yazısı ekranda kalmasın.
    setIsFull(false);
    if (isFull) {
      onComplete();
    }
  }

  return (
    <Pressable
      accessibilityHint="Çubuk dolana kadar basılı tut, sonra parmağını kaldır"
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onAccessibilityTap={onComplete}
      onPressIn={startHold}
      onPressOut={endHold}
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
        <Text style={styles.label}>{isFull ? 'Şimdi bırak' : label}</Text>
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
