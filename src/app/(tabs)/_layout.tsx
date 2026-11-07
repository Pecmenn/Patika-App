import { Tabs } from 'expo-router';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { StethoscopeIcon } from 'phosphor-react-native/src/icons/Stethoscope';
import { StyleSheet } from 'react-native';

import { LostTabButton } from '@/components/lost-tab-button';
import { listActiveReports, subscribeToReports } from '@/data/lost-reports';
import { useFocusData } from '@/hooks/use-focus-data';
import { tabIconColor, useTabBarOptions } from '@/hooks/use-tab-bar-options';

export default function TabsLayout() {
  const screenOptions = useTabBarOptions();
  const activeReports = useFocusData(listActiveReports, subscribeToReports);
  const activeReport = activeReports?.[0];

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
        name="report-lost"
        options={{
          title: 'Hayvanım kayıp',
          tabBarItemStyle: styles.lostItem,
          tabBarButton: () => <LostTabButton report={activeReport} />,
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
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ focused }) => (
            <GearSixIcon size={24} weight={focused ? 'fill' : 'regular'} color={tabIconColor(focused)} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Yazısı en uzun düğme: yanındakilerden geniş. Daire menünün üstüne taştığı için kırpılmaz.
  lostItem: {
    flex: 1.3,
    overflow: 'visible',
  },
});
