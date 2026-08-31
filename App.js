import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importar pantallas
import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import FormularioMultaScreen from './src/screens/FormularioMultaScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Menu" 
          component={MenuScreen} 
        />
        <Stack.Screen 
          name="FormularioMulta" 
          component={FormularioMultaScreen} 
          options={{ title: 'Crear Multa' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
