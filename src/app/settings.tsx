import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { SignInButton } from '@/components/sign-in-button';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { readActiveReports, type LostReport } from '@/data/lost-reports';
import { clearLocalData, flushBeforeSignOut, type SyncStatus } from '@/data/sync';
import { useSession } from '@/hooks/use-session';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { ApiError } from '@/lib/api';
import { deleteAccount, signOut } from '@/lib/auth';

const PROVIDER_LABELS = {
  apple: 'Apple ile giriş',
  development: 'Deneme hesabı',
  email: 'E-posta ile giriş',
};

function goToStart() {
  router.dismissAll();
  router.replace('/');
}

async function leave() {
  try {
    await signOut();
    await clearLocalData();
  } catch (error) {
    console.warn('Çıkış yapılamadı', error);
    Alert.alert('Çıkış yapılamadı', 'Lütfen tekrar dene.', [{ text: 'Tamam' }]);
    return;
  }
  goToStart();
}

// Veteriner hesabı telefondaki kayıtlara bağlı değil, çıkışta telefona dokunulmaz.
async function leaveAsVet() {
  try {
    await signOut();
  } catch (error) {
    console.warn('Çıkış yapılamadı', error);
    Alert.alert('Çıkış yapılamadı', 'Lütfen tekrar dene.', [{ text: 'Tamam' }]);
    return;
  }
  goToStart();
}

function confirmLeaveAsVet() {
  Alert.alert('Çıkış yapılsın mı?', 'İşletme bilgilerin ve randevuların sunucuda kalır.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Çıkış yap', onPress: leaveAsVet },
  ]);
}

const VET_DELETION_WARNING =
  'Kliniğin listeden kalkar, bilgileri ve fotoğrafı silinir. Yaklaşan randevuların iptal olur, sahipler bunu görür. Bu işlem geri alınamaz.';

function deletionWarning(openReports: LostReport[]) {
  const lostNote =
    openReports.length > 0
      ? `${openReports.map((report) => report.petName).join(', ')} için açık kayıp ilanın var. İlan sayfası kapanır, gelen ihbarlar da silinir.\n\n`
      : '';
  return `${lostNote}Tüm hayvanların, kayıtların ve fotoğrafların sunucudan ve bu telefondan silinir. Bastığın QR kodlar artık çalışmaz. Bu işlem geri alınamaz.`;
}

function showDeleteError(error: unknown) {
  console.warn('Hesap silinemedi', error);
  const isSessionOver = error instanceof ApiError && error.status === 401;
  Alert.alert(
    'Hesap silinemedi',
    isSessionOver
      ? 'Oturumun kapanmış. Uygulamayı kapatıp yeniden aç, giriş yaptıktan sonra tekrar dene.'
      : 'Hesabı silmek için sunucuya ulaşmak gerekiyor. İnternet bağlantını kontrol edip tekrar dene.',
    [{ text: 'Tamam' }],
  );
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
  const fullName = session?.user.full_name;
  const email = session?.user.email;
  const isVet = session?.user.role === 'vet';
  const providerLabel = PROVIDER_LABELS[session?.user.provider ?? 'development'];
  const [isBusy, setIsBusy] = useState(false);

  async function removeAccount() {
    setIsBusy(true);
    try {
      await deleteAccount();
    } catch (error) {
      setIsBusy(false);
      showDeleteError(error);
      return;
    }
    if (isVet) {
      Alert.alert('Hesabın silindi', 'Kliniğin ve bilgilerin silindi.', [{ text: 'Tamam' }]);
      goToStart();
      return;
    }
    // Hesap artık yok. Telefondaki kopya silinemese de kullanıcı bunu doğru öğrenmeli.
    let isPhoneCleared = true;
    try {
      await clearLocalData();
    } catch (error) {
      console.warn('Telefondaki kayıtlar silinemedi', error);
      isPhoneCleared = false;
    }
    Alert.alert(
      'Hesabın silindi',
      isPhoneCleared
        ? 'Tüm kayıtların sunucudan ve bu telefondan silindi.'
        : 'Kayıtların sunucudan silindi ama bu telefondaki kopyası silinemedi. Uygulamayı kaldırırsan o da silinir.',
      [{ text: 'Tamam' }],
    );
    goToStart();
  }

  async function confirmDelete() {
    if (isVet) {
      Alert.alert('Hesabın silinsin mi?', VET_DELETION_WARNING, [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Hesabı sil', style: 'destructive', onPress: removeAccount },
      ]);
      return;
    }
    setIsBusy(true);
    let openReports: LostReport[];
    try {
      openReports = await readActiveReports();
    } catch (error) {
      showDeleteError(error);
      return;
    } finally {
      setIsBusy(false);
    }
    Alert.alert('Hesabın silinsin mi?', deletionWarning(openReports), [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Hesabı sil', style: 'destructive', onPress: removeAccount },
    ]);
  }

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
        <Row label="Giriş yöntemi" value={session ? providerLabel : 'Giriş yapılmadı'} />
        {fullName ? <Row label="Ad" value={fullName} /> : null}
        {email ? <Row label="E-posta" value={email} /> : null}
        {session && !isVet ? <Row label="Yedekleme" value={backupLabel(sync)} /> : null}
      </View>

      {session && (
        <>
          <View style={styles.action}>
            <Button
              label="Çıkış yap"
              size="small"
              variant="text"
              disabled={isBusy}
              onPress={isVet ? confirmLeaveAsVet : confirmLeave}
            />
          </View>
          <View style={styles.action}>
            <Button
              label={isBusy ? 'Lütfen bekle...' : 'Hesabı sil'}
              size="small"
              variant="text"
              disabled={isBusy}
              onPress={confirmDelete}
            />
          </View>
        </>
      )}

      {session === null && (
        <View style={styles.signIn}>
          <SignInButton />
          <Button
            label="Veteriner girişi"
            size="small"
            variant="text"
            onPress={() => router.push('/vet-auth')}
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
  signIn: {
    marginTop: 12,
  },
});
