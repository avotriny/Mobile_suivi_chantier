import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from './Header/CustomHeader';
import CarteScreen from '../Screen/LocalisationScreen/CarteScreen';
import ChantierScreen from '../Screen/ChantierScreen/ChantierScreen';
import NewScreen from '../Screen/NewChantierScreen/NewScreen';
import ProfileScreen from '../Screen/ProfileScreen/ProfileScreen';



const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();


export default function AppMain() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          header: () => <CustomHeader navigation={navigation} />,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Carte') iconName = 'google-maps';
            else if (route.name === 'Chantier') iconName = 'hammer-wrench';
            else if (route.name === 'Nouveau') iconName = 'plus';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#228B22',
          tabBarInactiveTintColor: 'gray',
          tabBarShowLabel: false,
        })}
      >
        <Tab.Screen name="Carte" component={CarteScreen} />
        <Tab.Screen name="Chantier" component={ChantierScreen}/>
        <Tab.Screen name="Nouveau" component={NewScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarButton: () => null }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}