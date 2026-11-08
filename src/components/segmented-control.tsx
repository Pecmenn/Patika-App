import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { cardShadow, colors, fonts } from '@/constants/theme';
import { selectionHaptic } from '@/lib/haptics';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

const PADDING = 4;

// Seçili sekmeyi gösteren beyaz hap yeni seçime kayarak gider.
// "Hareketi azalt" açıksa Reanimated kaymayı kendiliğinden atlar.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const position = useSharedValue(selectedIndex);
  const segmentWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;

  useEffect(() => {
    position.value = withTiming(selectedIndex, { duration: 220 });
  }, [position, selectedIndex]);

  const indicator = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: position.value * segmentWidth }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.control}>
      {segmentWidth > 0 && <Animated.View style={[styles.indicator, indicator]} />}
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            hitSlop={{ top: 2, bottom: 2 }}
            onPress={() => {
              if (!isSelected) {
                selectionHaptic();
              }
              onChange(option.value);
            }}
            style={styles.segment}>
            <Text
              maxFontSizeMultiplier={1.4}
              numberOfLines={1}
              style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    padding: PADDING,
    borderRadius: 999,
    backgroundColor: 'rgba(29, 36, 82, 0.06)',
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 999,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 999,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink2,
  },
  labelSelected: {
    color: colors.ink,
  },
});
