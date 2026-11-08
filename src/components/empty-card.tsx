import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { cardShadow, colors, fonts } from '@/constants/theme';

type EmptyCardProps = {
  title: string;
  body: string;
  // Boş ya da hatalı durumda bir sonraki adım: "Tekrar dene", "Aşı ekle" gibi.
  action?: { label: string; onPress: () => void };
};

export function EmptyCard({ title, body, action }: EmptyCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action && (
        <View style={styles.action}>
          <Button label={action.label} size="small" onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: cardShadow,
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
    alignSelf: 'flex-start',
    marginTop: 14,
  },
});
