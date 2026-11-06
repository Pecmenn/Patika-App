import { Tabs } from 'expo-router';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { StethoscopeIcon } from 'phosphor-react-native/src/icons/Stethoscope';

import { tabIconColor, useTabBarOptions } from '@/hooks/use-tab-bar-options';

export default function TabsLayout() {
  const screenOptions = useTabBarOptions();

  return (
    <Tabs safeAreaInsets={{ bottom: 0 }} screenOptions={screenOptions}>
      <Tabs.Screen
        name="today"
        options={{
          title: 'Bugün',
          tabBarIcon: ({ focused }) => (
            <HouseIcon size={24} weight={focused ? 'fill' : 'regular'} color={tabIconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Hayvanlar',
          tabBarIcon: ({ focused }) => (
            <PawPrintIcon size={24} weight={focused ? 'fill' : 'regular'} color={tabIconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="vets"
        options={{
          title: 'Veterinerler',
          tabBarIcon: ({ focused }) => (
            <StethoscopeIcon size={24} weight={focused ? 'fill' : 'regular'} color={tabIconColor(focused)} />
          ),
        }}
      />
    </Tabs>
  );
}
