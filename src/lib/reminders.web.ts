// Tarayıcı önizlemesi için: yerel bildirimler yalnızca telefonda çalışıyor.
export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

export function subscribeToReminderPermission(_listener: () => void) {
  return () => {};
}

export function configureReminders() {}

export async function getReminderPermission(): Promise<ReminderPermission> {
  return 'granted';
}

export async function getRemindersEnabled() {
  return true;
}

export async function setRemindersEnabled(_isEnabled: boolean) {}

export type ReminderState = { permission: ReminderPermission; isEnabled: boolean };

export async function getReminderState(): Promise<ReminderState> {
  return { permission: 'granted', isEnabled: true };
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  return 'granted';
}

export async function syncReminders() {}

export async function refreshReminders(_options?: { askPermission?: boolean }) {}

export async function showInstantNotification(_title: string, _body: string, _url: string) {}
