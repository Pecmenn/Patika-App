import { router } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { SirenIcon } from 'phosphor-react-native/src/icons/Siren';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NextVisitCard } from '@/components/next-visit-card';
import { PetAvatar } from '@/components/pet-avatar';
import { PetMessagesCard } from '@/components/pet-messages-card';
import { ReminderPermissionCard } from '@/components/reminder-permission-card';
import { TodayTasks } from '@/components/today-tasks';
import { UpNextCard } from '@/components/up-next-card';
import { WeightCard } from '@/components/weight-card';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { listHealthRecords } from '@/data/health-records';
import {
  listActiveReports,
  listPetMessages,
  subscribeToReports,
  subscribeToSightings,
} from '@/data/lost-reports';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { listTasks, setTaskCompleted } from '@/data/tasks';
import { listVisits } from '@/data/visits';
import { listWeightRanges, listWeights } from '@/data/weights';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSession } from '@/hooks/use-session';
import { formatWeekday, greetingFor } from '@/lib/dates';
import { splitRecords } from '@/lib/health-records';
import { groupMessagesByPet } from '@/lib/lost';
import { hasUpcomingReminder } from '@/lib/reminder-plan';
import { refreshReminders } from '@/lib/reminders';
import { tasksForToday, type TodayTask } from '@/lib/tasks';
import { splitVisits } from '@/lib/visits';
import { sortByDate } from '@/lib/weights';

// Saat de verilerle birlikte okunuyor: uygulama ertesi gün açılırsa ekran yeni güne geçsin.
async function loadToday() {
  const [pets, records, tasks, visits, weights, weightRanges] = await Promise.all([
    listPets(),
    listHealthRecords(),
    listTasks(),
    listVisits(),
    listWeights(),
    listWeightRanges(),
  ]);
  return { pets, records, tasks, visits, weights, weightRanges, now: new Date() };
}

