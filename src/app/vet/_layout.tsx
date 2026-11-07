import { Redirect, Tabs } from 'expo-router';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { StorefrontIcon } from 'phosphor-react-native/src/icons/Storefront';
import { useEffect } from 'react';

import { useSessionRejected } from '@/hooks/use-session';
import { tabIconColor, useTabBarOptions } from '@/hooks/use-tab-bar-options';
import { refreshReminders } from '@/lib/reminders';

export default function VetLayout() {
  const screenOptions = useTabBarOptions();
  const isRejected = useSessionRejected();

  // Veteriner yeni randevu isteklerini bildirimle öğrenir: izin panel açılınca sorulur.
  useEffect(() => {
    refreshReminders({ askPermission: true });
  }, []);

  // Oturum düşerse veteriner ekranlarının hiçbiri çalışmaz, başa dönülür.
  if (isRejected) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs safeAreaInsets={{ bottom: 0 }} screenOptions={screenOptions}>
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Randevular',
          tabBarIcon: ({ focused }) => (
            <CalendarCheckIcon size={24} weight={focused ? 'fill' : 'regular'} color={tabIconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="clinic"
        options={{
          title: 'İşletme',
          tabBarIcon: ({ focused }) => (
            <StorefrontIcon size={24} weight={focused ? 'fill' : 'regular'} color={tabIconColor(focused)} />
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
