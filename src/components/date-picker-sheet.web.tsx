import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import type { DatePickerSheetProps } from '@/components/date-picker-sheet';
import { colors } from '@/constants/theme';
import { atTime, fromDateKey, toDateKey, toTimeKey } from '@/lib/dates';

// Yalnızca tarayıcı önizlemesi için: telefondaki seçici tarayıcıda çalışmıyor.
export function DatePickerSheet({
  value,
  mode = 'date',
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
}: DatePickerSheetProps) {
  const isTime = mode === 'time';
  const [draft, setDraft] = useState(isTime ? toTimeKey(value) : toDateKey(value));

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable accessibilityLabel="Seçimi kapat" onPress={onCancel} style={styles.backdrop} />
      <View style={styles.sheet}>
        <input
          aria-label={isTime ? 'Saat' : 'Tarih'}
          max={maximumDate ? toDateKey(maximumDate) : undefined}
          min={minimumDate ? toDateKey(minimumDate) : undefined}
          type={mode}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          label="Tamam"
          disabled={!draft}
          onPress={() =>
            onConfirm(isTime ? atTime(toDateKey(value), draft) : fromDateKey(draft))
          }
        />
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
