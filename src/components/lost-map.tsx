import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { colors } from '@/constants/theme';
import type { LostReport, Sighting } from '@/data/lost-reports';
import { regionFor } from '@/lib/lost';

type LostMapProps = {
  report: LostReport;
  sightings: Sighting[];
};

export function LostMap({ report, sightings }: LostMapProps) {
  const lastSeen = { latitude: report.lastSeenLat, longitude: report.lastSeenLng };
  const located = sightings.flatMap((sighting) =>
    sighting.lat !== null && sighting.lng !== null
      ? [{ id: sighting.id, coordinate: { latitude: sighting.lat, longitude: sighting.lng } }]
      : [],
  );

  return (
    <MapView
      region={regionFor([lastSeen, ...located.map(({ coordinate }) => coordinate)])}
      style={styles.map}>
      <Marker coordinate={lastSeen} title="Son görüldüğü yer">
        <View style={styles.pet}>
          <PawPrintIcon size={18} weight="fill" color={colors.card} />
        </View>
      </Marker>
      {located.map(({ id, coordinate }) => (
        <Marker key={id} coordinate={coordinate} title="İhbar">
          <View style={styles.sighting} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pet: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.card,
    backgroundColor: colors.ink,
  },
  sighting: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.card,
    backgroundColor: colors.alert,
  },
});
