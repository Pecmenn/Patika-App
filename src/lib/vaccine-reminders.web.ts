// Tarayıcı önizlemesi için: yerel bildirimler yalnızca telefonda çalışıyor.
export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

export function configureReminders() {}

export async function getReminderPermission(): Promise<ReminderPermission> {
  return 'granted';
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  return 'granted';
}

export async function syncVaccineReminders() {}
