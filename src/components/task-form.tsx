import { router } from 'expo-router';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
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
import { listPets } from '@/data/pets';
import { addTask, deleteTask, updateTask, type Task, type TaskRepeat } from '@/data/tasks';
import { useFocusData } from '@/hooks/use-focus-data';
import { atTime, formatLongDate, formatTime, fromDateKey, toDateKey, toTimeKey } from '@/lib/dates';
import { refreshReminders } from '@/lib/reminders';
import { REPEAT_OPTIONS, scheduleLabel } from '@/lib/tasks';

const DEFAULT_TIME = '09:00';

type OpenPicker = 'time' | 'start' | 'end' | null;

const calendarIcon = <CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />;
const clockIcon = <ClockIcon size={20} weight="bold" color={colors.ink2} />;

// Verilirse form bu görevi düzenler ve silme seçeneği görünür.
export function TaskForm({ task }: { task?: Task }) {
  const insets = useSafeAreaInsets();
  const pets = useFocusData(listPets);

  const [name, setName] = useState(task?.name ?? '');
  const [chosenPetId, setChosenPetId] = useState<string | null>(task?.petId ?? null);
  const [time, setTime] = useState(task?.time ?? DEFAULT_TIME);
  const [repeat, setRepeat] = useState<TaskRepeat>(task?.repeat ?? 'daily');
  const [startDate, setStartDate] = useState(() =>
    task ? fromDateKey(task.startDate) : new Date(),
  );
  const [endDate, setEndDate] = useState<Date | null>(() =>
    task?.endDate ? fromDateKey(task.endDate) : null,
  );
  const [note, setNote] = useState(task?.note ?? '');
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [isSaving, setIsSaving] = useState(false);

  const petId = chosenPetId ?? pets?.[0]?.id ?? null;
  const pet = pets?.find((candidate) => candidate.id === petId);
  const trimmedName = name.trim();
  const canSave = pet !== undefined && trimmedName.length > 0 && !isSaving;
  const isRepeating = repeat !== 'once';
  const startDateKey = toDateKey(startDate);
  const today = new Date();
  // Düzenlerken eski başlangıç tarihi seçilebilir kalsın.
  const minimumStart = task && fromDateKey(task.startDate) < today ? fromDateKey(task.startDate) : today;

  function changeStartDate(date: Date) {
    setStartDate(date);
    if (endDate && endDate < date) {
      setEndDate(null);
    }
  }

  async function save() {
    if (!pet) {
      return;
    }
    const fields = {
      petId: pet.id,
      name: trimmedName,
      time,
      repeat,
      startDate: startDateKey,
      endDate: isRepeating && endDate ? toDateKey(endDate) : null,
      note: note.trim() || null,
    };
    setIsSaving(true);
    try {
      if (task) {
        await updateTask(task.id, fields);
      } else {
        await addTask(fields);
      }
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    await refreshReminders({ askPermission: true });
    router.back();
  }

  async function remove(id: string) {
    setIsSaving(true);
    try {
      await deleteTask(id);
    } catch {
      setIsSaving(false);
      Alert.alert('Silinemedi', 'Görev silinirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    await refreshReminders();
    router.back();
  }

  function confirmRemove({ id, name: savedName }: Task) {
    Alert.alert(
      `${savedName} silinsin mi?`,
      'Bu görev ve hatırlatmaları silinir. Bu işlem geri alınamaz.',
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
          {task ? 'Görevi düzenle' : 'Görev ekle'}
        </Text>
        <Text style={styles.lede}>İlaç, damla ya da bakım. Zamanı gelince hatırlatırız.</Text>

        <TextField
          autoCapitalize="sentences"
          label="Görev adı"
          maxLength={60}
          placeholder="Örneğin tiroid hapı"
          value={name}
          onChangeText={setName}
        />

        {pets && pets.length > 1 && (
          <View style={styles.group}>
            <Text style={styles.groupLabel}>Hayvan</Text>
            <ChoiceChips
              options={pets.map((candidate) => ({ value: candidate.id, label: candidate.name }))}
              value={petId}
              onChange={setChosenPetId}
            />
          </View>
        )}

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Tekrar</Text>
          <ChoiceChips options={REPEAT_OPTIONS} value={repeat} onChange={setRepeat} />
        </View>

        <View style={styles.field}>
          <PressableField
            icon={clockIcon}
            label="Saat"
            placeholder="Saat seç"
            value={formatTime(time)}
            onPress={() => setOpenPicker('time')}
          />
        </View>

        <View style={styles.field}>
          <PressableField
            icon={calendarIcon}
            label={isRepeating ? 'Başlangıç tarihi' : 'Tarih'}
            placeholder="Tarih seç"
            value={formatLongDate(startDate)}
            onPress={() => setOpenPicker('start')}
          />
        </View>

        {isRepeating && (
          <>
            <View style={styles.field}>
              <PressableField
                icon={calendarIcon}
                label="Bitiş tarihi (isteğe bağlı)"
                placeholder="Tarih seç"
                value={endDate ? formatLongDate(endDate) : null}
                onPress={() => setOpenPicker('end')}
              />
            </View>
            {endDate && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setEndDate(null)}
                style={styles.shortcut}>
                <Text style={styles.shortcutLabel}>Bitiş tarihini kaldır</Text>
              </Pressable>
            )}
          </>
        )}

        <Text style={styles.hint}>
          Hatırlatma: {scheduleLabel({ repeat, startDate: startDateKey, time })}.
          {repeat === 'monthly' && startDate.getDate() > 28 && ' Kısa aylarda ayın son günü.'}
        </Text>

        <View style={styles.field}>
          <TextField
            autoCapitalize="sentences"
            label="Not (isteğe bağlı)"
            maxLength={120}
            placeholder="Örneğin damlalar banyo dolabında"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {task && (
          <View style={styles.removeAction}>
            <Button
              disabled={isSaving}
              label="Görevi sil"
              size="small"
              variant="text"
              onPress={() => confirmRemove(task)}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button disabled={!canSave} label="Kaydet" onPress={save} />
      </View>

      {openPicker === 'time' && (
        <DatePickerSheet
          mode="time"
          value={atTime(startDateKey, time)}
          onCancel={() => setOpenPicker(null)}
          onConfirm={(date) => {
            setTime(toTimeKey(date));
            setOpenPicker(null);
          }}
        />
      )}
      {openPicker === 'start' && (
        <DatePickerSheet
          minimumDate={minimumStart}
          value={startDate}
          onCancel={() => setOpenPicker(null)}
          onConfirm={(date) => {
            changeStartDate(date);
            setOpenPicker(null);
          }}
        />
      )}
      {openPicker === 'end' && (
        <DatePickerSheet
          minimumDate={startDate}
          value={endDate ?? startDate}
          onCancel={() => setOpenPicker(null)}
          onConfirm={(date) => {
            setEndDate(date);
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
  group: {
    marginTop: 14,
    marginBottom: 4,
  },
  groupLabel: {
    marginHorizontal: 4,
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
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
  hint: {
    marginTop: 10,
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
