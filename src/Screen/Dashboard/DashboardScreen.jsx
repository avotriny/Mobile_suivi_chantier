// Screen/Menu/MenuScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const MENU_ITEMS = [
  // 'DashboardMainScreen' défini dans AppMain -> DashboardStack
  { id: 'dashboard', label: 'Tableau de bord', icon: 'view-dashboard', color: '#8A2BE2', roles: ['directeur de chantier'], route: 'DashboardMainScreen', parent: 'DashboardTab' },

  // Remplace 'UsersScreen' par le nom exact de ta route utilisateur si différent.
  // Si la gestion utilisateur est dans le même stack que le dashboard, enlève parent.
  { id: 'users', label: 'Gestion utilisateur', icon: 'account-multiple', color: '#2196F3', roles: ['directeur de chantier'], route: 'ManageUserScreen' },

  // Pour aller vers l'onglet Chantier (déclaré dans AppMain comme 'ChantierTab')
  { id: 'chantier', label: 'Gestion chantier', icon: 'map', color: '#228B22', roles: [], route: 'GestionChantierScreen', parent: 'DashboardTab' },
];

function normalizeRole(str = '') {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

export default function MenuScreen({ navigation, currentUser: propUser }) {
  const [currentUser, setCurrentUser] = useState(propUser ?? null);
  const [loading, setLoading] = useState(!propUser);

  useEffect(() => {
    if (propUser) { setCurrentUser(propUser); setLoading(false); return; }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const stored = await AsyncStorage.getItem('currentUser');
        if (!mounted) return;
        if (stored) {
          try { setCurrentUser(JSON.parse(stored)); }
          catch { setCurrentUser({ role: stored }); }
        } else setCurrentUser(null);
      } catch (e) {
        console.warn('Erreur lecture currentUser:', e);
        setCurrentUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [propUser]);

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator size="large" color="#228B22" /></View>
  );

  const roleNorm = normalizeRole(currentUser?.role ?? '');

  const visibleMenu = MENU_ITEMS.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    const allowed = item.roles.map(r => normalizeRole(r));
    return allowed.includes(roleNorm);
  });

const handlePress = (item) => {
  if (!navigation || !navigation.navigate) {
    Alert.alert('Navigation non configurée', `Cliqué sur "${item.label}" mais navigation non trouvée.`);
    return;
  }

  const { route, parent, label } = item;
  if (!route) {
    Alert.alert('Route non définie', `La route pour "${label}" n'est pas définie dans MENU_ITEMS.`);
    return;
  }

  // 1) essai direct (si ManageUserScreen est dans le même stack)
  try {
    navigation.navigate(route);
    return;
  } catch (err) {
    // navigation.navigate ne jette normalement pas, mais on conserve le fallback
    console.warn('navigate direct failed', err);
  }

  // 2) fallback : naviguer vers le parent (tab) puis screen enfant
  if (parent) {
    try {
      navigation.navigate(parent, { screen: route });
      return;
    } catch (err) {
      console.warn('navigate parent failed', err);
    }
  }

  // 3) inspection utile pour debug — affiche les routes connues
  try {
    const state = navigation.getState?.();
    console.log('NAV STATE', JSON.stringify(state, null, 2));
    // extra info to user
    Alert.alert('Erreur navigation', `Impossible de naviguer vers "${route}". Vérifie le nom du screen. Voir console pour l'état de navigation.`);
  } catch (err) {
    Alert.alert('Erreur navigation', `Impossible de naviguer vers "${route}".`);
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Menu</Text>

      <View style={styles.menuList}>
        {visibleMenu.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${item.color}22` }]}>
              <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
            </View>

            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              {item.roles && item.roles.length > 0 && <Text style={styles.itemSub}>Restreint</Text>}
            </View>

            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Rôle courant : <Text style={{ fontWeight: '700' }}>{currentUser?.role ?? 'non défini'}</Text></Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: '#F5F5F5', minHeight: '100%' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#333' },
  menuList: { marginTop: 8 },
  menuItem: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  iconWrapper: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemTextWrap: { flex: 1 },
  itemLabel: { fontSize: 16, fontWeight: '600', color: '#222' },
  itemSub: { fontSize: 12, color: '#777', marginTop: 2 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#666' },
});
