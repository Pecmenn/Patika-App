import { SPECIES } from '@/constants/species';
import type { Pet } from '@/data/pets';
import { ageLabel } from '@/lib/dates';

export function petBreedLabel(pet: Pet) {
  return pet.breed ?? SPECIES[pet.species].label;
}

export function petAge(pet: Pet) {
  return pet.birthDate ? ageLabel(pet.birthDate, pet.birthDateIsApproximate) : null;
}

export function petSummary(pet: Pet) {
  return [petBreedLabel(pet), petAge(pet)].filter(Boolean).join(', ');
}
