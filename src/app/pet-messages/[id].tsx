import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { GlassButton } from '@/components/glass-button';
import { SightingRow } from '@/components/sighting-row';
import { cardShadow, colors, fonts } from '@/constants/theme';
import { deletePetMessages, listPetMessages, subscribeToSightings } from '@/data/lost-reports';
import { listPets } from '@/data/pets';
import { useFocusData } from '@/hooks/use-focus-data';

async function loadMessages() {
  const [messages, pets] = await Promise.all([listPetMessages(), listPets()]);
  return { messages, pets, now: new Date() };
}

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/today');
  }
}

// Kayıp modu kapalıyken künyedeki QR'dan gelen haberler.
export default function PetMessagesScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useFocusData(loadMessages, subscribeToSightings);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!data) {
    return <View style={styles.screen} />;
  }
  const pet = data.pets.find((candidate) => candidate.id === id);
  const messages = data.messages.filter((message) => message.petId === id);
  const name = pet?.name ?? 'Hayvanın';

  async function removeAll() {
    setIsDeleting(true);
    try {
      await deletePetMessages(id);
      goBack();
    } catch (error) {
      console.warn('Haberler silinemedi', error);
      setIsDeleting(false);
      Alert.alert('Silinemedi', 'İnternet bağlantını kontrol edip tekrar dene.', [{ text: 'Tamam' }]);
    }
  }

  function confirmRemove() {
    Alert.alert('Haberler silinsin mi?', 'Bu haberler geri getirilemez.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: removeAll },
    ]);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassButton label="Geri" onPress={goBack}>
          <CaretLeftIcon size={20} weight="bold" color={colors.ink} />
        </GlassButton>

        <Text accessibilityRole="header" style={styles.title}>
          {name} için haber var
        </Text>
        <Text style={styles.lead}>
          {messages.length > 1 ? 'QR kodunu okutanlar sana yazdı.' : 'QR kodunu okutan biri sana yazdı.'}{' '}
          {name} yanında değilse kayıp modunu başlat, haberler ilana eklenir.
        </Text>

        {messages.length === 0 ? (
          <View style={styles.empty}>
            <EmptyCard body="Yeni bir haber geldiğinde burada görünür." title="Haber yok" />
          </View>
        ) : (
          <View style={styles.card}>
            {messages.map((message, index) => (
              <View key={message.id} style={index > 0 && styles.divider}>
                <SightingRow now={data.now} sighting={message} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {messages.length > 0 && (
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button
            label="Kayıp modunu başlat"
            onPress={() => router.replace({ pathname: '/start-lost', params: { petId: id } })}
          />
          <Button
            disabled={isDeleting}
            label={isDeleting ? 'Siliniyor...' : 'Haberleri sil'}
            size="small"
            variant="text"
            onPress={confirmRemove}
          />
        </View>
      )}
    </View>
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
    marginTop: 18,
    fontFamily: fonts.displaySemi,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  lead: {
    marginTop: 6,
    fontFamily: fonts.ui,
    fontSize: 15.5,
    lineHeight: 22,
    color: colors.ink2,
  },
  empty: {
    marginTop: 16,
  },
  card: {
    marginTop: 16,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  actions: {
    gap: 2,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
