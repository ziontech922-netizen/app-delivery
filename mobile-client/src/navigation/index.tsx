import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Types
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  ExploreStackParamList,
  ListingsStackParamList,
  ChatStackParamList,
  SearchStackParamList,
  OrdersStackParamList,
  ProfileStackParamList,
  CartStackParamList,
} from './types';

// Screens - Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Screens - Explore (Super App Hub)
import ExploreHomeScreen from '../screens/explore/ExploreHomeScreen';

// Screens - Legacy Home (fallback)
import HomeScreen from '../screens/home/HomeScreen';
import RestaurantDetailScreen from '../screens/restaurant/RestaurantDetailScreen';

// Screens - Listings/Marketplace
import ListingsScreen from '../screens/listings/ListingsScreen';
import ListingDetailScreen from '../screens/listings/ListingDetailScreen';
import CreateListingScreen from '../screens/listings/CreateListingScreen';

// Screens - Chat
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';

// Screens - Search
import SearchScreen from '../screens/search/SearchScreen';

// Screens - Orders
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';

// Screens - Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';

// Screens - Cart
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';

// Stores
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

// Theme
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2D3436',
  background: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
};

// Create navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ListingsStack = createNativeStackNavigator<ListingsStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Explore Stack Navigator (Super App Hub)
function ExploreNavigator() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ExploreStack.Screen
        name="ExploreHome"
        component={ExploreHomeScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ headerShown: false }}
      />
    </ExploreStack.Navigator>
  );
}

// Listings Stack Navigator (Marketplace)
function ListingsNavigator() {
  return (
    <ListingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ListingsStack.Screen
        name="ListingsHome"
        component={ListingsScreen}
        options={{ headerShown: false }}
      />
      <ListingsStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ headerShown: false }}
      />
      <ListingsStack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </ListingsStack.Navigator>
  );
}

// Chat Stack Navigator
function ChatNavigator() {
  return (
    <ChatStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ChatStack.Screen
        name="ConversationsList"
        component={ConversationsScreen}
        options={{ headerShown: false }}
      />
      <ChatStack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ headerShown: false }}
      />
    </ChatStack.Navigator>
  );
}

// Search Stack Navigator
function SearchNavigator() {
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <SearchStack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ headerShown: false }}
      />
    </SearchStack.Navigator>
  );
}

// Orders Stack Navigator
function OrdersNavigator() {
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <OrdersStack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: 'Meus Pedidos' }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Detalhes do Pedido' }}
      />
      <OrdersStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Acompanhar Pedido' }}
      />
    </OrdersStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <ProfileStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Meus Endereços' }}
      />
    </ProfileStack.Navigator>
  );
}

// Cart Stack Navigator
function CartNavigator() {
  return (
    <CartStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.secondary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <CartStack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{ title: 'Carrinho' }}
      />
      <CartStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Finalizar Pedido' }}
      />
    </CartStack.Navigator>
  );
}

// Cart Badge Component
function CartBadge() {
  const itemCount = useCartStore((state) => state.cart?.items.length || 0);

  if (itemCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
    </View>
  );
}

// Central Publish Button Component
function PublishButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.publishButtonContainer} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#FF6B35', '#FF8F5C']}
        style={styles.publishButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Dummy screen for Publish tab (handled by button)
function PublishPlaceholder() {
  return <View />;
}

// Main Tab Navigator (Super App)
function MainNavigator() {
  const navigation = require('@react-navigation/native').useNavigation();

  return (
    <MainTab.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: string;

          switch (route.name) {
            case 'Explore':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Listings':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Publish':
              return null; // Custom button
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.lightGray,
          paddingBottom: 8,
          paddingTop: 5,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen
        name="Explore"
        component={ExploreNavigator}
        options={{ tabBarLabel: 'Explorar' }}
      />
      <MainTab.Screen
        name="Listings"
        component={ListingsNavigator}
        options={{ tabBarLabel: 'Anúncios' }}
      />
      <MainTab.Screen
        name="Publish"
        component={PublishPlaceholder}
        options={{
          tabBarLabel: '',
          tabBarButton: () => (
            <PublishButton
              onPress={() => {
                navigation.navigate('CreateListingModal' as never);
              }}
            />
          ),
        }}
      />
      <MainTab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{ tabBarLabel: 'Chat' }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </MainTab.Navigator>
  );
}

// Root Navigator
export default function RootNavigator() {
  const { user, isLoading, loadUser } = useAuthStore();

  // Load user on mount
  React.useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#FF6B35', '#FF8F5C']}
          style={styles.loadingGradient}
        >
          <Ionicons name="flash" size={48} color={COLORS.white} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen
            name="Cart"
            component={CartNavigator}
            options={{
              presentation: 'modal',
            }}
          />
          <RootStack.Screen
            name="Search"
            component={SearchNavigator}
            options={{
              presentation: 'modal',
            }}
          />
          <RootStack.Screen
            name="CreateListingModal"
            component={CreateListingScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <RootStack.Screen
            name="OrderTracking"
            component={OrderTrackingScreen}
            options={{
              presentation: 'fullScreenModal',
              headerShown: true,
              title: 'Acompanhar Pedido',
            }}
          />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  publishButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
