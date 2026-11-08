import { Image } from 'expo-image';
import { StorefrontIcon } from 'phosphor-react-native/src/icons/Storefront';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

// Kliniğin fotoğrafı. Fotoğraf yoksa simge.
export function ClinicThumb({ uri, size }: { uri: string | null; size: number }) {
  return (
    <View style={[styles.thumb, { width: size, height: size, borderRadius: size * 0.26 }]}>
      {uri ? (
        <Image contentFit="cover" source={{ uri }} style={StyleSheet.absoluteFill} transition={150} />
      ) : (
        <StorefrontIcon size={size * 0.45} weight="duotone" color={colors.ink} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.skySoft,
  },
});
