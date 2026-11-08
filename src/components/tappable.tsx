import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESSED_OPACITY = 0.75;
const DISABLED_OPACITY = 0.4;

type TappableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  // Büyük kartlarda küçülme daha az olmalı, yoksa göze fazla oynak gelir.
  pressedScale?: number;
  // Yalnızca dokunulamayan bilgi satırı olacaksa (ör. konumsuz ihbar) soluklaşmasın.
  dimWhenDisabled?: boolean;
};

// Dokunulan her şey aynı biçimde tepki verir: basınca hafifçe küçülür ve solar.
// "Hareketi azalt" açıksa yalnızca solar. Kapalı düğme her yerde aynı solukluktadır,
// bu yüzden çağıran yer kendi opaklık ayarını vermez.
export function Tappable({
  style,
  pressedScale = 0.97,
  dimWhenDisabled = true,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: TappableProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const isDisabled = Boolean(disabled) && dimWhenDisabled;

  const feedback = useAnimatedStyle(() => ({
    opacity: isDisabled ? DISABLED_OPACITY : 1 - pressed.value * (1 - PRESSED_OPACITY),
    transform: [{ scale: reduceMotion ? 1 : 1 - pressed.value * (1 - pressedScale) }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        pressed.value = withTiming(1, { duration: 80 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withTiming(0, { duration: 160 });
        onPressOut?.(event);
      }}
      style={[style, feedback]}
    />
  );
}
