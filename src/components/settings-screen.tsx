import Constants from 'expo-constants';
import { router } from 'expo-router';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { SignInButton } from '@/components/sign-in-button';
import { TabHeader } from '@/components/tab-header';
import { Tappable } from '@/components/tappable';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { readActiveReports, type LostReport } from '@/data/lost-reports';
import { clearLocalData, flushBeforeSignOut, type SyncStatus } from '@/data/sync';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSession } from '@/hooks/use-session';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { ApiError } from '@/lib/api';
import { deleteAccount, signOut } from '@/lib/auth';
import { selectionHaptic } from '@/lib/haptics';
import {
  getReminderState,
  requestReminderPermission,
  setRemindersEnabled,
  subscribeToReminderPermission,
  syncReminders,
  type ReminderState,
} from '@/lib/reminders';

const PROVIDER_LABELS = {
  apple: 'Apple ile giriş',
  development: 'Deneme hesabı',
  email: 'E-posta ile giriş',
};

// Ayarlar bir sekme: altında kapatılacak ekran olmayabilir, o zaman kapatma komutu hata verir.
function goToStart() {
  if (router.canDismiss()) {
    router.dismissAll();
  }
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

const APP_VERSION = Constants.expoConfig?.version ?? '';
const SWITCH_OFF = '#D6D5E8';

// Düğme yalnızca uygulamanın ayarı açık ve telefon izin vermişken açık görünür.
function isReminderOn({ isEnabled, permission }: ReminderState) {
  return isEnabled && permission === 'granted';
}

// Kapatınca kurulu bütün hatırlatmalar silinir. Açarken izin yoksa sorulur, reddedilmişse
// yalnızca telefon ayarlarından açılabildiği için oraya yönlendirilir.
async function toggleReminders(state: ReminderState, turnOn: boolean) {
  selectionHaptic();
  try {
    await setRemindersEnabled(turnOn);
    if (!turnOn) {
      return;
    }
    if (state.permission === 'undetermined') {
      await requestReminderPermission();
      await syncReminders();
    } else if (state.permission === 'denied') {
      Alert.alert(
        'Bildirimler kapalı',
        "Hatırlatma gelmesi için telefon ayarlarından Patika'nın bildirimlerini aç.",
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ],
      );
    }
  } catch (error) {
    console.warn('Hatırlatma ayarı değiştirilemedi', error);
    Alert.alert('Değiştirilemedi', 'Lütfen tekrar dene.', [{ text: 'Tamam' }]);
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </>
  );
}

function InfoRow({ label, value, isFirst }: { label: string; value: string; isFirst?: boolean }) {
  return (
    <View style={[styles.infoRow, !isFirst && styles.divider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type ActionRowProps = {
  icon: ReactNode;
  label: string;
  detail?: string;
  isDanger?: boolean;
  isFirst?: boolean;
  isBusy?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

// Dokunulunca bir iş yapan liste satırı. Meşgulken dönen işaret gösterir ve basılamaz.
function ActionRow({ icon, label, detail, isDanger, isFirst, isBusy, disabled, onPress }: ActionRowProps) {
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isBusy, busy: isBusy }}
      dimWhenDisabled={!isBusy}
      disabled={disabled || isBusy}
      onPress={onPress}
      pressedScale={0.99}
      style={[styles.actionRow, !isFirst && styles.divider]}>
      <View style={[styles.rowIcon, isDanger && styles.rowIconDanger]}>{icon}</View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, isDanger && styles.actionLabelDanger]}>{label}</Text>
        {detail ? <Text style={styles.actionDetail}>{detail}</Text> : null}
      </View>
      {isBusy ? (
        <ActivityIndicator color={isDanger ? colors.danger : colors.ink} />
      ) : (
        <CaretRightIcon size={16} weight="bold" color={colors.ink3} />
      )}
    </Tappable>
  );
}

type SwitchRowProps = {
  icon: ReactNode;
  label: string;
  value: boolean;
  isFirst?: boolean;
  onChange: (value: boolean) => void;
};

// Açma kapama düğmeli satır. Satırın kendisine değil, düğmeye dokunulur.
function SwitchRow({ icon, label, value, isFirst, onChange }: SwitchRowProps) {
  return (
    <View style={[styles.actionRow, !isFirst && styles.divider]}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.actionCopy, styles.actionLabel]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        ios_backgroundColor={SWITCH_OFF}
        thumbColor={colors.card}
        trackColor={{ false: SWITCH_OFF, true: colors.ink }}
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

// Sahibin ve veterinerin alt menüsündeki aynı ekran.
export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const sync = useSyncStatus();
  const fullName = session?.user.full_name;
  const email = session?.user.email;
  const isVet = session?.user.role === 'vet';
  const providerLabel = PROVIDER_LABELS[session?.user.provider ?? 'development'];
  const [isBusy, setIsBusy] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const reminders = useFocusData(getReminderState, subscribeToReminderPermission);

  // Çıkıştan önce son eşitleme beklenir, internetsizken uzun sürebilir: düğme kilitlenir, tekrar basılamaz.
  async function startLeaving() {
    setIsLeaving(true);
    try {
      await (isVet ? confirmLeaveAsVet() : confirmLeave());
    } finally {
      setIsLeaving(false);
    }
  }

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
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <TabHeader title="Ayarlar" />

      <Section title="Hesap">
        <InfoRow isFirst label="Giriş yöntemi" value={session ? providerLabel : 'Giriş yapılmadı'} />
        {fullName ? <InfoRow label="Ad" value={fullName} /> : null}
        {email ? <InfoRow label="E-posta" value={email} /> : null}
        {session && !isVet ? <InfoRow label="Yedekleme" value={backupLabel(sync)} /> : null}
        {session === null ? <InfoRow label="Yedekleme" value="Kayıtların yalnızca bu telefonda" /> : null}
      </Section>

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

      {!isVet && reminders && (
        <Section title="Bildirimler">
          <SwitchRow
            isFirst
            icon={<BellIcon size={18} weight="bold" color={colors.ink} />}
            label="Hatırlatmalar"
            value={isReminderOn(reminders)}
            onChange={(turnOn) => toggleReminders(reminders, turnOn)}
          />
        </Section>
      )}

      <Section title="Hakkında">
        <InfoRow isFirst label="Uygulama" value="Patika" />
        {APP_VERSION ? <InfoRow label="Sürüm" value={APP_VERSION} /> : null}
      </Section>

      {session && (
        <Section title="Oturum">
          <ActionRow
            isFirst
            disabled={isBusy}
            icon={<SignOutIcon size={18} weight="bold" color={colors.ink} />}
            isBusy={isLeaving}
            label="Çıkış yap"
            onPress={startLeaving}
          />
          <ActionRow
            isDanger
            detail={isVet ? 'Kliniğin ve randevuların silinir.' : 'Tüm hayvanların ve kayıtların silinir.'}
            disabled={isLeaving}
            icon={<TrashIcon size={18} weight="bold" color={colors.danger} />}
            isBusy={isBusy}
            label="Hesabı sil"
            onPress={confirmDelete}
          />
        </Section>
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
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: fonts.uiHeavy,
    fontSize: 19,
    color: colors.ink,
  },
  card: {
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  infoRow: {
    gap: 1,
    paddingVertical: 13,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
  },
  rowIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
  },
  rowIconDanger: {
    backgroundColor: '#FDECEA',
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.ink,
  },
  actionLabelDanger: {
    color: colors.danger,
  },
  actionDetail: {
    marginTop: 2,
    fontFamily: fonts.ui,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
  },
  signIn: {
    marginTop: 12,
  },
});
