import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts } from '@/constants/theme';

// Sunucudan gelen ekranlarda veri beklerken: boş ekran yerine ne olduğunu söyler.
export function LoadingState({ label = 'Yükleniyor...' }: { label?: string }) {
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="progressbar" style={styles.loading}>
      <ActivityIndicator color={colors.ink} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// İçeriğin yerini tutan soluk kutu. Yavaşça nefes alır, "hareketi azalt" açıksa durur.
export function Skeleton({ height, width = '100%', radius = 22 }: { height: number; width?: DimensionValue; radius?: number }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    }
  }, [pulse, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.35 }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.skeleton, { height, width, borderRadius: radius }, style]}
    />
  );
}

// Liste yüklenirken: kartların kabaca yerini gösterir, ekran yüklendiğinde zıplamaz.
export function SkeletonList({ count = 3, height = 96 }: { count?: number; height?: number }) {
  return (
    <View accessibilityLabel="Yükleniyor" accessibilityRole="progressbar" style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
  },
  label: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink,
  },
  skeleton: {
    backgroundColor: 'rgba(29, 36, 82, 0.08)',
  },
  list: {
    gap: 10,
    marginTop: 16,
  },
});
