import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useValue } from '../../components/context/ContextProvider';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

const profileSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Nom trop court').required('Nom requis'),
});

export default function ProfileScreen() {
  const route = useRoute();
  const { profile } = route.params;
  const { dispatch } = useValue();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Android only: sélection + upload d'image
  const pickAndUploadImage = (setFieldValue) => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Erreur', response.errorMessage || 'Erreur de sélection');
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.uri) return;

      const uri = asset.uri;
      const filename = uri.split('/').pop();
      setUploading(true);
      try {
        const ref = storage().ref(`profiles/${profile.id}/${filename}`);
        await ref.putFile(uri);
        const url = await ref.getDownloadURL();
        setFieldValue('photoURL', url);
      } catch {
        Alert.alert('Erreur', "Échec de l'upload");
      } finally {
        setUploading(false);
      }
    });
  };

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const { data } = await axios.post(
        'http://10.0.2.2:5000/user/updateProfile',
        { name: values.name, photoURL: values.photoURL || '' },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        const updated = {
          ...profile,
          name: data.result.name,
          photoURL: data.result.photoURL,
          token: data.result.token
        };
        await AsyncStorage.multiSet([
          ['currentUser', JSON.stringify(updated)],
          ['authToken', data.result.token]
        ]);
        dispatch({ type: 'UPDATE_USER', payload: updated });
        Alert.alert('Succès', 'Profil mis à jour');
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur réseau', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ name: profile.name, photoURL: profile.photoURL || '' }}
        validationSchema={profileSchema}
        onSubmit={handleUpdate}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            <Text style={styles.label}>Photo de profil</Text>
            {values.photoURL ? (
              <Image source={{ uri: values.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>?</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickAndUploadImage(setFieldValue)}
              disabled={uploading}
            >
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadText}>Choisir une image</Text>}
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 16 }]}>Nom</Text>
            <TextInput
              style={[styles.input, touched.name && errors.name && styles.inputError]}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              value={values.name}
            />
            {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Mettre à jour</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', padding: 16 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 4, alignItems: 'center' },
  label: { alignSelf: 'flex-start', fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#f9f9f9' },
  inputError: { borderColor: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: 4, alignSelf: 'flex-start' },
  button: { marginTop: 24, backgroundColor: '#228B22', padding: 12, borderRadius: 8, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 48, color: '#fff' },
  uploadButton: { backgroundColor: '#228B22', padding: 8, borderRadius: 6, marginBottom: 16 },
  uploadText: { color: '#fff' },
});
