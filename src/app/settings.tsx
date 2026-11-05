import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { signOut } from '@/lib/auth';

async function leave() {
  try {
    await signOut();
  } catch (error) {
    console.warn('Çıkış yapılamadı', error);
    Alert.alert('Çıkış yapılamadı', 'Lütfen bağlantını kontrol edip tekrar dene.');
    return;
  }
  router.dismissAll();
  router.replace('/');
}

function confirmLeave() {
  Alert.alert('Çıkış yapılsın mı?', 'Kayıtların bu telefonda kalır. Tekrar girince görürsün.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Çıkış yap', onPress: leave },
  ]);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const fullName = session?.user.user_metadata.full_name as string | undefined;
  const email = session?.user.email;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 2, paddingBottom: Math.max(insets.bottom, 16) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <GlassButton label="Geri" onPress={() => router.back()}>
        <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
      </GlassButton>

      <Text accessibilityRole="header" style={styles.title}>
        Ayarlar
      </Text>

      <Text style={styles.sectionTitle}>Hesap</Text>
      <View style={styles.card}>
        <Row label="Giriş yöntemi" value={session ? 'Apple ile giriş' : 'Giriş yapılmadı'} />
        {fullName ? <Row label="Ad" value={fullName} /> : null}
        {email ? <Row label="E-posta" value={email} /> : null}
      </View>

      {session && (
        <View style={styles.action}>
          <Button label="Çıkış yap" size="small" variant="text" onPress={confirmLeave} />
        </View>
      )}
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
  title: {
    marginTop: 22,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 4,
    fontFamily: fonts.uiHeavy,
    fontSize: 19,
    color: colors.ink,
  },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  row: {
    gap: 1,
  },
  rowLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.ink3,
  },
  rowValue: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.ink,
  },
  action: {
    alignSelf: 'center',
    marginTop: 12,
  },
});
