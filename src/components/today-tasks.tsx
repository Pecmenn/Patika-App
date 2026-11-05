import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TaskRow } from '@/components/task-row';
import { cardShadow, colors, fonts } from '@/constants/theme';
import type { Pet } from '@/data/pets';
import { formatShortDate, formatTime, fromDateKey } from '@/lib/dates';
import type { TodayTask } from '@/lib/tasks';

type TodayTasksProps = {
  items: TodayTask[];
  pets: Pet[];
  hasAnyTask: boolean;
  onToggle: (item: TodayTask) => void;
};

function detailFor({ task, date, isOverdue }: TodayTask, pet: Pet) {
  return isOverdue
    ? `${pet.name}, gecikti: ${formatShortDate(fromDateKey(date))}`
    : `${pet.name}, saat ${formatTime(task.time)}`;
}

function TextAction({ label, href }: { label: string; href: '/add-task' | '/tasks' }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={styles.action}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function TodayTasks({ items, pets, hasAnyTask, onToggle }: TodayTasksProps) {
  const visible = items.flatMap((item) => {
    const pet = pets.find((candidate) => candidate.id === item.task.petId);
    return pet ? [{ item, pet }] : [];
  });
  const doneCount = visible.filter(({ item }) => item.isDone).length;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Bugün</Text>
        {visible.length > 0 && (
          <Text style={styles.count}>
            {doneCount}/{visible.length} tamamlandı
          </Text>
        )}
      </View>

      {visible.length > 0 ? (
        <>
          <View style={styles.list}>
            {visible.map(({ item, pet }, index) => (
              <TaskRow
                key={`${item.task.id}:${item.date}`}
                detail={detailFor(item, pet)}
                isDone={item.isDone}
                name={item.task.name}
                pet={pet}
                showDivider={index < visible.length - 1}
                onPress={() =>
                  router.push({ pathname: '/edit-task', params: { id: item.task.id } })
                }
                onToggle={() => onToggle(item)}
              />
            ))}
          </View>
          <View style={styles.actions}>
            <TextAction href="/add-task" label="Görev ekle" />
            <TextAction href="/tasks" label="Tüm görevler" />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Bugün için görev yok</Text>
          <Text style={styles.emptyBody}>
            İlaç, damla ya da bakım gibi işleri ekle, zamanı gelince hatırlatalım.
          </Text>
          <View style={styles.emptyActions}>
            <Button label="Görev ekle" size="small" onPress={() => router.push('/add-task')} />
            {hasAnyTask && <TextAction href="/tasks" label="Tüm görevler" />}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 4,
  },
  title: {
    fontFamily: fonts.uiHeavy,
    fontSize: 19,
    color: colors.ink,
  },
  count: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink3,
  },
  list: {
    paddingVertical: 2,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: 4,
  },
  action: {
    paddingVertical: 8,
  },
  actionLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  empty: {
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
  emptyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
});
