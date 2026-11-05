import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { LostMap } from '@/components/lost-map';
import { colors, fonts } from '@/constants/theme';
import {
  getLostDetails,
  markFound,
  subscribeToSightings,
  type LostReport,
  type Sighting,
} from '@/data/lost-reports';
import { useFocusData } from '@/hooks/use-focus-data';
import { formatTime, toTimeKey } from '@/lib/dates';
import { timeAgoLabel } from '@/lib/lost';

const MAP_HEIGHT = 196;

async function loadLostScreen(id: string) {
  try {
    return { ...(await getLostDetails(id)), now: new Date(), hasFailed: false as const };
  } catch (error) {
    console.warn('Kayıp ilanı okunamadı', error);
    return { hasFailed: true as const };
  }
}

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

function SightingRow({ sighting, now }: { sighting: Sighting; now: Date }) {
  const { lat, lng, place, message, contact } = sighting;
  const phone = contact ? phoneFrom(contact) : null;
  const hasLocation = lat !== null && lng !== null;

  return (
    <View style={styles.sighting}>
      <View style={styles.sightingIcon}>
        <EyeIcon size={20} weight="bold" color={colors.alertText} />
      </View>
      <Pressable
        accessibilityHint={hasLocation ? 'Haritada açmak için dokun' : undefined}
        accessibilityRole={hasLocation ? 'button' : 'text'}
        disabled={!hasLocation}
        onPress={() => {
          if (lat !== null && lng !== null) {
            openInMaps(lat, lng);
          }
        }}
        style={styles.sightingCopy}>
        <Text style={styles.sightingTitle}>
          {place ?? (hasLocation ? 'Konum paylaşıldı' : 'Mesaj geldi')}
        </Text>
        <Text style={styles.sightingTime}>
          {timeAgoLabel(sighting.createdAt, now)}
          {hasLocation ? ', haritada aç' : ''}
        </Text>
        {message && <Text style={styles.sightingMessage}>{message}</Text>}
        {contact && !phone && <Text style={styles.sightingContact}>İletişim: {contact}</Text>}
      </Pressable>
      {phone && (
        <Pressable
          accessibilityLabel={`${contact} numarasını ara`}
          accessibilityRole="button"
          onPress={() => Linking.openURL(`tel:${phone}`)}
          style={styles.call}>
          <PhoneIcon size={18} weight="bold" color={colors.ink} />
        </Pressable>
      )}
    </View>
  );
}

export default function LostScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback(() => loadLostScreen(id), [id]);
  const data = useFocusData(load, subscribeToSightings);
  const [isClosing, setIsClosing] = useState(false);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/today');
    }
  }

  async function closeReport(report: LostReport) {
    setIsClosing(true);
    try {
      await markFound(report);
      router.replace({ pathname: '/found/[id]', params: { id: report.id } });
    } catch (error) {
      console.warn('Kayıp modu kapatılamadı', error);
      setIsClosing(false);
      Alert.alert('Kapatılamadı', 'İnternet bağlantını kontrol edip tekrar dene.');
    }
  }

  function confirmFound(report: LostReport) {
    Alert.alert(`${report.petName} bulundu mu?`, 'Kayıp modu kapanır, sayfa artık ihbar almaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Evet, bulundu', onPress: () => closeReport(report) },
    ]);
  }

  if (!data) {
    return <View style={styles.screen} />;
  }
  if (data.hasFailed) {
    return (
      <View style={[styles.screen, styles.failed, { paddingTop: insets.top + 2 }]}>
        <GlassButton label="Geri" onPress={goBack}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>
        <Text style={styles.failedTitle}>İlan açılamadı</Text>
        <Text style={styles.lead}>
          İnternet bağlantını kontrol et. Bağlantı gelince uygulamaya geri dönmen yeterli, ihbarlar
          kaybolmaz.
        </Text>
      </View>
    );
  }

  const { report, sightings, now, publicCode } = data;
  const lastSeenClock = formatTime(toTimeKey(report.lastSeenAt));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 2 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <GlassButton label="Geri" onPress={goBack}>
            <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
          </GlassButton>
          <View style={styles.live}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>Kayıp modu açık</Text>
          </View>
          <Text style={styles.since}>Başlangıç {formatTime(toTimeKey(report.startedAt))}</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.polaroid}>
            {report.photoUrl ? (
              <Image accessibilityIgnoresInvertColors source={{ uri: report.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.noPhoto]}>
                <PawPrintIcon size={36} weight="fill" color={colors.ink} />
              </View>
            )}
          </View>
          <Text accessibilityRole="header" style={styles.heading}>
            {report.petName} kayıp
          </Text>
        </View>

        <Text style={styles.lead}>
          Son görüldüğü yer {report.lastSeenArea}, saat {lastSeenClock}.
          {report.description ? ` ${report.description}` : ''}
        </Text>

        <View style={styles.mapCard}>
          <LostMap report={report} sightings={sightings} />
        </View>

        <View style={styles.sightings}>
          <View style={styles.sightingsHead}>
            <Text style={styles.sightingsTitle}>
              {sightings.length > 0 ? `${sightings.length} ihbar` : 'Henüz ihbar yok'}
            </Text>
            {sightings.length > 0 && <Text style={styles.sightingsOrder}>En yeni üstte</Text>}
          </View>
          {sightings.length === 0 && (
            <Text style={styles.noSighting}>
              Biri kayıp sayfasından konum ya da mesaj gönderince burada görünür.
            </Text>
          )}
          {sightings.map((sighting, index) => (
            <View key={sighting.id} style={index > 0 && styles.sightingDivider}>
              <SightingRow now={now} sighting={sighting} />
            </View>
          ))}
        </View>

        {/* Yalnızca geliştirirken: testten ihbar göndermek için. Paylaşma gelince kalkacak. */}
        {__DEV__ && <Text style={styles.devCode}>Kod: {publicCode}</Text>}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          disabled={isClosing}
          label={isClosing ? 'Kapatılıyor...' : 'Bulundu'}
          onPress={() => confirmFound(report)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.alert,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  failed: {
    paddingHorizontal: 20,
  },
  failedTitle: {
    marginTop: 24,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingRight: 14,
    paddingLeft: 12,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.alert,
  },
  liveLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.card,
  },
  since: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  polaroid: {
    padding: 6,
    paddingBottom: 18,
    borderRadius: 14,
    backgroundColor: colors.card,
    transform: [{ rotate: '-5deg' }],
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: 9,
  },
  noPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alertSoft,
  },
  heading: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.2,
    color: colors.ink,
  },
  lead: {
    marginTop: 16,
    marginBottom: 16,
    fontFamily: fonts.uiSemi,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  },
  mapCard: {
    height: MAP_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  sightings: {
    marginTop: 10,
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.card,
  },
  sightingsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sightingsTitle: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16,
    color: colors.ink,
  },
  sightingsOrder: {
    fontFamily: fonts.ui,
    fontSize: 13.5,
    color: colors.ink3,
  },
  noSighting: {
    paddingBottom: 8,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
  },
  sightingDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  sighting: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  sightingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.alertSoft,
  },
  sightingCopy: {
    flex: 1,
    minWidth: 0,
  },
  sightingTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  sightingTime: {
    marginTop: 1,
    fontFamily: fonts.ui,
    fontSize: 13,
    color: colors.ink3,
  },
  sightingMessage: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
  },
  sightingContact: {
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
  devCode: {
    marginTop: 10,
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.ink,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
