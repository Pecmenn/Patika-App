import { useImperativeHandle, useRef, useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Tappable } from '@/components/tappable';
import { cardShadow, colors, fonts } from '@/constants/theme';

export type TextFieldHandle = { focus: () => void };

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  autoCapitalize?: 'words' | 'characters' | 'sentences' | 'none';
  // Not gibi serbest metinlerde yazım düzeltmesi yardımcı olur, ad ve numarada yanıltır.
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'email-address' | 'phone-pad' | 'url';
  multiline?: boolean;
  secureTextEntry?: boolean;
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | 'telephoneNumber' | 'name';
  // Klavyedeki düğme: "next" sonraki alana geçer, "done" ya da "send" formu bitirir.
  returnKeyType?: 'done' | 'next' | 'send';
  onSubmitEditing?: () => void;
  onChangeText: (text: string) => void;
  ref?: Ref<TextFieldHandle>;
};

export function TextField({
  label,
  value,
  placeholder,
  maxLength,
  autoCapitalize = 'words',
  autoCorrect = false,
  keyboardType = 'default',
  multiline = false,
  secureTextEntry = false,
  textContentType,
  returnKeyType = 'done',
  onSubmitEditing,
  onChangeText,
  ref,
}: TextFieldProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [isFocused, setIsFocused] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  return (
    <Pressable
      accessible={false}
      onPress={() => inputRef.current?.focus()}
      style={[styles.field, isFocused && styles.focused]}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          selectionColor={colors.ink}
          style={styles.input}
          // Sonraki alana geçerken klavye kapanıp açılmasın.
          submitBehavior={!multiline && returnKeyType === 'next' ? 'submit' : undefined}
          textContentType={textContentType}
          value={value}
        />
      </View>
    </Pressable>
  );
}

type PressableFieldProps = {
  label: string;
  value: string | null;
  placeholder: string;
  icon: ReactNode;
  onPress: () => void;
};

export function PressableField({ label, value, placeholder, icon, onPress }: PressableFieldProps) {
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
      onPress={onPress}
      pressedScale={0.98}
      style={styles.field}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !value && styles.placeholder]}>{value ?? placeholder}</Text>
      </View>
      {icon}
    </Tappable>
  );
}

// Etiket ve değerin yanına düğme gibi başka parçalar koymak için.
export function FieldRow({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  focused: {
    borderColor: colors.ink,
  },
  content: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.ink3,
  },
  input: {
    marginTop: 2,
    padding: 0,
    fontFamily: fonts.uiBold,
    fontSize: 17,
    color: colors.ink,
  },
  value: {
    marginTop: 2,
    fontFamily: fonts.uiBold,
    fontSize: 17,
    color: colors.ink,
  },
  placeholder: {
    color: colors.ink3,
  },
});
