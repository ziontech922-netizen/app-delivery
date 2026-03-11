import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeScreen: undefined;
  RestaurantDetail: { restaurantId: string };
  ProductDetail: { productId: string; restaurantId: string };
};

// Search Stack
export type SearchStackParamList = {
  SearchScreen: undefined;
  SearchResults: { query?: string; category?: string };
  RestaurantDetail: { restaurantId: string };
  ProductDetail: { productId: string; restaurantId: string };
};

// Orders Stack
export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
  OrderTracking: { orderId: string };
  Review: { orderId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  AddAddress: { addressId?: string };
  FavoritesScreen: undefined;
  Settings: undefined;
  Help: undefined;
};

// Cart Stack
export type CartStackParamList = {
  CartScreen: undefined;
  Checkout: undefined;
  SelectAddress: undefined;
  AddAddress: { returnTo: string };
  ApplyCoupon: undefined;
  OrderSuccess: { orderId: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Search: NavigatorScreenParams<SearchStackParamList>;
  Orders: NavigatorScreenParams<OrdersStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Cart: NavigatorScreenParams<CartStackParamList>;
  OrderTracking: { orderId: string };
};

// Navigation props
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
