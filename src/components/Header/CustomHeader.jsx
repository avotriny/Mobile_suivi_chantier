import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useValue } from '../context/ContextProvider';

export default function CustomHeader({ navigation }) {
  const { state, dispatch } = useValue();
  const user = state.currentUser;
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'currentUser']);
    dispatch({ type: 'UPDATE_USER', payload: null });
    setMenuVisible(false);
    navigation.replace('Auth'); // or login screen
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Image
          source={require('../../../assets/images/sinohydro.jpg')}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>Shopnakay</Text>
      </View>

      <TouchableOpacity onPress={() => setMenuVisible(true)}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <MaterialCommunityIcons name="account-circle" size={32} color="#fff" />
        )}
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>{user?.name || 'Utilisateur'}</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Dashboard');
              }}
            >
              <Text style={styles.menuText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Profile', { profile: user });
              }}
            >
              <Text style={styles.menuText}>Modifier Photo de profil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuText, { color: 'red' }]}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    backgroundColor: '#228B22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#333',
  },
});