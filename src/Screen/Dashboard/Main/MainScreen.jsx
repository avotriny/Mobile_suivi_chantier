// Screen/Dashboard/Main/MainScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Card, Avatar, List } from 'react-native-paper';
import moment from 'moment';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart, LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF4D4D', '#8884D8', '#4BC0C0'];

export default function MainScreen() {
  const [chantiers, setChantiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // helper: fallback parse fin like PKxx+yyy -> meters (if longueur missing)
  function parseFinToMeters(fin = '') {
    if (!fin || typeof fin !== 'string') return 0;
    const s = fin.replace(/\s/g, '').toUpperCase();
    if (s.startsWith('PK')) {
      const m = s.match(/PK(\d+)\+?(\d*)/);
      const km = m?.[1] ?? '0';
      const me = m?.[2] ?? '0';
      return parseInt(km, 10) * 1000 + (me === '' ? 0 : parseInt(me, 10));
    }
    if (s.startsWith('P')) {
      const m = s.match(/P(\d+)/);
      const v = m?.[1] ?? '0';
      return parseInt(v, 10) * 20;
    }
    return 0;
  }

  useEffect(() => {
    const controller = new AbortController();

    const unwrap = (data) => {
      if (!data) return [];
      if (typeof data === 'object' && 'success' in data) return Array.isArray(data.result) ? data.result : [];
      return Array.isArray(data) ? data : [];
    };

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('authToken'); // adapte la clé si besoin
        if (!token) throw new Error('Utilisateur non authentifié (token manquant).');

        const headers = { Authorization: `Bearer ${token}` };

        const [chantierRes, usersRes] = await Promise.all([
          axios.get('http://10.0.2.2:5000/chantier', { headers, signal: controller.signal }),
          axios.get('http://10.0.2.2:5000/user', { headers, signal: controller.signal }),
        ]);

        const fetchedChantiers = unwrap(chantierRes.data);
        const fetchedUsers = unwrap(usersRes.data);

        // normalize: ensure numeric longueur (fallback to parsed fin)
        const normalizedChantiers = fetchedChantiers.map((c) => {
          const longueurNum = Number(c?.longueur ?? NaN);
          return {
            ...c,
            longueur: Number.isFinite(longueurNum) ? longueurNum : parseFinToMeters(c?.fin),
          };
        });

        setChantiers(normalizedChantiers);
        setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
      } catch (err) {
        if (axios.isCancel?.(err)) return;
        console.warn('fetchAll error:', err?.message ?? err);
        setError(err?.message ?? 'Erreur réseau');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    return () => {
      try { controller.abort(); } catch (e) {}
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  const totalChantiers = Array.isArray(chantiers) ? chantiers.length : 0;
  const totalUsers = Array.isArray(users) ? users.length : 0;

  // last 5 by createdAt (most recent first)
  const lastFiveChantiers = [...chantiers]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const lastFiveUsers = [...users]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Pie data: sum longueur by category
  const byCategory = chantiers.reduce((acc, c) => {
    const cat = (c?.categorie || 'Autre').toString();
    const len = Number(c?.longueur ?? 0) || 0;
    acc[cat] = (acc[cat] || 0) + len;
    return acc;
  }, {});

  // Per-category pies relative to 30 000 m
  const TOTAL_MAX = 30000;
  const categoriesEntries = Object.entries(byCategory); // [ [cat, value], ... ]
  const PIE_SIZE = Math.min(160, (CHART_WIDTH / 2) - 8); // taille d'un petit camembert (définie ici)

  // --- LineChart (anciennement BarChart) : une courbe par catégorie sur 6 mois ---
  const getLastNMonths = (n = 6) => {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d);
    }
    return months;
  };
  const months = getLastNMonths(6);
  const monthLabels = months.map(d => d.toLocaleString('default', { month: 'short' })); // Ex: "Aug"

  const categories = Object.keys(byCategory);
  const datasets = categories.map((cat, idx) => {
    const data = months.map(m => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1);
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      return chantiers.reduce((sum, c) => {
        if ((c?.categorie || 'Autre') !== cat) return sum;
        const dt = c?.createdAt ? new Date(c.createdAt) : null;
        if (dt && dt >= start && dt < end) {
          return sum + (Number(c.longueur) || 0);
        }
        return sum;
      }, 0);
    });
    const colorHex = COLORS[idx % COLORS.length];
    return {
      data,
      strokeWidth: 2,
      color: (opacity = 1) => {
        const hex = colorHex.replace('#', '');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        return `rgba(${r},${g},${b},${opacity})`;
      },
      withDots: false,
      label: cat,
    };
  });

  const lineData = { labels: monthLabels, datasets, legend: categories };

  const chartConfig = {
    backgroundGradientFrom: '#0b1220',
    backgroundGradientTo: '#07121b',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(34,139,34,${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    style: { borderRadius: 8 },
    propsForDots: { r: '0' },
    fillShadowGradient: '#228B22',
    fillShadowGradientOpacity: 0.08,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Tableau de bord</Text>

      <View style={styles.row}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.center}>
            <Text style={styles.statLabel}>Total chantiers</Text>
            <Text style={styles.statValue}>{totalChantiers}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.center}>
            <Text style={styles.statLabel}>Total utilisateurs</Text>
            <Text style={styles.statValue}>{totalUsers}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* --- Per-category small pie charts (each vs 30 000 m) --- */}
      <Text style={styles.section}>Répartition par catégorie (chaque camembert = part / 30 000 m)</Text>
      {categoriesEntries.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.piesScroll}>
          {categoriesEntries.map(([name, value], i) => {
            const used = Math.min(Number(value) || 0, TOTAL_MAX);
            const remaining = Math.max(TOTAL_MAX - used, 0);
            const color = COLORS[i % COLORS.length];
            const percent = Math.round((used / TOTAL_MAX) * 100);

            const dataForPie = [
              { name, population: used, color, legendFontColor: '#333', legendFontSize: 12 },
              { name: 'Restant', population: remaining, color: '#E6E6E6', legendFontColor: '#333', legendFontSize: 12 },
            ];

            return (
              <View key={name} style={[styles.pieContainer, { width: PIE_SIZE + 16 }]}>
                <PieChart
                  data={dataForPie}
                  width={PIE_SIZE}
                  height={PIE_SIZE}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  absolute
                />
                <Text style={styles.piePercent}>{percent}%</Text>
                <Text style={styles.pieLabel} numberOfLines={1}>{name}</Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>Aucune catégorie disponible.</Text>
      )}

      {/* Line chart: une courbe par catégorie */}
      <Text style={styles.section}>Longueurs par mois (6 derniers mois) — courbe par catégorie</Text>
      {datasets.length > 0 && datasets.some(ds => ds.data.some(v => v > 0)) ? (
        <LineChart
          data={lineData}
          width={CHART_WIDTH}
          height={260}
          chartConfig={chartConfig}
          fromZero
          bezier
          style={{ borderRadius: 8, marginBottom: 8 }}
          withInnerLines={false}
          withShadow={true}
          withVerticalLines={false}
        />
      ) : (
        <Text style={styles.emptyText}>Pas de longueurs enregistrées dans les 6 derniers mois.</Text>
      )}

      {/* Lists */}
      <Text style={styles.section}>5 derniers chantiers</Text>
      <List.Section>
        {lastFiveChantiers.length > 0 ? (
          lastFiveChantiers.map((c) => {
            const img = c?.images?.[0];
            const desc = `Par ${c?.uName || 'Inconnu'}${c?.createdAt ? `, ${moment(c.createdAt).fromNow()}` : ''}`;
            return (
              <List.Item
                key={c?._id ?? Math.random().toString()}
                title={c?.categorie || 'Sans catégorie'}
                description={desc}
                left={(props) =>
                  img
                    ? <Avatar.Image {...props} size={48} source={{ uri: img }} />
                    : <Avatar.Icon {...props} size={48} icon="hammer-wrench" />
                }
              />
            );
          })
        ) : (
          <Text style={styles.emptyText}>{error ? `Erreur: ${error}` : 'Aucun chantier trouvé.'}</Text>
        )}
      </List.Section>

      <Text style={styles.section}>5 derniers utilisateurs</Text>
      <List.Section>
        {lastFiveUsers.length > 0 ? (
          lastFiveUsers.map((u) => {
            const avatarUri = u?.photoURL || u?.uImage || null;
            const desc = u?.createdAt ? moment(u.createdAt).format('YYYY-MM-DD HH:mm') : '';
            return (
              <List.Item
                key={u?._id ?? u?.email ?? Math.random().toString()}
                title={u?.name || u?.email || 'Utilisateur'}
                description={desc}
                left={(props) =>
                  avatarUri
                    ? <Avatar.Image {...props} size={48} source={{ uri: avatarUri }} />
                    : <Avatar.Icon {...props} size={48} icon="account" />
                }
              />
            );
          })
        ) : (
          <Text style={styles.emptyText}>{error ? `Erreur: ${error}` : 'Aucun utilisateur trouvé.'}</Text>
        )}
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { width: '48%', elevation: 2, marginBottom: 16 },
  center: { alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#555' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#228B22' },
  section: { marginTop: 12, marginBottom: 8, fontSize: 18, fontWeight: '600', color: '#333' },
  emptyText: { color: '#666', padding: 8 },
  piesScroll: { paddingVertical: 8, paddingHorizontal: 4 },
  pieContainer: { alignItems: 'center', marginHorizontal: 8 }, // width applied inline now
  piePercent: { marginTop: 6, fontWeight: '700', color: '#333' },
  pieLabel: { fontSize: 12, textAlign: 'center', color: '#555' },
});
