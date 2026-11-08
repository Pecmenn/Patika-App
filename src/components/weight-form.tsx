import { router } from 'expo-router';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { PetPicker } from '@/components/pet-picker';
import { colors, fonts } from '@/constants/theme';
import { listPets } from '@/data/pets';
import { addWeight, deleteWeight, updateWeight, type WeightEntry } from '@/data/weights';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import { useFocusData } from '@/hooks/use-focus-data';
import { formatLongDate, fromDateKey, toDateKey } from '@/lib/dates';
import { formatKg, kgToInput, parseKg } from '@/lib/weights';

const calendarIcon = <CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />;

type WeightFormProps = {
  // Verilmezse ve birden fazla hayvan varsa form önce hangisi için olduğunu sorar.
  petId?: string;
  // Verilirse form bu kaydı düzenler ve silme seçeneği görünür.
  entry?: WeightEntry;
};

export function WeightForm({ petId: givenPetId, entry }: WeightFormProps) {
  const insets = useSafeAreaInsets();
  const pets = useFocusData(listPets);
  const [pickedPetId, setPickedPetId] = useState<string>();
  const petId = givenPetId ?? pickedPetId ?? (pets?.length === 1 ? pets[0].id : undefined);
  const pet = pets?.find((candidate) => candidate.id === petId);
  const showsPetPicker = givenPetId === undefined && pets !== null && pets.length > 1;

  const [kgText, setKgText] = useState(entry ? kgToInput(entry.kg) : '');
  const [date, setDate] = useState(() => (entry ? fromDateKey(entry.date) : new Date()));
  const [note, setNote] = useState(entry?.note ?? '');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const allowLeave = useDiscardGuard({ kgText, date, note });

  const kg = parseKg(kgText);
  const canSave = pet !== undefined && kg !== null && !isSaving;
  const showsInvalidHint = kgText.trim().length > 0 && kg === null;

  async function save() {
    if (kg === null || !pet) {
      return;
    }
    const fields = { petId: pet.id, kg, date: toDateKey(date), note: note.trim() || null };
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
    allowLeave();
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
    allowLeave();
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
      behavior="padding"
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
        {pet ? (
          <Text style={styles.lede}>
            {entry ? `${pet.name} için bu kaydı düzelt.` : `${pet.name} için tartı sonucunu yaz.`}
          </Text>
        ) : (
          showsPetPicker && <Text style={styles.lede}>Önce hangi hayvan için olduğunu seç.</Text>
        )}
        {showsPetPicker && (
          <View style={styles.picker}>
            <Text style={styles.label}>Kim için?</Text>
            <PetPicker pets={pets} value={pet?.id} onChange={setPickedPetId} />
          </View>
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
              variant="danger"
              onPress={() => confirmRemove(entry)}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button disabled={!canSave} label="Kaydet" loading={isSaving} onPress={save} />
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
  picker: {
    marginTop: -4,
    marginBottom: 18,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink2,
  },
  hint: {
    marginTop: 8,
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
