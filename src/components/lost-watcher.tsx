import { useEffect } from 'react';

import { watchSightings } from '@/data/lost-reports';
import { useSession } from '@/hooks/use-session';

// Giriş yapılmışsa yeni ihbarları dinler. Ekranda bir şey çizmez.
export function LostWatcher() {
  const session = useSession();
  const token = session?.token;

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    return watchSightings(token);
  }, [token]);

  return null;
}
