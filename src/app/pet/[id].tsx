import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { GlassButton } from '@/components/glass-button';
import { PetAvatar } from '@/components/pet-avatar';
import { SegmentedControl } from '@/components/segmented-control';
import {
  DueRecordSticker,
  RecordSticker,
  UpcomingVisitSticker,
  VisitSticker,
} from '@/components/stickers';
import { WeightSection } from '@/components/weight-section';
import { colors, fonts } from '@/constants/theme';
import { listHealthRecords, type RecordKind } from '@/data/health-records';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { listVisits } from '@/data/visits';
import { listWeightRanges, listWeights } from '@/data/weights';
import { useFocusData } from '@/hooks/use-focus-data';
import { splitRecords } from '@/lib/health-records';
import { petSummary } from '@/lib/pets';
import { splitVisits } from '@/lib/visits';

type RecordTab = 'vaccines' | 'treatments' | 'visits' | 'weight';

const TABS: { value: RecordTab; label: string }[] = [
  { value: 'vaccines', label: 'Aşılar' },
  { value: 'treatments', label: 'Tedaviler' },
  { value: 'visits', label: 'Ziyaretler' },
  { value: 'weight', label: 'Kilo' },
];

const ADD_LABELS: Record<RecordTab, string> = {
  vaccines: 'Aşı ekle',
  treatments: 'Tedavi ekle',
  visits: 'Ziyaret ekle',
  weight: 'Kilo ekle',
};

const RECORD_COPY: Record<RecordKind, { emptyTitle: string; emptyBody: string }> = {
  vaccine: {
    emptyTitle: 'Henüz aşı kaydı yok',
    emptyBody: 'Karnedeki aşıları ekle, zamanı yaklaşanlar burada ve Bugün ekranında görünsün.',
  },
  treatment: {
    emptyTitle: 'Henüz tedavi kaydı yok',
    emptyBody:
      'İç ve dış parazit gibi uygulamaları ekle, zamanı yaklaşanlar burada ve Bugün ekranında görünsün.',
  },
};

// Saat de verilerle birlikte okunuyor: uygulama ertesi gün açılırsa sayaçlar yenilensin.
async function loadRecord() {
  const [pets, records, visits, weights, weightRanges] = await Promise.all([
    listPets(),
    listHealthRecords(),
    listVisits(),
    listWeights(),
    listWeightRanges(),
  ]);
  return { pets, records, visits, weights, weightRanges, now: new Date() };
}

function openEditRecord(id: string) {
  router.push({ pathname: '/edit-record', params: { id } });
}

function openEditVisit(id: string) {
  router.push({ pathname: '/edit-visit', params: { id } });
}

export default function PetRecordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const data = useFocusData(loadRecord);
  const [tab, setTab] = useState<RecordTab>(
    () => TABS.find((option) => option.value === params.tab)?.value ?? 'vaccines',
  );

  if (!data) {
    return null;
  }
  const pet = data.pets.find((candidate) => candidate.id === params.id);
  // Silinmiş bir hayvanın eski bildirimine dokunulmuş olabilir.
  if (!pet) {
    return <Redirect href="/today" />;
  }
  const { records, visits, weights, weightRanges, now } = data;
  const kind: RecordKind = tab === 'treatments' ? 'treatment' : 'vaccine';

  const { due, others } = splitRecords(
    records.filter((record) => record.petId === pet.id && record.kind === kind),
    now,
  );
  const { upcoming, past } = splitVisits(
    visits.filter((visit) => visit.petId === pet.id),
    now,
  );

  function openAdd(petId: string) {
    if (tab === 'visits') {
      router.push({ pathname: '/add-visit', params: { petId } });
    } else if (tab === 'weight') {
      router.push({ pathname: '/add-weight', params: { petId } });
    } else {
      router.push({ pathname: '/add-record', params: { petId, kind } });
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 2 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.navbar}>
          <GlassButton
            label="Geri"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}>
            <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
          </GlassButton>
          <GlassButton
            label="Hayvanı düzenle"
            onPress={() => router.push({ pathname: '/edit-pet', params: { id: pet.id } })}>
            <PencilSimpleIcon size={20} weight="bold" color={colors.ink} />
          </GlassButton>
        </View>

        <View style={styles.head}>
          <PetAvatar
            photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
            size={76}
            species={pet.species}
          />
          <View style={styles.headCopy}>
            <Text accessibilityRole="header" style={styles.name}>
              {pet.name}
            </Text>
            <Text style={styles.summary}>{petSummary(pet)}</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <SegmentedControl options={TABS} value={tab} onChange={setTab} />
        </View>

        {tab === 'weight' && (
          <WeightSection
            entries={weights.filter((weight) => weight.petId === pet.id)}
            now={now}
            petId={pet.id}
            range={weightRanges[pet.id] ?? null}
          />
        )}

        {tab === 'visits' && (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yaklaşanlar</Text>
                {upcoming.map((visit) => (
                  <UpcomingVisitSticker
                    key={visit.id}
                    now={now}
                    visit={visit}
                    onEdit={() => openEditVisit(visit.id)}
                  />
                ))}
              </View>
            )}

            {past.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Geçmiş</Text>
                  <Text style={styles.sectionCount}>{past.length} kayıt</Text>
                </View>
                {past.map((visit) => (
                  <VisitSticker
                    key={visit.id}
                    visit={visit}
                    onEdit={() => openEditVisit(visit.id)}
                  />
                ))}
              </View>
            )}

            {upcoming.length === 0 && past.length === 0 && (
              <EmptyCard
                body="Geçmiş ziyaretleri ya da aldığın randevuları ekle, yaklaşanları hatırlatalım."
                title="Henüz ziyaret kaydı yok"
              />
            )}
          </>
        )}

        {(tab === 'vaccines' || tab === 'treatments') && (
          <>
            {due.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yaklaşanlar</Text>
                {due.map((record) => (
                  <DueRecordSticker
                    key={record.id}
                    now={now}
                    record={record}
                    onDone={() =>
                      router.push({
                        pathname: '/add-record',
                        params: { petId: pet.id, kind: record.kind, name: record.name },
                      })
                    }
                    onEdit={() => openEditRecord(record.id)}
                  />
                ))}
              </View>
            )}

            {others.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Kayıtlar</Text>
                  <Text style={styles.sectionCount}>{others.length} kayıt</Text>
                </View>
                {others.map((record) => (
                  <RecordSticker
                    key={record.id}
                    record={record}
                    onEdit={() => openEditRecord(record.id)}
                  />
                ))}
              </View>
            )}

            {due.length === 0 && others.length === 0 && (
              <EmptyCard
                body={RECORD_COPY[kind].emptyBody}
                title={RECORD_COPY[kind].emptyTitle}
              />
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label={ADD_LABELS[tab]} onPress={() => openAdd(pet.id)} />
      </View>
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
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  headCopy: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -1,
    color: colors.ink,
  },
  summary: {
    marginTop: 2,
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink2,
  },
  tabs: {
    marginTop: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    marginBottom: 10,
    marginHorizontal: 4,
    fontFamily: fonts.uiHeavy,
    fontSize: 19,
    color: colors.ink,
  },
  sectionCount: {
    marginHorizontal: 4,
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink3,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
