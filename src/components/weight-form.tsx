import { router } from 'expo-router';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { colors, fonts } from '@/constants/theme';
import { listPets } from '@/data/pets';
import { addWeight, deleteWeight, updateWeight, type WeightEntry } from '@/data/weights';
import { useFocusData } from '@/hooks/use-focus-data';
import { formatLongDate, fromDateKey, toDateKey } from '@/lib/dates';
import { formatKg, kgToInput, parseKg } from '@/lib/weights';

const calendarIcon = <CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />;

type WeightFormProps = {
  petId: string;
  // Verilirse form bu kaydı düzenler ve silme seçeneği görünür.
  entry?: WeightEntry;
};

export function WeightForm({ petId, entry }: WeightFormProps) {
  const insets = useSafeAreaInsets();
  const pets = useFocusData(listPets);
  const pet = pets?.find((candidate) => candidate.id === petId);

  const [kgText, setKgText] = useState(entry ? kgToInput(entry.kg) : '');
  const [date, setDate] = useState(() => (entry ? fromDateKey(entry.date) : new Date()));
  const [note, setNote] = useState(entry?.note ?? '');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const kg = parseKg(kgText);
  const canSave = pet !== undefined && kg !== null && !isSaving;
  const showsInvalidHint = kgText.trim().length > 0 && kg === null;

  async function save() {
    if (kg === null) {
      return;
    }
    const fields = { petId, kg, date: toDateKey(date), note: note.trim() || null };
    setIsSaving(true);
    try {
      if (entry) {
        await updateWeight(entry.id, fields);
      } else {
        await addWeight(fields);
      }
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    router.back();
  }

  async function remove(id: string) {
    setIsSaving(true);
    try {
      await deleteWeight(id);
    } catch {
      setIsSaving(false);
      Alert.alert('Silinemedi', 'Kayıt silinirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    router.back();
  }

  function confirmRemove({ id, kg: savedKg }: WeightEntry) {
    Alert.alert(`${formatKg(savedKg)} kg kaydı silinsin mi?`, 'Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove(id) },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <GlassButton label="Kapat" onPress={() => router.back()}>
          <XIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        <Text accessibilityRole="header" style={styles.title}>
          {entry ? 'Kiloyu düzenle' : 'Kilo ekle'}
        </Text>
        {pet && (
          <Text style={styles.lede}>
            {entry ? `${pet.name} için bu kaydı düzelt.` : `${pet.name} için tartı sonucunu yaz.`}
          </Text>
        )}

        <TextField
          keyboardType="decimal-pad"
          label="Kilo (kg)"
          maxLength={7}
          placeholder="Örneğin 18,4"
          value={kgText}
          onChangeText={setKgText}
        />
        {showsInvalidHint && (
          <Text style={styles.hint}>0 ile 200 kg arasında bir sayı yaz. Örneğin 18,4</Text>
        )}

        <View style={styles.field}>
          <PressableField
            icon={calendarIcon}
            label="Tarih"
            placeholder="Tarih seç"
            value={formatLongDate(date)}
            onPress={() => setIsDatePickerOpen(true)}
          />
        </View>

        <View style={styles.field}>
          <TextField
            autoCapitalize="sentences"
            label="Not (isteğe bağlı)"
            maxLength={60}
            placeholder="Örneğin ev tartısı"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {entry && (
          <View style={styles.removeAction}>
            <Button
              disabled={isSaving}
              label="Kaydı sil"
              size="small"
              variant="text"
              onPress={() => confirmRemove(entry)}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button disabled={!canSave} label="Kaydet" onPress={save} />
      </View>

      {isDatePickerOpen && (
        <DatePickerSheet
          maximumDate={new Date()}
          value={date}
          onCancel={() => setIsDatePickerOpen(false)}
          onConfirm={(picked) => {
            setDate(picked);
            setIsDatePickerOpen(false);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    marginTop: 22,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  lede: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  field: {
    marginTop: 10,
  },
  hint: {
    marginTop: 8,
    marginHorizontal: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
  },
  removeAction: {
    alignSelf: 'center',
    marginTop: 12,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
