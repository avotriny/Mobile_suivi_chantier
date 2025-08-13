// Screen/ChantierScreen/GestionChantierScreen.js
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

export default function GestionChantierScreen({ navigation, route, currentUser: propUser }) {
  const [currentUser, setCurrentUser] = useState(propUser ?? null);
  const [token, setToken] = useState(null);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // charge user + token si pas fourni en prop
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!propUser) {
          const storedUser = await AsyncStorage.getItem('currentUser');
          if (storedUser) {
            try { setCurrentUser(JSON.parse(storedUser)); }
            catch { setCurrentUser({ role: storedUser }); }
          }
        } else {
          setCurrentUser(propUser);
        }
        const t = await AsyncStorage.getItem('authToken');
        if (mounted) setToken(t);
      } catch (e) {
        console.warn('load user/token error', e);
      }
    })();
    return () => { mounted = false; };
  }, [propUser]);

  const fetchChantiers = async () => {
    setLoading(true);
    setError(null);
    try {
      const t = token ?? (await AsyncStorage.getItem('authToken'));
      if (!token && t) setToken(t);
      const headers = t ? { Authorization: `Bearer ${t}` } : {};
      const res = await axios.get('http://10.0.2.2:5000/chantier', { headers });
      const data = res?.data;
      const items = (data && typeof data === 'object' && 'success' in data)
        ? (Array.isArray(data.result) ? data.result : [])
        : (Array.isArray(data) ? data : []);
      setChantiers(items);
    } catch (err) {
      console.warn('fetch chantiers error', err?.message ?? err);
      setError(err?.message ?? 'Erreur récupération chantiers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChantiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChantiers();
  };

  // rôle et id utilisateur robustes
  const roleNorm = normalizeRole(currentUser?.role ?? '');
  const userId = currentUser?.id ?? currentUser?._id ?? currentUser?.uid ?? '';

  // règles : Directeur de chantier voit tout ; Chef d'equipe voit ses chantiers
  const isDirector = roleNorm.includes('directeur'); // "Directeur de chantier"
  const isChef = roleNorm.includes('chef'); // "Chef d'equipe"

  // filtrage visible
  const visibleChantiers = chantiers.filter(c => {
    if (isDirector) return true;
    if (isChef) return String(c.uid) === String(userId);
    return false; // autres rôles = aucune visibilité par défaut
  });

  const canEditDelete = (c) => {
    if (isDirector) return true; // directeur peut tout faire
    if (isChef && String(c.uid) === String(userId)) return true; // chef => ses propres chantiers
    return false;
  };

  const handleEdit = (chantier) => {
    if (!navigation?.navigate) { Alert.alert('Navigation non disponible'); return; }
    navigation.navigate('EditChantier', { chantier });
  };

  const handleDelete = (chantier) => {
    Alert.alert(
      'Supprimer chantier',
      `Supprimer "${chantier?.description ?? chantier?.categorie ?? 'chantier'}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive', onPress: async () => {
            try {
              const t = token ?? (await AsyncStorage.getItem('authToken'));
              const headers = t ? { Authorization: `Bearer ${t}` } : {};
              await axios.delete(`http://10.0.2.2:5000/chantier/${chantier._id}`, { headers });
              setChantiers(prev => prev.filter(p => String(p._id) !== String(chantier._id)));
            } catch (err) {
              console.warn('delete error', err?.message ?? err);
              Alert.alert('Erreur', 'Impossible de supprimer le chantier.');
            }
          }
        }
      ]
    );
  };

const handleMessage = (chantier) => {
  const recipientId = chantier?.uid ?? chantier?.userId ?? chantier?.responsable ?? null;
  const recipientName = chantier?.chefName ?? chantier?.responsableName ?? chantier?.ownerName ?? chantier?.categorie ?? 'Contact';
  if (!recipientId) return Alert.alert('Info', 'Responsable introuvable.');
  const senderId = currentUser?._id ?? currentUser?.id;
  if (String(recipientId) === String(senderId)) return Alert.alert('Info', "Vous ne pouvez pas vous envoyer un message.");
  navigation.navigate('ChatScreen', { senderId, receiverId: recipientId, recipient: { _id: recipientId, name: recipientName } });
};


  const renderItem = ({ item }) => {
    const subtitle = item?.createdAt ? moment(item.createdAt).fromNow() : (item?.description ?? '');
    return (
      <List.Item
        title={item?.categorie || 'Sans catégorie'}
        description={`${subtitle} • ${item?.longueur ?? 0} m`}
        left={props =>
          item?.images?.[0]
            ? <Avatar.Image {...props} size={48} source={{ uri: item.images[0] }} />
            : <Avatar.Icon {...props} size={48} icon="hammer-wrench" />
        }
        right={() => (
          <View style={styles.actionRow}>
            {/* Bouton message : visible si chantier a un responsable et ce n'est pas soi */}
            <TouchableOpacity onPress={() => handleMessage(item)} style={styles.actionBtn}>
              <MaterialCommunityIcons name="message-text" size={20} color="#388E3C" />
            </TouchableOpacity>

            {canEditDelete(item) && (
              <>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="pencil" size={20} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="delete" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        onPress={() => {
          navigation?.navigate?.('DetailChantierScreen', { chantier: item });
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
      <Text style={styles.title}>Gestion chantier</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {visibleChantiers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {isDirector ? 'Aucun chantier disponible.' : 'Aucun chantier trouvé pour votre compte.'}
          </Text>
          <Text style={styles.hint}>Tirer pour actualiser →</Text>
        </View>
      ) : (
        <FlatList
          data={visibleChantiers}
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
