import { router } from 'expo-router';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

// Bekleyen randevu isteği ya da kliniğin olumsuz cevabı Bugün'de görünür. Onaylananlar ziyaret kartına düşer.
export function AppointmentNoticeCard({ title, body }: { title: string; body: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/appointments')}
      style={styles.card}>
      <View style={styles.icon}>
        <CalendarCheckIcon size={20} weight="bold" color={colors.card} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.skySoft,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16,
    color: colors.ink,
  },
  body: {
    marginTop: 1,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink2,
  },
});
