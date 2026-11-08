import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PetAvatar } from '@/components/pet-avatar';
import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import type { Pet } from '@/data/pets';
import { selectionHaptic, successHaptic } from '@/lib/haptics';

type TaskRowProps = {
  name: string;
  detail: string;
  pet: Pet;
  showDivider: boolean;
  isDone?: boolean;
  // Verilirse başında işaretleme yuvarlağı görünür.
  onToggle?: () => void;
  onPress: () => void;
};

export function TaskRow({
  name,
  detail,
  pet,
  showDivider,
  isDone = false,
  onToggle,
  onPress,
}: TaskRowProps) {
  const scale = useSharedValue(1);
  const wasDone = useRef(isDone);

  // "Yapıldı" denince yuvarlak bir kez zıplar. Açılışta zaten yapılmış olan görev zıplamaz.
  useEffect(() => {
    if (isDone && !wasDone.current) {
      scale.value = withSequence(withTiming(1.25, { duration: 110 }), withSpring(1, { damping: 9 }));
    }
    wasDone.current = isDone;
  }, [isDone, scale]);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.row, showDivider && styles.divider]}>
      {onToggle && (
        <Pressable
          accessibilityLabel={`${name} yapıldı`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          hitSlop={10}
          onPress={() => {
            if (isDone) {
              selectionHaptic();
            } else {
              successHaptic();
            }
            onToggle();
          }}>
          <Animated.View style={[styles.check, isDone && styles.checkDone, checkStyle]}>
            {isDone && <CheckIcon size={14} weight="bold" color={colors.ink} />}
          </Animated.View>
        </Pressable>
      )}
      <Tappable
        accessibilityHint="Düzenlemek için dokun"
        accessibilityRole="button"
        onPress={onPress}
        pressedScale={0.98}
        style={styles.body}>
        <View style={styles.copy}>
          <Text style={[styles.name, isDone && styles.nameDone]}>{name}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <PetAvatar
          name={pet.name}
          photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
          size={30}
          species={pet.species}
        />
      </Tappable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  // Çerçeve beyaz kartta en az 3:1 seçilsin diye ikincil yazı rengiyle çizilir.
  check: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.ink3,
  },
  checkDone: {
    borderColor: colors.ball,
    backgroundColor: colors.ball,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.uiBold,
    fontSize: 15.5,
    color: colors.ink,
  },
  nameDone: {
    color: colors.ink3,
    textDecorationLine: 'line-through',
  },
  detail: {
    marginTop: 1,
    fontFamily: fonts.ui,
    fontSize: 13.5,
    color: colors.ink3,
  },
});
