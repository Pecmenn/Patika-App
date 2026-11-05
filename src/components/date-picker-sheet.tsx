import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { colors } from '@/constants/theme';

export type DatePickerSheetProps = {
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};

export function DatePickerSheet({
  value,
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
}: DatePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  // Android tarih seçiciyi kendi penceresinde açar.
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        mode="date"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        value={value}
        onDismiss={onCancel}
        onValueChange={(_event, date) => onConfirm(date)}
      />
    );
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        accessibilityLabel="Tarih seçimini kapat"
        accessibilityRole="button"
        onPress={onCancel}
        style={styles.backdrop}
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <DateTimePicker
          display="spinner"
          locale="tr-TR"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          mode="date"
          textColor={colors.ink}
          themeVariant="light"
          value={draft}
          onValueChange={(_event, date) => setDraft(date)}
        />
        <Button label="Tamam" onPress={() => onConfirm(draft)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 36, 82, 0.35)',
  },
  sheet: {
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.card,
  },
});
