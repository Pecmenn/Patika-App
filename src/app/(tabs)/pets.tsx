import { router } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { PetAvatar } from '@/components/pet-avatar';
import { TabHeader } from '@/components/tab-header';
import { Tappable } from '@/components/tappable';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { listHealthRecords } from '@/data/health-records';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets, type Pet } from '@/data/pets';
import { listVisits } from '@/data/visits';
import { listWeights } from '@/data/weights';
import { useFocusData } from '@/hooks/use-focus-data';
import { formatShortDate, fromDateKey } from '@/lib/dates';
import { latestWeightFor, nextUpFor, nextUpWhen } from '@/lib/pet-facts';
import { petSummary } from '@/lib/pets';
import { formatKg } from '@/lib/weights';

// Saat de verilerle birlikte okunuyor: uygulama ertesi gün açılırsa "kaç gün kaldı" yenilensin.
async function loadPets() {
  const [pets, records, visits, weights] = await Promise.all([
    listPets(),
    listHealthRecords(),
    listVisits(),
    listWeights(),
  ]);
  return { pets, records, visits, weights, now: new Date() };
}

type Data = Awaited<ReturnType<typeof loadPets>>;

function Fact({ label, value, detail }: { label: string; value: string | null; detail?: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      {value ? (
        <>
          <Text numberOfLines={1} style={styles.factValue}>
            {value}
          </Text>
          {detail && <Text style={styles.factDetail}>{detail}</Text>}
        </>
      ) : (
        <Text style={styles.factEmpty}>Henüz yok</Text>
      )}
    </View>
  );
}

function PetCard({ pet, data }: { pet: Pet; data: Data }) {
  const weight = latestWeightFor(pet.id, data.weights);
  const nextUp = nextUpFor(pet.id, data.records, data.visits, data.now);

  return (
    <Tappable
      accessibilityHint="Sağlık kaydını açmak için dokun"
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })}
      style={styles.card}>
      <View style={styles.top}>
        <PetAvatar
          name={pet.name}
          photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
          size={56}
          species={pet.species}
        />
        <View style={styles.copy}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.summary}>{petSummary(pet)}</Text>
        </View>
        <CaretRightIcon size={16} weight="bold" color={colors.ink3} />
      </View>
      <View style={styles.facts}>
        <Fact
          detail={weight && formatShortDate(fromDateKey(weight.date))}
          label="Son kilo"
          value={weight ? `${formatKg(weight.kg)} kg` : null}
        />
        <Fact
          detail={nextUp ? nextUpWhen(nextUp.date, data.now) : undefined}
          label="Sıradaki"
          value={nextUp?.title ?? null}
        />
      </View>
    </Tappable>
  );
}

export default function PetsScreen() {
  const insets = useSafeAreaInsets();
  const data = useFocusData(loadPets);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <TabHeader title="Hayvanlar" />

      <View style={styles.list}>
        {data?.pets.map((pet) => <PetCard key={pet.id} data={data} pet={pet} />)}
      </View>

      <View style={styles.action}>
        <Button label="Hayvan ekle" onPress={() => router.push('/add-pet')} />
      </View>
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
  list: {
    gap: 10,
    marginTop: 14,
  },
  card: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  summary: {
    marginTop: 2,
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.ink2,
  },
  facts: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  fact: {
    flex: 1,
    minWidth: 0,
  },
  factLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.ink3,
  },
  factValue: {
    marginTop: 2,
    fontFamily: fonts.uiHeavy,
    fontSize: 15,
    color: colors.ink,
  },
  factDetail: {
    marginTop: 1,
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: colors.ink2,
  },
  factEmpty: {
    marginTop: 2,
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink3,
  },
  action: {
    marginTop: 16,
  },
});
