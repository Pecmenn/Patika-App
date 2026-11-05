import { BirdIcon } from 'phosphor-react-native/src/icons/Bird';
import { CatIcon } from 'phosphor-react-native/src/icons/Cat';
import { DogIcon } from 'phosphor-react-native/src/icons/Dog';
import { RabbitIcon } from 'phosphor-react-native/src/icons/Rabbit';

import { colors } from '@/constants/theme';
import type { Species } from '@/data/pets';

export const SPECIES = {
  cat: { label: 'Kedi', Icon: CatIcon, color: colors.paw },
  dog: { label: 'Köpek', Icon: DogIcon, color: colors.sky },
  rabbit: { label: 'Tavşan', Icon: RabbitIcon, color: colors.paw },
  bird: { label: 'Kuş', Icon: BirdIcon, color: colors.sky },
} as const satisfies Record<Species, unknown>;

export const SPECIES_KEYS = Object.keys(SPECIES) as Species[];
