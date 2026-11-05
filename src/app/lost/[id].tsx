import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { LostMap } from '@/components/lost-map';
import { SightingRow } from '@/components/sighting-row';
import { colors, fonts } from '@/constants/theme';
import {
  getLostDetails,
  markFound,
  retryMissingPhoto,
  subscribeToSightings,
  type LostReport,
} from '@/data/lost-reports';
import { useFocusData } from '@/hooks/use-focus-data';
import { formatTime, toTimeKey } from '@/lib/dates';

const MAP_HEIGHT = 196;

async function loadLostScreen(id: string) {
  try {
    let details = await getLostDetails(id);
    if (await retryMissingPhoto(details.report)) {
      details = await getLostDetails(id);
    }
    return { ...details, now: new Date(), hasFailed: false as const };
  } catch (error) {
    console.warn('Kayıp ilanı okunamadı', error);
    return { hasFailed: true as const };
  }
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
      Alert.alert('Kapatılamadı', 'İnternet bağlantını kontrol edip tekrar dene.', [{ text: 'Tamam' }]);
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

  const { report, sightings, now } = data;
  const lastSeenClock = formatTime(toTimeKey(report.lastSeenAt));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 2 }]}
        keyboardShouldPersistTaps="handled"
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

        {!report.photoUrl && (
          <View style={styles.noPhotoNote}>
            <Text style={styles.noPhotoText}>
              Bu ilanda fotoğraf yok. Fotoğraflı ilan çok daha kolay tanınır.
            </Text>
            <Button
              label="Fotoğraf ekle"
              size="small"
              variant="white"
              onPress={() =>
                router.push({ pathname: '/edit-pet', params: { id: report.petId } })
              }
            />
          </View>
        )}

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
              İlanı paylaş. Biri kayıp sayfasından konum ya da mesaj gönderince burada görünür.
            </Text>
          )}
          {sightings.map((sighting, index) => (
            <View key={sighting.id} style={index > 0 && styles.sightingDivider}>
              <SightingRow now={now} sighting={sighting} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.action}>
          <Button
            label="İlanı paylaş"
            variant="white"
            onPress={() => router.push({ pathname: '/poster/[id]', params: { id: report.id } })}
          />
        </View>
        <View style={styles.action}>
          <Button
            disabled={isClosing}
            label={isClosing ? 'Kapatılıyor...' : 'Bulundu'}
            onPress={() => confirmFound(report)}
          />
        </View>
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
  noPhotoNote: {
    gap: 8,
    marginBottom: 12,
  },
  noPhotoText: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    lineHeight: 21,
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  action: {
    flex: 1,
  },
});
