import { router } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { colors, fonts } from '@/constants/theme';
import { setWeightRange, type WeightRange } from '@/data/weights';
import { kgToInput, parseKg } from '@/lib/weights';

type WeightRangeFormProps = {
  petId: string;
  petName: string;
  range: WeightRange | null;
};

export function WeightRangeForm({ petId, petName, range }: WeightRangeFormProps) {
  const insets = useSafeAreaInsets();
  const [minText, setMinText] = useState(range ? kgToInput(range.min) : '');
  const [maxText, setMaxText] = useState(range ? kgToInput(range.max) : '');
  const [isSaving, setIsSaving] = useState(false);

  const min = parseKg(minText);
  const max = parseKg(maxText);
  const isValid = min !== null && max !== null && min < max;
  const showsOrderHint = min !== null && max !== null && min >= max;

  async function apply(next: WeightRange | null) {
    setIsSaving(true);
    try {
      await setWeightRange(petId, next);
    } catch {
      setIsSaving(false);
      Alert.alert('Kaydedilemedi', 'Bilgiler kaydedilirken bir sorun oldu. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    router.back();
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
          Sağlıklı aralık
        </Text>
        <Text style={styles.lede}>
          {petName} için veterinerinin söylediği aralığı yaz. Patika kendisi aralık önermez.
        </Text>

        <TextField
          keyboardType="decimal-pad"
          label="En az (kg)"
          maxLength={7}
          placeholder="Örneğin 17"
          value={minText}
          onChangeText={setMinText}
        />
        <View style={styles.field}>
          <TextField
            keyboardType="decimal-pad"
            label="En çok (kg)"
            maxLength={7}
            placeholder="Örneğin 19,5"
            value={maxText}
            onChangeText={setMaxText}
          />
        </View>
        {showsOrderHint && (
          <Text style={styles.hint}>En çok değeri, en az değerinden büyük olmalı.</Text>
        )}

        {range && (
          <View style={styles.removeAction}>
            <Button
              disabled={isSaving}
              label="Aralığı kaldır"
              size="small"
              variant="text"
              onPress={() => apply(null)}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          disabled={!isValid || isSaving}
          label="Kaydet"
          onPress={() => {
            if (isValid) {
              apply({ min, max });
            }
          }}
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
    marginBottom: 18,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  field: {
    marginTop: 10,
  },
  hint: {
    marginTop: 8,
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
