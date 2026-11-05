import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { listHealthRecords } from '@/data/health-records';
import { listPets } from '@/data/pets';
import { listTasks, setTaskCompleted, snoozeTask } from '@/data/tasks';
import { listVisits } from '@/data/visits';
import { createChangeSignal } from '@/lib/change-signal';
import { planReminders } from '@/lib/reminder-plan';

const CHANNEL_ID = 'reminders';

// Bu adlarda : ve - kullanılamıyor.
const TASK_CATEGORY = 'task_reminder';
const TASK_DONE_ACTION = 'task_done';
const TASK_SNOOZE_ACTION = 'task_snooze';
const SNOOZE_MS = 60 * 60 * 1000;

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

const permissionChanges = createChangeSignal();
export const subscribeToReminderPermission = permissionChanges.subscribe;

export function configureReminders() {
  // Uygulama açıkken gelen bildirimler de ekranda görünsün.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  Notifications.setNotificationCategoryAsync(TASK_CATEGORY, [
    {
      identifier: TASK_DONE_ACTION,
      buttonTitle: 'Yapıldı',
      options: { opensAppToForeground: false },
    },
    {
      identifier: TASK_SNOOZE_ACTION,
      buttonTitle: '1 saat sonra',
      options: { opensAppToForeground: false },
    },
  ]).catch((error) => console.warn('Bildirim düğmeleri kurulamadı', error));
}

// iPhone'da bildirim kanalı yok. Android'de Expo Go kanal oluştururken hata verebiliyor,
// o durumda bildirim Android'in varsayılan kanalından gider.
async function ensureChannel(): Promise<string | undefined> {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Hatırlatmalar',
      importance: AndroidImportance.HIGH,
    });
    return CHANNEL_ID;
  } catch (error) {
    console.warn('Bildirim kanalı oluşturulamadı', error);
    return undefined;
  }
}

// Android hiç sorulmamışken de "denied" diyor. Bu yüzden yeniden sorulup sorulamayacağına bakıyoruz:
// sorulabiliyorsa karar henüz verilmemiş sayılır, sorulamıyorsa yalnızca ayarlardan açılabilir.
function toReminderPermission({
  granted,
  canAskAgain,
}: Notifications.NotificationPermissionsStatus): ReminderPermission {
  if (granted) {
    return 'granted';
  }
  return canAskAgain ? 'undetermined' : 'denied';
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  return toReminderPermission(await Notifications.getPermissionsAsync());
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  await ensureChannel();
  const permission = toReminderPermission(await Notifications.requestPermissionsAsync());
  permissionChanges.notify();
  return permission;
}

// Planı her seferinde baştan kurar: böylece değişen ve yapılan kayıtların eski bildirimi kalmaz.
async function rebuildReminders() {
  if ((await getReminderPermission()) !== 'granted') {
    return;
  }
  const channelId = await ensureChannel();

  const [pets, records, tasks, visits] = await Promise.all([
    listPets(),
    listHealthRecords(),
    listTasks(),
    listVisits(),
  ]);
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of planReminders(pets, records, tasks, visits)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        categoryIdentifier: reminder.task ? TASK_CATEGORY : undefined,
        data: {
          url: reminder.url,
          taskId: reminder.task?.id,
          occurrence: reminder.task?.occurrence,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId,
      },
    });
  }
}

let lastSync: Promise<void> = Promise.resolve();

// Aynı anda iki kurulum çalışırsa bildirimler çiftlenir, bu yüzden sıraya giriyorlar.
export function syncReminders() {
  lastSync = lastSync.catch(() => undefined).then(rebuildReminders);
  return lastSync;
}

// Kayıt değişti. Hatırlatma kurulamazsa kayıt yine geçerli, kullanıcıyı durdurmuyoruz.
export async function refreshReminders({ askPermission = false } = {}) {
  try {
    if (askPermission) {
      await requestReminderPermission();
    }
    await syncReminders();
  } catch (error) {
    console.warn('Hatırlatmalar kurulamadı', error);
  }
}

export async function showSightingNotification(title: string, body: string, url: string) {
  if ((await getReminderPermission()) !== 'granted') {
    return;
  }
  const channelId = await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url } },
    trigger: channelId ? { channelId } : null,
  });
}

// Bildirimdeki "Yapıldı" ve "1 saat sonra" düğmeleri. Dokunulan bunlardan biri değilse false döner.
export async function handleTaskAction({
  actionIdentifier,
  notification,
}: Notifications.NotificationResponse) {
  const { taskId, occurrence } = notification.request.content.data ?? {};
  if (typeof taskId !== 'string' || typeof occurrence !== 'string') {
    return false;
  }

  if (actionIdentifier === TASK_DONE_ACTION) {
    await setTaskCompleted(taskId, occurrence, true);
  } else if (actionIdentifier === TASK_SNOOZE_ACTION) {
    await snoozeTask(taskId, occurrence, new Date(Date.now() + SNOOZE_MS));
  } else {
    return false;
  }

  // Android düğmeye basılan bildirimi ekranda bırakıyor. Kapanmazsa da işlem tamamdır.
  Notifications.dismissNotificationAsync(notification.request.identifier).catch((error) =>
    console.warn('Bildirim kapatılamadı', error),
  );
  await refreshReminders();
  return true;
}
