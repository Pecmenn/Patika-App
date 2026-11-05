import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { handleTaskAction } from '@/lib/reminders';

function openFromNotification(notification: Notifications.Notification) {
  const url = notification.request.content.data?.url;
  if (typeof url !== 'string') {
    return;
  }
  // Bugün ekranı yığının en altında durur. Üstünde başka ekran yoksa zaten oradayız.
  if (url === '/today') {
    if (router.canDismiss()) {
      router.dismissTo(url);
    }
    return;
  }
  router.push(url as Href);
}

async function handleResponse(response: Notifications.NotificationResponse) {
  Notifications.clearLastNotificationResponse();
  try {
    if (await handleTaskAction(response)) {
      return;
    }
  } catch (error) {
    console.warn('Bildirim düğmesi işlenemedi', error);
  }
  if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    openFromNotification(response.notification);
  }
}

// Bildirime ve düğmelerine dokunulunca ne olacağını belirler. Ekranda bir şey çizmez.
// Gezinme hazır olduktan sonra çalışsın diye Stack'in yanında durur.
export function NotificationObserver() {
  useEffect(() => {
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      handleResponse(lastResponse);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);

  return null;
}
