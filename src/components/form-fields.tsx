import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { cardShadow, colors, fonts } from '@/constants/theme';

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  autoCapitalize?: 'words' | 'characters' | 'sentences' | 'none';
  keyboardType?: 'default' | 'decimal-pad' | 'email-address' | 'phone-pad' | 'url';
  multiline?: boolean;
  secureTextEntry?: boolean;
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | 'telephoneNumber';
  onChangeText: (text: string) => void;
};

export function TextField({
  label,
  value,
  placeholder,
  maxLength,
  autoCapitalize = 'words',
  keyboardType = 'default',
  multiline = false,
  secureTextEntry = false,
  textContentType,
  onChangeText,
}: TextFieldProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [isFocused, setIsFocused] = useState(false);

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
          autoCorrect={false}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          returnKeyType="done"
          secureTextEntry={secureTextEntry}
          selectionColor={colors.ink}
          style={styles.input}
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
      onPress={onPress}
      style={styles.field}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !value && styles.placeholder]}>{value ?? placeholder}</Text>
      </View>
      {icon}
    </Pressable>
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
