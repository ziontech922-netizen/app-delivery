import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { restaurantService } from '../../services/restaurantService';
import { listingService } from '../../services/listingService';
import { feedService } from '../../services/feedService';
import { sponsorService } from '../../services/sponsorService';
import { LISTING_CATEGORIES } from '../../types';
import type { Restaurant, Listing, FeedItem, Sponsor, ListingCategory } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

// ===========================================
// THEME
// ===========================================
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2D3436',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  gray: '#95A5A6',
  lightGray: '#E9ECEF',
  success: '#27AE60',
  warning: '#F39C12',
  text: '#1A1A1A',
  textLight: '#6C757D',
  white: '#FFFFFF',
  gradient: ['#FF6B35', '#FF8B5C'] as readonly [string, string],
};

// ===========================================
// HEADER COMPONENT
// ===========================================
function ExploreHeader({ user, onSearch }: { user: any; onSearch: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.greeting}>
          {user ? `Olá, ${user.firstName}` : 'Olá!'}
        </Text>
        <Text style={styles.subtitle}>O que você procura hoje?</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton} onPress={onSearch}>
          <Ionicons name="search-outline" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===========================================
// CATEGORY GRID
// ===========================================
const EXPLORE_CATEGORIES = [
  { id: 'FOOD', label: 'Comida', icon: 'restaurant-outline', color: '#FF6B35' },
  { id: 'PRODUCTS', label: 'Produtos', icon: 'cube-outline', color: '#3498DB' },
  { id: 'SERVICES', label: 'Serviços', icon: 'construct-outline', color: '#9B59B6' },
  { id: 'VEHICLES', label: 'Veículos', icon: 'car-outline', color: '#27AE60' },
  { id: 'JOBS', label: 'Empregos', icon: 'briefcase-outline', color: '#E74C3C' },
  { id: 'REAL_ESTATE', label: 'Imóveis', icon: 'home-outline', color: '#F39C12' },
];

