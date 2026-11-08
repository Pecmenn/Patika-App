import type { Pet } from '@/data/pets';
import { syncNow } from '@/data/sync';
import { apiRequest } from '@/lib/api';
import { createChangeSignal } from '@/lib/change-signal';
import { formatAppointmentWhen, type AppointmentStatus } from '@/lib/clinics';
import { ageLabel } from '@/lib/dates';
import type { ServerEvent } from '@/lib/realtime';
import { showInstantNotification } from '@/lib/reminders';
import { getSession } from '@/lib/session';

// Randevular telefonda tutulmaz, iki taraf da sunucudan okur.
// Onaylanan randevu sunucuda sahibin ziyaretlerine yazılır, telefona eşitlemeyle gelir.

export type Appointment = {
  id: string;
  clinicId: string | null;
  clinicName: string;
  clinicPhone: string | null;
  clinicAddress: string | null;
  petId: string;
  petName: string;
  species: string;
  breed: string | null;
  petAge: string | null;
  ownerName: string;
  ownerPhone: string;
  reason: string;
  note: string | null;
  date: string;
  time: string;
  status: AppointmentStatus;
  cancelledBy: 'owner' | 'vet' | null;
  vetNote: string | null;
  respondedAt: Date | null;
};

type AppointmentRow = {
  id: string;
  clinic_id: string | null;
  clinic_name: string;
  clinic_phone?: string | null;
  clinic_address?: string | null;
  pet_id: string;
  pet_name: string;
  species: string;
  breed: string | null;
  pet_age: string | null;
  owner_name: string;
  owner_phone: string;
  reason: string;
  note: string | null;
  date: string;
  time: string;
  status: AppointmentStatus;
  cancelled_by: 'owner' | 'vet' | null;
  vet_note: string | null;
  responded_at: string | null;
};

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    clinicName: row.clinic_name,
    clinicPhone: row.clinic_phone ?? null,
    clinicAddress: row.clinic_address ?? null,
    petId: row.pet_id,
    petName: row.pet_name,
    species: row.species,
    breed: row.breed,
    petAge: row.pet_age,
    ownerName: row.owner_name,
    ownerPhone: row.owner_phone,
    reason: row.reason,
    note: row.note,
    date: row.date,
    time: row.time,
    status: row.status,
    cancelledBy: row.cancelled_by,
    vetNote: row.vet_note,
    respondedAt: row.responded_at ? new Date(row.responded_at) : null,
  };
}

const changes = createChangeSignal();
export const subscribeToAppointments = changes.subscribe;

// Sahibin randevuları. Girişsiz ya da internetsizken boş döner, ekranı durdurmaz.
export async function listMyAppointments(): Promise<Appointment[]> {
  try {
    return await readMyAppointments();
  } catch (error) {
    console.warn('Randevular okunamadı', error);
    return [];
  }
}

// Randevularım ekranı için: hata gizlenmez, internet yokken "Henüz randevun yok" yazmasın.
export async function readMyAppointments(): Promise<Appointment[]> {
  const session = await getSession();
  if (!session || session.user.role === 'vet') {
    return [];
  }
  const { appointments } = await apiRequest<{ appointments: AppointmentRow[] }>('/v1/appointments');
  return appointments.map(toAppointment);
}

export type NewAppointment = {
  clinicId: string;
  pet: Pet;
  ownerName: string;
  ownerPhone: string;
  reason: string;
  note: string | null;
  date: string;
  time: string;
};

export async function requestAppointment(input: NewAppointment) {
  await apiRequest('/v1/appointments', {
    method: 'POST',
    body: {
      clinic_id: input.clinicId,
      pet_id: input.pet.id,
      pet_name: input.pet.name,
      species: input.pet.species,
      breed: input.pet.breed,
      pet_age: input.pet.birthDate
        ? ageLabel(input.pet.birthDate, input.pet.birthDateIsApproximate)
        : null,
      owner_name: input.ownerName,
      owner_phone: input.ownerPhone,
      reason: input.reason,
      note: input.note,
      date: input.date,
      time: input.time,
    },
  });
  changes.notify();
}

export async function cancelMyAppointment(id: string) {
  await apiRequest(`/v1/appointments/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  changes.notify();
  await syncNow();
}

export async function listClinicAppointments(scope: 'active' | 'past'): Promise<Appointment[]> {
  const { appointments } = await apiRequest<{ appointments: AppointmentRow[] }>(
    `/v1/clinic/appointments?scope=${scope}`,
  );
  return appointments.map(toAppointment);
}

export async function fetchClinicAppointment(id: string): Promise<Appointment> {
  const { appointment } = await apiRequest<{ appointment: AppointmentRow }>(
    `/v1/clinic/appointments/${encodeURIComponent(id)}`,
  );
  return toAppointment(appointment);
}

export async function respondToAppointment(
  id: string,
  action: 'confirm' | 'reject' | 'cancel',
  note: string | null,
) {
  await apiRequest(`/v1/clinic/appointments/${encodeURIComponent(id)}/${action}`, {
    method: 'POST',
    body: { note },
  });
  changes.notify();
}

function ownerNotice(status: unknown) {
  if (status === 'confirmed') {
    return 'Randevun onaylandı';
  }
  if (status === 'rejected') {
    return 'Randevu isteğin reddedildi';
  }
  return status === 'cancelled' ? 'Randevun iptal edildi' : null;
}

function vetNotice(status: unknown) {
  if (status === 'pending') {
    return 'Yeni randevu isteği';
  }
  return status === 'cancelled' ? 'Randevu iptal edildi' : null;
}

// Uygulama açıkken gelen randevu haberi. Kapalıyken bildirim için kendi derlememiz gerekecek.
export async function handleAppointmentEvent(event: ServerEvent) {
  changes.notify();
  const session = await getSession();
  const isVet = session?.user.role === 'vet';
  if (!isVet) {
    // Onaylanan randevu ziyaretlere düşsün, iptal edilen kalksın.
    syncNow();
  }
  const title = isVet ? vetNotice(event.status) : ownerNotice(event.status);
  if (!title) {
    return;
  }
  const when = formatAppointmentWhen(String(event.date), String(event.time));
  await showInstantNotification(
    title,
    isVet ? `${String(event.pet_name)}, ${when}` : `${String(event.clinic_name)}, ${String(event.pet_name)}, ${when}`,
    isVet ? '/vet/appointments' : '/appointments',
  );
}

export function refreshAppointments() {
  changes.notify();
}
