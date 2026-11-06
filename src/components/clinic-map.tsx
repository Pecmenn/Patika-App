import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { cardShadow, colors } from '@/constants/theme';

const DELTA = 0.006;

// Kliniğin yerini gösterir, kaydırılmaz: yol tarifi düğmesi telefonun harita uygulamasını açar.
export function ClinicMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <View pointerEvents="none" style={styles.card}>
      <MapView
        initialRegion={{ latitude, longitude, latitudeDelta: DELTA, longitudeDelta: DELTA }}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={false}
        style={styles.map}
        zoomEnabled={false}>
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 150,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  map: {
    flex: 1,
  },
});
