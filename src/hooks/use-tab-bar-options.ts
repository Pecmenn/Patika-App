import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, colors, fonts, TAB_BAR_HEIGHT, tabBarBottom } from '@/constants/theme';

// Sahip ve veteriner alt menüleri aynı görünür.
export function useTabBarOptions() {
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    sceneStyle: styles.scene,
    tabBarActiveBackgroundColor: 'rgba(29, 36, 82, 0.08)',
    tabBarActiveTintColor: colors.ink,
    tabBarInactiveTintColor: colors.ink3,
    tabBarItemStyle: styles.item,
    tabBarLabelStyle: styles.label,
    tabBarStyle: [styles.bar, { bottom: tabBarBottom(insets.bottom) }],
  };
}

export function tabIconColor(focused: boolean) {
  return focused ? colors.ink : colors.ink3;
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.paper,
  },
  // Tasarımdaki yüzen menü: kenarlardan içeride, tam yuvarlak.
  bar: {
    position: 'absolute',
    marginHorizontal: 16,
    height: TAB_BAR_HEIGHT,
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 5,
    borderTopWidth: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    boxShadow: cardShadow,
  },
  item: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
  },
});
