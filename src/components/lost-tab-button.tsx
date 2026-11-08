import { router } from 'expo-router';
import { SirenIcon } from 'phosphor-react-native/src/icons/Siren';
import { StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';
import type { LostReport } from '@/data/lost-reports';

function openLostMode(report?: LostReport) {
  if (report) {
    router.push({ pathname: '/lost/[id]', params: { id: report.id } });
  } else {
    router.push('/start-lost');
  }
}

// Alt menünün ortasındaki düğme. Sekme değil, her dokunuşta kayıp ekranını üstte açar.
export function LostTabButton({ report }: { report?: LostReport }) {
  return (
    <Tappable
      accessibilityRole="button"
      onPress={() => openLostMode(report)}
      style={styles.button}>
      <View style={[styles.circle, report && styles.circleActive]}>
        <SirenIcon size={28} weight="fill" color={colors.ink} />
      </View>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.label}>
        {report ? `${report.petName} kayıp` : 'Hayvanım kayıp'}
      </Text>
    </Tappable>
  );
}

const CIRCLE_SIZE = 60;

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  // Menünün üstüne taşar: dikkat çeksin diye diğer düğmelerden yukarıda ve büyük.
  circle: {
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.card,
    backgroundColor: colors.alert,
    boxShadow: '0 8px 16px -6px rgba(255, 79, 26, 0.65)',
  },
  // Açık ilan varken halka da turuncu olur: düğmenin artık ilanı açtığı belli olsun.
  circleActive: {
    borderColor: colors.alertSoft,
  },
  label: {
    fontFamily: fonts.uiHeavy,
    fontSize: 10.5,
    color: colors.alertText,
  },
});
