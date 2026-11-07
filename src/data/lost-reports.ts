import { handleAppointmentEvent, refreshAppointments } from '@/data/appointments';
import { petPhotoExists, readPetPhotoBytes } from '@/data/pet-photo-storage';
import { listPets, type Pet, type Species } from '@/data/pets';
import { API_URL, apiRequest } from '@/lib/api';
import { createChangeSignal } from '@/lib/change-signal';
import { openEventStream } from '@/lib/realtime';
import { showInstantNotification } from '@/lib/reminders';
import { getSession } from '@/lib/session';

// Kayıp ilanları telefonda tutulmaz, başkalarının ulaşması gerektiği için doğrudan sunucudadır.

export type LostReport = {
  id: string;
  petId: string;
  petName: string;
  species: Species;
  breed: string | null;
  description: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  lastSeenArea: string;
  lastSeenLat: number;
  lastSeenLng: number;
  lastSeenAt: Date;
  startedAt: Date;
  foundAt: Date | null;
  removedAt: Date | null;
};

export type Sighting = {
  id: string;
  place: string | null;
  lat: number | null;
  lng: number | null;
  message: string | null;
  contact: string | null;
  createdAt: Date;
};

// İlan açık değilken künyedeki QR'dan gelen haber.
export type PetMessage = Sighting & { petId: string };

export type NewLostReport = {
  pet: Pet;
  lastSeenArea: string;
  lastSeenLat: number;
  lastSeenLng: number;
  lastSeenAt: Date;
  description: string | null;
};

type ReportRow = {
  id: string;
  pet_id: string;
  pet_name: string;
  species: Species;
  breed: string | null;
  description: string | null;
  photo_path: string | null;
  last_seen_area: string;
  last_seen_lat: number;
  last_seen_lng: number;
  last_seen_at: string;
  started_at: string;
  found_at: string | null;
  removed_at: string | null;
};

type SightingRow = {
  id: string;
  report_id: string | null;
  pet_id: string;
  place: string | null;
  lat: number | null;
  lng: number | null;
  message: string | null;
  contact: string | null;
  created_at: string;
};

function toReport(row: ReportRow): LostReport {
  return {
    id: row.id,
    petId: row.pet_id,
    petName: row.pet_name,
    species: row.species,
    breed: row.breed,
    description: row.description,
    photoPath: row.photo_path,
    photoUrl: row.photo_path
      ? `${API_URL}/v1/public/photos/${encodeURIComponent(row.photo_path)}`
      : null,
    lastSeenArea: row.last_seen_area,
    lastSeenLat: row.last_seen_lat,
    lastSeenLng: row.last_seen_lng,
    lastSeenAt: new Date(row.last_seen_at),
    startedAt: new Date(row.started_at),
    foundAt: row.found_at ? new Date(row.found_at) : null,
    removedAt: row.removed_at ? new Date(row.removed_at) : null,
  };
}

function toSighting(row: SightingRow): Sighting {
  return {
    id: row.id,
    place: row.place,
    lat: row.lat,
    lng: row.lng,
    message: row.message,
    contact: row.contact,
    createdAt: new Date(row.created_at),
  };
}

const reportChanges = createChangeSignal();
export const subscribeToReports = reportChanges.subscribe;

const sightingChanges = createChangeSignal();
export const subscribeToSightings = sightingChanges.subscribe;

const petPath = (petId: string) => `/v1/pets/${encodeURIComponent(petId)}`;

// Hata gizlenmez: hesap silme onayında internet yokken "açık ilan yok" sanılmasın.
export async function readActiveReports(): Promise<LostReport[]> {
  const { reports } = await apiRequest<{ reports: ReportRow[] }>('/v1/lost-reports?active=true');
  return reports.map(toReport);
}

// Bugün ekranı içindir: internet yoksa ya da giriş yapılmamışsa boş döner, ekranı durdurmaz.
export async function listActiveReports(): Promise<LostReport[]> {
  if (!(await getSession())) {
    return [];
  }
  try {
    return await readActiveReports();
  } catch (error) {
    console.warn('Kayıp ilanları okunamadı', error);
    return [];
  }
}

export async function getLostDetails(id: string) {
  const data = await apiRequest<{
    report: ReportRow;
    sightings: SightingRow[];
    public_code: string;
  }>(`/v1/lost-reports/${encodeURIComponent(id)}`);
  return {
    report: toReport(data.report),
    sightings: data.sightings.map(toSighting),
    publicCode: data.public_code,
  };
}

// Hayvanın değişmeyen kodu. Yoksa sunucu oluşturur. QR kodu bu kodu taşır.
export async function ensurePublicCode(petId: string) {
  const { public_code: code } = await apiRequest<{ public_code: string }>(
    `${petPath(petId)}/public-code`,
  );
  return code;
}

// Bugün ekranı içindir: internet yoksa ya da giriş yapılmamışsa boş döner, ekranı durdurmaz.
export async function listPetMessages(): Promise<PetMessage[]> {
  if (!(await getSession())) {
    return [];
  }
  try {
    const { messages } = await apiRequest<{ messages: SightingRow[] }>('/v1/pet-messages');
    return messages.map((row) => ({ ...toSighting(row), petId: row.pet_id }));
  } catch (error) {
    console.warn('Haberler okunamadı', error);
    return [];
  }
}

