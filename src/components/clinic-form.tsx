import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ChoiceChips, MultiChoiceChips } from '@/components/choice-chips';
import { ClinicThumb } from '@/components/clinic-thumb';
import { TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { HoursEditor } from '@/components/hours-editor';
import { LastSeenMap } from '@/components/last-seen-map';
import { Tappable } from '@/components/tappable';
import { SPECIES, SPECIES_KEYS } from '@/constants/species';
import { colors, fonts } from '@/constants/theme';
import { saveOwnClinic, uploadOwnClinicPhoto, type ClinicFields, type OwnClinic } from '@/data/own-clinic';
import type { Species } from '@/data/pets';
import {
  defaultHours,
  hasValidHours,
  isValidInstagram,
  isValidPhone,
  isValidWebsite,
  SERVICE_OPTIONS,
  SLOT_OPTIONS,
  type ClinicService,
  type DayHours,
} from '@/lib/clinics';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import type { Point } from '@/lib/lost';

const SPECIES_OPTIONS = SPECIES_KEYS.map((key) => ({ value: key, label: SPECIES[key].label }));
const SLOT_CHOICES = SLOT_OPTIONS.map((minutes) => ({ value: String(minutes), label: `${minutes} dk` }));

// Verilirse form bu kliniği düzenler. Yoksa yeni klinik oluşturup onaya gönderir.
export function ClinicForm({ clinic }: { clinic: OwnClinic | null }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(clinic?.name ?? '');
  const [vetName, setVetName] = useState(clinic?.vetName ?? '');
  const [licenseNo, setLicenseNo] = useState(clinic?.licenseNo ?? '');
  const [phone, setPhone] = useState(clinic?.phone ?? '');
  const [address, setAddress] = useState(clinic?.address ?? '');
  const [area, setArea] = useState(clinic?.area ?? '');
  const [hasTypedArea, setHasTypedArea] = useState(clinic !== null);
  const [point, setPoint] = useState<Point | null>(
    clinic ? { latitude: clinic.latitude, longitude: clinic.longitude } : null,
  );
  const [hours, setHours] = useState<DayHours[]>(clinic?.hours ?? defaultHours());
  const [slotMinutes, setSlotMinutes] = useState(clinic?.slotMinutes ?? 30);
  const [species, setSpecies] = useState<Species[]>(clinic?.species ?? []);
  const [services, setServices] = useState<ClinicService[]>(clinic?.services ?? []);
  const [description, setDescription] = useState(clinic?.description ?? '');
  const [website, setWebsite] = useState(clinic?.website ?? '');
  const [instagram, setInstagram] = useState(clinic?.instagram ?? '');
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const allowLeave = useDiscardGuard({ name, vetName, licenseNo, phone, address, area, point, hours, slotMinutes, species, services, description, website, instagram, pickedPhotoUri });

  const missing = [
    !name.trim() && 'klinik adı',
    !vetName.trim() && 'hekim adı',
    !licenseNo.trim() && 'oda sicil numarası',
    !isValidPhone(phone) && 'telefon',
    !point && 'harita konumu',
    !address.trim() && 'adres',
    !area.trim() && 'semt',
    !hasValidHours(hours) && 'çalışma saatleri',
    species.length === 0 && 'baktığın türler',
    !isValidWebsite(website) && 'web adresi (https:// ile başlamalı)',
    !isValidInstagram(instagram) && 'Instagram kullanıcı adı',
  ].filter((item): item is string => Boolean(item));

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

  async function save(fields: ClinicFields) {
    setIsSaving(true);
    try {
      await saveOwnClinic(fields);
    } catch (error) {
      console.warn('Klinik kaydedilemedi', error);
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.', [
        { text: 'Tamam' },
      ]);
      return;
    }
    if (pickedPhotoUri) {
      try {
        await uploadOwnClinicPhoto(pickedPhotoUri);
      } catch (error) {
        console.warn('Klinik fotoğrafı yüklenemedi', error);
        Alert.alert('Fotoğraf yüklenemedi', 'Bilgilerin kaydedildi. Fotoğrafı sonra yeniden deneyebilirsin.', [
          { text: 'Tamam' },
        ]);
      }
    }
    if (!clinic) {
      Alert.alert('Onaya gönderildi', 'Bilgilerin kontrol edilince sahiplerin listesinde görüneceksin.', [
        { text: 'Tamam' },
      ]);
    }
    allowLeave();
    router.back();
  }

  function submit() {
    if (!point) {
      return;
    }
    const fields: ClinicFields = {
      name: name.trim(),
      vetName: vetName.trim(),
      licenseNo: licenseNo.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area: area.trim(),
      latitude: point.latitude,
      longitude: point.longitude,
      hours,
      slotMinutes,
      species,
      services,
      description: description.trim() || null,
      website: website.trim() || null,
      instagram: instagram.trim() || null,
    };
    const needsReview =
      clinic?.approval === 'approved' &&
      (clinic.name !== fields.name ||
        clinic.vetName !== fields.vetName ||
        clinic.licenseNo !== fields.licenseNo);
    if (needsReview) {
      Alert.alert(
        'Yeniden onay gerekecek',
        'Klinik adı, hekim adı ya da sicil numarası değişince bilgiler yeniden kontrol edilir. Onaylanana kadar listede görünmezsin.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Devam et', onPress: () => save(fields) },
        ],
      );
      return;
    }
    save(fields);
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
          İşletme bilgileri
        </Text>
        <Text style={styles.lede}>
          Sahipler bu bilgileri görür. Oda sicil numarası yalnızca kontrol içindir, kimseye görünmez.
        </Text>

        <Tappable
          accessibilityLabel="Klinik fotoğrafı seç"
          accessibilityRole="button"
          onPress={pickPhoto}
          style={styles.photo}>
          <ClinicThumb size={72} uri={pickedPhotoUri ?? clinic?.photoUrl ?? null} />
          <View style={styles.photoCopy}>
            <CameraIcon size={18} weight="bold" color={colors.ink} />
            <Text style={styles.photoLabel}>Fotoğraf seç (isteğe bağlı)</Text>
          </View>
        </Tappable>

        <View style={styles.fields}>
          <TextField label="Klinik adı" maxLength={80} value={name} onChangeText={setName} />
          <TextField label="Sorumlu hekim" maxLength={80} value={vetName} onChangeText={setVetName} />
          <TextField
            autoCapitalize="characters"
            label="Oda sicil numarası"
            maxLength={40}
            value={licenseNo}
            onChangeText={setLicenseNo}
          />
          <TextField
            autoCapitalize="none"
            keyboardType="phone-pad"
            label="Telefon"
            maxLength={24}
            placeholder="0216 555 11 22"
            textContentType="telephoneNumber"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Text style={styles.section}>Konum</Text>
        <LastSeenMap
          initialPoint={point ?? undefined}
          onArea={(found) => {
            if (!hasTypedArea && found) {
              setArea(found);
            }
          }}
          onMove={setPoint}
        />
        <View style={styles.fields}>
          <TextField
            autoCapitalize="sentences"
            label="Açık adres"
            maxLength={200}
            multiline
            value={address}
            onChangeText={setAddress}
          />
          <TextField
            label="Semt, ilçe"
            maxLength={80}
            placeholder="Örneğin Moda, Kadıköy"
            value={area}
            onChangeText={(text) => {
              setHasTypedArea(true);
              setArea(text);
            }}
          />
        </View>

        <Text style={styles.section}>Çalışma saatleri</Text>
        <HoursEditor hours={hours} onChange={setHours} />

        <Text style={styles.section}>Randevu aralığı</Text>
        <ChoiceChips
          options={SLOT_CHOICES}
          value={String(slotMinutes)}
          onChange={(value) => setSlotMinutes(Number(value))}
        />

        <Text style={styles.section}>Baktığın türler</Text>
        <MultiChoiceChips options={SPECIES_OPTIONS} values={species} onChange={setSpecies} />

        <Text style={styles.section}>Hizmetler</Text>
        <MultiChoiceChips options={SERVICE_OPTIONS} values={services} onChange={setServices} />

        <Text style={styles.section}>Diğer bilgiler</Text>
        <View style={styles.fields}>
          <TextField
            autoCapitalize="sentences"
            label="Açıklama (isteğe bağlı)"
            maxLength={600}
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextField
            autoCapitalize="none"
            keyboardType="url"
            label="Web adresi (isteğe bağlı)"
            maxLength={200}
            placeholder="https://"
            value={website}
            onChangeText={setWebsite}
          />
          <TextField
            autoCapitalize="none"
            label="Instagram (isteğe bağlı)"
            maxLength={60}
            placeholder="@klinik"
            value={instagram}
            onChangeText={setInstagram}
          />
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {missing.length > 0 && <Text style={styles.missing}>Eksik: {missing.join(', ')}</Text>}
        <Button
          disabled={missing.length > 0 || isSaving}
          label={clinic ? 'Kaydet' : 'Onaya gönder'}
          loading={isSaving}
          onPress={submit}
        />
      </View>
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
    marginBottom: 16,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  photo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoLabel: {
    flexShrink: 1,
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  fields: {
    gap: 10,
    marginTop: 12,
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  actions: {
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  missing: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink2,
  },
});
