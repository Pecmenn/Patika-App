import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { WelcomeCollage } from '@/components/welcome-collage';
import { colors, fonts } from '@/constants/theme';
import { usePets } from '@/hooks/use-pets';

const MAX_CONTENT_WIDTH = 430;

// Uygulamanın giriş noktası: hayvan varsa Bugün'e, yoksa Karşılama'ya gider.
export default function IndexScreen() {
  const pets = usePets();

  if (pets === null) {
    return null;
  }
  if (pets.length > 0) {
    return <Redirect href="/today" />;
  }
  return <Welcome />;
}

function Welcome() {
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
          <Button label="İlk hayvanını ekle" onPress={() => router.push('/add-pet')} />
          <Button label="Zaten hesabım var" variant="text" />
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
  actions: {
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
