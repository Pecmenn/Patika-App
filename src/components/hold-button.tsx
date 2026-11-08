import { SirenIcon } from 'phosphor-react-native/src/icons/Siren';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, fonts } from '@/constants/theme';
import { impactHaptic } from '@/lib/haptics';

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
// Çubuk telefonun kendi çiziminde dolar: uygulama meşgulken de takılmaz.
export function HoldButton({ label, disabled, onComplete }: HoldButtonProps) {
  const progress = useSharedValue(0);
  const [isFull, setIsFull] = useState(false);

  function markFull() {
    setIsFull(true);
    impactHaptic();
  }

  function startHold() {
    setIsFull(false);
    // Süre bir güvenlik önlemi, süs değil: "hareketi azalt" açıkken de bir saniye sürer.
    progress.value = withTiming(
      1,
      { duration: HOLD_MS, reduceMotion: ReduceMotion.Never },
      (finished) => {
        if (finished) {
          scheduleOnRN(markFull);
        }
      },
    );
  }

  function endHold() {
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 150 });
    // Parmak dolma anıyla aynı anda kalkarsa "Şimdi bırak" yazısı ekranda kalmasın.
    setIsFull(false);
    if (isFull) {
      onComplete();
    }
  }

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

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
      <Animated.View style={[styles.fill, fillStyle]} />
      <View style={styles.content}>
        <SirenIcon size={20} weight="fill" color={colors.ink} />
        <Text style={styles.label}>{isFull ? 'Şimdi bırak' : label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    minHeight: 60,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: TRACK_COLOR,
  },
  disabled: {
    opacity: 0.4,
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
    paddingVertical: 16,
  },
  label: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16.5,
    color: colors.ink,
  },
});
