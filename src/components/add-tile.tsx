import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';

type AddTileProps = {
  label: string;
  body: string;
  actionLabel: string;
  onPress: () => void;
};

// Bugün'deki kilo ve ziyaret kartlarının boş hâli: yerini korur, ne ekleneceğini söyler.
// Kesik kenar "henüz dolmadı" der, dolu kartlarla karışmaz.
export function AddTile({ label, body, actionLabel, onPress }: AddTileProps) {
  return (
    <Tappable
      accessibilityLabel={`${label}. ${body}. ${actionLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.action}>
        <View style={styles.plus}>
          <PlusIcon size={13} weight="bold" color={colors.card} />
        </View>
        <Text style={styles.actionLabel}>{actionLabel}</Text>
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9C8E0',
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink2,
  },
  body: {
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
  },
  plus: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
  },
  actionLabel: {
    fontFamily: fonts.uiHeavy,
    fontSize: 14.5,
    color: colors.ink,
  },
});
