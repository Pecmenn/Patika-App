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
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { colors, fonts } from '@/constants/theme';
import { listPets } from '@/data/pets';
import { addVisit, deleteVisit, updateVisit, type Visit } from '@/data/visits';
import { useFocusData } from '@/hooks/use-focus-data';
import { atTime, formatLongDate, formatTime, fromDateKey, toDateKey, toTimeKey } from '@/lib/dates';
import { refreshReminders } from '@/lib/reminders';
import { isUpcomingVisit } from '@/lib/visits';

const DEFAULT_TIME = '10:00';

type OpenPicker = 'date' | 'time' | null;

const calendarIcon = <CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />;
const clockIcon = <ClockIcon size={20} weight="bold" color={colors.ink2} />;

type VisitFormProps = {
  petId: string;
  // Verilirse form bu ziyareti düzenler ve silme seçeneği görünür.
  visit?: Visit;
};

export function VisitForm({ petId, visit }: VisitFormProps) {
  const insets = useSafeAreaInsets();
  const pets = useFocusData(listPets);
  const pet = pets?.find((candidate) => candidate.id === petId);

  const [reason, setReason] = useState(visit?.reason ?? '');
  const [date, setDate] = useState(() => (visit ? fromDateKey(visit.date) : new Date()));
  const [time, setTime] = useState<string | null>(visit?.time ?? null);
  const [clinic, setClinic] = useState(visit?.clinic ?? '');
  const [note, setNote] = useState(visit?.note ?? '');
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedReason = reason.trim();
  const canSave = pet !== undefined && trimmedReason.length > 0 && !isSaving;
  const dateKey = toDateKey(date);
  const isUpcoming = isUpcomingVisit({ date: dateKey, time } as Visit);

  async function save() {
    const fields = {
      petId,
      reason: trimmedReason,
      date: dateKey,
      time,
      clinic: clinic.trim() || null,
      note: note.trim() || null,
    };
    setIsSaving(true);
    try {
      if (visit) {
        await updateVisit(visit.id, fields);
      } else {
        await addVisit(fields);
      }
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.');
      return;
    }
    await refreshReminders({ askPermission: isUpcoming });
    router.back();
  }

  async function remove(id: string) {
    setIsSaving(true);
    try {
      await deleteVisit(id);
    } catch {
      setIsSaving(false);
      Alert.alert('Silinemedi', 'Kayıt silinirken bir sorun oldu. Lütfen tekrar dene.');
      return;
    }
    await refreshReminders();
    router.back();
  }

  function confirmRemove({ id, reason: savedReason }: Visit) {
    Alert.alert(
      `${savedReason} silinsin mi?`,
      'Bu ziyaret ve hatırlatmaları silinir. Bu işlem geri alınamaz.',
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
          {visit ? 'Ziyareti düzenle' : 'Ziyaret ekle'}
        </Text>
        {pet && (
          <Text style={styles.lede}>
            {visit
              ? `${pet.name} için bu kaydı düzelt.`
              : `${pet.name} için, geçmiş bir ziyareti ya da aldığın randevuyu yaz.`}
          </Text>
        )}

        <TextField
          autoCapitalize="sentences"
          label="Ziyaret nedeni"
          maxLength={60}
          placeholder="Örneğin diş kontrolü"
          value={reason}
          onChangeText={setReason}
        />

        <View style={styles.field}>
          <PressableField
            icon={calendarIcon}
            label="Tarih"
            placeholder="Tarih seç"
            value={formatLongDate(date)}
            onPress={() => setOpenPicker('date')}
          />
        </View>

        <View style={styles.field}>
          <PressableField
            icon={clockIcon}
            label="Saat (isteğe bağlı)"
            placeholder="Saat seç"
            value={time ? formatTime(time) : null}
            onPress={() => setOpenPicker('time')}
          />
        </View>
        {time && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setTime(null)}
            style={styles.shortcut}>
            <Text style={styles.shortcutLabel}>Saati kaldır</Text>
          </Pressable>
        )}
        {dateKey > toDateKey(new Date()) && (
          <Text style={styles.hint}>
            {time
              ? 'Bir gün önce sabah 09.00’da ve randevudan 2 saat önce hatırlatırız.'
              : 'Bir gün önce ve o gün sabah 09.00’da hatırlatırız.'}
          </Text>
        )}

        <View style={styles.field}>
          <TextField
            autoCapitalize="words"
            label="Klinik (isteğe bağlı)"
            maxLength={40}
            value={clinic}
            onChangeText={setClinic}
          />
        </View>

        <View style={styles.field}>
          <TextField
            autoCapitalize="sentences"
            label="Not (isteğe bağlı)"
            maxLength={120}
            placeholder="Örneğin veterinerin önerileri"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {visit ? (
          <View style={styles.removeAction}>
            <Button
              disabled={isSaving}
              label="Ziyareti sil"
              size="small"
              variant="text"
              onPress={() => confirmRemove(visit)}
            />
          </View>
        ) : (
          <Text style={styles.note}>Bu kayıtta &quot;Elle girildi&quot; yazacak.</Text>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button disabled={!canSave} label="Kaydet" onPress={save} />
      </View>

      {openPicker === 'date' && (
        <DatePickerSheet
          value={date}
          onCancel={() => setOpenPicker(null)}
          onConfirm={(picked) => {
            setDate(picked);
            setOpenPicker(null);
          }}
        />
      )}
      {openPicker === 'time' && (
        <DatePickerSheet
          mode="time"
          value={atTime(dateKey, time ?? DEFAULT_TIME)}
          onCancel={() => setOpenPicker(null)}
          onConfirm={(picked) => {
            setTime(toTimeKey(picked));
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
  hint: {
    marginTop: 8,
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