export async function deletePetMessages(petId: string) {
  await apiRequest(`${petPath(petId)}/messages`, { method: 'DELETE' });
  sightingChanges.notify();
}

// Fotoğraf yüklenemezse ilan yine açık kalır: kayıp hayvan için fotoğrafı beklemek olmaz.
// Yükleme, ilan ekranı her açıldığında yeniden denenir (retryMissingPhoto).
async function uploadReportPhoto(reportId: string, pet: Pet) {
  if (!pet.photo || !petPhotoExists(pet.photo)) {
    return false;
  }
  try {
    const photo = await readPetPhotoBytes(pet.photo);
    if (photo.byteLength === 0) {
      return false;
    }
    await apiRequest(`/v1/lost-reports/${encodeURIComponent(reportId)}/photo`, {
      method: 'PUT',
      photo,
    });
    return true;
  } catch (error) {
    console.warn('İlan fotoğrafı yüklenemedi', error);
    return false;
  }
}

const PHOTO_RETRY_MS = 60_000;
const lastPhotoAttempts = new Map<string, number>();

// Açık ilanda fotoğraf yoksa ve hayvanın fotoğrafı varsa yeniden yüklemeyi dener.
export async function retryMissingPhoto(report: LostReport) {
  if (report.photoPath || report.foundAt) {
    return false;
  }
  const last = lastPhotoAttempts.get(report.id) ?? 0;
  if (Date.now() - last < PHOTO_RETRY_MS) {
    return false;
  }
  lastPhotoAttempts.set(report.id, Date.now());
  const pet = (await listPets()).find((candidate) => candidate.id === report.petId);
  return pet ? uploadReportPhoto(report.id, pet) : false;
}

// Bu hayvanın zaten açık bir ilanı varsa yenisi açılmaz, sunucu açık olanı döner.
export async function startLostReport(input: NewLostReport): Promise<string> {
  const { pet } = input;
  const { id, has_photo: hasPhoto } = await apiRequest<{ id: string; has_photo: boolean }>(
    '/v1/lost-reports',
    {
      method: 'POST',
      body: {
        pet_id: pet.id,
        pet_name: pet.name,
        species: pet.species,
        breed: pet.breed,
        description: input.description,
        last_seen_area: input.lastSeenArea,
        last_seen_lat: input.lastSeenLat,
        last_seen_lng: input.lastSeenLng,
        last_seen_at: input.lastSeenAt.toISOString(),
      },
    },
  );
  if (!hasPhoto) {
    await uploadReportPhoto(id, pet);
  }
  reportChanges.notify();
  sightingChanges.notify();
  return id;
}

// Bulununca herkese açık fotoğraf sunucuda silinir.
export async function markFound({ id }: LostReport) {
  await apiRequest(`/v1/lost-reports/${encodeURIComponent(id)}/found`, { method: 'POST' });
  reportChanges.notify();
}

export async function deleteReportsOfPet(petId: string) {
  if (!(await getSession())) {
    return;
  }
  await apiRequest(`${petPath(petId)}/lost-data`, { method: 'DELETE' });
  reportChanges.notify();
  sightingChanges.notify();
}

function sightingSummary({ place, message }: SightingRow) {
  return [place, message].filter(Boolean).join('. ') || 'Konum paylaşıldı.';
}

async function notifySighting(row: SightingRow) {
  if (row.report_id) {
    const report = await apiRequest<{ report: ReportRow }>(
      `/v1/lost-reports/${encodeURIComponent(row.report_id)}`,
    ).catch(() => null);
    await showInstantNotification(
      `Yeni ihbar: ${report?.report.pet_name ?? 'hayvanın'}`,
      sightingSummary(row),
      `/lost/${row.report_id}`,
    );
    return;
  }
  const pet = (await listPets()).find((candidate) => candidate.id === row.pet_id);
  await showInstantNotification(
    `${pet?.name ?? 'Hayvanın'} için haber var`,
    sightingSummary(row),
    `/pet-messages/${row.pet_id}`,
  );
}

// Uygulama açıkken gelen ihbarı ve randevu haberini anında bildirir.
// Kapalıyken bildirim için kendi derlememiz gerekecek.
export function watchLiveEvents(token: string) {
  return openEventStream(
    token,
    (event) => {
      if (event.type === 'sighting') {
        sightingChanges.notify();
        notifySighting(event.sighting as SightingRow).catch((error) => {
          console.warn('İhbar bildirimi gösterilemedi', error);
        });
      } else if (event.type === 'appointment') {
        handleAppointmentEvent(event).catch((error) => {
          console.warn('Randevu bildirimi gösterilemedi', error);
        });
      } else if (event.type === 'lost_removed') {
        reportChanges.notify();
        sightingChanges.notify();
        showInstantNotification(
          'İlanın kaldırıldı',
          `${event.pet_name} ilanı Patika yönetimi tarafından kaldırıldı.`,
          `/lost/${event.report_id}`,
        ).catch((error) => {
          console.warn('İlan bildirimi gösterilemedi', error);
        });
      }
    },
    // Bağlantı yokken gelmiş olabilecekler ekranlara yansısın.
    () => {
      sightingChanges.notify();
      refreshAppointments();
    },
  );
}
