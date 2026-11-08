import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

// Alt menüdeki sekmelerin başlığı. Yanında düğme olsun olmasın, başlık her sekmede aynı yükseklikte durur:
// satır, yuvarlak düğmenin boyunda (44) tutulur ve başlık bu satırda ortalanır.
export function TabHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.head}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
});
