import { router } from 'expo-router';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ClinicThumb } from '@/components/clinic-thumb';
import { EmptyCard } from '@/components/empty-card';
import { GlassButton } from '@/components/glass-button';
import { SkeletonList } from '@/components/loading-state';
import { TabHeader } from '@/components/tab-header';
import { Tappable } from '@/components/tappable';
import { SPECIES, SPECIES_KEYS } from '@/constants/species';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { fetchClinics } from '@/data/clinics';
import { useFocusResource } from '@/hooks/use-focus-data';
import { useNearbyPoint } from '@/hooks/use-nearby-point';
import {
  formatDistance,
  openStatus,
  SERVICE_OPTIONS,
  sortClinics,
  type Clinic,
  type ClinicWithDistance,
} from '@/lib/clinics';

// Kartta en çok bu kadar etiket görünür, kalanı "+2" gibi sayıyla yazılır.
const VISIBLE_TAGS = 2;

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
  // Hizmet seçmek isteğe bağlı, tür seçmek zorunlu: hizmet yoksa baktığı türler yazılır, düğme tek kalmaz.
  const services = SERVICE_OPTIONS.filter((option) => clinic.services.includes(option.value));
  const tags =
    services.length > 0
      ? services.map((service) => service.label)
      : SPECIES_KEYS.filter((key) => clinic.species.includes(key)).map((key) => SPECIES[key].label);
  const hiddenCount = tags.length - VISIBLE_TAGS;
  const openDetails = () => router.push({ pathname: '/clinic/[id]', params: { id: clinic.id } });

  return (
    <Tappable
      accessibilityHint="Kliniğin bilgilerini açmak için dokun"
      accessibilityRole="button"
      onPress={openDetails}
      style={styles.card}>
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
      <View style={styles.cardFoot}>
        <View style={styles.services}>
          {tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <View key={tag} style={styles.service}>
              <Text numberOfLines={1} style={styles.serviceLabel}>
                {tag}
              </Text>
            </View>
          ))}
          {hiddenCount > 0 && (
            <View accessibilityLabel={`${hiddenCount} tane daha`} style={styles.service}>
              <Text style={styles.serviceLabel}>+{hiddenCount}</Text>
            </View>
          )}
        </View>
        <Button
          label="Randevu al"
          size="small"
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: clinic.id } })}
        />
      </View>
    </Tappable>
  );
}

export default function VetsScreen() {
  const insets = useSafeAreaInsets();
  const { data, refresh, isRefreshing } = useFocusResource(loadClinics);
  const { point, isGranted, askPermission } = useNearbyPoint();
  const clinics = sortClinics(data?.clinics ?? [], point);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor={colors.ink} />}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <TabHeader title="Veterinerler">
        <GlassButton label="Randevularım" onPress={() => router.push('/appointments')}>
          <CalendarCheckIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>
      </TabHeader>

      {isGranted === false && clinics.length > 0 && (
        <View style={styles.location}>
          <MapPinIcon size={20} weight="fill" color={colors.ink} />
          <View style={styles.locationCopy}>
            <Text style={styles.locationText}>
              En yakın klinikleri görmek için konumunu kullan. Konumun telefondan çıkmaz.
            </Text>
            <Tappable accessibilityRole="button" onPress={askPermission} hitSlop={10} style={styles.locationAction}>
              <Text style={styles.locationActionLabel}>Konumumu kullan</Text>
            </Tappable>
          </View>
        </View>
      )}

      {data?.hasFailed && (
        <EmptyCard
          action={{ label: 'Tekrar dene', onPress: refresh }}
          body="İnternet bağlantını kontrol edip tekrar dene."
          title="Sunucuya ulaşılamadı"
        />
      )}
      {data && !data.hasFailed && clinics.length === 0 && (
        <EmptyCard
          body="Klinikler Patika'ya katıldıkça burada görünecek."
          title="Henüz klinik yok"
        />
      )}

      {!data && <SkeletonList count={3} height={150} />}
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
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  services: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minWidth: 0,
  },
  service: {
    flexShrink: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.skySoft,
  },
  serviceLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.ink,
  },
});
