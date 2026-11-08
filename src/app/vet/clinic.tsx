import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ClinicDetails } from '@/components/clinic-details';
import { EmptyCard } from '@/components/empty-card';
import { SkeletonList } from '@/components/loading-state';
import { TabHeader } from '@/components/tab-header';
import { colors, fonts, tabBarClearance } from '@/constants/theme';
import { fetchOwnClinic, type ClinicApproval } from '@/data/own-clinic';
import { useFocusResource } from '@/hooks/use-focus-data';

const APPROVAL_TEXT: Record<ClinicApproval, { title: string; body: string }> = {
  pending: { title: 'Onay bekliyor', body: 'Onaylanınca sahipler seni böyle görecek.' },
  approved: { title: 'Listede görünüyorsun', body: 'Sahipler seni böyle görüyor.' },
  rejected: { title: 'Onaylanmadı', body: 'Bilgileri kontrol edip yeniden gönder.' },
};

async function loadClinic() {
  try {
    return { clinic: await fetchOwnClinic(), hasFailed: false };
  } catch (error) {
    console.warn('Klinik okunamadı', error);
    return { clinic: null, hasFailed: true };
  }
}

export default function VetClinicScreen() {
  const insets = useSafeAreaInsets();
  const { data, refresh, isRefreshing } = useFocusResource(loadClinic);
  const clinic = data?.clinic;
  const approval = clinic ? APPROVAL_TEXT[clinic.approval] : null;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      refreshControl={<RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor={colors.ink} />}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <TabHeader title="İşletme" />

      {!data && <SkeletonList count={2} height={140} />}
      {data?.hasFailed && (
        <EmptyCard
          action={{ label: 'Tekrar dene', onPress: refresh }}
          body="İnternet bağlantını kontrol edip tekrar dene."
          title="Sunucuya ulaşılamadı"
        />
      )}
      {data && !data.hasFailed && !clinic && (
        <EmptyCard
          body="Kliniğinin adını, konumunu ve çalışma saatlerini doldur."
          title="İşletme bilgilerin eksik"
        />
      )}
      {approval && (
        <View style={styles.approval}>
          <Text style={styles.approvalTitle}>{approval.title}</Text>
          <Text style={styles.approvalBody}>{approval.body}</Text>
        </View>
      )}

      {data && !data.hasFailed && (
        <View style={styles.action}>
          <Button
            label={clinic ? 'Bilgileri düzenle' : 'Bilgileri doldur'}
            onPress={() => router.push('/vet-clinic-form')}
          />
        </View>
      )}

      {clinic && (
        <View style={styles.details}>
          <ClinicDetails clinic={clinic} />
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
  approval: {
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.skySoft,
  },
  approvalTitle: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16,
    color: colors.ink,
  },
  approvalBody: {
    marginTop: 2,
    fontFamily: fonts.ui,
    fontSize: 14.5,
    color: colors.ink2,
  },
  action: {
    marginTop: 14,
  },
  details: {
    marginTop: 22,
  },
});
