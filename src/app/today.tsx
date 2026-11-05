import { router } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetAvatar } from '@/components/pet-avatar';
import { ReminderPermissionCard } from '@/components/reminder-permission-card';
import { TodayTasks } from '@/components/today-tasks';
import { UpNextCard } from '@/components/up-next-card';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { listTasks, setTaskCompleted, subscribeToTasks } from '@/data/tasks';
import { listVaccines } from '@/data/vaccines';
import { useFocusData } from '@/hooks/use-focus-data';
import { formatWeekday, greetingFor } from '@/lib/dates';
import { hasUpcomingReminder } from '@/lib/reminder-plan';
import { refreshReminders } from '@/lib/reminders';
import { tasksForToday, type TodayTask } from '@/lib/tasks';
import { splitVaccines } from '@/lib/vaccines';

// Saat de verilerle birlikte okunuyor: uygulama ertesi gün açılırsa ekran yeni güne geçsin.
async function loadToday() {
  const [pets, vaccines, tasks] = await Promise.all([listPets(), listVaccines(), listTasks()]);
  return { pets, vaccines, tasks, now: new Date() };
}

async function toggleTask({ task, date, isDone }: TodayTask) {
  try {
    await setTaskCompleted(task.id, date, !isDone);
  } catch {
    Alert.alert('Kaydedilemedi', 'Görev işaretlenirken bir sorun oldu. Lütfen tekrar dene.');
    return;
  }
  await refreshReminders();
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const data = useFocusData(loadToday, subscribeToTasks);
  const pets = data?.pets;
  const vaccines = data?.vaccines;
  const tasks = data?.tasks;
  const now = data?.now ?? new Date();

  const upNext = vaccines ? splitVaccines(vaccines).due[0] : undefined;
  const upNextPet = upNext ? pets?.find((pet) => pet.id === upNext.petId) : undefined;

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <Text style={styles.date}>{formatWeekday(now)}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {greetingFor(now)}
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

      {upNext && upNextPet ? (
        <View style={styles.content}>
          <UpNextCard
            now={now}
            pet={upNextPet}
            vaccine={upNext}
            onDone={() =>
              router.push({
                pathname: '/add-vaccine',
                params: { petId: upNextPet.id, name: upNext.name },
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

      {vaccines && tasks && hasUpcomingReminder(vaccines, tasks, now) && (
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
    paddingBottom: 32,
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
