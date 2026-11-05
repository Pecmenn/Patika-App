import { router, useLocalSearchParams } from 'expo-router';
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
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { colors, fonts } from '@/constants/theme';
import { listPets, type Species } from '@/data/pets';
import { addVaccine } from '@/data/vaccines';
import { useFocusData } from '@/hooks/use-focus-data';
import { addYears, formatLongDate, toDateKey } from '@/lib/dates';

// Yalnızca yazmayı hızlandıran kısayollar. Hangi aşının gerektiğine veteriner karar verir.
const NAME_SUGGESTIONS: Record<Species, string[]> = {
  cat: ['Kuduz', 'Karma', 'Lösemi'],
  dog: ['Kuduz', 'Karma', 'Bronşin'],
  rabbit: [],
  bird: [],
};

type OpenPicker = 'given' | 'next' | null;

const calendarIcon = <CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />;

export default function AddVaccineScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ petId: string; name?: string }>();
  const pets = useFocusData(listPets);
  const pet = pets?.find((candidate) => candidate.id === params.petId);

  const [name, setName] = useState(params.name ?? '');
  const [givenDate, setGivenDate] = useState(() => new Date());
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);
  const [batch, setBatch] = useState('');
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
    if (!pet) {
      return;
    }
    setIsSaving(true);
    try {
      await addVaccine({
        petId: pet.id,
        name: trimmedName,
        givenDate: toDateKey(givenDate),
        nextDueDate: nextDueDate ? toDateKey(nextDueDate) : null,
        batch: batch.trim() || null,
      });
      router.back();
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.');
    }
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
          Aşı ekle
        </Text>
        {pet && <Text style={styles.lede}>{pet.name} için, karnedeki bilgileri yaz.</Text>}

        <TextField label="Aşı adı" maxLength={40} value={name} onChangeText={setName} />

        {suggestions.length > 0 && (
          <View style={styles.chips}>
            {suggestions.map((suggestion) => {
              const isSelected = trimmedName === suggestion;
              return (
                <Pressable
                  key={suggestion}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setName(suggestion)}
                  style={[styles.chip, isSelected && styles.chipSelected]}>
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {suggestion}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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

        <View style={styles.field}>
          <TextField
            autoCapitalize="characters"
            label="Seri no (isteğe bağlı)"
            maxLength={30}
            value={batch}
            onChangeText={setBatch}
          />
        </View>

        <Text style={styles.note}>Bu kayıtta &quot;Elle girildi&quot; yazacak.</Text>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  chipLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  chipLabelSelected: {
    color: colors.card,
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
  note: {
    marginTop: 12,
    marginHorizontal: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    color: colors.ink2,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
