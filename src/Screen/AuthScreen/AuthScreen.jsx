import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useValue } from '../../components/context/ContextProvider';

// Validation schemas
const loginSchema = Yup.object().shape({
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string().min(6, '6 caractères minimum').required('Mot de passe requis'),
});

const registerSchema = Yup.object().shape({
  name: Yup.string().required('Nom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string().min(6, '6 caractères minimum').required('Mot de passe requis'),
});

export default function AuthScreen({ navigation }) {
  const { dispatch } = useValue();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleLogin = async (values) => {
    dispatch({ type: 'START_LOADING' });
    try {
      const { data } = await axios.post(
        'http://10.0.2.2:5000/user/login',
        { email: values.email.trim().toLowerCase(), password: values.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!data.success) {
        dispatch({ type: 'UPDATE_ALERT', payload: { open: true, severity: 'error', message: data.message } });
        return;
      }
      const user = data.result;
      await AsyncStorage.multiSet([
        ['authToken', user.token],
        ['currentUser', JSON.stringify(user)],
      ]);
      dispatch({ type: 'UPDATE_USER', payload: user });
    } catch (err) {
      dispatch({ type: 'UPDATE_ALERT', payload: { open: true, severity: 'error', message: err.response?.data?.message || 'Erreur réseau' } });
    } finally {
      dispatch({ type: 'END_LOADING' });
    }
  };

  const handleRegister = async (values) => {
    dispatch({ type: 'START_LOADING' });
    try {
      const { data } = await axios.post(
        'http://10.0.2.2:5000/user/register',
        { name: values.name, email: values.email.trim().toLowerCase(), password: values.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!data.success) {
        dispatch({ type: 'UPDATE_ALERT', payload: { open: true, severity: 'error', message: data.message } });
        return;
      }
     const user = data.result;
      await AsyncStorage.multiSet([
        ['authToken', user.token],
        ['currentUser', JSON.stringify(user)],
      ]);
      dispatch({ type: 'UPDATE_USER', payload: user });
      setIsRegister(false);
    } catch (err) {
      dispatch({ type: 'UPDATE_ALERT', payload: { open: true, severity: 'error', message: err.response?.data?.message || 'Erreur réseau' } });
    } finally {
      dispatch({ type: 'END_LOADING' });
    }
  };

  return (
    <View style={styles.container}>
      {isRegister ? (
        <Formik
          initialValues={{ name: '', email: '', password: '' }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <Text style={styles.title}>Inscription</Text>
              <TextInput
                style={[styles.input, touched.name && errors.name && styles.inputError]}
                placeholder="Nom"
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
              />
              {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              <TextInput
                style={[styles.input, touched.email && errors.email && styles.inputError]}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
              />
              {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, touched.password && errors.password && styles.inputError]}
                  placeholder="Mot de passe"
                  secureTextEntry={!showPassword}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(v => !v)}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>S'inscrire</Text>
              </TouchableOpacity>
              <View style={styles.footer}>
                <Text>Vous avez déjà un compte ? </Text>
                <TouchableOpacity onPress={() => setIsRegister(false)}>
                  <Text style={styles.link}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      ) : (
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <Text style={styles.title}>Connexion</Text>
              <TextInput
                style={[styles.input, touched.email && errors.email && styles.inputError]}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
              />
              {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, touched.password && errors.password && styles.inputError]}
                  placeholder="Mot de passe"
                  secureTextEntry={!showPassword}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(v => !v)}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Se connecter</Text>
              </TouchableOpacity>
              <View style={styles.footer}>
                <Text>Vous n'avez pas de compte ? </Text>
                <TouchableOpacity onPress={() => setIsRegister(true)}>
                  <Text style={styles.link}>S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  form: { width: 300, padding: 20, backgroundColor: '#fff', borderRadius: 12, elevation: 4, alignItems: 'center' },
  title: { fontSize: 20, marginBottom: 16, textAlign: 'center', fontWeight: '600' },
  input: { width: '100%', height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#f9f9f9' },
  inputError: { borderColor: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, alignSelf: 'flex-start', marginTop: 4 },
  passwordWrapper: { width: '100%', marginTop: 4, position: 'relative' },
  eyeButton: { position: 'absolute', right: 12, top: '50%', marginTop: -12, height: 24, width: 24, justifyContent: 'center', alignItems: 'center' },
  button: { marginTop: 24, width: '100%', height: 48, backgroundColor: '#228B22', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', marginTop: 16 },
  link: { color: '#228B22', fontWeight: '600' },
});
