import { Redirect, router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppleSignInButton } from '@/components/apple-sign-in-button';
import { Button } from '@/components/button';
import { WelcomeCollage } from '@/components/welcome-collage';
import { colors, fonts } from '@/constants/theme';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSession } from '@/hooks/use-session';
import { useSyncStatus } from '@/hooks/use-sync-status';

const MAX_CONTENT_WIDTH = 430;

// Apple ile giriş yalnızca iPhone'da var. Android ve tarayıcıdaki denemeler girişsiz sürer.
const REQUIRES_SIGN_IN = Platform.OS === 'ios';

// Uygulamanın giriş noktası: giriş yapılmamışsa veya hayvan yoksa Karşılama, yoksa Bugün açılır.
export default function IndexScreen() {
  const pets = useFocusData(listPets);
  const session = useSession();
  const sync = useSyncStatus();

  if (pets === null || session === undefined) {
    return null;
  }
  const isSignedIn = session !== null || !REQUIRES_SIGN_IN;
  if (isSignedIn && pets.length > 0) {
    return <Redirect href="/today" />;
  }
  // Yeni telefonda kayıtlar sunucudan gelene kadar "İlk hayvanını ekle" gösterilmez.
  const isRestoring = session !== null && !sync.hasPulled && !sync.hasError;
  return <Welcome isRestoring={isRestoring} isSignedIn={isSignedIn} />;
}

function Welcome({ isRestoring, isSignedIn }: { isRestoring: boolean; isSignedIn: boolean }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.column, { width: contentWidth }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <WelcomeCollage width={contentWidth} />
          <View style={styles.copy}>
            <Text style={styles.wordmark}>patika</Text>
            <Text accessibilityRole="header" style={styles.heading}>
              Her aşı, her ziyaret, her tartı tek yerde
            </Text>
            <Text style={styles.body}>
              Patika zamanı gelmeden hatırlatır. Hayvanın kaybolursa ilanını hazırlar, onu bulanların
              sana ulaşmasını sağlar.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {isRestoring && <Text style={styles.restoring}>Kayıtların getiriliyor...</Text>}
          {!isRestoring && isSignedIn && (
            <Button label="İlk hayvanını ekle" onPress={() => router.push('/add-pet')} />
          )}
          {!isRestoring && !isSignedIn && <AppleSignInButton />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  column: {
    flex: 1,
  },
  copy: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  heading: {
    marginTop: 8,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.9,
    color: colors.ink,
  },
  body: {
    marginTop: 12,
    fontFamily: fonts.ui,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink2,
  },
  restoring: {
    paddingVertical: 18,
    textAlign: 'center',
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.ink2,
  },
  actions: {
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
