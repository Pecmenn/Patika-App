import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { LostPoster, posterSize } from '@/components/lost-poster';
import { colors, fonts } from '@/constants/theme';
import { getLostDetails } from '@/data/lost-reports';
import { useFocusData } from '@/hooks/use-focus-data';
import { API_URL } from '@/lib/api';
import { lostPageLink } from '@/lib/lost';
import {
  POST_DESCRIPTION_CHARS,
  POSTER_FORMAT_KEYS,
  POSTER_FORMATS,
  posterDescription,
  type PosterFormat,
} from '@/lib/poster';
import { sharePoster, type PosterView } from '@/lib/share-poster';

// Üst çubuk, biçim seçimi ve düğmelerin kapladığı yaklaşık yükseklik.
const RESERVED_HEIGHT = 310;
const SIDE_PADDING = 20;
const COPIED_MS = 2000;

async function loadPoster(id: string) {
  try {
    return { ...(await getLostDetails(id)), hasFailed: false as const };
  } catch (error) {
    console.warn('İlan okunamadı', error);
    return { hasFailed: true as const };
  }
}

export default function PosterScreen() {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback(() => loadPoster(id), [id]);
  const data = useFocusData(load);

  const posterRef = useRef<PosterView>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [format, setFormat] = useState<PosterFormat>('post');
  const [isPhotoReady, setIsPhotoReady] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/today');
    }
  }

  const navbar = (title: string) => (
    <View style={styles.navbar}>
      <GlassButton label="Geri" onPress={goBack}>
        <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
      </GlassButton>
      <Text accessibilityRole="header" style={styles.navTitle}>
        {title}
      </Text>
      <View style={styles.navSpacer} />
    </View>
  );

  if (!data) {
    return <View style={styles.screen} />;
  }
  if (data.hasFailed || !data.publicCode) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 2 }]}>
        {navbar('İlan')}
        <Text style={styles.failed}>İlan açılamadı. İnternet bağlantını kontrol edip tekrar dene.</Text>
      </View>
    );
  }

  const { report, publicCode } = data;
  const link = lostPageLink(publicCode, API_URL);
  const size = posterSize(format);
  const availableHeight = window.height - insets.top - insets.bottom - RESERVED_HEIGHT;
  const availableWidth = window.width - SIDE_PADDING * 2;
  const scale = Math.min(availableWidth / size.width, availableHeight / size.height);
  const needsPhoto = Boolean(report.photoUrl);
  const isCutOff =
    format === 'post' &&
    posterDescription(report.breed, report.description).length > POST_DESCRIPTION_CHARS;

  async function share() {
    setIsSharing(true);
    try {
      await sharePoster(posterRef, format);
    } catch (error) {
      console.warn('İlan paylaşılamadı', error);
      Alert.alert('Paylaşılamadı', 'İlan hazırlanırken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
    } finally {
      setIsSharing(false);
    }
  }

  async function copyLink() {
    await Clipboard.setStringAsync(link);
    setIsCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setIsCopied(false), COPIED_MS);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      {navbar('İlan')}

      <View style={styles.previewArea}>
        <View
          style={[
            styles.preview,
            { width: size.width * scale, height: size.height * scale },
          ]}>
          {/* Kapsayıcı küçültülür, ilanın kendisi gerçek boyutunda kalır. */}
          <View
            style={{
              width: size.width,
              height: size.height,
              transformOrigin: 'top left',
              transform: [{ scale }],
            }}>
            <LostPoster
              format={format}
              link={link}
              posterRef={posterRef}
              report={report}
              onPhotoSettled={() => setIsPhotoReady(true)}
            />
          </View>
        </View>
      </View>

      <View accessibilityRole="radiogroup" style={styles.formats}>
        {POSTER_FORMAT_KEYS.map((key) => {
          const isSelected = key === format;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => setFormat(key)}
              style={[styles.format, isSelected && styles.formatSelected]}>
              <Text style={[styles.formatLabel, isSelected && styles.formatLabelSelected]}>
                {POSTER_FORMATS[key].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {isCutOff && (
          <Text style={styles.note}>Açıklama bu biçime sığmadı. A4 baskıda tamamı görünür.</Text>
        )}
        {format !== 'a4' && (
          <Text style={styles.note}>
            Telefonda görenler QR kodunu okutamaz. Bağlantıyı da görselle birlikte gönder.
          </Text>
        )}
        <Button
          disabled={isSharing || (needsPhoto && !isPhotoReady)}
          label={isSharing ? 'Hazırlanıyor...' : 'Paylaş'}
          onPress={share}
        />
        <Button
          label={isCopied ? 'Bağlantı kopyalandı' : 'Bağlantıyı kopyala'}
          size="small"
          variant="text"
          onPress={copyLink}
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
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_PADDING,
  },
  navTitle: {
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  navSpacer: {
    width: 44,
  },
  failed: {
    marginTop: 24,
    paddingHorizontal: SIDE_PADDING,
    fontFamily: fonts.uiSemi,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  preview: {
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  formats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  format: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  formatSelected: {
    backgroundColor: colors.ink,
  },
  formatLabel: {
    fontFamily: fonts.uiHeavy,
    fontSize: 14,
    color: colors.ink,
  },
  formatLabelSelected: {
    color: colors.card,
  },
  actions: {
    gap: 2,
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 10,
  },
  note: {
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: fonts.uiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
});
