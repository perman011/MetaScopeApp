import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DataModelScreen from '../screens/DataModelScreen';
import SecurityScreen from '../screens/SecurityScreen';
import SoqlEditorScreen from '../screens/SoqlEditorScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  DataModel: { orgId: number };
  Security: { orgId: number };
  SoqlEditor: { orgId: number };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // In a real app, we would check for authentication state here
  const isAuthenticated = false;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#f5f8fa'
          }
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Salesforce Metadata Manager' }}
        />
        <Stack.Screen 
          name="DataModel" 
          component={DataModelScreen} 
          options={{ title: 'Data Model' }}
        />
        <Stack.Screen 
          name="Security" 
          component={SecurityScreen} 
          options={{ title: 'Security Analyzer' }}
        />
        <Stack.Screen 
          name="SoqlEditor" 
          component={SoqlEditorScreen} 
          options={{ title: 'SOQL Editor' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}