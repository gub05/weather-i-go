// app/(tabs)/explore.tsx

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';
import ee from '@google/earthengine';
import { initializeGEE } from '@/api/googleEarthEngine'; 

export default function ExploreScreen() {
  const [mapUrl, setMapUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getGEEMap = async () => {
      try {
        console.log('1. Starting GEE map process...');
        await initializeGEE();
        console.log('2. GEE initialization complete.');

        const image = ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_044034_20140318');
        const ndvi = image.normalizedDifference(['B5', 'B4']);
        const ndviParams = { min: -1, max: 1, palette: ['blue', 'white', 'green'] };

        console.log('3. Requesting map URL from Google...');
        ndvi.getMap(ndviParams, ({ mapid, urlFormat }) => {
          console.log('4. SUCCESS: Map URL received!');
          setMapUrl(urlFormat);
        });

      } catch (e) {
        console.error('ERROR in getGEEMap:', e);
        setError('Failed to load map data. Check terminal for details.');
      }
    };

    getGEEMap();
  }, []);

  useEffect(() => {
    if (mapUrl || error) {
      setIsLoading(false);
    }
  }, [mapUrl, error]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading Map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {mapUrl && <UrlTile urlTemplate={mapUrl} zIndex={-1} />}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});