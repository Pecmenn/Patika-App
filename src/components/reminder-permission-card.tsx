import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { useFocusData } from '@/hooks/use-focus-data';
import {
  getReminderPermission,
  requestReminderPermission,
  syncVaccineReminders,
  type ReminderPermission,
} from '@/lib/vaccine-reminders';

// İzin verilmemişse hatırlatmaların gelmeyeceğini söyler ve açmanın yolunu gösterir.
export function ReminderPermissionCard() {
  const stored = useFocusData(getReminderPermission);
  const [requested, setRequested] = useState<ReminderPermission | null>(null);
  const permission = requested ?? stored;

  if (permission === null || permission === 'granted') {
    return null;
  }

  async function enable() {
    if (permission === 'denied') {
      await Linking.openSettings();
      return;
    }
    try {
      setRequested(await requestReminderPermission());
      await syncVaccineReminders();
    } catch (error) {
      console.warn('Hatırlatmalar kurulamadı', error);
      Alert.alert('Hatırlatmalar açılamadı', 'Lütfen tekrar dene.');
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hatırlatmalar kapalı</Text>
      <Text style={styles.body}>
        {permission === 'denied'
          ? 'Aşı hatırlatmalarını alabilmek için telefon ayarlarından bildirimleri aç.'
          : 'Aşının zamanı yaklaşınca sana bildirim gönderebilmemiz için izin ver.'}
      </Text>
      <View style={styles.actions}>
        <Button
          label={permission === 'denied' ? 'Ayarları aç' : 'Hatırlatmaları aç'}
          size="small"
          onPress={enable}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  title: {
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  body: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
