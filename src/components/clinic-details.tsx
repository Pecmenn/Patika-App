import { NavigationArrowIcon } from 'phosphor-react-native/src/icons/NavigationArrow';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import type { ReactNode } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { ClinicMap } from '@/components/clinic-map';
import { ClinicThumb } from '@/components/clinic-thumb';
import { Tappable } from '@/components/tappable';
import { SPECIES } from '@/constants/species';
import { cardShadow, colors, fonts } from '@/constants/theme';
import {
  DAY_NAMES,
  formatDistance,
  instagramUrl,
  openStatus,
  SERVICE_OPTIONS,
  todayIndex,
  type Clinic,
} from '@/lib/clinics';
import { formatTime } from '@/lib/dates';

function open(url: string) {
  Linking.openURL(url).catch((error) => {
    console.warn('Bağlantı açılamadı', error);
    Alert.alert('Açılamadı', 'Bu bağlantı telefonda açılamadı.', [{ text: 'Tamam' }]);
  });
}

function directionsUrl({ name, latitude, longitude }: Clinic) {
  const label = encodeURIComponent(name);
  return Platform.OS === 'ios'
    ? `maps:?q=${label}&ll=${latitude},${longitude}`
    : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
}

function ActionButton({ label, icon, onPress }: { label: string; icon: ReactNode; onPress: () => void }) {
  return (
    <Tappable accessibilityRole="button" onPress={onPress} style={styles.action}>
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </Tappable>
  );
}

function Tags({ labels }: { labels: string[] }) {
  return (
    <View style={styles.tags}>
      {labels.map((label) => (
        <View key={label} style={styles.tag}>
          <Text style={styles.tagLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

type ClinicDetailsProps = {
  clinic: Clinic;
  distance?: number | null;
};

// Kliniğin bilgileri. Sahip listeden açınca da, veteriner kendi profiline bakınca da aynısını görür.
export function ClinicDetails({ clinic, distance = null }: ClinicDetailsProps) {
  const status = openStatus(clinic.hours);
  const today = todayIndex();
  const serviceLabels = SERVICE_OPTIONS.filter(({ value }) => clinic.services.includes(value)).map(
    ({ label }) => label,
  );

  return (
    <View>
      <View style={styles.head}>
        <ClinicThumb size={72} uri={clinic.photoUrl} />
        <View style={styles.headCopy}>
          <Text accessibilityRole="header" style={styles.name}>
            {clinic.name}
          </Text>
          <Text style={styles.vet}>{clinic.vetName}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.status, status.isOpen && styles.statusOpen]}>
          <Text style={styles.statusLabel}>{status.label}</Text>
        </View>
        {distance !== null && <Text style={styles.distance}>{formatDistance(distance)}</Text>}
      </View>

      <View style={styles.actions}>
        <ActionButton
          icon={<PhoneIcon size={18} weight="bold" color={colors.ink} />}
          label="Ara"
          onPress={() => open(`tel:${clinic.phone.replace(/[^0-9+]/g, '')}`)}
        />
        <ActionButton
          icon={<NavigationArrowIcon size={18} weight="bold" color={colors.ink} />}
          label="Yol tarifi"
          onPress={() => open(directionsUrl(clinic))}
        />
      </View>

      <View style={styles.block}>
        <ClinicMap latitude={clinic.latitude} longitude={clinic.longitude} />
        <Text style={styles.address}>{clinic.address}</Text>
        <Text style={styles.area}>{clinic.area}</Text>
      </View>

      <Text style={styles.section}>Çalışma saatleri</Text>
      <View style={styles.card}>
        {DAY_NAMES.map((name, index) => {
          const day = clinic.hours[index];
          const isToday = index === today;
          return (
            <View key={name} style={styles.hourRow}>
              <Text style={[styles.hourDay, isToday && styles.hourToday]}>{name}</Text>
              <Text style={[styles.hourTime, isToday && styles.hourToday]}>
                {day ? `${formatTime(day.open)} - ${formatTime(day.close)}` : 'Kapalı'}
              </Text>
            </View>
          );
        })}
      </View>

      {serviceLabels.length > 0 && (
        <>
          <Text style={styles.section}>Hizmetler</Text>
          <Tags labels={serviceLabels} />
        </>
      )}

      <Text style={styles.section}>Baktığı türler</Text>
      <Tags labels={clinic.species.map((key) => SPECIES[key].label)} />

      {clinic.description && (
        <>
          <Text style={styles.section}>Hakkında</Text>
          <Text style={styles.description}>{clinic.description}</Text>
        </>
      )}

      {clinic.website && (
        <Tappable
          accessibilityRole="link"
          hitSlop={10}
          onPress={() => open(clinic.website as string)}
          style={styles.link}>
          <Text style={styles.linkLabel}>Web sitesi</Text>
        </Tappable>
      )}
      {clinic.instagram && (
        <Tappable
          accessibilityRole="link"
          onPress={() => open(instagramUrl(clinic.instagram as string))}
          hitSlop={10}
          style={styles.link}>
          <Text style={styles.linkLabel}>Instagram</Text>
        </Tappable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  vet: {
    marginTop: 3,
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  status: {
    flexShrink: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.line,
  },
  statusOpen: {
    backgroundColor: colors.ball,
  },
  statusLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink,
  },
  distance: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  actionLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  block: {
    marginTop: 16,
  },
  address: {
    marginTop: 10,
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  },
  area: {
    marginTop: 1,
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink2,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  card: {
    gap: 6,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourDay: {
    fontFamily: fonts.uiSemi,
    fontSize: 14.5,
    color: colors.ink2,
  },
  hourTime: {
    fontFamily: fonts.uiSemi,
    fontSize: 14.5,
    color: colors.ink2,
  },
  hourToday: {
    fontFamily: fonts.uiHeavy,
    color: colors.ink,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.skySoft,
  },
  tagLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink,
  },
  description: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink2,
  },
  link: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
  },
  linkLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
