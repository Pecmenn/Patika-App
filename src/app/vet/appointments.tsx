import { router } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppointmentStatusPill } from '@/components/appointment-status';
import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { SkeletonList } from '@/components/loading-state';
import { SegmentedControl } from '@/components/segmented-control';
import { TabHeader } from '@/components/tab-header';
import { Tappable } from '@/components/tappable';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { listClinicAppointments, subscribeToAppointments, type Appointment } from '@/data/appointments';
import { fetchOwnClinic } from '@/data/own-clinic';
import { useFocusResource } from '@/hooks/use-focus-data';
import { formatAppointmentWhen } from '@/lib/clinics';

type Section = 'pending' | 'upcoming' | 'past';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'pending', label: 'Bekleyen' },
  { value: 'upcoming', label: 'Yaklaşan' },
  { value: 'past', label: 'Geçmiş' },
];

const EMPTY_TEXT: Record<Section, { title: string; body: string }> = {
  pending: { title: 'Bekleyen istek yok', body: 'Yeni randevu istekleri burada görünecek.' },
  upcoming: { title: 'Yaklaşan randevu yok', body: 'Onayladığın randevular burada görünecek.' },
  past: { title: 'Geçmiş randevu yok', body: 'Tamamlanan ve iptal edilen randevular burada görünecek.' },
};

async function loadPanel() {
  try {
    const [clinic, active, past] = await Promise.all([
      fetchOwnClinic(),
      listClinicAppointments('active'),
      listClinicAppointments('past'),
    ]);
    return { clinic, active, past, hasFailed: false };
  } catch (error) {
    console.warn('Randevular okunamadı', error);
    return { clinic: null, active: [], past: [], hasFailed: true };
  }
}

function Notice({ title, body, action }: { title: string; body: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      {action && (
        <View style={styles.noticeAction}>
          <Button label={action.label} size="small" onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <Tappable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/vet-appointment/[id]', params: { id: appointment.id } })
      }
      style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.when}>{formatAppointmentWhen(appointment.date, appointment.time)}</Text>
        <Text style={styles.pet}>
          {appointment.petName}, {appointment.reason}
        </Text>
        <Text style={styles.owner}>{appointment.ownerName}</Text>
        <AppointmentStatusPill status={appointment.status} />
      </View>
      <CaretRightIcon size={16} weight="bold" color={colors.ink3} />
    </Tappable>
  );
}

export default function VetAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { data: panel, refresh, isRefreshing } = useFocusResource(loadPanel, subscribeToAppointments);
  const [section, setSection] = useState<Section>('pending');
  const clinic = panel?.clinic;

  const lists: Record<Section, Appointment[]> = {
    pending: panel?.active.filter((item) => item.status === 'pending') ?? [],
    upcoming: panel?.active.filter((item) => item.status === 'confirmed') ?? [],
    past: panel?.past ?? [],
  };
  const items = lists[section];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor={colors.ink} />}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <TabHeader title="Randevular" />

      {panel?.hasFailed && (
        <Notice
          action={{ label: 'Tekrar dene', onPress: refresh }}
          body="İnternet bağlantını kontrol edip tekrar dene."
          title="Sunucuya ulaşılamadı"
        />
      )}
      {panel && !panel.hasFailed && !clinic && (
        <Notice
          action={{ label: 'Bilgileri doldur', onPress: () => router.push('/vet-clinic-form') }}
          body="Sahiplerin seni görmesi için kliniğinin bilgilerini doldur. Kontrol edildikten sonra listede görünürsün."
          title="İşletme bilgilerin eksik"
        />
      )}
      {clinic?.approval === 'pending' && (
        <Notice
          body="Bilgilerin kontrol ediliyor. Onaylanınca sahiplerin listesinde görüneceksin."
          title="Onay bekliyor"
        />
      )}
      {clinic?.approval === 'rejected' && (
        <Notice
          action={{ label: 'Bilgileri düzelt', onPress: () => router.push('/vet-clinic-form') }}
          body="Bilgilerin doğrulanamadı. Oda sicil numaranı ve diğer bilgileri kontrol edip yeniden gönder."
          title="Onaylanmadı"
        />
      )}

      <View style={styles.segments}>
        <SegmentedControl options={SECTIONS} value={section} onChange={setSection} />
      </View>

      {!panel && <SkeletonList count={3} height={110} />}
      {panel && !panel.hasFailed && items.length === 0 && <EmptyCard {...EMPTY_TEXT[section]} />}
      <View style={styles.list}>
        {items.map((appointment) => (
          <AppointmentRow key={appointment.id} appointment={appointment} />
        ))}
      </View>
    </ScrollView>
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
  notice: {
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.skySoft,
  },
  noticeTitle: {
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  noticeBody: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  noticeAction: {
    marginTop: 12,
  },
  segments: {
    marginTop: 16,
  },
  list: {
    gap: 10,
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  when: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  pet: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  owner: {
    marginBottom: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.ink2,
  },
});
