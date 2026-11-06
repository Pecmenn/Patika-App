import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { STATUS_LABELS, type AppointmentStatus } from '@/lib/clinics';

const BACKGROUND: Record<AppointmentStatus, string> = {
  pending: colors.skySoft,
  confirmed: colors.ball,
  rejected: colors.pawSoft,
  cancelled: colors.pawSoft,
  expired: colors.line,
};

export function AppointmentStatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <View style={[styles.pill, { backgroundColor: BACKGROUND[status] }]}>
      <Text style={styles.label}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.ink,
  },
});
