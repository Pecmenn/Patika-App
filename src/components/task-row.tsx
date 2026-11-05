import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PetAvatar } from '@/components/pet-avatar';
import { colors, fonts } from '@/constants/theme';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import type { Pet } from '@/data/pets';

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
  return (
    <View style={[styles.row, showDivider && styles.divider]}>
      {onToggle && (
        <Pressable
          accessibilityLabel={`${name} yapıldı`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          hitSlop={10}
          onPress={onToggle}
          style={[styles.check, isDone && styles.checkDone]}>
          {isDone && <CheckIcon size={14} weight="bold" color={colors.ink} />}
        </Pressable>
      )}
      <Pressable
        accessibilityHint="Düzenlemek için dokun"
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
        <View style={styles.copy}>
          <Text style={[styles.name, isDone && styles.nameDone]}>{name}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <PetAvatar
          photoUri={pet.photo ? resolvePetPhotoUri(pet.photo) : null}
          size={30}
          species={pet.species}
        />
      </Pressable>
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
  check: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C9C8DD',
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
  pressed: {
    opacity: 0.6,
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
