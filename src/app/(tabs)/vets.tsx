import { router } from 'expo-router';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ClinicThumb } from '@/components/clinic-thumb';
import { EmptyCard } from '@/components/empty-card';
import { GlassButton } from '@/components/glass-button';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { fetchClinics } from '@/data/clinics';
import { useFocusData } from '@/hooks/use-focus-data';
import { useNearbyPoint } from '@/hooks/use-nearby-point';
import { formatDistance, openStatus, sortClinics, type Clinic, type ClinicWithDistance } from '@/lib/clinics';

async function loadClinics() {
  try {
    return { clinics: await fetchClinics(), hasFailed: false };
  } catch (error) {
    console.warn('Klinikler okunamadı', error);
    return { clinics: [] as Clinic[], hasFailed: true };
  }
}

function ClinicCard({ clinic }: { clinic: ClinicWithDistance<Clinic> }) {
  const status = openStatus(clinic.hours);
  const openDetails = () => router.push({ pathname: '/clinic/[id]', params: { id: clinic.id } });

  return (
    <Pressable
      accessibilityHint="Kliniğin bilgilerini açmak için dokun"
      accessibilityRole="button"
      onPress={openDetails}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <ClinicThumb size={60} uri={clinic.photoUrl} />
        <View style={styles.cardCopy}>
          <Text numberOfLines={2} style={styles.name}>
            {clinic.name}
          </Text>
          <Text numberOfLines={1} style={styles.area}>
            {clinic.distance !== null ? `${formatDistance(clinic.distance)}, ` : ''}
            {clinic.area}
          </Text>
          <Text numberOfLines={1} style={[styles.status, status.isOpen && styles.statusOpen]}>
            {status.label}
          </Text>
        </View>
      </View>
      <View style={styles.cardAction}>
        <Button
          label="Randevu al"
          size="small"
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: clinic.id } })}
        />
      </View>
    </Pressable>
  );
}

export default function VetsScreen() {
  const insets = useSafeAreaInsets();
  const data = useFocusData(loadClinics);
  const { point, isGranted, askPermission } = useNearbyPoint();
  const clinics = sortClinics(data?.clinics ?? [], point);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.title}>
          Veterinerler
        </Text>
        <GlassButton label="Randevularım" onPress={() => router.push('/appointments')}>
          <CalendarCheckIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>
      </View>

      {isGranted === false && clinics.length > 0 && (
        <View style={styles.location}>
          <MapPinIcon size={20} weight="fill" color={colors.ink} />
          <View style={styles.locationCopy}>
            <Text style={styles.locationText}>
              En yakın klinikleri görmek için konumunu kullan. Konumun telefondan çıkmaz.
            </Text>
            <Pressable accessibilityRole="button" onPress={askPermission} style={styles.locationAction}>
              <Text style={styles.locationActionLabel}>Konumumu kullan</Text>
            </Pressable>
          </View>
        </View>
      )}

      {data?.hasFailed && (
        <EmptyCard body="İnternet bağlantını kontrol edip tekrar dene." title="Sunucuya ulaşılamadı" />
      )}
      {data && !data.hasFailed && clinics.length === 0 && (
        <EmptyCard
          body="Klinikler Patika'ya katıldıkça burada görünecek."
          title="Henüz klinik yok"
        />
      )}

      <View style={styles.list}>
        {clinics.map((clinic) => (
          <ClinicCard key={clinic.id} clinic={clinic} />
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  location: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.skySoft,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    fontFamily: fonts.uiSemi,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink2,
  },
  locationAction: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
  },
  locationActionLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14.5,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  list: {
    gap: 10,
    marginTop: 14,
  },
  card: {
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  pressed: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  area: {
    marginTop: 2,
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.ink2,
  },
  status: {
    marginTop: 2,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    color: colors.ink3,
  },
  statusOpen: {
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
  cardAction: {
    alignSelf: 'flex-end',
  },
});
