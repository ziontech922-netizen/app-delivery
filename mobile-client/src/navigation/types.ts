import { NavigatorScreenParams } from '@react-navigation/native';

// ===========================================
// SUPER APP NAVIGATION TYPES
// ===========================================

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
};

// Home/Explore Stack (Super App Hub)
export type ExploreStackParamList = {
  ExploreHome: undefined;
  Category: { category: ListingCategoryType; title: string };
  RestaurantDetail: { restaurantId: string };
  ProductDetail: { productId: string; restaurantId: string };
  ListingDetail: { listingId: string };
  UserProfile: { userId: string; userHandle?: string };
  MerchantsList: { category?: string };
  FoodDelivery: undefined;
};

// Listings/Marketplace Stack
export type ListingsStackParamList = {
  ListingsHome: undefined;
  ListingDetail: { listingId: string };
  CreateListing: { category?: ListingCategoryType };
  EditListing: { listingId: string };
  MyListings: undefined;
  ListingCategory: { category: ListingCategoryType; title: string };
  UserProfile: { userId: string; userHandle?: string };
};

// Chat/Messages Stack
export type ChatStackParamList = {
  ConversationsList: undefined;
  ChatRoom: { 
    conversationId?: string; 
    recipientId?: string; 
    recipientName?: string;
    listingId?: string;
    otherUser?: {
      id: string;
      name: string;
      avatar?: string;
      userHandle?: string;
    };
  };
  ChatSettings: { conversationId: string };
  UserProfile: { userId: string; userHandle?: string };
};

// Search Stack (Universal Search)
export type SearchStackParamList = {
  SearchScreen: undefined;
  SearchResults: { query?: string; category?: string; type?: 'all' | 'food' | 'listings' | 'services' | 'users' };
  RestaurantDetail: { restaurantId: string };
  ListingDetail: { listingId: string };
  UserProfile: { userId: string; userHandle?: string };
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
  MyListings: undefined;
  MyPurchases: undefined;
  Settings: undefined;
  Help: undefined;
  Notifications: undefined;
  PrivacySettings: undefined;
};

// Cart Stack
export type CartStackParamList = {
  CartScreen: undefined;
  Checkout: undefined;
  SelectAddress: undefined;
  AddAddress: { returnTo: string };
  ApplyCoupon: undefined;
  OrderSuccess: { orderId: string };
  PaymentMethods: undefined;
};

// Community Feed Stack
export type FeedStackParamList = {
  FeedHome: undefined;
  FeedItemDetail: { itemId: string };
  CreatePost: undefined;
  SponsorDetail: { sponsorId: string };
};

// Main Tab Navigator (Super App Bottom Navigation)
export type MainTabParamList = {
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Listings: NavigatorScreenParams<ListingsStackParamList>;
  Publish: undefined; // Central action button
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Cart: NavigatorScreenParams<CartStackParamList>;
  OrderTracking: { orderId: string };
  Search: NavigatorScreenParams<SearchStackParamList>;
  Feed: NavigatorScreenParams<FeedStackParamList>;
  // Modals
  CreateListingModal: { category?: ListingCategoryType; initialText?: string };
  VoiceRecordingModal: undefined;
  ImagePickerModal: { maxImages?: number; onSelect?: (images: string[]) => void };
  LocationPickerModal: { onSelect?: (location: LocationData) => void };
  FullScreenGallery: { images: string[]; initialIndex?: number };
};

// ===========================================
// SUPER APP TYPE DEFINITIONS
// ===========================================

// Listing Categories (mirrors backend enum)
export type ListingCategoryType = 
  | 'PRODUCTS'
  | 'SERVICES'
  | 'VEHICLES'
  | 'REAL_ESTATE'
  | 'JOBS'
  | 'FOOD'
  | 'ELECTRONICS'
  | 'FASHION'
  | 'HOME_GARDEN'
  | 'SPORTS'
  | 'PETS'
  | 'OTHER';

// Listing Status
export type ListingStatusType = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REMOVED';

// Price Types
export type PriceType = 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT';

// Message Types
export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'SYSTEM';

// Location Data
export interface LocationData {
  city: string;
  state: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

// User Profile (Public)
export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  userHandle: string | null;
  avatarUrl: string | null;
  bio?: string;
  defaultCity?: string;
  defaultState?: string;
  listingsCount?: number;
  rating?: number;
  memberSince?: string;
}

// Listing Interface
export interface Listing {
  id: string;
  userId: string;
  title: string;
  description?: string;
  price?: number;
  priceType: PriceType;
  images: string[];
  audioUrl?: string;
  category: ListingCategoryType;
  subcategory?: string;
  tags: string[];
  city?: string;
  state?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  status: ListingStatusType;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  user?: PublicUserProfile;
  isFavorited?: boolean;
}

// Conversation Interface
export interface Conversation {
  id: string;
  participant1: PublicUserProfile;
  participant2: PublicUserProfile;
  listingId?: string;
  lastMessageAt?: string;
  lastMessageText?: string;
  unreadCount: number;
  listing?: Pick<Listing, 'id' | 'title' | 'images' | 'price'>;
}

// Message Interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  readAt?: string;
  createdAt: string;
  sender?: PublicUserProfile;
}

// Sponsor Interface
export interface Sponsor {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  websiteUrl?: string;
  placements: string[];
}

// Feed Item Interface
export interface FeedItem {
  id: string;
  type: 'NEW_LISTING' | 'PROMOTION' | 'NEW_MERCHANT' | 'SPONSORED' | 'ANNOUNCEMENT' | 'EVENT';
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  listingId?: string;
  merchantId?: string;
  sponsorId?: string;
  createdAt: string;
}

// AI Extracted Data
export interface AiExtractedData {
  title: string;
  description?: string;
  price?: number;
  priceType: PriceType;
  category: ListingCategoryType;
  subcategory?: string;
  tags: string[];
  confidence: number;
}

// Navigation props
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
