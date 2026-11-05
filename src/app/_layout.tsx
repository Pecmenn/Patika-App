import {
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { Unbounded_600SemiBold, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { NotificationObserver } from '@/components/notification-observer';
import { colors } from '@/constants/theme';
import { configureReminders, refreshReminders } from '@/lib/reminders';

SplashScreen.preventAutoHideAsync();
configureReminders();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Unbounded_600SemiBold,
    Unbounded_700Bold,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Bildirimler önceden kuruluyor, uygulama her açıldığında süreleri uzuyor.
  useEffect(() => {
    refreshReminders();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshReminders();
      }
    });
    return () => subscription.remove();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}>
        <Stack.Screen name="add-pet" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="add-record" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="edit-record" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="add-visit" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="edit-visit" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="add-task" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="edit-task" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="today" options={{ gestureEnabled: false }} />
      </Stack>
      <NotificationObserver />
    </>
  );
}
