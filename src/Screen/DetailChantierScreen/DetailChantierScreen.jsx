import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CATEGORY_COLORS = { terrassement: '#FF5722', fondation: '#795548', nivellement: '#8BC34A', drainage: '#00BCD4', compactage: '#FFC107', géotextile: '#9C27B0', profilage: '#3F51B5', reprofilage: '#009688', buttage: '#4CAF50', enrobé: '#2196F3', curage: '#607D8B', default: '#9E9E9E' };

export default function DetailChantierScreen() {
  const { params: { chantier } } = useRoute();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={[styles.header, { backgroundColor: CATEGORY_COLORS[chantier.categorie] || CATEGORY_COLORS.default }]}>
        <View style={styles.userInfo}>
          <Image source={{ uri: chantier.uImage }} style={styles.headerAvatar} />
          <Text style={styles.headerName}>{chantier.uName}</Text>
        </View>
        <Text style={styles.headerTitle}>{chantier.description}</Text>
      </View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageCarousel}>
        {chantier.images.map((uri, idx) => (
          <Image key={idx} source={{ uri }} style={styles.carouselImage} />
        ))}
      </ScrollView>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}><MaterialCommunityIcons name="tag" size={20} /><Text style={styles.detailText}>Catégorie: {chantier.categorie}</Text></View>
        <View style={styles.detailRow}><MaterialCommunityIcons name="calendar-start" size={20} /><Text style={styles.detailText}>Début: {chantier.debut}</Text></View>
        <View style={styles.detailRow}><MaterialCommunityIcons name="calendar-end" size={20} /><Text style={styles.detailText}>Fin: {chantier.fin}</Text></View>
        <View style={styles.detailRow}><MaterialCommunityIcons name="ruler" size={20} /><Text style={styles.detailText}>Longueur: {chantier.longueur} m</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { padding: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 4 },
  imageCarousel: { height: Dimensions.get('window').width * 0.6, marginTop: 16 },
  carouselImage: { width: Dimensions.get('window').width - 32, height: '100%', marginHorizontal: 16, borderRadius: 12 },
  detailsContainer: { padding: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  detailText: { fontSize: 14, marginLeft: 8 }
});
