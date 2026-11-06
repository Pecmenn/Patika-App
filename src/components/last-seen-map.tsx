import * as Location from 'expo-location';
import { CrosshairIcon } from 'phosphor-react-native/src/icons/Crosshair';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';

import { cardShadow, colors, fonts } from '@/constants/theme';
import { areaFromAddress, isSameSpot, type Point } from '@/lib/lost';

const ISTANBUL: Region = {
  latitude: 41.015,
  longitude: 28.979,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};
const CLOSE_DELTA = 0.008;
// Harita kaydırılırken her durakta sormamak için. Apple aynı anda tek adres sorgusuna izin veriyor.
const AREA_DELAY_MS = 500;

type LastSeenMapProps = {
  // Nokta değişince hemen çağrılır, semt adı beklenmez.
  onMove: (point: Point) => void;
  // Yalnızca son seçilen noktanın semt adıyla çağrılır. Bulunamazsa boş metin gelir.
  onArea: (area: string) => void;
  // Daha önce seçilmiş bir nokta varsa harita orada açılır.
  initialPoint?: Point;
};

// Harita kaydırılır, ortadaki iğnenin altındaki nokta seçilmiş olur.
export function LastSeenMap({ onMove, onArea, initialPoint }: LastSeenMapProps) {
  const mapRef = useRef<ComponentRef<typeof MapView>>(null);
  const isReadyRef = useRef(false);
  // Kullanıcı haritayı elle kaydırdı mı?
  const hasDraggedRef = useRef(false);
  // "Konumumu kullan" ile gidilen nokta. Oraya varılana kadar gelen duraklar seçim sayılmaz.
  const targetRef = useRef<Point | null>(null);
  const requestRef = useRef(0);
  const areaTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hasPicked, setHasPicked] = useState(initialPoint !== undefined);
  const hasInitialPoint = initialPoint !== undefined;

  const flyToTarget = useCallback(() => {
    if (targetRef.current && isReadyRef.current) {
      mapRef.current?.animateToRegion(
        { ...targetRef.current, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA },
        400,
      );
    }
  }, []);

  const goTo = useCallback(
    ({ latitude, longitude }: Point) => {
      hasDraggedRef.current = false;
      targetRef.current = { latitude, longitude };
      flyToTarget();
    },
    [flyToTarget],
  );

  // Daha önce izin verildiyse harita doğrudan bulunduğun yerde açılır.
  useEffect(() => {
    let isActive = true;
    (async () => {
      const { granted } = await Location.getForegroundPermissionsAsync();
      if (!granted || hasInitialPoint) {
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (isActive && !hasDraggedRef.current) {
        goTo(position.coords);
      }
    })().catch((error) => console.warn('Konum alınamadı', error));
    return () => {
      isActive = false;
      clearTimeout(areaTimerRef.current);
    };
  }, [goTo, hasInitialPoint]);

  async function useMyLocation() {
    try {
      const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Konum izni yok',
          'Haritayı elle kaydırarak da işaretleyebilirsin.',
          canAskAgain
            ? [{ text: 'Tamam' }]
            : [
                { text: 'Tamam', style: 'cancel' },
                { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      goTo(position.coords);
    } catch (error) {
      console.warn('Konum alınamadı', error);
      Alert.alert('Konum alınamadı', 'Haritayı elle kaydırarak işaretleyebilirsin.', [{ text: 'Tamam' }]);
    }
  }

  function findArea(point: Point) {
    requestRef.current += 1;
    const request = requestRef.current;
    clearTimeout(areaTimerRef.current);
    areaTimerRef.current = setTimeout(async () => {
      let area = '';
      try {
        const [address] = await Location.reverseGeocodeAsync(point);
        area = address ? areaFromAddress(address) : '';
      } catch (error) {
        console.warn('Semt adı bulunamadı', error);
      }
      // Bu arada yeni bir nokta seçildiyse eski cevap yok sayılır.
      if (request === requestRef.current) {
        onArea(area);
      }
    }, AREA_DELAY_MS);
  }

  function handleRegionChange({ latitude, longitude }: Region) {
    const point = { latitude, longitude };
    if (targetRef.current && isSameSpot(point, targetRef.current)) {
      targetRef.current = null;
    } else if (!hasDraggedRef.current) {
      // Haritanın açılışı ya da yolda bir durak. Kullanıcının seçimi değil.
      return;
    }
    setHasPicked(true);
    onMove(point);
    findArea(point);
  }

  return (
    <View style={styles.card}>
      <MapView
        ref={mapRef}
        initialRegion={
          initialPoint
            ? { ...initialPoint, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA }
            : ISTANBUL
        }
        onMapReady={() => {
          isReadyRef.current = true;
          flyToTarget();
        }}
        onPanDrag={() => {
          hasDraggedRef.current = true;
          targetRef.current = null;
        }}
        onRegionChangeComplete={handleRegionChange}
        style={styles.map}
      />
      <View pointerEvents="none" style={styles.pin}>
        <MapPinIcon size={34} weight="fill" color={colors.alert} />
      </View>
      <Pressable accessibilityRole="button" onPress={useMyLocation} style={styles.locate}>
        <CrosshairIcon size={16} weight="bold" color={colors.card} />
        <Text style={styles.locateLabel}>Konumumu kullan</Text>
      </Pressable>
      {!hasPicked && (
        <View pointerEvents="none" style={styles.hint}>
          <Text style={styles.hintText}>Haritayı kaydırıp yeri işaretle</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 210,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.card,
    boxShadow: cardShadow,
  },
  map: {
    flex: 1,
  },
  // İğnenin ucu haritanın tam ortasına gelsin diye yukarı kaydırıldı.
  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -32,
    marginLeft: -17,
  },
  locate: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  locateLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.card,
  },
  hint: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  hintText: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.ink,
  },
});
