import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { ClinicThumb } from '@/components/clinic-thumb';
import { EmptyCard } from '@/components/empty-card';
import { TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { PetAvatar } from '@/components/pet-avatar';
import { SignInButton } from '@/components/sign-in-button';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { listMyAppointments, requestAppointment } from '@/data/appointments';
import { fetchClinic, fetchFreeTimes } from '@/data/clinics';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSession } from '@/hooks/use-session';
import { ApiError } from '@/lib/api';
import { bookingDays, formatAppointmentWhen, isValidPhone } from '@/lib/clinics';
import { formatTime } from '@/lib/dates';
import { refreshReminders } from '@/lib/reminders';

const REASONS = ['Aşı', 'Kontrol', 'Hastalık', 'Diş', 'Diğer'].map((value) => ({ value, label: value }));

function requestError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'slot_unavailable') {
      return 'Bu saat artık boş değil. Başka bir saat seç.';
    }
    if (error.code === 'already_requested') {
      return 'Bu saat için zaten bekleyen bir isteğin var.';
    }
    if (error.code === 'too_many_requests') {
      return 'En fazla 5 bekleyen isteğin olabilir. Cevap gelince yeniden dene.';
    }
    if (error.status === 401) {
      return 'Oturumun kapanmış. Yeniden giriş yapıp tekrar dene.';
    }
  }
  return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
}

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const load = useCallback(async () => {
    try {
      return { clinic: await fetchClinic(id) };
    } catch (error) {
      console.warn('Klinik okunamadı', error);
      return { clinic: null };
    }
  }, [id]);
  const data = useFocusData(load);
  const pets = useFocusData(listPets);
  const history = useFocusData(listMyAppointments);
  const clinic = data?.clinic;

  const [pickedPetId, setPickedPetId] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ date: string; time: string } | null>(null);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [typedPhone, setTypedPhone] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadedTimes, setLoadedTimes] = useState<{ key: string; times: string[] | null } | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const days = clinic ? bookingDays(clinic.hours) : [];
  const date = pickedDate ?? days.find((day) => !day.isClosed)?.date ?? null;
  const pet = pets?.find((candidate) => candidate.id === pickedPetId) ?? pets?.[0];

  // Telefon ve ad bir yerde saklanmaz: önceki randevudan ya da hesaptan gelir, istenirse değiştirilir.
  const last = history?.[0];
  const ownerName = typedName ?? last?.ownerName ?? session?.user.full_name ?? '';
  const ownerPhone = typedPhone ?? last?.ownerPhone ?? '';

  const timesKey = date ? `${date}/${reloadCount}` : null;
  useEffect(() => {
    if (!date || !timesKey) {
      return undefined;
    }
    let isActive = true;
    fetchFreeTimes(id, date)
      .then((times) => {
        if (isActive) {
          setLoadedTimes({ key: timesKey, times });
        }
      })
      .catch((error) => {
        console.warn('Boş saatler okunamadı', error);
        if (isActive) {
          setLoadedTimes({ key: timesKey, times: null });
        }
      });
    return () => {
      isActive = false;
    };
  }, [id, date, timesKey]);

  const isLoadingTimes = loadedTimes?.key !== timesKey;
  const times = isLoadingTimes ? [] : (loadedTimes?.times ?? []);
  const hasTimesFailed = !isLoadingTimes && loadedTimes?.times === null;
  const time = picked?.date === date && times.includes(picked?.time ?? '') ? (picked?.time ?? null) : null;

  const canSend =
    !isSending &&
    pet !== undefined &&
    reason !== null &&
    date !== null &&
    time !== null &&
    ownerName.trim().length >= 2 &&
    isValidPhone(ownerPhone);

  async function send() {
    if (!pet || !reason || !date || !time) {
      return;
    }
    setIsSending(true);
    try {
      await requestAppointment({
        clinicId: id,
        pet,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        reason,
        note: note.trim() || null,
        date,
        time,
      });
    } catch (error) {
      console.warn('Randevu isteği gönderilemedi', error);
      setIsSending(false);
      setReloadCount((count) => count + 1);
      Alert.alert('İstek gönderilemedi', requestError(error), [{ text: 'Tamam' }]);
      return;
    }
    // Onaylanan randevu hatırlatılacak, cevap da bildirimle gelecek.
    await refreshReminders({ askPermission: true });
    router.replace('/appointments');
  }

  const closeButton = (
    <GlassButton label="Kapat" onPress={() => router.back()}>
      <XIcon size={20} weight="bold" color={colors.ink} />
    </GlassButton>
  );

  if (session === null) {
    return (
      <View style={[styles.screen, styles.scroll, { paddingTop: insets.top + 2 }]}>
        {closeButton}
        <EmptyCard body="Randevu isteği göndermek için giriş yap." title="Giriş gerekiyor" />
        <View style={styles.signIn}>
          <SignInButton />
        </View>
      </View>
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
        {closeButton}
        <Text accessibilityRole="header" style={styles.title}>
          Randevu iste
        </Text>

        {data && !clinic && (
          <EmptyCard
            body="Klinik artık listede olmayabilir ya da internet bağlantısı kopmuş olabilir."
            title="Klinik açılamadı"
          />
        )}

        {clinic && (
          <>
            <View style={styles.clinic}>
              <ClinicThumb size={48} uri={clinic.photoUrl} />
              <View style={styles.clinicCopy}>
                <Text style={styles.clinicName}>{clinic.name}</Text>
                <Text style={styles.clinicMeta}>{clinic.vetName}</Text>
              </View>
            </View>

            <Text style={styles.section}>Kim için?</Text>
            {pets?.length === 0 && (
              <Text style={styles.hint}>Randevu için önce Hayvanlar ekranından hayvan ekle.</Text>
            )}
            <View style={styles.pets}>
              {pets?.map((candidate) => {
                const isSelected = candidate.id === pet?.id;
                return (
                  <Pressable
                    key={candidate.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setPickedPetId(candidate.id)}
                    style={[styles.pet, isSelected && styles.petSelected]}>
                    <PetAvatar
                      photoUri={candidate.photo ? resolvePetPhotoUri(candidate.photo) : null}
                      size={28}
                      species={candidate.species}
                    />
                    <Text style={[styles.petName, isSelected && styles.petNameSelected]}>
                      {candidate.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>Neden?</Text>
            <ChoiceChips options={REASONS} value={reason} onChange={setReason} />

            <Text style={styles.section}>Gün</Text>
            <ScrollView
              horizontal
              contentContainerStyle={styles.days}
              showsHorizontalScrollIndicator={false}
              style={styles.daysRow}>
              {days.map((day) => {
                const isSelected = day.date === date;
                return (
                  <Pressable
                    key={day.date}
                    accessibilityLabel={`${day.dayOfMonth} ${day.month} ${day.weekday}${day.isClosed ? ', kapalı' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: day.isClosed, selected: isSelected }}
                    disabled={day.isClosed}
                    onPress={() => setPickedDate(day.date)}
                    style={[styles.day, isSelected && styles.daySelected, day.isClosed && styles.dayClosed]}>
                    <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>{day.weekday}</Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>{day.dayOfMonth}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.section}>Saat</Text>
            {hasTimesFailed && <Text style={styles.hint}>Saatler okunamadı. İnternet bağlantını kontrol et.</Text>}
            {!isLoadingTimes && !hasTimesFailed && times.length === 0 && (
              <Text style={styles.hint}>Bu gün için boş saat kalmadı. Başka bir gün seç.</Text>
            )}
            <View style={styles.times}>
              {times.map((candidate) => {
                const isSelected = candidate === time;
                return (
                  <Pressable
                    key={candidate}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => date && setPicked({ date, time: candidate })}
                    style={[styles.time, isSelected && styles.timeSelected]}>
                    <Text style={styles.timeLabel}>{formatTime(candidate)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>İletişim</Text>
            <View style={styles.fields}>
              <TextField
                label="Adın soyadın"
                maxLength={100}
                value={ownerName}
                onChangeText={setTypedName}
              />
              <TextField
                autoCapitalize="none"
                keyboardType="phone-pad"
                label="Telefonun"
                maxLength={24}
                placeholder="0532 555 00 11"
                textContentType="telephoneNumber"
                value={ownerPhone}
                onChangeText={setTypedPhone}
              />
              <TextField
                autoCapitalize="sentences"
                label="Not (isteğe bağlı)"
                maxLength={500}
                placeholder="Örneğin iki gündür yemek yemiyor"
                value={note}
                onChangeText={setNote}
              />
            </View>

            <View style={styles.privacy}>
              <ShieldCheckIcon size={18} weight="fill" color={colors.ink2} />
              <Text style={styles.privacyText}>
                Klinik adını, telefonunu, hayvanının adını, türünü, ırkını ve yaşını görür. Sağlık kayıtları paylaşılmaz.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {clinic && (
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            disabled={!canSend}
            label={date && time ? `${formatAppointmentWhen(date, time)} için istek gönder` : 'Gün ve saat seç'}
            onPress={send}
          />
        </View>
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
  signIn: {
    marginTop: 14,
  },
  clinic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  clinicCopy: {
    flex: 1,
    minWidth: 0,
  },
  clinicName: {
    fontFamily: fonts.uiHeavy,
    fontSize: 16,
    color: colors.ink,
  },
  clinicMeta: {
    marginTop: 1,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    color: colors.ink2,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 4,
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink2,
  },
  hint: {
    marginTop: 8,
    marginHorizontal: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
  },
  pets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  pet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 42,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  petSelected: {
    borderColor: colors.paw,
    backgroundColor: colors.paw,
  },
  petName: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  petNameSelected: {
    fontFamily: fonts.uiHeavy,
  },
  daysRow: {
    marginTop: 10,
    marginHorizontal: -20,
    flexGrow: 0,
  },
  days: {
    gap: 8,
    paddingHorizontal: 20,
  },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 68,
    borderRadius: 18,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  daySelected: {
    backgroundColor: colors.ink,
  },
  dayClosed: {
    opacity: 0.4,
    boxShadow: 'none',
  },
  dayName: {
    fontFamily: fonts.uiSemi,
    fontSize: 12.5,
    color: colors.ink3,
  },
  dayNumber: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  dayTextSelected: {
    color: colors.card,
  },
  times: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  time: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '31.5%',
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  timeSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ball,
  },
  timeLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.ink,
  },
  fields: {
    gap: 10,
    marginTop: 10,
  },
  privacy: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginHorizontal: 4,
  },
  privacyText: {
    flex: 1,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
