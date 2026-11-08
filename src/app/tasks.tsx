import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassButton } from '@/components/glass-button';
import { TaskRow } from '@/components/task-row';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { listPets, type Pet } from '@/data/pets';
import { listTasks, type Task } from '@/data/tasks';
import { useFocusData } from '@/hooks/use-focus-data';
import { toDateKey } from '@/lib/dates';
import { pendingOccurrence, scheduleLabel } from '@/lib/tasks';

async function loadTasksScreen() {
  const [pets, tasks] = await Promise.all([listPets(), listTasks()]);
  return { pets, tasks, todayKey: toDateKey(new Date()) };
}

function TaskGroup({ title, tasks, pets }: { title?: string; tasks: Task[]; pets: Pet[] }) {
  const visible = tasks.flatMap((task) => {
    const pet = pets.find((candidate) => candidate.id === task.petId);
    return pet ? [{ task, pet }] : [];
  });

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={styles.group}>
      {title && <Text style={styles.groupTitle}>{title}</Text>}
      <View style={styles.list}>
        {visible.map(({ task, pet }, index) => (
          <TaskRow
            key={task.id}
            detail={`${pet.name}. ${scheduleLabel(task)}`}
            name={task.name}
            pet={pet}
            showDivider={index < visible.length - 1}
            onPress={() => router.push({ pathname: '/edit-task', params: { id: task.id } })}
          />
        ))}
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const data = useFocusData(loadTasksScreen);

  if (!data) {
    return null;
  }
  const { pets, tasks, todayKey } = data;

  // Sırası en yakın olan üstte. Yapılacak bir tekrarı kalmayanlar ayrı listede.
  const withPending = tasks.map((task) => ({ task, pending: pendingOccurrence(task, todayKey) }));
  const active = withPending
    .filter(({ pending }) => pending !== null)
    .sort(
      (a, b) =>
        (a.pending ?? '').localeCompare(b.pending ?? '') || a.task.time.localeCompare(b.task.time),
    )
    .map(({ task }) => task);
  const finished = withPending.filter(({ pending }) => pending === null).map(({ task }) => task);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 2 }]}
        showsVerticalScrollIndicator={false}>
        <GlassButton label="Geri" onPress={() => router.back()}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        <Text accessibilityRole="header" style={styles.title}>
          Görevler
        </Text>

        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Henüz görev yok</Text>
            <Text style={styles.emptyBody}>
              İlaç, damla ya da bakım gibi işleri ekle, zamanı gelince hatırlatalım.
            </Text>
          </View>
        ) : (
          <>
            <TaskGroup pets={pets} tasks={active} />
            <TaskGroup pets={pets} tasks={finished} title="Bitenler" />
          </>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label="Görev ekle" onPress={() => router.push('/add-task')} />
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
  title: {
    marginTop: 22,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  group: {
    marginTop: 18,
  },
  groupTitle: {
    marginBottom: 10,
    fontFamily: fonts.uiHeavy,
    fontSize: 19,
    color: colors.ink,
  },
  list: {
    paddingVertical: 2,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  empty: {
    marginTop: 18,
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
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
