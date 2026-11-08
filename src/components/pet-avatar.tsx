import { Image } from 'expo-image';
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { StyleSheet, Text, View } from 'react-native';

import { SPECIES } from '@/constants/species';
import { colors, fonts } from '@/constants/theme';
import type { Species } from '@/data/pets';
import { petInitial } from '@/lib/pet-facts';

type PetAvatarProps = {
  size: number;
  species: Species | null;
  photoUri: string | null;
  // Fotoğraf yoksa adın baş harfi görünür: aynı türden iki hayvan da birbirinden ayrılır.
  name?: string;
};

export function PetAvatar({ size, species, photoUri, name }: PetAvatarProps) {
  const info = species ? SPECIES[species] : null;
  const Icon = info?.Icon ?? PawPrintIcon;
  const initial = photoUri ? null : petInitial(name);

  return (
    // Avatar süs: adı zaten yanında yazıyor. Ekran okuyucu harfi kartın etiketine katmasın.
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        { width: size, height: size, backgroundColor: info?.color ?? colors.line },
      ]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} contentFit="cover" style={StyleSheet.absoluteFill} transition={150} />
      ) : initial ? (
        <Text
          allowFontScaling={false}
          style={[styles.initial, { fontSize: Math.round(size * 0.44), lineHeight: size }]}>
          {initial}
        </Text>
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
  initial: {
    fontFamily: fonts.display,
    color: colors.ink,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
