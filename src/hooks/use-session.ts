import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { getSession, subscribeToSession, wasSessionRejected, type Session } from '@/lib/session';

export function useSessionRejected() {
  return useSyncExternalStore(subscribeToSession, wasSessionRejected);
}

// Oturum okunurken undefined, giriş yapılmamışsa null döner.
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let isActive = true;
    const read = () => {
      getSession()
        .then((next) => {
          if (isActive) {
            setSession(next);
          }
        })
        .catch((error) => console.warn('Oturum okunamadı', error));
    };
    read();
    const unsubscribe = subscribeToSession(read);
    // Telefon kilitliyken okunamadıysa uygulama öne gelince yeniden denenir.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        read();
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
      appState.remove();
    };
  }, []);

  return session;
}
