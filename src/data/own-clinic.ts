import { File } from 'expo-file-system';

import { toClinic, type ClinicRow } from '@/data/clinics';
import type { Species } from '@/data/pets';
import { apiRequest } from '@/lib/api';
import type { Clinic, ClinicService, DayHours } from '@/lib/clinics';

// Veterinerin kendi işletmesi.

export type ClinicApproval = 'pending' | 'approved' | 'rejected';
export type OwnClinic = Clinic & { approval: ClinicApproval; licenseNo: string };

type OwnClinicRow = ClinicRow & { status: ClinicApproval; license_no: string };

export type ClinicFields = {
  name: string;
  vetName: string;
  licenseNo: string;
  phone: string;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  hours: DayHours[];
  slotMinutes: number;
  species: Species[];
  services: ClinicService[];
  description: string | null;
  website: string | null;
  instagram: string | null;
};

function toOwnClinic(row: OwnClinicRow): OwnClinic {
  return { ...toClinic(row), approval: row.status, licenseNo: row.license_no };
}

export async function fetchOwnClinic(): Promise<OwnClinic | null> {
  const { clinic } = await apiRequest<{ clinic: OwnClinicRow | null }>('/v1/clinic');
  return clinic ? toOwnClinic(clinic) : null;
}

export async function saveOwnClinic(fields: ClinicFields): Promise<OwnClinic> {
  const { clinic } = await apiRequest<{ clinic: OwnClinicRow }>('/v1/clinic', {
    method: 'PUT',
    body: {
      name: fields.name,
      vet_name: fields.vetName,
      license_no: fields.licenseNo,
      phone: fields.phone,
      address: fields.address,
      area: fields.area,
      lat: fields.latitude,
      lng: fields.longitude,
      hours: fields.hours,
      slot_minutes: fields.slotMinutes,
      species: fields.species,
      services: fields.services,
      description: fields.description,
      website: fields.website,
      instagram: fields.instagram,
    },
  });
  return toOwnClinic(clinic);
}

export async function uploadOwnClinicPhoto(uri: string) {
  const photo = await new File(uri).arrayBuffer();
  await apiRequest('/v1/clinic/photo', { method: 'PUT', photo });
}
