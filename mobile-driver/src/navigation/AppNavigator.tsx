import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../stores/authStore';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import AvailableOrdersScreen from '../screens/AvailableOrdersScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Modal Screens
import NavigationScreen from '../screens/NavigationScreen';
import DeliveryConfirmationScreen from '../screens/DeliveryConfirmationScreen';
import DeliveryDetailsScreen from '../screens/DeliveryDetailsScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Navigation: { orderId: string };
  DeliveryConfirmation: { orderId: string; type: 'pickup' | 'delivery' };
  DeliveryDetails: { orderId: string };
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Orders: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Orders':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Earnings':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen
        name="Orders"
        component={AvailableOrdersScreen}
        options={{ title: 'Pedidos' }}
      />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Ganhos' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Navigation"
            component={NavigationScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="DeliveryConfirmation"
            component={DeliveryConfirmationScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="DeliveryDetails"
            component={DeliveryDetailsScreen}
            options={{ presentation: 'card' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
