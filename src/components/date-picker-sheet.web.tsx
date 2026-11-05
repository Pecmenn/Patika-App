import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import type { DatePickerSheetProps } from '@/components/date-picker-sheet';
import { colors } from '@/constants/theme';
import { fromDateKey, toDateKey } from '@/lib/dates';

// Yalnızca tarayıcı önizlemesi için: telefondaki tarih seçici tarayıcıda çalışmıyor.
export function DatePickerSheet({ value, maximumDate, onConfirm, onCancel }: DatePickerSheetProps) {
  const [draft, setDraft] = useState(toDateKey(value));

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable accessibilityLabel="Tarih seçimini kapat" onPress={onCancel} style={styles.backdrop} />
      <View style={styles.sheet}>
        <input
          aria-label="Doğum tarihi"
          max={toDateKey(maximumDate)}
          type="date"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button label="Tamam" disabled={!draft} onPress={() => onConfirm(fromDateKey(draft))} />
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
    gap: 12,
    padding: 20,
    backgroundColor: colors.card,
  },
});
