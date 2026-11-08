import { router } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField, type TextFieldHandle } from '@/components/form-fields';
import { GlassButton } from '@/components/glass-button';
import { colors, fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { ACCOUNT_SUSPENDED_MESSAGE, signInAsVet } from '@/lib/auth';
import { isValidEmail } from '@/lib/clinics';

const MIN_PASSWORD = 8;

function authError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'invalid_credentials') {
      return 'E-posta ya da şifre yanlış.';
    }
    if (error.code === 'email_taken') {
      return 'Bu e-postayla açılmış bir hesap var. Giriş yapmayı dene.';
    }
    if (error.code === 'rate_limited') {
      return 'Çok fazla deneme yapıldı. Bir dakika sonra tekrar dene.';
    }
    if (error.code === 'account_suspended') {
      return ACCOUNT_SUSPENDED_MESSAGE;
    }
  }
  return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
}

export default function VetAuthScreen() {
  const insets = useSafeAreaInsets();
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const passwordField = useRef<TextFieldHandle>(null);

  const canSubmit =
    isValidEmail(email) && password.length >= (isNewAccount ? MIN_PASSWORD : 1) && !isBusy;

  async function submit() {
    setIsBusy(true);
    try {
      await signInAsVet(email.trim(), password, isNewAccount);
    } catch (error) {
      console.warn('Veteriner girişi başarısız', error);
      setIsBusy(false);
      Alert.alert(isNewAccount ? 'Hesap açılamadı' : 'Giriş yapılamadı', authError(error), [{ text: 'Tamam' }]);
      return;
    }
    router.replace('/vet/appointments');
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
          {isNewAccount ? 'Klinik hesabı aç' : 'Veteriner girişi'}
        </Text>
        <Text style={styles.lede}>
          {isNewAccount
            ? 'Hesabını aç, kliniğinin bilgilerini doldur. Kontrol edildikten sonra sahipler seni bulabilir ve randevu isteyebilir.'
            : 'Kliniğinin hesabıyla gir, randevu isteklerini ve işletme bilgilerini yönet.'}
        </Text>

        <View style={styles.fields}>
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="E-posta"
            maxLength={320}
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passwordField.current?.focus()}
          />
          <TextField
            autoCapitalize="none"
            label="Şifre"
            maxLength={200}
            secureTextEntry
            ref={passwordField}
            returnKeyType="done"
            textContentType={isNewAccount ? 'newPassword' : 'password'}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => canSubmit && submit()}
          />
        </View>
        {/* Şifreye geçildiğinde e-posta hâlâ geçersizse düğmenin neden kapalı olduğunu söyler. */}
        {password.length > 0 && !isValidEmail(email) && (
          <Text style={styles.hint}>E-posta adresini kontrol et. Örneğin klinik@ornek.com</Text>
        )}
        {isNewAccount && <Text style={styles.hint}>Şifre en az {MIN_PASSWORD} karakter olmalı.</Text>}

        <View style={styles.switch}>
          <Button
            label={isNewAccount ? 'Hesabım var, giriş yap' : 'Hesabım yok, klinik hesabı aç'}
            size="small"
            variant="text"
            onPress={() => setIsNewAccount(!isNewAccount)}
          />
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          disabled={!canSubmit}
          label={isNewAccount ? 'Hesap aç' : 'Giriş yap'}
          loading={isBusy}
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
    marginBottom: 18,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  fields: {
    gap: 10,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.uiSemi,
    fontSize: 13.5,
    color: colors.ink2,
  },
  switch: {
    alignSelf: 'center',
    marginTop: 12,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
