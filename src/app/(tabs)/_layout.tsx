import { Tabs } from 'expo-router';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, colors, fonts, TAB_BAR_HEIGHT, tabBarBottom } from '@/constants/theme';

function iconColor(focused: boolean) {
  return focused ? colors.ink : colors.ink3;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveBackgroundColor: 'rgba(29, 36, 82, 0.08)',
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.ink3,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.bar, { bottom: tabBarBottom(insets.bottom) }],
      }}>
      <Tabs.Screen
        name="today"
        options={{
          title: 'Bugün',
          tabBarIcon: ({ focused }) => (
            <HouseIcon size={24} weight={focused ? 'fill' : 'regular'} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Hayvanlar',
          tabBarIcon: ({ focused }) => (
            <PawPrintIcon
              size={24}
              weight={focused ? 'fill' : 'regular'}
              color={iconColor(focused)}
            />
          ),
        }}
      />
    </Tabs>
  );
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
