import type { Species } from '@/data/pets';
import { API_URL, apiRequest } from '@/lib/api';
import type { Clinic, ClinicService, DayHours } from '@/lib/clinics';

// Klinik bilgileri telefonda tutulmaz, doğrudan sunucudan okunur.

export type ClinicRow = {
  id: string;
  name: string;
  vet_name: string;
  phone: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
  hours: DayHours[];
  slot_minutes: number;
  species: Species[];
  services: ClinicService[];
  description: string | null;
  website: string | null;
  instagram: string | null;
  photo_path: string | null;
};

export function toClinic(row: ClinicRow): Clinic {
  return {
    id: row.id,
    name: row.name,
    vetName: row.vet_name,
    phone: row.phone,
    address: row.address,
    area: row.area,
    latitude: row.lat,
    longitude: row.lng,
    hours: row.hours,
    slotMinutes: row.slot_minutes,
    species: row.species,
    services: row.services,
    description: row.description,
    website: row.website,
    instagram: row.instagram,
    photoUrl: row.photo_path
      ? `${API_URL}/v1/public/clinic-photos/${encodeURIComponent(row.photo_path)}`
      : null,
  };
}

const publicOptions = { isPublic: true };

// Konum sunucuya gitmez: liste indirilir, yakınlık sıralaması telefonda yapılır.
export async function fetchClinics(): Promise<Clinic[]> {
  const { clinics } = await apiRequest<{ clinics: ClinicRow[] }>('/v1/public/clinics', publicOptions);
  return clinics.map(toClinic);
}

export async function fetchClinic(id: string): Promise<Clinic> {
  const { clinic } = await apiRequest<{ clinic: ClinicRow }>(
    `/v1/public/clinics/${encodeURIComponent(id)}`,
    publicOptions,
  );
  return toClinic(clinic);
}

export async function fetchFreeTimes(id: string, date: string): Promise<string[]> {
  const { times } = await apiRequest<{ times: string[] }>(
    `/v1/public/clinics/${encodeURIComponent(id)}/slots?date=${date}`,
    publicOptions,
  );
  return times;
}
