// Screen/ChantierScreen/ManageUserScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { List, Avatar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';

function normalizeRole(r = '') {
  return r
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

export default function ManageUserScreen({ navigation, route, currentUser: propUser }) {
  const [currentUser, setCurrentUser] = useState(propUser ?? null);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // récupère token + currentUser si pas fourni
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('authToken');
        if (t) setToken(t);
        if (!propUser) {
          const stored = await AsyncStorage.getItem('currentUser');
          if (stored) setCurrentUser(JSON.parse(stored));
        } else {
          setCurrentUser(propUser);
        }
      } catch (e) {
        console.warn('init error', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const t = token ?? (await AsyncStorage.getItem('authToken'));
      if (!token && t) setToken(t);
      const headers = t ? { Authorization: `Bearer ${t}` } : {};
      const res = await axios.get('http://10.0.2.2:5000/user', { headers });
      const data = res?.data;
      const items = (data && typeof data === 'object' && 'success' in data)
        ? (Array.isArray(data.result) ? data.result : [])
        : (Array.isArray(data) ? data : []);
      setUsers(items);
    } catch (err) {
      console.warn('fetch users error', err?.message ?? err);
      setError(err?.message ?? 'Erreur récupération utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
  };

  const canManage = (u) => {
    return currentUser && normalizeRole(currentUser.role || '') === normalizeRole('Directeur de chantier');
  };

  const handleDelete = (user) => {
    if (!user) return;
    if (String(user._id) === String(currentUser?._id)) {
      return Alert.alert('Action interdite', "Vous ne pouvez pas supprimer votre propre compte.");
    }

    Alert.alert(
      'Supprimer utilisateur',
      `Supprimer "${user.name}" (${user.email}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const t = token ?? (await AsyncStorage.getItem('authToken'));
              const headers = t ? { Authorization: `Bearer ${t}` } : {};
              await axios.delete(`http://10.0.2.2:5000/user/${user._id}`, { headers });
              setUsers(prev => prev.filter(p => String(p._id) !== String(user._id)));
            } catch (err) {
              console.warn('delete user error', err?.message ?? err);
              Alert.alert('Erreur', "Impossible de supprimer l'utilisateur.");
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (user) => {
    if (!user) return;
    const roles = ['Directeur de chantier', "Chef d'equipe", 'Ouvrier'];

    const options = roles.map(r => ({
      text: r,
      onPress: async () => {
        if (r === user.role) return;
        try {
          const t = token ?? (await AsyncStorage.getItem('authToken'));
          const headers = t ? { Authorization: `Bearer ${t}` } : {};
          const res = await axios.put(`http://10.0.2.2:5000/user/${user._id}`, { role: r }, { headers });
          const updated = (res?.data && res.data.user) ? res.data.user : { ...user, role: r };
          setUsers(prev => prev.map(u => (String(u._id) === String(user._id) ? updated : u)));
        } catch (err) {
          console.warn('change role error', err?.message ?? err);
          Alert.alert('Erreur', "Impossible de modifier le rôle.");
        }
      },
    }));

    options.push({ text: 'Annuler', style: 'cancel' });

    Alert.alert(
      `Modifier rôle — ${user.name}`,
      `Rôle actuel: ${user.role || '—'}`,
      options,
      { cancelable: true }
    );
  };

  // ---- NOUVEAU : fonction d'envoi de message ----
const handleMessage = (user) => {
  if (!user) return;
  if (String(user._id) === String(currentUser?._id)) {
    return Alert.alert('Info', "Vous ne pouvez pas vous envoyer un message.");
  }
  // passe senderId + receiverId + recipient (optionnel)
  const senderId = currentUser?._id ?? currentUser?.id;
  navigation.navigate('ChatScreen', { senderId, receiverId: user._id, recipient: user });
};
  // ---- fin handleMessage ----

  const renderItem = ({ item }) => {
    const subtitle = item?.createdAt ? moment(item.createdAt).fromNow() : (item?.email ?? '');
    const isSelf = String(item._id) === String(currentUser?._id);
    return (
      <List.Item
        title={item?.name || 'Utilisateur sans nom'}
        description={`${item?.email || ''} • ${item?.role || '—'} • ${subtitle}`}
        left={props =>
          item?.photoURL
            ? <Avatar.Image {...props} size={48} source={{ uri: item.photoURL }} />
            : <Avatar.Icon {...props} size={48} icon="account" />
        }
        right={() => (
          <View style={styles.actionRow}>
            {/* Bouton message : visible pour tous sauf soi-même */}
            {!isSelf && (
              <TouchableOpacity onPress={() => handleMessage(item)} style={styles.actionBtn}>
                <MaterialCommunityIcons name="message-text" size={20} color="#388E3C" />
              </TouchableOpacity>
            )}

            {/* Actions de gestion (éditer / supprimer) uniquement si autorisé */}
            {canManage(item) && (
              <>
                <TouchableOpacity onPress={() => handleChangeRole(item)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="account-cog" size={20} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="delete" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        onPress={() => {
          navigation?.navigate?.('UserDetailScreen', { user: item });
        }}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion utilisateurs</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {users.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
          <Text style={styles.hint}>Tirer pour actualiser →</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(i) => String(i._id ?? Math.random())}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#333' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#666', marginBottom: 8 },
  hint: { color: '#999', fontSize: 12 },
  errorText: { color: '#c00', marginBottom: 8 },
  sep: { height: 1, backgroundColor: '#e6e6e6', marginVertical: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  actionBtn: { paddingHorizontal: 8 },
});
