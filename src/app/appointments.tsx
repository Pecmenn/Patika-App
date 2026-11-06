import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppointmentStatusPill } from '@/components/appointment-status';
import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { GlassButton } from '@/components/glass-button';
import { cardShadow, colors, fonts } from '@/constants/theme';
import {
  cancelMyAppointment,
  listMyAppointments,
  subscribeToAppointments,
  type Appointment,
} from '@/data/appointments';
import { useFocusData } from '@/hooks/use-focus-data';
import { formatAppointmentWhen } from '@/lib/clinics';

function resultNote({ status, cancelledBy, vetNote }: Appointment) {
  if (status === 'cancelled') {
    return cancelledBy === 'vet' ? 'Klinik iptal etti.' : 'Sen iptal ettin.';
  }
  if (status === 'expired') {
    return 'Klinik saatinden önce cevap vermedi.';
  }
  return vetNote ? null : status === 'pending' ? 'Klinik onaylayınca ziyaretlerine düşer.' : null;
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const extra = resultNote(appointment);
  const phone = appointment.clinicPhone;

  async function cancel() {
    setIsCancelling(true);
    try {
      await cancelMyAppointment(appointment.id);
    } catch (error) {
      console.warn('Randevu iptal edilemedi', error);
      setIsCancelling(false);
      Alert.alert('İptal edilemedi', 'İnternet bağlantını kontrol edip tekrar dene.', [{ text: 'Tamam' }]);
    }
  }

  function confirmCancel() {
    Alert.alert('Randevu iptal edilsin mi?', 'Klinik iptal ettiğini görür.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal et', style: 'destructive', onPress: cancel },
    ]);
  }

  return (
    <View style={styles.card}>
      <AppointmentStatusPill status={appointment.status} />
      <Text style={styles.when}>{formatAppointmentWhen(appointment.date, appointment.time)}</Text>
      <Text style={styles.clinic}>{appointment.clinicName}</Text>
      <Text style={styles.pet}>
        {appointment.petName}, {appointment.reason}
      </Text>
      {appointment.vetNote && <Text style={styles.note}>Klinik notu: {appointment.vetNote}</Text>}
      {extra && <Text style={styles.hint}>{extra}</Text>}
      {canCancel && (
        <View style={styles.actions}>
          {phone && (
            <Pressable
              accessibilityLabel={`${appointment.clinicName} ara`}
              accessibilityRole="button"
              onPress={() =>
                Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() =>
                  Alert.alert('Arama başlatılamadı', phone, [{ text: 'Tamam' }]),
                )
              }
              style={styles.call}>
              <PhoneIcon size={16} weight="bold" color={colors.ink} />
              <Text style={styles.callLabel}>Ara</Text>
            </Pressable>
          )}
          <Button disabled={isCancelling} label="İptal et" size="small" variant="text" onPress={confirmCancel} />
        </View>
      )}
    </View>
  );
}

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const appointments = useFocusData(listMyAppointments, subscribeToAppointments);
  const open = (appointments ?? [])
    .filter(({ status }) => status === 'pending' || status === 'confirmed')
    .reverse();
  const closed = (appointments ?? []).filter(({ status }) => status !== 'pending' && status !== 'confirmed');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) }]}
        showsVerticalScrollIndicator={false}>
        <GlassButton label="Geri" onPress={() => router.back()}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>
        <Text accessibilityRole="header" style={styles.title}>
          Randevularım
        </Text>

        {appointments?.length === 0 && (
          <EmptyCard
            body="Veterinerler ekranından bir klinik seçip randevu isteyebilirsin."
            title="Henüz randevun yok"
          />
        )}

        <View style={styles.list}>
          {open.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </View>
        {closed.length > 0 && <Text style={styles.section}>Geçmiş</Text>}
        <View style={styles.list}>
          {closed.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  title: {
    marginTop: 22,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  section: {
    marginTop: 22,
    marginHorizontal: 4,
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  list: {
    gap: 10,
    marginTop: 14,
  },
  card: {
    gap: 3,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  when: {
    marginTop: 6,
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  clinic: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  pet: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.ink2,
  },
  note: {
    marginTop: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  hint: {
    marginTop: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.skySoft,
  },
  callLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14.5,
    color: colors.ink,
  },
});
