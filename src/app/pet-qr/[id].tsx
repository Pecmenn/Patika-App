import * as Clipboard from 'expo-clipboard';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { LoadingState } from '@/components/loading-state';
import { QrCode } from '@/components/qr-code';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { ensurePublicCode } from '@/data/lost-reports';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';
import { API_URL } from '@/lib/api';
import { successHaptic } from '@/lib/haptics';
import { lostPageLink, shortLink } from '@/lib/lost';
import { qrSheetHtml } from '@/lib/poster';
import { printQrSheet } from '@/lib/share-poster';

const COPIED_MS = 2000;

async function loadPetQr(petId: string) {
  const pet = (await listPets()).find((candidate) => candidate.id === petId);
  if (!pet) {
    return { pet: null, code: null };
  }
  try {
    return { pet, code: await ensurePublicCode(petId) };
  } catch (error) {
    console.warn('QR kodu alınamadı', error);
    return { pet, code: null };
  }
}

export default function PetQrScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const load = useCallback(() => loadPetQr(id), [id]);
  const data = useFocusData(load);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  if (!data) {
    return (
      <View style={[styles.screen, styles.scroll, { paddingTop: insets.top + 2 }]}>
        <GlassButton label="Geri" onPress={() => router.back()}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>
        <LoadingState label="QR kodu hazırlanıyor..." />
      </View>
    );
  }
  if (!data.pet) {
    return <Redirect href="/today" />;
  }
  const { pet, code } = data;
  const link = code ? lostPageLink(code, API_URL) : null;

  async function print(html: string) {
    try {
      await printQrSheet(html);
    } catch (error) {
      console.warn('Yazdırılamadı', error);
      Alert.alert('Yazdırılamadı', 'Lütfen tekrar dene.', [{ text: 'Tamam' }]);
    }
  }

  async function copyLink(text: string) {
    await Clipboard.setStringAsync(text);
    successHaptic();
    AccessibilityInfo.announceForAccessibility('Bağlantı kopyalandı');
    setIsCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setIsCopied(false), COPIED_MS);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassButton label="Geri" onPress={() => router.back()}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        <Text accessibilityRole="header" style={styles.title}>
          {pet.name} için QR kodu
        </Text>
        <Text style={styles.lead}>
          Tasmaya tak. Bulan kişi okutunca sana konum ve mesaj gönderebilir, telefon numaran görünmez.
        </Text>

        {link ? (
          <View style={styles.card}>
            <QrCode size={250} value={link} />
            <Text style={styles.name}>{pet.name}</Text>
            <Text selectable style={styles.link}>
              {shortLink(link)}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.failed}>
              QR kodu için internet ve giriş gerekiyor. Bağlantını kontrol edip bu ekrana yeniden gel.
            </Text>
          </View>
        )}

        <Text style={styles.note}>
          Bu kod hayvana özel ve değişmez. Kayıp modu açıksa ilanı, kapalıysa ailesine haber verme
          formunu açar.
        </Text>
      </ScrollView>

      {link && (
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button
            label="Yazdır"
            onPress={() => print(qrSheetHtml(pet.name, link, colors.ink))}
          />
          <Button
            label={isCopied ? 'Bağlantı kopyalandı' : 'Bağlantıyı kopyala'}
            size="small"
            variant="text"
            onPress={() => copyLink(link)}
          />
        </View>
      )}
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
    paddingBottom: 16,
  },
  title: {
    marginTop: 18,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  lead: {
    marginTop: 6,
    fontFamily: fonts.ui,
    fontSize: 15.5,
    lineHeight: 22,
    color: colors.ink2,
  },
  card: {
    alignItems: 'center',
    marginTop: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  name: {
    marginTop: 2,
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  link: {
    marginTop: 4,
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink2,
  },
  failed: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  note: {
    marginTop: 12,
    fontFamily: fonts.ui,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
  },
  actions: {
    gap: 2,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
