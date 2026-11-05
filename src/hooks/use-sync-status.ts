import { useSyncExternalStore } from 'react';

import { getSyncStatus, subscribeToSyncStatus } from '@/data/sync';

export function useSyncStatus() {
  return useSyncExternalStore(subscribeToSyncStatus, getSyncStatus);
}
