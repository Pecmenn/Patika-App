import { router } from 'expo-router';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';
import {
  addHealthRecord,
  deleteHealthRecord,
  updateHealthRecord,
  type HealthRecord,
  type RecordKind,
} from '@/data/health-records';
import { listPets, type Species } from '@/data/pets';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import { useFocusData } from '@/hooks/use-focus-data';
import { addMonths, addYears, formatLongDate, fromDateKey, toDateKey } from '@/lib/dates';
import { refreshReminders } from '@/lib/reminders';

// Yalnızca yazmayı hızlandıran kısayollar. Hangisinin gerektiğine veteriner karar verir.
const NAME_SUGGESTIONS: Record<RecordKind, Record<Species, string[]>> = {
  vaccine: {
    cat: ['Kuduz', 'Karma', 'Lösemi'],
    dog: ['Kuduz', 'Karma', 'Bronşin'],
    rabbit: [],
    bird: [],
  },
  treatment: {
    cat: ['İç parazit', 'Dış parazit'],
    dog: ['İç parazit', 'Dış parazit'],
    rabbit: [],
    bird: [],
  },
};

const COPY: Record<
  RecordKind,
  { add: string; edit: string; nameLabel: string; nextShortcut: string }
> = {
  vaccine: {
    add: 'Aşı ekle',
    edit: 'Aşıyı düzenle',
    nameLabel: 'Aşı adı',
    nextShortcut: 'Bir yıl sonrasını seç',
  },
  treatment: {
    add: 'Tedavi ekle',
    edit: 'Tedaviyi düzenle',
    nameLabel: 'Tedavi adı',
    nextShortcut: 'Bir ay sonrasını seç',
  },
};

type OpenPicker = 'given' | 'next' | null;

const calendarIcon = <CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />;

type RecordFormProps = {
  petId: string;
  kind: RecordKind;
  // Verilirse form bu kaydı düzenler ve silme seçeneği görünür.
  record?: HealthRecord;
  initialName?: string;
};

export function RecordForm({ petId, kind, record, initialName }: RecordFormProps) {
  const insets = useSafeAreaInsets();
  const pets = useFocusData(listPets);
  const pet = pets?.find((candidate) => candidate.id === petId);

  const [name, setName] = useState(record?.name ?? initialName ?? '');
  const [givenDate, setGivenDate] = useState(() =>
    record ? fromDateKey(record.givenDate) : new Date(),
  );
  const [nextDueDate, setNextDueDate] = useState<Date | null>(() =>
    record?.nextDueDate ? fromDateKey(record.nextDueDate) : null,
  );
  const [batch, setBatch] = useState(record?.batch ?? '');
  const [note, setNote] = useState(record?.note ?? '');
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [isSaving, setIsSaving] = useState(false);
  const allowLeave = useDiscardGuard({ name, givenDate, nextDueDate, batch, note });

  const copy = COPY[kind];
  const trimmedName = name.trim();
  const canSave = pet !== undefined && trimmedName.length > 0 && !isSaving;
  const suggestions = pet ? NAME_SUGGESTIONS[kind][pet.species] : [];
  // Yalnızca başlangıç noktası. Hangi aralığın gerektiğine veteriner karar verir.
  const suggestedNext = kind === 'vaccine' ? addYears(givenDate, 1) : addMonths(givenDate, 1);

  function changeGivenDate(date: Date) {
    setGivenDate(date);
    if (nextDueDate && nextDueDate < date) {
      setNextDueDate(null);
    }
  }

  async function save() {
    const fields = {
      petId,
      kind,
      name: trimmedName,
      givenDate: toDateKey(givenDate),
      nextDueDate: nextDueDate ? toDateKey(nextDueDate) : null,
      batch: kind === 'vaccine' ? batch.trim() || null : null,
      note: kind === 'treatment' ? note.trim() || null : null,
    };
    setIsSaving(true);
    try {
      if (record) {
        await updateHealthRecord(record.id, fields);
      } else {
        await addHealthRecord(fields);
      }
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    await refreshReminders({ askPermission: nextDueDate !== null });
    allowLeave();
    router.back();
  }

  async function remove(id: string) {
    setIsSaving(true);
    try {
      await deleteHealthRecord(id);
    } catch {
      setIsSaving(false);
      Alert.alert('Silinemedi', 'Kayıt silinirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    await refreshReminders();
    allowLeave();
    router.back();
  }

  function confirmRemove({ id, name: savedName }: HealthRecord) {
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
          {record ? copy.edit : copy.add}
        </Text>
        {pet && (
          <Text style={styles.lede}>
            {record
              ? `${pet.name} için bu kaydı düzelt.`
              : `${pet.name} için, karnedeki bilgileri yaz.`}
          </Text>
        )}

        <TextField label={copy.nameLabel} maxLength={40} value={name} onChangeText={setName} />

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
        <Tappable
          accessibilityRole="button"
          onPress={() => setNextDueDate(nextDueDate ? null : suggestedNext)}
          hitSlop={10}
          style={styles.shortcut}>
          <Text style={styles.shortcutLabel}>
            {nextDueDate ? 'Sonraki tarihi kaldır' : copy.nextShortcut}
          </Text>
        </Tappable>
        {nextDueDate && (
          <Text style={styles.reminderNote}>
            Bu tarihten 7 gün önce ve son gün sabah 09.00&apos;da sana hatırlatırız.
          </Text>
        )}

        <View style={styles.field}>
          {kind === 'vaccine' ? (
            <TextField
              autoCapitalize="characters"
              label="Seri no (isteğe bağlı)"
              maxLength={30}
              value={batch}
              onChangeText={setBatch}
            />
          ) : (
            <TextField
              autoCapitalize="sentences"
              label="Not (isteğe bağlı)"
              maxLength={120}
              placeholder="Örneğin ilacın adı ve dozu"
              value={note}
              onChangeText={setNote}
            />
          )}
        </View>

        {record ? (
          <View style={styles.removeAction}>
            <Button
              disabled={isSaving}
              label="Kaydı sil"
              size="small"
              variant="danger"
              onPress={() => confirmRemove(record)}
            />
          </View>
        ) : (
          <Text style={styles.note}>Bu kayıtta &quot;Elle girildi&quot; yazacak.</Text>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button disabled={!canSave} label="Kaydet" loading={isSaving} onPress={save} />
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
          value={nextDueDate ?? suggestedNext}
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
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
  },
  note: {
    marginTop: 12,
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
