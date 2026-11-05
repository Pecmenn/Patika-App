import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { PressableField, TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { HoldButton } from '@/components/hold-button';
import { LastSeenMap } from '@/components/last-seen-map';
import { PetAvatar } from '@/components/pet-avatar';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { startLostReport } from '@/data/lost-reports';
import { resolvePetPhotoUri } from '@/data/pet-photo-storage';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSession } from '@/hooks/use-session';
import { formatTime, toTimeKey } from '@/lib/dates';
import { lastSeenDate, type Point } from '@/lib/lost';
import { refreshReminders } from '@/lib/reminders';

const clockIcon = <ClockIcon size={20} weight="bold" color={colors.ink2} />;

function WhatHappens({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View style={styles.whatRow}>
      <View style={styles.whatIcon}>{icon}</View>
      <Text style={styles.whatText}>{children}</Text>
    </View>
  );
}

export default function StartLostScreen() {
  const insets = useSafeAreaInsets();
  const session = useSession();
  const pets = useFocusData(listPets);
  // Haber ekranından gelindiyse o hayvan seçili başlar.
  const { petId: initialPetId } = useLocalSearchParams<{ petId?: string }>();

  const [chosenPetId, setChosenPetId] = useState<string | null>(initialPetId ?? null);
  const [place, setPlace] = useState<Point | null>(null);
  const [area, setArea] = useState('');
  const [isAreaEdited, setIsAreaEdited] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => new Date());
  const [description, setDescription] = useState('');
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const petId = chosenPetId ?? pets?.[0]?.id ?? null;
  const pet = pets?.find((candidate) => candidate.id === petId);
  const trimmedArea = area.trim();
  const canStart = Boolean(session && pet && place && trimmedArea) && !isStarting;

  // Nokta değişince eski semt yazısı silinir: yanlış semtle başlatılamasın.
  function movePlace(point: Point) {
    setPlace(point);
    if (!isAreaEdited) {
      setArea('');
    }
  }

  function fillArea(found: string) {
    if (!isAreaEdited) {
      setArea(found);
    }
  }

  async function start() {
    if (!pet || !place || !canStart) {
      return;
    }
    // Açık kalan klavye, sonraki ekrandaki ilk dokunuşu yutmasın.
    Keyboard.dismiss();
    setIsStarting(true);
    try {
      const id = await startLostReport({
        pet,
        lastSeenArea: trimmedArea,
        lastSeenLat: place.latitude,
        lastSeenLng: place.longitude,
        lastSeenAt: lastSeen,
        description: description.trim() || null,
      });
      // İhbar geldiğinde bildirim çıkabilsin. Hiç hatırlatma kurmamış kullanıcıda izin henüz yok.
      refreshReminders({ askPermission: true }).catch((error) => {
        console.warn('Bildirim izni istenemedi', error);
      });
      router.replace({ pathname: '/lost/[id]', params: { id } });
    } catch (error) {
      console.warn('Kayıp modu başlatılamadı', error);
      setIsStarting(false);
      Alert.alert('Kayıp modu başlatılamadı', 'İnternet bağlantını kontrol edip tekrar dene. Kayıp modu için internet gerekiyor.', [{ text: 'Tamam' }]);
    }
  }

  let missingHint: string | null = null;
  if (!session) {
    missingHint = 'Kayıp modu için giriş yapmış olman gerekiyor.';
  } else if (!place) {
    missingHint = 'Başlatmak için haritada son görüldüğü yeri işaretle.';
  } else if (!trimmedArea) {
    missingHint = 'Semt yazısı bekleniyor. Birkaç saniyede dolmazsa kendin yaz.';
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <GlassButton label="Kapat" onPress={() => router.back()}>
          <XIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        <Text accessibilityRole="header" style={styles.title}>
          Kayıp modunu başlat
        </Text>

        <Text style={styles.label}>Kim kayıp?</Text>
        <View style={styles.pets}>
          {pets?.map((candidate) => {
            const isSelected = candidate.id === petId;
            return (
              <Pressable
                key={candidate.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setChosenPetId(candidate.id)}
                style={[styles.pet, isSelected && styles.petSelected]}>
                <PetAvatar
                  photoUri={candidate.photo ? resolvePetPhotoUri(candidate.photo) : null}
                  size={40}
                  species={candidate.species}
                />
                <Text numberOfLines={1} style={styles.petName}>
                  {candidate.name}
                </Text>
                {isSelected && <CheckCircleIcon size={22} weight="fill" color={colors.ink} />}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Son görüldüğü yer</Text>
        <LastSeenMap onArea={fillArea} onMove={movePlace} />
        <Text style={styles.note}>Tam nokta yalnızca sana görünür.</Text>

        <View style={styles.field}>
          <TextField
            autoCapitalize="words"
            label="Semt (herkese görünür)"
            maxLength={80}
            placeholder="Örneğin Moda, Kadıköy"
            value={area}
            onChangeText={(text) => {
              setArea(text);
              setIsAreaEdited(true);
            }}
          />
        </View>

        <View style={styles.field}>
          <PressableField
            icon={clockIcon}
            label="Son görülme saati"
            placeholder="Saat seç"
            value={formatTime(toTimeKey(lastSeen))}
            onPress={() => setIsTimeOpen(true)}
          />
        </View>

        <View style={styles.field}>
          <TextField
            autoCapitalize="sentences"
            label="Ayırt edici özellikler (isteğe bağlı)"
            maxLength={300}
            multiline
            placeholder="Örneğin mavi tasma, korkak, kovalamayın"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Text style={styles.label}>Başlatınca</Text>
        <View style={styles.what}>
          <WhatHappens icon={<QrCodeIcon size={19} weight="bold" color={colors.alertText} />}>
            Hayvanının kayıp sayfası açılır, QR koduyla ya da bağlantıyla herkes görebilir
          </WhatHappens>
          <View style={styles.divider} />
          <WhatHappens icon={<MapPinIcon size={19} weight="bold" color={colors.alertText} />}>
            Sayfayı gören kişi sana konum ve mesaj gönderebilir
          </WhatHappens>
          <View style={styles.divider} />
          <WhatHappens icon={<ShieldCheckIcon size={19} weight="bold" color={colors.alertText} />}>
            Sayfada yalnızca semt görünür. Tam konumun ve numaran görünmez
          </WhatHappens>
        </View>

        <View style={styles.hold}>
          <HoldButton
            disabled={!canStart}
            label={isStarting ? 'Başlatılıyor...' : 'Basılı tut, dolunca bırak'}
            onComplete={start}
          />
        </View>
        <Text style={styles.hint}>
          {missingHint ?? 'Yanlışlıkla başlamaması için çubuk dolana kadar basılı tut, sonra parmağını kaldır.'}
        </Text>
      </ScrollView>

      {isTimeOpen && (
        <DatePickerSheet
          mode="time"
          value={lastSeen}
          onCancel={() => setIsTimeOpen(false)}
          onConfirm={(date) => {
            setLastSeen(lastSeenDate(date.getHours(), date.getMinutes()));
            setIsTimeOpen(false);
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
  },
  title: {
    marginTop: 18,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 4,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink2,
  },
  pets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pet: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.card,
  },
  petSelected: {
    borderColor: colors.ink,
  },
  petName: {
    flex: 1,
    fontFamily: fonts.uiHeavy,
    fontSize: 16,
    color: colors.ink,
  },
  note: {
    marginTop: 8,
    marginHorizontal: 4,
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: colors.ink2,
  },
  field: {
    marginTop: 10,
  },
  what: {
    paddingVertical: 2,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  whatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  whatIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.alertSoft,
  },
  whatText: {
    flex: 1,
    fontFamily: fonts.uiSemi,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  hold: {
    marginTop: 16,
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink2,
  },
});
