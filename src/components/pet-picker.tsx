import { StyleSheet, Text, View } from 'react-native';

import { PetAvatar } from '@/components/pet-avatar';
import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import type { Pet } from '@/data/pets';
import { selectionHaptic } from '@/lib/haptics';

type PetPickerProps = {
  pets: Pet[];
  value: string | undefined;
  onChange: (petId: string) => void;
};

// "Kim için?" sorusu: fotoğraflı küçük seçenekler, aynı anda yalnızca biri seçili.
export function PetPicker({ pets, value, onChange }: PetPickerProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.pets}>
      {pets.map((candidate) => {
        const isSelected = candidate.id === value;
        return (
          <Tappable
            key={candidate.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={() => {
              if (!isSelected) {
                selectionHaptic();
              }
              onChange(candidate.id);
            }}
            style={[styles.pet, isSelected && styles.petSelected]}>
            <PetAvatar
              photoUri={candidate.photo ? resolvePetPhotoUri(candidate.photo) : null}
              size={28}
              species={candidate.species}
            />
            <Text style={[styles.petName, isSelected && styles.petNameSelected]}>
              {candidate.name}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  pet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 42,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  petSelected: {
    borderColor: colors.paw,
    backgroundColor: colors.paw,
  },
  petName: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  petNameSelected: {
    fontFamily: fonts.uiHeavy,
  },
});