async function toggleTask({ task, date, isDone }: TodayTask) {
  try {
    await setTaskCompleted(task.id, date, !isDone);
  } catch {
    Alert.alert('Kaydedilemedi', 'Görev işaretlenirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
    return;
  }
  await refreshReminders();
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const data = useFocusData(loadToday);
  const session = useSession();
  const activeReports = useFocusData(listActiveReports, subscribeToReports);
  const activeReport = activeReports?.[0];
  const petMessages = useFocusData(listPetMessages, subscribeToSightings);
  const messageGroups = groupMessagesByPet(petMessages ?? []);
  const givenName = session?.user.given_name;
  const pets = data?.pets;
  const records = data?.records;
  const tasks = data?.tasks;
  const visits = data?.visits;
  const now = data?.now ?? new Date();

  const upNext = records ? splitRecords(records, now).due[0] : undefined;
  const upNextPet = upNext ? pets?.find((pet) => pet.id === upNext.petId) : undefined;
  const nextVisit = visits ? splitVisits(visits, now).upcoming[0] : undefined;
  const nextVisitPet = nextVisit ? pets?.find((pet) => pet.id === nextVisit.petId) : undefined;

  // Kilo kartı en son tartılan hayvanı gösterir.
  const weights = data?.weights ?? [];
  const latestWeight = sortByDate(weights).at(-1);
  const weightPet = latestWeight ? pets?.find((pet) => pet.id === latestWeight.petId) : undefined;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.date}>{formatWeekday(now)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            activeReport
              ? router.push({ pathname: '/lost/[id]', params: { id: activeReport.id } })
              : router.push('/start-lost')
          }
          style={[styles.lostPill, activeReport && styles.lostPillActive]}>
          <SirenIcon size={17} weight="fill" color={activeReport ? colors.ink : colors.alert} />
          <Text
            numberOfLines={1}
            style={[styles.lostPillLabel, activeReport && styles.lostPillLabelActive]}>
            {activeReport ? `${activeReport.petName} kayıp` : 'Hayvanım kayıp'}
          </Text>
        </Pressable>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {greetingFor(now)}
        {givenName ? `, ${givenName}` : ''}
      </Text>

      <ScrollView
        horizontal
        contentContainerStyle={styles.chips}
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}>
        {pets?.map((pet) => (
          <Pressable
            key={pet.id}
            accessibilityLabel={`${pet.name} kayıtları`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })}
            style={styles.chip}>
            <PetAvatar
              photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
              size={28}
              species={pet.species}
            />
            <Text style={styles.chipLabel}>{pet.name}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityLabel="Hayvan ekle"
          accessibilityRole="button"
          onPress={() => router.push('/add-pet')}
          style={styles.addChip}>
          <PlusIcon size={17} weight="bold" color={colors.ink} />
        </Pressable>
      </ScrollView>

      {messageGroups.map(({ petId, items }) => {
        const pet = pets?.find((candidate) => candidate.id === petId);
        return (
          pet && (
            <View key={petId} style={styles.message}>
              <PetMessagesCard
                count={items.length}
                petName={pet.name}
                onPress={() => router.push({ pathname: '/pet-messages/[id]', params: { id: petId } })}
              />
            </View>
          )
        );
      })}

      {upNext && upNextPet ? (
        <View style={styles.content}>
          <UpNextCard
            now={now}
            pet={upNextPet}
            record={upNext}
            onDone={() =>
              router.push({
                pathname: '/add-record',
                params: { petId: upNextPet.id, kind: upNext.kind, name: upNext.name },
              })
            }
          />
        </View>
      ) : (
        <View style={[styles.content, styles.emptyCard]}>
          <Text style={styles.emptyTitle}>Yaklaşan bir şey yok</Text>
          <Text style={styles.emptyBody}>
            Hayvanına dokunup aşılarını ekle, zamanı yaklaşanlar burada görünsün.
          </Text>
        </View>
      )}

      {records && tasks && visits && hasUpcomingReminder(records, tasks, visits, now) && (
        <ReminderPermissionCard />
      )}

      {pets && tasks && (
        <TodayTasks
          hasAnyTask={tasks.length > 0}
          items={tasksForToday(tasks, now)}
          pets={pets}
          onToggle={toggleTask}
        />
      )}

      {(weightPet || (nextVisit && nextVisitPet)) && (
        <View style={styles.tiles}>
          {weightPet && (
            <WeightCard
              entries={weights.filter((weight) => weight.petId === weightPet.id)}
              pet={weightPet}
              range={data?.weightRanges[weightPet.id] ?? null}
              onPress={() =>
                router.push({ pathname: '/pet/[id]', params: { id: weightPet.id, tab: 'weight' } })
              }
            />
          )}
          {nextVisit && nextVisitPet && (
            <NextVisitCard
              pet={nextVisitPet}
              visit={nextVisit}
              onPress={() =>
                router.push({
                  pathname: '/pet/[id]',
                  params: { id: nextVisitPet.id, tab: 'visits' },
                })
              }
            />
          )}
          {/* Tasarımda kartlar iki sütunlu: tek kart kalırsa da yarım genişlikte durur. */}
          {!(weightPet && nextVisit && nextVisitPet) && <View style={styles.tileSpacer} />}
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
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  date: {
    flexShrink: 1,
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink3,
  },
  lostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    paddingVertical: 7,
    paddingRight: 13,
    paddingLeft: 10,
    borderRadius: 999,
    backgroundColor: colors.alertSoft,
  },
  lostPillActive: {
    backgroundColor: colors.alert,
  },
  lostPillLabel: {
    flexShrink: 1,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.alertText,
  },
  lostPillLabelActive: {
    color: colors.ink,
  },
  title: {
    marginTop: 4,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  chipsRow: {
    marginTop: 16,
    marginHorizontal: -20,
    flexGrow: 0,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  addChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  content: {
    marginTop: 16,
  },
  message: {
    marginTop: 12,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  tileSpacer: {
    flex: 1,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  emptyTitle: {
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  emptyBody: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
});
