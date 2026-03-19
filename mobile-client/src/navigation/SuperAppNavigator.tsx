/**
 * Super App Navigator
 * 
 * Hub digital da cidade - Navegação principal do Super App
 * Inclui tab bar personalizada com botão central de publicação
 * 
 * @description Implementação ultra profissional da navegação Super App
 * seguindo padrões de design premium (Uber Eats, Airbnb, Instagram)
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Types
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  ExploreStackParamList,
  ListingsStackParamList,
  ChatStackParamList,
  ProfileStackParamList,
  CartStackParamList,
  SearchStackParamList,
  FeedStackParamList,
} from './types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Explore Screens (Super App Home)
import ExploreHomeScreen from '../screens/explore/ExploreHomeScreen';
import RestaurantDetailScreen from '../screens/restaurant/RestaurantDetailScreen';

// Listing Screens
import ListingsScreen from '../screens/listings/ListingsScreen';
import ListingDetailScreen from '../screens/listings/ListingDetailScreen';
import CreateListingScreen from '../screens/listings/CreateListingScreen';

// Chat Screens
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';

// Profile Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';

// Orders Screens
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';

// Cart Screens
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';

// Search
import SearchScreen from '../screens/search/SearchScreen';

// Stores
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

// ===========================================
// DESIGN SYSTEM
// ===========================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  // Primary brand colors
  primary: '#FF6B35',
  primaryLight: '#FF8B5C',
  primaryDark: '#E55A2B',
  
  // Secondary colors
  secondary: '#2D3436',
  secondaryLight: '#636E72',
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  surface: '#FFFFFF',
  
  // Text colors
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  textTertiary: '#95A5A6',
  textInverse: '#FFFFFF',
  
  // Utility colors
  border: '#E9ECEF',
  divider: '#F1F3F4',
  
  // Semantic colors
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  
  // Tab bar
  tabBarBackground: 'rgba(255,255,255,0.98)',
  tabBarBorder: 'rgba(0,0,0,0.05)',
  tabInactive: '#ADB5BD',
  tabActive: '#FF6B35',
  
  // Gradients
  gradient: ['#FF6B35', '#FF8B5C'] as readonly [string, string],
  gradientSecondary: ['#2D3436', '#636E72'] as readonly [string, string],
};

const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ===========================================
// CREATE NAVIGATORS
// ===========================================

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ListingsStack = createNativeStackNavigator<ListingsStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

// ===========================================
// AUTH NAVIGATOR
// ===========================================

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ===========================================
// EXPLORE STACK (Super App Home)
// ===========================================

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <ExploreStack.Screen name="ExploreHome" component={ExploreHomeScreen} />
      <ExploreStack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <ExploreStack.Screen name="ListingDetail" component={ListingDetailScreen} />
    </ExploreStack.Navigator>
  );
}

// ===========================================
// LISTINGS STACK (Marketplace)
// ===========================================

function ListingsNavigator() {
  return (
    <ListingsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <ListingsStack.Screen name="ListingsHome" component={ListingsScreen} />
      <ListingsStack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <ListingsStack.Screen name="CreateListing" component={CreateListingScreen} />
    </ListingsStack.Navigator>
  );
}

// ===========================================
// CHAT STACK (Mensageiro)
// ===========================================

function ChatNavigator() {
  return (
    <ChatStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <ChatStack.Screen name="ConversationsList" component={ConversationsScreen} />
      <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </ChatStack.Navigator>
  );
}

// ===========================================
// PROFILE STACK
// ===========================================

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Meus Endereços' }}
      />
    </ProfileStack.Navigator>
  );
}

// ===========================================
// CART STACK
// ===========================================

function CartNavigator() {
  return (
    <CartStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
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

// ===========================================
// CUSTOM TAB BAR COMPONENT
// ===========================================

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
  badge?: number;
}

function TabIcon({ name, focused, label, badge }: TabIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View 
      style={[
        styles.tabIconContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Ionicons
        name={name}
        size={24}
        color={focused ? COLORS.tabActive : COLORS.tabInactive}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? COLORS.tabActive : COLORS.tabInactive },
        ]}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// Central Publish Button
function PublishButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.85,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      rotateAnim.setValue(0);
      onPress();
    });
  }, [onPress]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.publishButtonContainer}>
      <Animated.View
        style={[
          styles.publishButtonOuter,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          style={styles.publishButtonTouchable}
        >
          <LinearGradient
            colors={COLORS.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.publishButtonGradient}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons name="add" size={32} color={COLORS.textInverse} />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.publishLabel}>Publicar</Text>
    </View>
  );
}

// Custom Tab Bar
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Chat unread count (would come from store/context)
  const chatUnreadCount = 0; // TODO: Connect to chat store

  const handlePublishPress = useCallback(() => {
    navigation.navigate('CreateListingModal' as any);
  }, [navigation]);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {Platform.OS === 'ios' && (
        <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="light" />
      )}
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          // Handle the center "Publish" button differently
          if (route.name === 'Publish') {
            return (
              <PublishButton key={route.key} onPress={handlePublishPress} />
            );
          }

          const iconMap: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            Explore: { active: 'compass', inactive: 'compass-outline' },
            Listings: { active: 'grid', inactive: 'grid-outline' },
            Chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
            Profile: { active: 'person', inactive: 'person-outline' },
          };

          const labelMap: Record<string, string> = {
            Explore: 'Explorar',
            Listings: 'Anúncios',
            Chat: 'Chat',
            Profile: 'Perfil',
          };

          const icon = iconMap[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
          const label = labelMap[route.name] || route.name;
          const badge = route.name === 'Chat' ? chatUnreadCount : undefined;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabButton}
            >
              <TabIcon
                name={isFocused ? icon.active : icon.inactive}
                focused={isFocused}
                label={label}
                badge={badge}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================
// MAIN TAB NAVIGATOR
// ===========================================

// Dummy component for the Publish tab
function PublishPlaceholder() {
  return <View />;
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainTab.Screen name="Explore" component={ExploreNavigator} />
      <MainTab.Screen name="Listings" component={ListingsNavigator} />
      <MainTab.Screen 
        name="Publish" 
        component={PublishPlaceholder}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <MainTab.Screen name="Chat" component={ChatNavigator} />
      <MainTab.Screen name="Profile" component={ProfileNavigator} />
    </MainTab.Navigator>
  );
}

// ===========================================
// LOADING SCREEN
// ===========================================

function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingLogo}
      >
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name="storefront" size={48} color={COLORS.textInverse} />
        </Animated.View>
      </LinearGradient>
      <Text style={styles.loadingText}>SuperApp</Text>
    </View>
  );
}

// ===========================================
// ROOT NAVIGATOR
// ===========================================

export default function SuperAppNavigator() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {user ? (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen
            name="Cart"
            component={CartNavigator}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <RootStack.Screen
            name="Search"
            component={SearchScreen as any}
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
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
          <RootStack.Screen
            name="CreateListingModal"
            component={CreateListingScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

// ===========================================
// STYLES
// ===========================================

const styles = StyleSheet.create({
  // Tab Bar
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : COLORS.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.tabBarBorder,
    ...SHADOWS.medium,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 60,
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.9)' : 'transparent',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    ...SHADOWS.small,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Publish Button
  publishButtonContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  publishButtonOuter: {
    ...SHADOWS.glow,
  },
  publishButtonTouchable: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  publishButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
