// AppMain.js
import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import MapScreen from '../Screen/LocalisationScreen/CarteScreen';
import DetailChantierScreen from '../Screen/DetailChantierScreen/DetailChantierScreen';
import ChantierScreen from '../Screen/ChantierScreen/ChantierScreen';
import ChantierNavigator from '../Screen/NewChantierScreen/NewScreen';
import ProfileScreen from '../Screen/ProfileScreen/ProfileScreen';
import CustomHeader from './Header/CustomHeader';
import DashboardScreen from '../Screen/Dashboard/DashboardScreen'; // menu
import DashboardMainScreen from '../Screen/Dashboard/Main/MainScreen'; // tableau de bord principal
import GestionChantierScreen from '../Screen/GestionChantierScreen/GestionChantierScreen';
import ManageUserScreen from '../Screen/Dashboard/ManageUserScreen/ManageUserScreen';
import ChatScreen from '../Screen/ChatScreen/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapListScreen"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DetailChantierScreen"
        component={DetailChantierScreen}
        options={({ navigation, route }) => ({
          title: 'Détails Chantier',
          headerBackTitle: 'Retour',
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={() =>
                navigation.navigate('MapListScreen', {
                  focus: route.params?.chantier,
                })
              }
            >
              <MaterialCommunityIcons name="arrow-left" size={24} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardMenuScreen"
        component={DashboardScreen}
        options={{ title: 'Menu' }}
      />
      <Stack.Screen
        name="DashboardMainScreen"
        component={DashboardMainScreen}
        options={{ title: 'Tableau de bord' }}
      />

      <Stack.Screen
        name="GestionChantierScreen"
        component={GestionChantierScreen}
        options={{ title: 'Gestion chantier' }}
      />
      <Stack.Screen
        name="ManageUserScreen"
        component={ManageUserScreen}
        options={{ title: 'Gestion utilisateur' }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={({ route }) => ({
          // titre dynamique si route.params.recipient.name fourni
          title: route?.params?.recipient?.name ? route.params.recipient.name : 'Messages',
        })}
      />
    </Stack.Navigator>
  );
}

export default function AppMain() {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <CustomHeader navigation={navigation} />,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#228B22',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          position: 'absolute',
          height: 60,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: '#fff',
          paddingBottom: Platform.OS === 'android' ? 8 : 20,
          elevation: 5,
        },
        tabBarItemStyle: { flex: 1 },
      })}
    >
      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="NewChantierTab"
        component={ChantierNavigator}
        options={({ navigation }) => ({
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => navigation.navigate('NewChantier')}
            >
              <MaterialCommunityIcons name="plus" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />

      <Tab.Screen
        name="ChantierTab"
        component={ChantierScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="hammer-wrench" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignSelf: 'center',
    marginTop: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#228B22',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});
