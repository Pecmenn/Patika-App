import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { handleTaskAction } from '@/lib/reminders';

function openFromNotification(notification: Notifications.Notification, isColdStart: boolean) {
  const url = notification.request.content.data?.url;
  if (typeof url !== 'string') {
    return;
  }
  if (url !== '/today') {
    router.push(url as Href);
    return;
  }
  // Uygulama yeni açılıyorsa zaten Bugün'e gidiyor. Açıksa üstteki ekranları kapatıp o sekmeye geçer.
  if (isColdStart) {
    return;
  }
  if (router.canDismiss()) {
    router.dismissTo(url);
  } else {
    router.navigate(url);
  }
}

async function handleResponse(
  response: Notifications.NotificationResponse,
  isColdStart: boolean,
) {
  Notifications.clearLastNotificationResponse();
  try {
    if (await handleTaskAction(response)) {
      return;
    }
  } catch (error) {
    console.warn('Bildirim düğmesi işlenemedi', error);
  }
  if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    openFromNotification(response.notification, isColdStart);
  }
}

// Bildirime ve düğmelerine dokunulunca ne olacağını belirler. Ekranda bir şey çizmez.
// Gezinme hazır olduktan sonra çalışsın diye Stack'in yanında durur.
export function NotificationObserver() {
  useEffect(() => {
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      handleResponse(lastResponse, true);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      handleResponse(response, false),
    );
    return () => subscription.remove();
  }, []);

  return null;
}
