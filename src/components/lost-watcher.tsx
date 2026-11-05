import { useEffect } from 'react';

import { watchSightings } from '@/data/lost-reports';
import { useSession } from '@/hooks/use-session';

// Giriş yapılmışsa yeni ihbarları dinler. Ekranda bir şey çizmez.
export function LostWatcher() {
  const session = useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      return undefined;
    }
    return watchSightings();
  }, [userId]);

  return null;
}
