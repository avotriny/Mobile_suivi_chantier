import React, { useState, useRef, useEffect } from 'react';
import { View, Button, StyleSheet, Dimensions, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import { useValue } from '../../../components/context/ContextProvider';

export default function LocationScreen({ navigation }) {
  const { state, dispatch } = useValue();
  const [region, setRegion] = useState({
    latitude: state.location.lat || -18.8792,
    longitude: state.location.lng || 47.5079,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const mapRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  }, []);

  const recenter = () => {
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const newRegion = { latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        mapRef.current.animateToRegion(newRegion, 500);
        setRegion(newRegion);
      },
      err => console.warn(err.message),
      { enableHighAccuracy: true }
    );
  };

  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
  };

  const handleNext = () => {
    dispatch({ type: 'UPDATE_LOCATION', payload: { lat: region.latitude, lng: region.longitude } });
    navigation.navigate('Images');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
      />

      {/* Crosshair icon fixed at center, using 'crosshairs-gps' for styled crosshair */}
      <View pointerEvents="none" style={styles.crosshairContainer}>
        <MaterialCommunityIcons name="crosshairs-gps" size={50} color="#228B22" />
      </View>

      <TouchableOpacity style={styles.gpsButton} onPress={recenter}>
        <MaterialCommunityIcons name="crosshairs-gps" size={30} color="#fff" />
      </TouchableOpacity>

      {region.latitude && (
        <View style={styles.nextButton}>
          <Button title="Suivant" onPress={handleNext} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: '100%' },
  gpsButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    backgroundColor: '#228B22',
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  crosshairContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
  nextButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
