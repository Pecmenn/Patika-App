import { Image, type ImageSource } from 'expo-image';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ScalesIcon } from 'phosphor-react-native/src/icons/Scales';
import { StyleSheet, Text, View } from 'react-native';

import { DecorativeQr } from '@/components/decorative-qr';
import { colors, fonts } from '@/constants/theme';

// Ölçüler tasarımdaki 393 noktalık ekrandan alındı, telefon genişliğine göre ölçeklenir.
const BASE_WIDTH = 393;
const BASE_HEIGHT = 372;
const ZEYTIN_RING = 8;

type PetPhotoProps = {
  source: ImageSource | number;
  size: number;
  zoom: number;
  focusY: number;
  backgroundColor: string;
};

function PetPhoto({ source, size, zoom, focusY, backgroundColor }: PetPhotoProps) {
  const imageSize = size * zoom;

  return (
    <View style={[styles.circle, { width: size, height: size, backgroundColor }]}>
      <Image
        source={source}
        style={{
          position: 'absolute',
          width: imageSize,
          height: imageSize,
          left: (size - imageSize) / 2,
          top: (size - imageSize) * focusY,
        }}
      />
    </View>
  );
}

export function WelcomeCollage({ width }: { width: number }) {
  const scale = width / BASE_WIDTH;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: BASE_HEIGHT * scale }}>
      <View style={[styles.canvas, { transform: [{ scale }] }]}>
        <View style={styles.mia}>
          <PetPhoto
            source={require('@/assets/images/pets/mia.jpg')}
            size={196}
            zoom={1.9}
            focusY={0.25}
            backgroundColor={colors.paw}
          />
        </View>

        <View style={styles.zeytinRing}>
          <PetPhoto
            source={require('@/assets/images/pets/zeytin.jpg')}
            size={222}
            zoom={1.5}
            focusY={0.2}
            backgroundColor={colors.sky}
          />
        </View>

        <View style={[styles.chip, styles.weight]}>
          <ScalesIcon size={17} weight="bold" color={colors.ink} />
          <Text style={styles.chipLabel}>18,4 kg</Text>
        </View>

        <View style={[styles.chip, styles.sticker]}>
          <CheckIcon size={17} weight="bold" color={colors.ink} />
          <Text style={styles.chipLabel}>Kuduz, yapıldı</Text>
        </View>

        <View style={styles.tag}>
          <View style={styles.tagRing} />
          <View style={styles.tagQr}>
            <DecorativeQr size={36} />
          </View>
        </View>
      </View>
    </View>
  );
}

const softShadow = '0 12px 22px -12px rgba(29, 36, 82, 0.5)';

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    transformOrigin: 'top left',
  },
  circle: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  mia: {
    position: 'absolute',
    left: 24,
    top: 22,
  },
  zeytinRing: {
    position: 'absolute',
    right: 20 - ZEYTIN_RING,
    top: 132 - ZEYTIN_RING,
    padding: ZEYTIN_RING,
    borderRadius: 999,
    backgroundColor: colors.paper,
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    boxShadow: softShadow,
  },
  chipLabel: {
    fontFamily: fonts.uiHeavy,
    fontSize: 15,
    color: colors.ink,
  },
  weight: {
    right: 30,
    top: 42,
    borderRadius: 999,
    backgroundColor: colors.card,
    transform: [{ rotate: '6deg' }],
  },
  sticker: {
    left: 22,
    top: 250,
    borderRadius: 12,
    backgroundColor: colors.ball,
    transform: [{ rotate: '-7deg' }],
  },
  tag: {
    position: 'absolute',
    left: 112,
    top: 306,
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ball,
    boxShadow: softShadow,
    transform: [{ rotate: '-10deg' }],
  },
  tagRing: {
    position: 'absolute',
    top: -15,
    left: 23,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  tagQr: {
    borderRadius: 3,
    overflow: 'hidden',
  },
});
