import { Image } from 'expo-image';
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { StyleSheet, View } from 'react-native';

import { SPECIES } from '@/constants/species';
import { colors } from '@/constants/theme';
import type { Species } from '@/data/pets';

type PetAvatarProps = {
  size: number;
  species: Species | null;
  photoUri: string | null;
};

export function PetAvatar({ size, species, photoUri }: PetAvatarProps) {
  const info = species ? SPECIES[species] : null;
  const Icon = info?.Icon ?? PawPrintIcon;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, backgroundColor: info?.color ?? colors.line },
      ]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} contentFit="cover" style={StyleSheet.absoluteFill} transition={150} />
      ) : (
        <Icon size={size * 0.5} weight="duotone" color={colors.ink} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
});
