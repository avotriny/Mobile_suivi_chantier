import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DetailsScreen from './DetailsScreen/DetailScreen';
import LocationScreen from './LocationScreen/LocationScreen';
import ImagesScreen from './ImagesScreen/ImagesScreen';


const Stack = createStackNavigator();
export default function ChantierNavigator() {
  return (
    <Stack.Navigator initialRouteName="Details">
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Location" component={LocationScreen} />
      <Stack.Screen name="Images" component={ImagesScreen} />
    </Stack.Navigator>
  );
}