import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { FieldRow, PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { PetAvatar } from '@/components/pet-avatar';
import { Tappable } from '@/components/tappable';
import { SPECIES, SPECIES_KEYS } from '@/constants/species';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { deletePetPhoto, resolvePetPhotoUri, storePetPhoto } from '@/data/pet-photo-storage';
import { addPet, listPets, updatePet, type Pet, type Species } from '@/data/pets';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import { formatLongDate, fromDateKey, toDateKey, yearsAgo, yearsSince } from '@/lib/dates';
import { countPetData, removalWarning, removePet } from '@/lib/pet-removal';
import { selectionHaptic } from '@/lib/haptics';
import { refreshReminders } from '@/lib/reminders';

const MAX_AGE = 30;
// Yaş düğmeleri 40 nokta: dokunma alanı 44'e tamamlanır.
const STEPPER_HIT_SLOP = 2;

function closeScreen() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

function ageLabel(age: number) {
  return age === 0 ? '1 yaşından küçük' : `${age} yaş`;
}

// Verilirse form bu hayvanı düzenler ve silme seçeneği görünür.
export function PetForm({ pet }: { pet?: Pet }) {
  const insets = useSafeAreaInsets();
  const savedApproximateAge =
    pet?.birthDateIsApproximate && pet.birthDate
      ? Math.min(yearsSince(pet.birthDate), MAX_AGE)
      : null;

  const [name, setName] = useState(pet?.name ?? '');
  const [species, setSpecies] = useState<Species | null>(pet?.species ?? null);
  const [breed, setBreed] = useState(pet?.breed ?? '');
  // Yalnızca yeni seçilen fotoğraf. Kayıtlı olana dokunulmadıysa boş kalır.
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(() =>
    pet?.birthDate && !pet.birthDateIsApproximate ? fromDateKey(pet.birthDate) : null,
  );
  const [usesApproximateAge, setUsesApproximateAge] = useState(savedApproximateAge !== null);
  const [approximateAge, setApproximateAge] = useState(savedApproximateAge ?? 1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const allowLeave = useDiscardGuard({ name, species, breed, pickedPhotoUri, birthDate, usesApproximateAge, approximateAge });

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && species !== null && !isSaving;
  const savedPhotoUri = pet?.photo ? resolvePetPhotoUri(pet.photo) : null;
  const photoUri = pickedPhotoUri ?? savedPhotoUri;

  async function pickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPickedPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Fotoğraf seçilemedi', 'Lütfen tekrar dene.', [{ text: 'Tamam' }]);
    }
  }

  function birthDateToSave() {
    if (!usesApproximateAge) {
      return birthDate ? toDateKey(birthDate) : null;
    }
    // Yaş değişmediyse eski tarih kalır, yoksa her kayıtta doğum tarihi kayardı.
    if (pet?.birthDate && approximateAge === savedApproximateAge) {
      return pet.birthDate;
    }
    return toDateKey(yearsAgo(approximateAge));
  }

  async function save() {
    if (species === null) {
      return;
    }
    setIsSaving(true);
    try {
      const fields = {
        name: trimmedName,
        species,
        breed: breed.trim() || null,
        photo: pickedPhotoUri ? await storePetPhoto(pickedPhotoUri) : (pet?.photo ?? null),
        birthDate: birthDateToSave(),
        birthDateIsApproximate: usesApproximateAge,
      };
      if (pet) {
        await updatePet(pet.id, fields);
        if (pickedPhotoUri && pet.photo) {
          deletePetPhoto(pet.photo);
        }
      } else {
        await addPet(fields);
      }
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    // Hayvanın adı bildirim metinlerinde geçiyor.
    if (pet) {
      await refreshReminders();
    }
    allowLeave();
    closeScreen();
  }

  async function remove(target: Pet) {
    setIsSaving(true);
    try {
      await removePet(target);
    } catch {
      setIsSaving(false);
      Alert.alert('Silinemedi', 'Hayvan silinirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    await refreshReminders();

    // Hiç hayvan kalmadıysa uygulama Karşılama ekranına döner.
    allowLeave();
    const remaining = await listPets();
    if (remaining.length > 0) {
      router.dismissTo('/pets');
    } else {
      router.dismissAll();
      router.replace('/');
    }
  }

  async function confirmRemove(target: Pet) {
    let warning = 'Bu işlem geri alınamaz.';
    try {
      warning = removalWarning(await countPetData(target.id));
    } catch (error) {
      console.warn('Kayıtlar sayılamadı', error);
    }
    Alert.alert(`${target.name} silinsin mi?`, warning, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove(target) },
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
        <GlassButton label="Kapat" onPress={closeScreen}>
          <XIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text accessibilityRole="header" style={styles.title}>
              {pet ? 'Hayvanı düzenle' : 'Hayvan ekle'}
            </Text>
            <Text style={styles.lede}>
              {pet
                ? 'Bilgilerini düzelt, hatırlatmalar da güncellenir.'
                : 'Önce temel bilgiler. Aşılar ve ziyaretler sonra gelir.'}
            </Text>
          </View>
          <Tappable
            accessibilityLabel={photoUri ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
            accessibilityRole="button"
            onPress={pickPhoto}>
            <PetAvatar name={name} photoUri={photoUri} size={92} species={species} />
            <View style={styles.photoBadge}>
              <CameraIcon size={16} weight="bold" color={colors.card} />
            </View>
          </Tappable>
        </View>

        <TextField label="Ad" maxLength={30} value={name} onChangeText={setName} />

        <Text style={styles.sectionLabel}>Tür</Text>
        <View accessibilityRole="radiogroup" style={styles.speciesRow}>
          {SPECIES_KEYS.map((key) => {
            const { Icon, label } = SPECIES[key];
            const isSelected = species === key;
            return (
              <Tappable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => {
                  if (!isSelected) {
                    selectionHaptic();
                  }
                  setSpecies(key);
                }}
                pressedScale={0.95}
                style={[styles.speciesOption, isSelected && styles.speciesSelected]}>
                <Icon size={32} weight="duotone" color={isSelected ? colors.ball : colors.ink} />
                <Text style={[styles.speciesLabel, isSelected && styles.speciesLabelSelected]}>
                  {label}
                </Text>
              </Tappable>
            );
          })}
        </View>

        <TextField
          label="Irk (isteğe bağlı)"
          maxLength={40}
          placeholder="Örneğin melez"
          value={breed}
          onChangeText={setBreed}
        />

        <View style={styles.birthField}>
          {usesApproximateAge ? (
            <FieldRow label="Yaklaşık yaş" value={ageLabel(approximateAge)}>
              <View style={styles.stepper}>
                <Tappable
                  accessibilityLabel="Yaşı azalt"
                  accessibilityRole="button"
                  disabled={approximateAge === 0}
                  hitSlop={STEPPER_HIT_SLOP}
                  onPress={() => {
                    selectionHaptic();
                    setApproximateAge((age) => age - 1);
                  }}
                  pressedScale={0.9}
                  style={styles.stepperButton}>
                  <MinusIcon size={18} weight="bold" color={colors.ink} />
                </Tappable>
                <Tappable
                  accessibilityLabel="Yaşı artır"
                  accessibilityRole="button"
                  disabled={approximateAge === MAX_AGE}
                  hitSlop={STEPPER_HIT_SLOP}
                  onPress={() => {
                    selectionHaptic();
                    setApproximateAge((age) => age + 1);
                  }}
                  pressedScale={0.9}
                  style={styles.stepperButton}>
                  <PlusIcon size={18} weight="bold" color={colors.ink} />
                </Tappable>
              </View>
            </FieldRow>
          ) : (
            <PressableField
              icon={<CalendarBlankIcon size={20} weight="bold" color={colors.ink2} />}
              label="Doğum tarihi (isteğe bağlı)"
              placeholder="Tarih seç"
              value={birthDate ? formatLongDate(birthDate) : null}
              onPress={() => setIsDatePickerOpen(true)}
            />
          )}
        </View>

        <Tappable
          accessibilityRole="button"
          onPress={() => setUsesApproximateAge((value) => !value)}
          style={styles.hint}>
          <InfoIcon size={16} weight="bold" color={colors.ink2} />
          <Text style={styles.hintText}>
            {usesApproximateAge
              ? 'Doğum tarihini biliyor musun? Tarih seç.'
              : 'Sahiplendin ve emin değil misin? Yaklaşık yaş seç.'}
          </Text>
        </Tappable>

        {pet && (
          <View style={styles.removeAction}>
            <Button
              disabled={isSaving}
              label="Hayvanı sil"
              size="small"
              variant="danger"
              onPress={() => confirmRemove(pet)}
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
          value={birthDate ?? yearsAgo(1)}
          onCancel={() => setIsDatePickerOpen(false)}
          onConfirm={(date) => {
            setBirthDate(date);
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 22,
    marginBottom: 18,
  },
  headCopy: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  lede: {
    marginTop: 6,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  photoBadge: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: colors.paper,
    backgroundColor: colors.ink,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink2,
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  speciesOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  speciesSelected: {
    backgroundColor: colors.ink,
  },
  speciesLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  speciesLabelSelected: {
    color: colors.card,
  },
  birthField: {
    marginTop: 10,
  },
  stepper: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paper,
  },
  hint: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  hintText: {
    flex: 1,
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
