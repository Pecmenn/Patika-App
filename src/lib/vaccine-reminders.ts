import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { listPets } from '@/data/pets';
import { listVaccines } from '@/data/vaccines';
import { planVaccineReminders } from '@/lib/reminder-plan';

const CHANNEL_ID = 'vaccine-reminders';

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

// Uygulama açıkken gelen bildirimler de ekranda görünsün.
export function configureReminders() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// iPhone'da bildirim kanalı yok. Android'de Expo Go kanal oluştururken hata verebiliyor,
// o durumda bildirim Android'in varsayılan kanalından gider.
async function ensureChannel(): Promise<string | undefined> {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Aşı hatırlatmaları',
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
  return toReminderPermission(await Notifications.requestPermissionsAsync());
}

// Planı her seferinde baştan kurar: böylece yeni doz eklenince eski hatırlatmalar kalmaz.
export async function syncVaccineReminders() {
  if ((await getReminderPermission()) !== 'granted') {
    return;
  }
  const channelId = await ensureChannel();

  const [pets, vaccines] = await Promise.all([listPets(), listVaccines()]);
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of planVaccineReminders(pets, vaccines)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { url: `/pet/${reminder.petId}` },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId,
      },
    });
  }
}
