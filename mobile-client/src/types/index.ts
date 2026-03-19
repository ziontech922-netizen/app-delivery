// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';
  avatarUrl: string | null;
  createdAt: string;
}

// Address types
export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

// Restaurant types
export interface Restaurant {
  id: string;
  tradeName: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  cuisineType: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  distance?: number;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
  };
}

// Category types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  preparationTime: number | null;
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Cart {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// Order types
export type OrderStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  acceptedAt: string | null;
  preparedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryTime: number | null;
  notes: string | null;
  restaurant: {
    id: string;
    tradeName: string;
    logoUrl: string | null;
    phone: string;
  };
  items: OrderItem[];
  deliveryAddress: Address;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
    location?: {
      latitude: number;
      longitude: number;
    };
  } | null;
}

// Review types
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reply: string | null;
  repliedAt: string | null;
}

// Search types
export interface SearchFilters {
  query?: string;
  cuisineType?: string;
  minRating?: number;
  maxDeliveryFee?: number;
  sortBy?: 'distance' | 'rating' | 'deliveryTime' | 'deliveryFee';
}

// Notification types
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number | null;
  validUntil: string;
}

// ===========================================
// SUPER APP TYPES
// ===========================================

// Listing types
export type ListingCategory = 
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

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REMOVED';

export type PriceType = 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT';

export interface ListingUser {
  id: string;
  firstName: string;
  lastName: string;
  userHandle: string | null;
  avatarUrl: string | null;
  phone?: string;
  createdAt?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  priceType: PriceType;
  images: string[];
  audioUrl: string | null;
  category: ListingCategory;
  subcategory: string | null;
  tags: string[];
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ListingStatus;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  aiGenerated: boolean;
  createdAt: string;
  user: ListingUser;
}

export interface ListingQuery {
  search?: string;
  category?: ListingCategory;
  subcategory?: string;
  status?: ListingStatus;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  userId?: string;
  featured?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: 'createdAt' | 'priceAsc' | 'priceDesc' | 'viewCount' | 'relevance';
  page?: number;
  limit?: number;
}

export interface CreateListingInput {
  title: string;
  description?: string;
  price?: number;
  priceType?: PriceType;
  category: ListingCategory;
  subcategory?: string;
  tags?: string[];
  images?: string[];
  audioUrl?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

// Chat types
export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'SYSTEM';

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  userHandle: string | null;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  otherUser: ChatUser;
  listingId: string | null;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
  sender: ChatUser;
}

// Community Feed types
export type FeedItemType = 
  | 'NEW_LISTING'
  | 'PROMOTION'
  | 'NEW_MERCHANT'
  | 'SPONSORED'
  | 'ANNOUNCEMENT'
  | 'EVENT';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  listing?: Listing;
  merchant?: Restaurant;
  sponsor?: Sponsor;
  createdAt: string;
}

// Sponsor types
export type SponsorPlacement = 
  | 'HOME_BANNER'
  | 'CATEGORY_HEADER'
  | 'FEED_INLINE'
  | 'SEARCH_RESULTS'
  | 'LISTING_DETAIL'
  | 'FEATURED_CAROUSEL';

export interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
}

// AI Listing types
export interface AiExtractionResult {
  title: string;
  description: string | null;
  price: number | null;
  priceType: PriceType;
  category: ListingCategory;
  subcategory: string | null;
  tags: string[];
  confidence: number;
}

export interface AiListingResponse {
  listing: Listing;
  aiExtraction: AiExtractionResult;
  transcription?: string;
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Category info for listings
export interface ListingCategoryInfo {
  name: ListingCategory;
  label: string;
  icon: string;
  count?: number;
}

export const LISTING_CATEGORIES: ListingCategoryInfo[] = [
  { name: 'PRODUCTS', label: 'Produtos', icon: 'cube-outline' },
  { name: 'SERVICES', label: 'Serviços', icon: 'construct-outline' },
  { name: 'VEHICLES', label: 'Veículos', icon: 'car-outline' },
  { name: 'REAL_ESTATE', label: 'Imóveis', icon: 'home-outline' },
  { name: 'JOBS', label: 'Empregos', icon: 'briefcase-outline' },
  { name: 'FOOD', label: 'Comida', icon: 'restaurant-outline' },
  { name: 'ELECTRONICS', label: 'Eletrônicos', icon: 'phone-portrait-outline' },
  { name: 'FASHION', label: 'Moda', icon: 'shirt-outline' },
  { name: 'HOME_GARDEN', label: 'Casa e Jardim', icon: 'leaf-outline' },
  { name: 'SPORTS', label: 'Esportes', icon: 'fitness-outline' },
  { name: 'PETS', label: 'Pets', icon: 'paw-outline' },
  { name: 'OTHER', label: 'Outros', icon: 'ellipsis-horizontal-outline' },
];

