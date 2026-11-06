import { useEffect } from 'react';

import { watchLiveEvents } from '@/data/lost-reports';
import { useSession } from '@/hooks/use-session';

// Giriş yapılmışsa yeni ihbarları ve randevu haberlerini dinler. Ekranda bir şey çizmez.
export function LostWatcher() {
  const session = useSession();
  const token = session?.token;

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    return watchLiveEvents(token);
  }, [token]);

  return null;
}
