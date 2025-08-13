import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Alert,
  Text,
  Image,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useFocusEffect } from '@react-navigation/native';

const CATEGORY_COLORS = {
  terrassement: '#FF5722', fondation: '#795548', nivellement: '#8BC34A', drainage: '#00BCD4',
  compactage: '#FFC107', géotextile: '#9C27B0', profilage: '#3F51B5', reprofilage: '#009688',
  buttage: '#4CAF50', enrobé: '#2196F3', curage: '#607D8B', default: '#9E9E9E'
};

export default function MapScreen({ navigation }) {
  const route = useRoute();
  const mapRef = useRef(null);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({ latitude: -18.8792, longitude: 47.5079, latitudeDelta: 0.12, longitudeDelta: 0.12 });

  useEffect(() => {
    axios.get('http://10.0.2.2:5000/chantier')
      .then(({ data }) => setChantiers(data.result))
      .catch(() => Alert.alert('Erreur', 'Impossible de charger les chantiers.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const focus = route.params?.focus;
      if (focus && mapRef.current) {
        const newRegion = { latitude: focus.lat, longitude: focus.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        mapRef.current.animateToRegion(newRegion, 500);
        setRegion(newRegion);
      }
    }, [route.params?.focus])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const groups = chantiers.reduce((acc, item) => {
    const key = `${item.lat.toFixed(6)}_${item.lng.toFixed(6)}`;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  const zoomedIn = region.latitudeDelta < 0.02;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {Object.values(groups).map(group => {
          const first = group[0];
          const coord = { latitude: first.lat, longitude: first.lng };
          const count = group.length;
          const color = CATEGORY_COLORS[first.categorie] || CATEGORY_COLORS.default;

          if (count > 1 && !zoomedIn) {
            return (
              <Marker key={first._id} coordinate={coord}>
                <View style={[styles.clusterMarker, { backgroundColor: color }]}>
                  <Text style={styles.clusterText}>{count}</Text>
                </View>
                <Callout onPress={() => navigation.push('DetailChantier', { chantier: first })}>
                  <View style={styles.clusterCallout}>
                    <Text style={styles.clusterTitle}>{count} chantiers ici</Text>
                  </View>
                </Callout>
              </Marker>
            );
          }

          return group.map(item => (
            <Marker key={item._id} coordinate={{ latitude: item.lat, longitude: item.lng }}>
              <MaterialCommunityIcons name="map-marker" size={40} color={color} />
              <Callout onPress={() => navigation.push('DetailChantier', { chantier: item })} tooltip>
                <View style={styles.calloutCard}>
                  {group.length > 1 && <Text style={styles.countText}>{group.length} chantiers ici</Text>}
                  <View style={styles.userRow}>
                    <Image source={{ uri: item.uImage }} style={styles.userAvatar} />
                    <Text style={styles.userName}>{item.uName}</Text>
                  </View>
                  <Text style={styles.infoText}><Text style={styles.bold}>Catégorie:</Text> {item.categorie}</Text>
                  <Text style={styles.infoText}><Text style={styles.bold}>Description:</Text> {item.description}</Text>
                  <Text style={styles.infoText}><Text style={styles.bold}>Début:</Text> {item.debut}</Text>
                  <Text style={styles.infoText}><Text style={styles.bold}>Fin:</Text> {item.fin}</Text>
                  <Text style={styles.infoText}><Text style={styles.bold}>Longueur:</Text> {item.longueur} m</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageSlider}>
                    {item.images.map((uri, idx) => (
                      <Image key={idx} source={{ uri }} style={styles.sliderImage} />
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.detailButton} onPress={() => navigation.push('DetailChantier', { chantier: item })}>
                    <Text style={styles.detailButtonText}>Voir détails</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ));
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clusterMarker: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  clusterText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clusterCallout: { padding: 10, backgroundColor: '#fff', borderRadius: 8 },
  clusterTitle: { fontSize: 14, fontWeight: '600' },
  calloutCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 6, padding: 12, minWidth: 220 },
  countText: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  userName: { fontSize: 15, fontWeight: '700' },
  infoText: { fontSize: 13, marginVertical: 2 },
  bold: { fontWeight: '700' },
  imageSlider: { marginVertical: 8 },
  sliderImage: { width: 110, height: 90, borderRadius: 6, marginRight: 8 },
  detailButton: { backgroundColor: '#228B22', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'center', marginTop: 12 },
  detailButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});