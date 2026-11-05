import { petPhotoExists, readPetPhotoBytes } from '@/data/pet-photo-storage';
import type { Pet, Species } from '@/data/pets';
import { createChangeSignal } from '@/lib/change-signal';
import { showSightingNotification } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';

// Kayıp ilanları telefonda tutulmaz, başkalarının ulaşması gerektiği için doğrudan sunucudadır.
const PHOTO_BUCKET = 'lost-photos';
const ALREADY_EXISTS_CODE = '23505';

export type LostReport = {
  id: string;
  petId: string;
  petName: string;
  species: Species;
  description: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  lastSeenArea: string;
  lastSeenLat: number;
  lastSeenLng: number;
  lastSeenAt: Date;
  startedAt: Date;
  foundAt: Date | null;
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
  description: string | null;
  photo_path: string | null;
  last_seen_area: string;
  last_seen_lat: number;
  last_seen_lng: number;
  last_seen_at: string;
  started_at: string;
  found_at: string | null;
};

type SightingRow = {
  id: string;
  report_id: string;
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
    description: row.description,
    photoPath: row.photo_path,
    photoUrl: row.photo_path
      ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(row.photo_path).data.publicUrl
      : null,
    lastSeenArea: row.last_seen_area,
    lastSeenLat: row.last_seen_lat,
    lastSeenLng: row.last_seen_lng,
    lastSeenAt: new Date(row.last_seen_at),
    startedAt: new Date(row.started_at),
    foundAt: row.found_at ? new Date(row.found_at) : null,
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

async function currentUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// Bugün ekranı içindir: internet yoksa ya da giriş yapılmamışsa boş döner, ekranı durdurmaz.
export async function listActiveReports(): Promise<LostReport[]> {
  if (!(await currentUserId())) {
    return [];
  }
  const { data, error } = await supabase
    .from('lost_reports')
    .select('*')
    .is('found_at', null)
    .order('started_at', { ascending: false });
  if (error) {
    console.warn('Kayıp ilanları okunamadı', error);
    return [];
  }
  return (data as ReportRow[]).map(toReport);
}

export async function getLostDetails(id: string) {
  const [reportResult, sightingsResult] = await Promise.all([
    supabase.from('lost_reports').select('*').eq('id', id).single(),
    supabase
      .from('sightings')
      .select('*')
      .eq('report_id', id)
      .order('created_at', { ascending: false }),
  ]);
  if (reportResult.error) {
    throw reportResult.error;
  }
  if (sightingsResult.error) {
    throw sightingsResult.error;
  }
  const report = toReport(reportResult.data as ReportRow);
  const { data: tag } = await supabase
    .from('pet_tags')
    .select('public_code')
    .eq('pet_id', report.petId)
    .maybeSingle();
  return {
    report,
    sightings: (sightingsResult.data as SightingRow[]).map(toSighting),
    publicCode: (tag?.public_code as string | undefined) ?? null,
  };
}

// Fotoğraf yüklenemezse ilan yine açılır: kayıp hayvan için fotoğrafı beklemek olmaz.
async function uploadReportPhoto(userId: string, pet: Pet) {
  if (!pet.photo || !petPhotoExists(pet.photo)) {
    return null;
  }
  const path = `${userId}/${pet.id}-${Date.now()}.jpg`;
  try {
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, await readPetPhotoBytes(pet.photo), { contentType: 'image/jpeg' });
    if (error) {
      throw error;
    }
    return path;
  } catch (error) {
    console.warn('İlan fotoğrafı yüklenemedi', error);
    return null;
  }
}

export async function startLostReport(input: NewLostReport): Promise<string> {
  const userId = await currentUserId();
  if (!userId) {
    throw new Error('Giriş yapılmadı');
  }
  const { pet } = input;

  const tag = await supabase
    .from('pet_tags')
    .upsert({ owner_id: userId, pet_id: pet.id }, { ignoreDuplicates: true });
  if (tag.error) {
    throw tag.error;
  }

  const { data, error } = await supabase
    .from('lost_reports')
    .insert({
      owner_id: userId,
      pet_id: pet.id,
      pet_name: pet.name,
      species: pet.species,
      breed: pet.breed,
      description: input.description,
      photo_path: await uploadReportPhoto(userId, pet),
      last_seen_area: input.lastSeenArea,
      last_seen_lat: input.lastSeenLat,
      last_seen_lng: input.lastSeenLng,
      last_seen_at: input.lastSeenAt.toISOString(),
    })
    .select('id')
    .single();

  // Bu hayvanın zaten açık bir ilanı varsa yenisini açmak yerine ona gidilir.
  if (error?.code === ALREADY_EXISTS_CODE) {
    const existing = await supabase
      .from('lost_reports')
      .select('id')
      .eq('pet_id', pet.id)
      .is('found_at', null)
      .single();
    if (existing.error) {
      throw existing.error;
    }
    return existing.data.id as string;
  }
  if (error) {
    throw error;
  }
  reportChanges.notify();
  return data.id as string;
}

async function removeReportPhotos(paths: string[]) {
  if (paths.length === 0) {
    return;
  }
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) {
    console.warn('İlan fotoğrafı silinemedi', error);
  }
}

// Bulununca herkese açık fotoğraf kaldırılır.
export async function markFound({ id, photoPath }: LostReport) {
  const { error } = await supabase
    .from('lost_reports')
    .update({ found_at: new Date().toISOString(), photo_path: null })
    .eq('id', id);
  if (error) {
    throw error;
  }
  await removeReportPhotos(photoPath ? [photoPath] : []);
  reportChanges.notify();
}

export async function deleteReportsOfPet(petId: string) {
  if (!(await currentUserId())) {
    return;
  }
  const { data, error } = await supabase
    .from('lost_reports')
    .delete()
    .eq('pet_id', petId)
    .select('photo_path');
  if (error) {
    throw error;
  }
  await removeReportPhotos(
    (data as { photo_path: string | null }[]).flatMap(({ photo_path: path }) =>
      path ? [path] : [],
    ),
  );
  await supabase.from('pet_tags').delete().eq('pet_id', petId);
  reportChanges.notify();
}

function sightingSummary({ place, message }: SightingRow) {
  return [place, message].filter(Boolean).join('. ') || 'Konum paylaşıldı.';
}

// Uygulama açıkken gelen ihbarı anında bildirir. Kapalıyken bildirim için kendi derlememiz gerekecek.
export function watchSightings() {
  const channel = supabase
    .channel('sightings-watch')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sightings' },
      async (payload) => {
        sightingChanges.notify();
        const row = payload.new as SightingRow;
        const { data } = await supabase
          .from('lost_reports')
          .select('pet_name')
          .eq('id', row.report_id)
          .single();
        await showSightingNotification(
          `Yeni ihbar: ${data?.pet_name ?? 'hayvanın'}`,
          sightingSummary(row),
          `/lost/${row.report_id}`,
        );
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
