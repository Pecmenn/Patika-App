import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';
import type { Sighting } from '@/data/lost-reports';
import { timeAgoLabel } from '@/lib/lost';

function openInMaps(lat: number, lng: number) {
  const url =
    Platform.OS === 'ios' ? `maps:?q=${lat},${lng}&ll=${lat},${lng}` : `geo:${lat},${lng}?q=${lat},${lng}`;
  Linking.openURL(url).catch((error) => console.warn('Harita açılamadı', error));
}

// İletişim serbest metin. Telefon numarasına benziyorsa arama açılabilir.
function phoneFrom(contact: string) {
  const digits = contact.replace(/[^\d+]/g, '');
  return digits.replace(/\D/g, '').length >= 7 ? digits : null;
}

export function SightingRow({ sighting, now }: { sighting: Sighting; now: Date }) {
  const { lat, lng, place, message, contact } = sighting;
  const phone = contact ? phoneFrom(contact) : null;
  const hasLocation = lat !== null && lng !== null;

  return (
    <View style={styles.sighting}>
      <View style={styles.icon}>
        <EyeIcon size={20} weight="bold" color={colors.alertText} />
      </View>
      <Tappable
        accessibilityHint={hasLocation ? 'Haritada açmak için dokun' : undefined}
        accessibilityRole={hasLocation ? 'button' : 'text'}
        dimWhenDisabled={false}
        disabled={!hasLocation}
        onPress={() => {
          if (lat !== null && lng !== null) {
            openInMaps(lat, lng);
          }
        }}
        style={styles.copy}>
        <Text style={styles.title}>{place ?? (hasLocation ? 'Konum paylaşıldı' : 'Mesaj geldi')}</Text>
        <Text style={styles.time}>
          {timeAgoLabel(sighting.createdAt, now)}
          {hasLocation ? ', haritada aç' : ''}
        </Text>
        {message && <Text style={styles.message}>{message}</Text>}
        {contact && !phone && <Text style={styles.contact}>İletişim: {contact}</Text>}
      </Tappable>
      {phone && (
        <Tappable
          accessibilityLabel={`${contact} numarasını ara`}
          accessibilityRole="button"
          onPress={() => Linking.openURL(`tel:${phone}`)}
          hitSlop={3}
          style={styles.call}>
          <PhoneIcon size={18} weight="bold" color={colors.ink} />
        </Tappable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sighting: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.alertSoft,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  time: {
    marginTop: 1,
    fontFamily: fonts.ui,
    fontSize: 13,
    color: colors.ink3,
  },
  message: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
  },
  contact: {
    marginTop: 4,
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink2,
  },
  call: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.paper,
  },
});
