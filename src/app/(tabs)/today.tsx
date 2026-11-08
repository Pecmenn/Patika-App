import { router } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddTile } from '@/components/add-tile';
import { AppointmentNoticeCard } from '@/components/appointment-notice-card';
import { Skeleton } from '@/components/loading-state';
import { NextVisitCard } from '@/components/next-visit-card';
import { PetAvatar } from '@/components/pet-avatar';
import { PetMessagesCard } from '@/components/pet-messages-card';
import { ReminderPermissionCard } from '@/components/reminder-permission-card';
import { SessionEndedCard } from '@/components/session-ended-card';
import { Tappable } from '@/components/tappable';
import { TodayTasks } from '@/components/today-tasks';
import { UpNextCard } from '@/components/up-next-card';
import { WeightCard } from '@/components/weight-card';
import { cardShadow, colors, fonts, tabBarClearance } from '@/constants/theme';
import { listMyAppointments, subscribeToAppointments } from '@/data/appointments';
import { listHealthRecords } from '@/data/health-records';
import { listPetMessages, subscribeToSightings } from '@/data/lost-reports';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { listTasks, setTaskCompleted } from '@/data/tasks';
import { listVisits } from '@/data/visits';
import { listWeightRanges, listWeights } from '@/data/weights';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSession, useSessionRejected } from '@/hooks/use-session';
import { appointmentNotice } from '@/lib/clinics';
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
  const isSessionRejected = useSessionRejected();
  const petMessages = useFocusData(listPetMessages, subscribeToSightings);
  const messageGroups = groupMessagesByPet(petMessages ?? []);
  const appointments = useFocusData(listMyAppointments, subscribeToAppointments);
  const givenName = session?.user.given_name;
  const pets = data?.pets;
  const records = data?.records;
  const tasks = data?.tasks;
  const visits = data?.visits;
  const now = data?.now ?? new Date();
  const notice = appointmentNotice(appointments ?? [], now);

  const upNext = records ? splitRecords(records, now).due[0] : undefined;
  const upNextPet = upNext ? pets?.find((pet) => pet.id === upNext.petId) : undefined;
  const nextVisit = visits ? splitVisits(visits, now).upcoming[0] : undefined;
  const nextVisitPet = nextVisit ? pets?.find((pet) => pet.id === nextVisit.petId) : undefined;

  // Kilo kartı en son tartılan hayvanı gösterir.
  const weights = data?.weights ?? [];
  const latestWeight = sortByDate(weights).at(-1);
  const weightPet = latestWeight ? pets?.find((pet) => pet.id === latestWeight.petId) : undefined;

  // Tek hayvan varsa form doğrudan onun için açılır, birden fazlaysa form önce hangisi için olduğunu sorar.
  function openAddForm(pathname: '/add-weight' | '/add-visit') {
    const onlyPet = pets?.length === 1 ? pets[0] : undefined;
    router.push(onlyPet ? { pathname, params: { petId: onlyPet.id } } : { pathname });
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 8, paddingBottom: tabBarClearance(insets.bottom) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <Text style={styles.date}>{formatWeekday(now)}</Text>
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
          <Tappable
            key={pet.id}
            accessibilityLabel={`${pet.name} kayıtları`}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/pet/[id]', params: { id: pet.id } })}
            hitSlop={2}
            style={styles.chip}>
            <PetAvatar
              photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
              size={28}
              species={pet.species}
            />
            <Text style={styles.chipLabel}>{pet.name}</Text>
          </Tappable>
        ))}
        <Tappable
          accessibilityLabel="Hayvan ekle"
          accessibilityRole="button"
          onPress={() => router.push('/add-pet')}
          hitSlop={2}
          style={styles.addChip}>
          <PlusIcon size={17} weight="bold" color={colors.ink} />
        </Tappable>
      </ScrollView>

      {isSessionRejected && (
        <View style={styles.message}>
          <SessionEndedCard />
        </View>
      )}

      {notice && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.message}>
          <AppointmentNoticeCard body={notice.body} title={notice.title} />
        </Animated.View>
      )}

      {messageGroups.map(({ petId, items }) => {
        const pet = pets?.find((candidate) => candidate.id === petId);
        return (
          pet && (
            <Animated.View key={petId} entering={FadeIn.duration(220)} style={styles.message}>
              <PetMessagesCard
                count={items.length}
                petName={pet.name}
                onPress={() => router.push({ pathname: '/pet-messages/[id]', params: { id: petId } })}
              />
            </Animated.View>
          )
        );
      })}

      {!data ? (
        <View style={styles.content}>
          <Skeleton height={150} />
        </View>
      ) : upNext && upNextPet ? (
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

      {pets && pets.length > 0 && (
        <View style={styles.tiles}>
          {weightPet ? (
            <WeightCard
              entries={weights.filter((weight) => weight.petId === weightPet.id)}
              pet={weightPet}
              range={data?.weightRanges[weightPet.id] ?? null}
              onPress={() =>
                router.push({ pathname: '/pet/[id]', params: { id: weightPet.id, tab: 'weight' } })
              }
            />
          ) : (
            <AddTile
              actionLabel="Kilo ekle"
              body="Henüz tartı yok"
              label="Kilo"
              onPress={() => openAddForm('/add-weight')}
            />
          )}
          {nextVisit && nextVisitPet ? (
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
          ) : (
            <AddTile
              actionLabel="Ziyaret ekle"
              body="Planlı ziyaret yok"
              label="Sonraki ziyaret"
              onPress={() => openAddForm('/add-visit')}
            />
          )}
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
  date: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    color: colors.ink3,
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
    minHeight: 40,
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
