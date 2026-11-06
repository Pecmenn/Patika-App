import { StyleSheet, Text, View } from 'react-native';

import { SignInButton } from '@/components/sign-in-button';
import { colors, fonts } from '@/constants/theme';

// Sunucu oturumu reddedince Bugün'de görünür. Ekran zorla değişmez: yarım kalan form kaybolmasın.
export function SessionEndedCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Oturumun kapandı</Text>
      <Text style={styles.body}>
        Kayıtların bu telefonda duruyor. Yeniden giriş yapana kadar yedeklenmez.
      </Text>
      <View style={styles.action}>
        <SignInButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.skySoft,
  },
  title: {
    fontFamily: fonts.uiHeavy,
    fontSize: 17,
    color: colors.ink,
  },
  body: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink2,
  },
  action: {
    marginTop: 12,
  },
});
