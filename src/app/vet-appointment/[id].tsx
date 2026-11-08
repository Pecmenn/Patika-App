import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppointmentStatusPill } from '@/components/appointment-status';
import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { LoadingState } from '@/components/loading-state';
import { Tappable } from '@/components/tappable';
import { SPECIES } from '@/constants/species';
import { cardShadow, colors, fonts } from '@/constants/theme';
import {
  fetchClinicAppointment,
  respondToAppointment,
  subscribeToAppointments,
} from '@/data/appointments';
import type { Species } from '@/data/pets';
import { useFocusResource } from '@/hooks/use-focus-data';
import { ApiError } from '@/lib/api';
import { formatAppointmentWhen } from '@/lib/clinics';

function responseError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'slot_taken') {
      return 'Bu saate başka bir randevu onayladın.';
    }
    if (error.code === 'not_pending' || error.code === 'not_cancellable') {
      return 'Bu randevu artık değiştirilemiyor.';
    }
  }
  return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function VetAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback(async () => {
    try {
      return { appointment: await fetchClinicAppointment(id) };
    } catch (error) {
      console.warn('Randevu okunamadı', error);
      return { appointment: null };
    }
  }, [id]);
  const { data, refresh } = useFocusResource(load, subscribeToAppointments);
  const appointment = data?.appointment ?? null;
  const [note, setNote] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function respond(action: 'confirm' | 'reject' | 'cancel') {
    setIsBusy(true);
    try {
      await respondToAppointment(id, action, note.trim() || null);
    } catch (error) {
      console.warn('Randevu cevaplanamadı', error);
      setIsBusy(false);
      Alert.alert('Yapılamadı', responseError(error), [{ text: 'Tamam' }]);
      return;
    }
    router.back();
  }

  function confirmReject() {
    Alert.alert('İstek reddedilsin mi?', 'Sahip reddedildiğini ve yazdığın notu görür.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Reddet', style: 'destructive', onPress: () => respond('reject') },
    ]);
  }

  function confirmCancel() {
    Alert.alert('Randevu iptal edilsin mi?', 'Sahip iptal edildiğini görür, ziyaretlerinden de kalkar.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal et', style: 'destructive', onPress: () => respond('cancel') },
    ]);
  }

  const canRespond = appointment?.status === 'pending' || appointment?.status === 'confirmed';
  const speciesLabel = appointment ? SPECIES[appointment.species as Species]?.label : null;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <GlassButton label="Geri" onPress={() => router.back()}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        {!data ? (
          <LoadingState />
        ) : !appointment ? (
          <EmptyCard
            action={{ label: 'Tekrar dene', onPress: refresh }}
            body="İnternet bağlantını kontrol edip tekrar dene."
            title="Randevu açılamadı"
          />
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {formatAppointmentWhen(appointment.date, appointment.time)}
            </Text>
            <View style={styles.status}>
              <AppointmentStatusPill status={appointment.status} />
            </View>

            <View style={styles.card}>
              <Row label="Hayvan" value={appointment.petName} />
              {speciesLabel && <Row label="Tür" value={speciesLabel} />}
              {appointment.breed && <Row label="Irk" value={appointment.breed} />}
              {appointment.petAge && <Row label="Yaş" value={appointment.petAge} />}
              <Row label="Neden" value={appointment.reason} />
              {appointment.note && <Row label="Sahibin notu" value={appointment.note} />}
              {appointment.vetNote && <Row label="Senin notun" value={appointment.vetNote} />}
            </View>

            <View style={styles.card}>
              <Row label="Sahip" value={appointment.ownerName} />
              <Tappable
                accessibilityLabel={`${appointment.ownerName} ara`}
                accessibilityRole="button"
                onPress={() =>
                  Linking.openURL(`tel:${appointment.ownerPhone.replace(/[^0-9+]/g, '')}`).catch(() =>
                    Alert.alert('Arama başlatılamadı', appointment.ownerPhone, [{ text: 'Tamam' }]),
                  )
                }
                style={styles.call}>
                <PhoneIcon size={18} weight="bold" color={colors.ink} />
                <Text style={styles.callLabel}>{appointment.ownerPhone}</Text>
              </Tappable>
            </View>

            {canRespond && (
              <View style={styles.note}>
                <TextField
                  autoCapitalize="sentences"
                  label="Sahibe not (isteğe bağlı)"
                  maxLength={300}
                  placeholder="Örneğin aç karnına gelin"
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {canRespond && (
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {appointment?.status === 'pending' ? (
            <>
              <Button disabled={isBusy} label="Onayla" onPress={() => respond('confirm')} />
              <Button disabled={isBusy} label="Reddet" size="small" variant="text" onPress={confirmReject} />
            </>
          ) : (
            <Button
              disabled={isBusy}
              label="Randevuyu iptal et"
              size="small"
              variant="text"
              onPress={confirmCancel}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    marginTop: 22,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  status: {
    marginTop: 8,
  },
  card: {
    gap: 12,
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  row: {
    gap: 1,
  },
  rowLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.ink3,
  },
  rowValue: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
  },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.skySoft,
  },
  callLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  note: {
    marginTop: 14,
  },
  actions: {
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