function CategoryGrid({ onCategoryPress }: { onCategoryPress: (category: string) => void }) {
  return (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>Explorar</Text>
      <View style={styles.categoryGrid}>
        {EXPLORE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            onPress={() => onCategoryPress(cat.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.categoryIconContainer, { backgroundColor: cat.color + '15' }]}>
              <Ionicons name={cat.icon as any} size={28} color={cat.color} />
            </View>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ===========================================
// SPONSOR BANNER
// ===========================================
function SponsorBanner({ sponsors }: { sponsors: Sponsor[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigation = useNavigation();

  if (!sponsors || sponsors.length === 0) return null;

  const handlePress = async (sponsor: Sponsor) => {
    await sponsorService.recordClick(sponsor.id);
    // Abrir link do patrocinador
  };

  return (
    <View style={styles.bannerContainer}>
      <FlatList
        data={sponsors}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bannerItem}
            onPress={() => handlePress(item)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.bannerUrl || item.logoUrl || 'https://via.placeholder.com/400x150' }}
              style={styles.bannerImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.bannerGradient}
            >
              <Text style={styles.bannerTitle}>{item.name}</Text>
              {item.description && (
                <Text style={styles.bannerDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
      {sponsors.length > 1 && (
        <View style={styles.paginationDots}>
          {sponsors.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ===========================================
// LISTING CARD
// ===========================================
function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const formatPrice = (price: number | null, priceType: string) => {
    if (priceType === 'FREE') return 'Grátis';
    if (priceType === 'CONTACT') return 'Consulte';
    if (!price) return 'A combinar';
    return `R$ ${price.toLocaleString('pt-BR')}`;
  };

  return (
    <TouchableOpacity style={styles.listingCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: listing.images[0] || 'https://via.placeholder.com/200' }}
        style={styles.listingImage}
        contentFit="cover"
      />
      {listing.isFeatured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={10} color="#FFF" />
          <Text style={styles.featuredText}>Destaque</Text>
        </View>
      )}
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.listingPrice}>{formatPrice(listing.price, listing.priceType)}</Text>
        <View style={styles.listingMeta}>
          <Ionicons name="location-outline" size={12} color={COLORS.gray} />
          <Text style={styles.listingLocation} numberOfLines={1}>
            {listing.city || 'Local não informado'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ===========================================
// RESTAURANT CARD (Premium Style)
// ===========================================
function RestaurantCardPremium({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.restaurantCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: restaurant.bannerUrl || restaurant.logoUrl || 'https://via.placeholder.com/300x150' }}
        style={styles.restaurantImage}
        contentFit="cover"
      />
      {restaurant.isOpen ? (
        <View style={styles.openBadge}>
          <Text style={styles.openText}>Aberto</Text>
        </View>
      ) : (
        <View style={[styles.openBadge, styles.closedBadge]}>
          <Text style={styles.closedText}>Fechado</Text>
        </View>
      )}
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.tradeName}</Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.ratingText}>{restaurant.rating?.toFixed(1) || '—'}</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <Ionicons name="time-outline" size={12} color={COLORS.gray} />
            <Text style={styles.deliveryText}>{restaurant.deliveryTime || '30-45'} min</Text>
          </View>
          <Text style={styles.deliveryFee}>
            {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee?.toFixed(2)}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ===========================================
// HORIZONTAL SECTION
// ===========================================
function HorizontalSection<T>({
  title,
  subtitle,
  data,
  renderItem,
  onSeeAll,
  keyExtractor,
}: {
  title: string;
  subtitle?: string;
  data: T[];
  renderItem: ({ item }: { item: T }) => React.ReactElement;
  onSeeAll?: () => void;
  keyExtractor: (item: T) => string;
}) {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>Ver tudo</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </View>
  );
}

// ===========================================
// MAIN HOME SCREEN
// ===========================================
export default function ExploreHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { data: restaurants, refetch: refetchRestaurants } = useQuery({
    queryKey: ['restaurants-home'],
    queryFn: () => restaurantService.getFeatured(),
  });

  const { data: listingsData, refetch: refetchListings } = useQuery({
    queryKey: ['listings-home'],
    queryFn: () => listingService.getListings({ limit: 10 }),
  });

  const { data: sponsors } = useQuery({
    queryKey: ['sponsors-home'],
    queryFn: () => sponsorService.getByPlacement('HOME_BANNER'),
  });

  const { data: feedData, refetch: refetchFeed } = useQuery({
    queryKey: ['feed-home'],
    queryFn: () => feedService.getFeed({ limit: 5 }),
  });

  const listings = listingsData?.data || [];
  const feed = feedData?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchRestaurants(), refetchListings(), refetchFeed()]);
    setRefreshing(false);
  }, []);

  const handleCategoryPress = (category: string) => {
    if (category === 'FOOD') {
      navigation.navigate('Search');
    } else {
      navigation.navigate('Listings', { category });
    }
  };

  const handleSearch = () => {
    navigation.navigate('Search');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <ExploreHeader user={user} onSearch={handleSearch} />

        {/* Sponsor Banner */}
        <SponsorBanner sponsors={sponsors || []} />

        {/* Category Grid */}
        <CategoryGrid onCategoryPress={handleCategoryPress} />

        {/* Restaurantes Próximos */}
        <HorizontalSection
          title="Restaurantes"
          subtitle="Perto de você"
          data={restaurants || []}
          renderItem={({ item }) => (
            <RestaurantCardPremium
              restaurant={item}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          onSeeAll={() => navigation.navigate('Search')}
        />

        {/* Anúncios Recentes */}
        <HorizontalSection
          title="Anúncios"
          subtitle="Publicados recentemente"
          data={listings}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          onSeeAll={() => navigation.navigate('Listings')}
        />

        {/* Espaço para o FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button - Publicar */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateListing')}
        activeOpacity={0.9}
      >
        <LinearGradient colors={COLORS.gradient} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ===========================================
// STYLES
// ===========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {},
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // Banner
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  bannerItem: {
    width: width - 32,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  bannerDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.lightGray,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 18,
  },

  // Category Grid
  categorySection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  categoryCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Listing Card
  listingCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 120,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  listingInfo: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  listingLocation: {
    fontSize: 11,
    color: COLORS.gray,
    flex: 1,
  },

  // Restaurant Card
  restaurantCard: {
    width: width * 0.7,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: 130,
  },
  openBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  closedBadge: {
    backgroundColor: COLORS.gray,
  },
  openText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  closedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  restaurantInfo: {
    padding: 14,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  deliveryFee: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
