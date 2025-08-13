import React, { useState } from 'react';
import {
  View,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useValue } from '../../../components/context/ContextProvider';

export default function ImagesScreen({ navigation }) {
  const { state } = useValue();
  const [localUris, setLocalUris] = useState([]);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo' });
      if (!result.didCancel && result.assets) {
        setLocalUris(u => [...u, result.assets[0].uri]);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sélectionner une image.');
    }
  };

  const uploadAndSubmit = async () => {
    if (localUris.length === 0) {
      Alert.alert('Aucune image', 'Ajoutez au moins une image avant de continuer.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload des fichiers sur Firebase Storage
      const urls = [];
      for (const uri of localUris) {
        const filename = uri.split('/').pop();
        const ref = storage().ref(`chantier/${Date.now()}_${filename}`);
        await ref.putFile(uri);
        const url = await ref.getDownloadURL();
        urls.push(url);
      }

      // 2. Récupération du token JWT
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d’authentification introuvable.');
      }

      // 3. Envoi au backend avec le header Authorization
      const response = await axios.post(
        'http://10.0.2.2:5000/chantier',
        {
          ...state.details,
          ...state.location,
          images: urls,
          uid: state.currentUser.id,
          uName: state.currentUser.name,
          uImage: state.currentUser.photoURL,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 4. Succès
      Alert.alert('Succès', 'Votre chantier a bien été enregistré.', [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (error) {
      console.error('Upload/Submit error:', error.response || error.message);
      Alert.alert(
        'Erreur',
        error.response?.data?.message
          ? `${error.response.status} — ${error.response.data.message}`
          : error.message
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Ajouter une image" onPress={pickImage} />

      <ScrollView horizontal style={styles.scroll}>
        {localUris.map(uri => (
          <Image key={uri} source={{ uri }} style={styles.thumb} />
        ))}
      </ScrollView>

      {uploading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        localUris.length > 0 && (
          <Button title="Terminer" onPress={uploadAndSubmit} />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  scroll: {
    marginVertical: 16
  },
  thumb: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 4
  },
  loader: {
    marginTop: 20
  }
});
