import { SPECIES } from '@/constants/species';
import type { Pet } from '@/data/pets';
import { ageLabel } from '@/lib/dates';

export function petSummary(pet: Pet) {
  const age = pet.birthDate ? ageLabel(pet.birthDate, pet.birthDateIsApproximate) : null;
  return [pet.breed ?? SPECIES[pet.species].label, age].filter(Boolean).join(', ');
}
