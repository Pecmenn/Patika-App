import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

function openFromNotification(notification: Notifications.Notification) {
  const url = notification.request.content.data?.url;
  if (typeof url === 'string') {
    router.push(url as Href);
  }
}

// Bildirime dokununca ilgili hayvanın kayıt sayfasını açar. Ekranda bir şey çizmez.
// Gezinme hazır olduktan sonra çalışsın diye Stack'in yanında durur.
export function NotificationObserver() {
  useEffect(() => {
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      openFromNotification(lastResponse.notification);
      Notifications.clearLastNotificationResponse();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response.notification);
      Notifications.clearLastNotificationResponse();
    });
    return () => subscription.remove();
  }, []);

  return null;
}
