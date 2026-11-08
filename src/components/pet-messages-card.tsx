import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';

type PetMessagesCardProps = {
  petName: string;
  count: number;
  onPress: () => void;
};

// Kayıp modu kapalıyken biri künyedeki QR'ı okutup yazdığında Bugün'de görünür.
export function PetMessagesCard({ petName, count, onPress }: PetMessagesCardProps) {
  return (
    <Tappable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <EyeIcon size={20} weight="bold" color={colors.card} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{petName} için haber var</Text>
        <Text style={styles.body}>
          {count > 1 ? `${count} mesaj geldi.` : 'Biri QR kodunu okutup yazdı.'} Görmek için dokun.
        </Text>
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.alertSoft,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.alertText,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16,
    color: colors.ink,
  },
  body: {
    marginTop: 1,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink2,
  },
});
