import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { clearLocalData, flushBeforeSignOut, type SyncStatus } from '@/data/sync';
import { useSession } from '@/hooks/use-session';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { signInForDevelopment, signOut } from '@/lib/auth';

async function leave() {
  try {
    await signOut();
    await clearLocalData();
  } catch (error) {
    console.warn('Çıkış yapılamadı', error);
    Alert.alert('Çıkış yapılamadı', 'Lütfen tekrar dene.');
    return;
  }
  router.dismissAll();
  router.replace('/');
}

async function confirmLeave() {
  let pendingCount = 0;
  try {
    pendingCount = await flushBeforeSignOut();
  } catch (error) {
    console.warn('Son eşitleme yapılamadı', error);
  }

  if (pendingCount > 0) {
    Alert.alert(
      'Gönderilmemiş değişiklikler var',
      `${pendingCount} değişiklik henüz sunucuya gitmedi. Şimdi çıkarsan bunlar kaybolur. İnternete bağlanıp yeniden denemeni öneririz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yine de çık', style: 'destructive', onPress: leave },
      ],
    );
    return;
  }

  Alert.alert(
    'Çıkış yapılsın mı?',
    'Kayıtların sunucuda duruyor, tekrar girince geri gelir. Bu telefondaki kopyası silinir.',
    [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', onPress: leave },
    ],
  );
}

function backupLabel({ isSyncing, pendingCount, hasError }: SyncStatus) {
  if (isSyncing) {
    return 'Eşitleniyor...';
  }
  if (pendingCount > 0) {
    return `${pendingCount} değişiklik internet bekliyor`;
  }
  return hasError ? 'Sunucuya ulaşılamadı, sonra yeniden denenecek' : 'Kayıtların sunucuda';
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
  const sync = useSyncStatus();
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
        {session ? <Row label="Yedekleme" value={backupLabel(sync)} /> : null}
      </View>

      {session && (
        <View style={styles.action}>
          <Button label="Çıkış yap" size="small" variant="text" onPress={confirmLeave} />
        </View>
      )}

      {/* Apple ile giriş Android'de yok. Eşitlemeyi taklitçide denemek için, yalnızca geliştirirken. */}
      {__DEV__ && !session && Platform.OS === 'android' && (
        <View style={styles.action}>
          <Button
            label="Deneme hesabıyla gir"
            size="small"
            variant="text"
            onPress={() =>
              signInForDevelopment().catch((error) => {
                console.warn('Deneme girişi başarısız', error);
                Alert.alert('Deneme girişi başarısız', String(error));
              })
            }
          />
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
