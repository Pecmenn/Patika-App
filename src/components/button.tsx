import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';

type ButtonProps = {
  label: string;
  variant?: 'ink' | 'white' | 'text' | 'danger';
  size?: 'large' | 'small';
  disabled?: boolean;
  // Sunucu beklenirken: düğme tam renkte kalır, dönen işaret çıkar, basılamaz.
  loading?: boolean;
  onPress?: () => void;
};

export function Button({
  label,
  variant = 'ink',
  size = 'large',
  disabled = false,
  loading = false,
  onPress,
}: ButtonProps) {
  const isInk = variant === 'ink';
  const isSmall = size === 'small';

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled && !loading, busy: loading }}
      disabled={disabled && !loading}
      onPress={loading ? undefined : onPress}
      style={[
        styles.base,
        isSmall && styles.small,
        isInk && styles.ink,
        variant === 'white' && styles.white,
      ]}>
      <View style={styles.content}>
        {loading && <ActivityIndicator color={isInk ? colors.card : colors.ink} size="small" />}
        <Text
          maxFontSizeMultiplier={1.6}
          style={[
            styles.label,
            isSmall && styles.labelSmall,
            isInk && styles.labelOnInk,
            variant === 'danger' && styles.labelDanger,
          ]}>
          {label}
        </Text>
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  // Yükseklik en az değer: yazı büyütülünce düğme de büyür, yazı kesilmez.
  base: {
    minHeight: 56,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  small: {
    minHeight: 44,
    paddingVertical: 8,
  },
  ink: {
    backgroundColor: colors.ink,
  },
  white: {
    backgroundColor: colors.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 16.5,
    color: colors.ink,
    textAlign: 'center',
  },
  labelSmall: {
    fontSize: 15,
  },
  labelOnInk: {
    color: colors.card,
  },
  // Geri alınamayan işler (hesap silme, kayıt silme) diğer metin düğmelerinden ayrışsın.
  labelDanger: {
    color: colors.danger,
  },
});
