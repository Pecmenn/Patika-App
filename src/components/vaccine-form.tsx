import { router } from 'expo-router';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { colors, fonts } from '@/constants/theme';
import { listPets, type Species } from '@/data/pets';
import { addVaccine, deleteVaccine, updateVaccine, type Vaccine } from '@/data/vaccines';
import { useFocusData } from '@/hooks/use-focus-data';
import { addYears, formatLongDate, fromDateKey, toDateKey } from '@/lib/dates';
import { refreshReminders } from '@/lib/reminders';

// Yalnızca yazmayı hızlandıran kısayollar. Hangi aşının gerektiğine veteriner karar verir.
const NAME_SUGGESTIONS: Record<Species, string[]> = {
  cat: ['Kuduz', 'Karma', 'Lösemi'],
  dog: ['Kuduz', 'Karma', 'Bronşin'],
  rabbit: [],
  bird: [],
};

type OpenPicker = 'given' | 'next' | null;

const calendarIcon = <CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />;

type VaccineFormProps = {
  petId: string;
  // Verilirse form bu kaydı düzenler ve silme seçeneği görünür.
  vaccine?: Vaccine;
  initialName?: string;
};

export function VaccineForm({ petId, vaccine, initialName }: VaccineFormProps) {
  const insets = useSafeAreaInsets();
  const pets = useFocusData(listPets);
  const pet = pets?.find((candidate) => candidate.id === petId);

  const [name, setName] = useState(vaccine?.name ?? initialName ?? '');
  const [givenDate, setGivenDate] = useState(() =>
    vaccine ? fromDateKey(vaccine.givenDate) : new Date(),
  );
  const [nextDueDate, setNextDueDate] = useState<Date | null>(() =>
    vaccine?.nextDueDate ? fromDateKey(vaccine.nextDueDate) : null,
  );
  const [batch, setBatch] = useState(vaccine?.batch ?? '');
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();
  const canSave = pet !== undefined && trimmedName.length > 0 && !isSaving;
  const suggestions = pet ? NAME_SUGGESTIONS[pet.species] : [];

  function changeGivenDate(date: Date) {
    setGivenDate(date);
    if (nextDueDate && nextDueDate < date) {
      setNextDueDate(null);
    }
  }

  async function save() {
    const fields = {
      petId,
      name: trimmedName,
      givenDate: toDateKey(givenDate),
      nextDueDate: nextDueDate ? toDateKey(nextDueDate) : null,
      batch: batch.trim() || null,
    };
    setIsSaving(true);
    try {
      if (vaccine) {
        await updateVaccine(vaccine.id, fields);
      } else {
        await addVaccine(fields);
      }
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.');
      return;
    }
    await refreshReminders({ askPermission: nextDueDate !== null });
    router.back();
  }

  async function remove(id: string) {
    setIsSaving(true);
    try {
      await deleteVaccine(id);
    } catch {
      setIsSaving(false);
      Alert.alert('Silinemedi', 'Kayıt silinirken bir sorun oldu. Lütfen tekrar dene.');
      return;
    }
    await refreshReminders();
    router.back();
  }

  function confirmRemove({ id, name: savedName }: Vaccine) {
    Alert.alert(
      `${savedName} kaydı silinsin mi?`,
      'Bu kayıt ve hatırlatmaları silinir. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => remove(id) },
      ],
    );
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
          {vaccine ? 'Aşıyı düzenle' : 'Aşı ekle'}
        </Text>
        {pet && (
          <Text style={styles.lede}>
            {vaccine
              ? `${pet.name} için bu kaydı düzelt.`
              : `${pet.name} için, karnedeki bilgileri yaz.`}
          </Text>
        )}

        <TextField label="Aşı adı" maxLength={40} value={name} onChangeText={setName} />

        {suggestions.length > 0 && (
          <ChoiceChips
            options={suggestions.map((suggestion) => ({ value: suggestion, label: suggestion }))}
            value={trimmedName}
            onChange={setName}
          />
        )}

        <View style={styles.field}>
          <PressableField
            icon={calendarIcon}
            label="Yapıldığı tarih"
            placeholder="Tarih seç"
            value={formatLongDate(givenDate)}
            onPress={() => setOpenPicker('given')}
          />
        </View>

        <View style={styles.field}>
          <PressableField
            icon={calendarIcon}
            label="Sonraki tarih (isteğe bağlı)"
            placeholder="Tarih seç"
            value={nextDueDate ? formatLongDate(nextDueDate) : null}
            onPress={() => setOpenPicker('next')}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNextDueDate(nextDueDate ? null : addYears(givenDate, 1))}
          style={styles.shortcut}>
          <Text style={styles.shortcutLabel}>
            {nextDueDate ? 'Sonraki tarihi kaldır' : 'Bir yıl sonrasını seç'}
          </Text>
        </Pressable>
        {nextDueDate && (
          <Text style={styles.reminderNote}>
            Bu tarihten 7 gün önce ve son gün sabah 09.00&apos;da sana hatırlatırız.
          </Text>
        )}

        <View style={styles.field}>
          <TextField
            autoCapitalize="characters"
            label="Seri no (isteğe bağlı)"
            maxLength={30}
            value={batch}
            onChangeText={setBatch}
          />
        </View>

        {vaccine ? (
          <View style={styles.removeAction}>
            <Button
              disabled={isSaving}
              label="Kaydı sil"
              size="small"
              variant="text"
              onPress={() => confirmRemove(vaccine)}
            />
          </View>
        ) : (
          <Text style={styles.note}>Bu kayıtta &quot;Elle girildi&quot; yazacak.</Text>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button disabled={!canSave} label="Kaydet" onPress={save} />
      </View>

      {openPicker === 'given' && (
        <DatePickerSheet
          maximumDate={new Date()}
          value={givenDate}
          onCancel={() => setOpenPicker(null)}
          onConfirm={(date) => {
            changeGivenDate(date);
            setOpenPicker(null);
          }}
        />
      )}
      {openPicker === 'next' && (
        <DatePickerSheet
          minimumDate={givenDate}
          value={nextDueDate ?? addYears(givenDate, 1)}
          onCancel={() => setOpenPicker(null)}
          onConfirm={(date) => {
            setNextDueDate(date);
            setOpenPicker(null);
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
  shortcut: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginHorizontal: 4,
    paddingVertical: 4,
  },
  shortcutLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  reminderNote: {
    marginTop: 4,
    marginHorizontal: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
  },
  note: {
    marginTop: 12,
    marginHorizontal: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
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
