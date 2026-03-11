import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '../../services/restaurantService';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { HomeStackParamList } from '../../navigation/types';
import { Restaurant, Category } from '../../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2D3436',
  background: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#F5F5F5',
  success: '#27AE60',
  warning: '#F39C12',
};

// Restaurant Card Component
function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.restaurantCard} onPress={onPress}>
      <Image
        source={{ uri: restaurant.bannerUrl || restaurant.logoUrl || 'https://via.placeholder.com/300x150' }}
        style={styles.restaurantImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {restaurant.tradeName}
          </Text>
          {restaurant.isOpen ? (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Aberto</Text>
            </View>
          ) : (
            <View style={[styles.openBadge, styles.closedBadge]}>
              <Text style={[styles.openBadgeText, styles.closedBadgeText]}>Fechado</Text>
            </View>
          )}
        </View>
        <Text style={styles.restaurantCuisine} numberOfLines={1}>
          {restaurant.cuisineType || 'Restaurante'}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.metaText}>
              {restaurant.rating?.toFixed(1) || '0.0'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.gray} />
            <Text style={styles.metaText}>
              {restaurant.deliveryTime || '30-45'} min
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={14} color={COLORS.gray} />
            <Text style={styles.metaText}>
              {restaurant.deliveryFee === 0
                ? 'Grátis'
                : `R$ ${restaurant.deliveryFee?.toFixed(2)}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Category Item Component
function CategoryItem({ category, onPress }: { category: Category; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
      <View style={styles.categoryIcon}>
        <Ionicons name="restaurant-outline" size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuthStore();
  const cartItemCount = useCartStore((state) => state.cart?.items.length || 0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch featured restaurants
  const {
    data: featuredRestaurants,
    isLoading: loadingFeatured,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ['restaurants', 'featured'],
    queryFn: () => restaurantService.getFeatured(),
  });

  // Fetch nearby restaurants (using featured for now until we have location)
  const {
    data: nearbyRestaurants,
    isLoading: loadingNearby,
    refetch: refetchNearby,
  } = useQuery({
    queryKey: ['restaurants', 'nearby'],
    queryFn: () => restaurantService.getFeatured(),
  });

  // Fetch cuisine types as categories
  const {
    data: cuisineTypes,
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['cuisineTypes'],
    queryFn: () => restaurantService.getCuisineTypes(),
  });
  
  const categories = cuisineTypes?.map((ct, index) => ({
    id: String(index),
    name: ct,
    description: null,
    imageUrl: null,
    sortOrder: index,
    productCount: 0,
  })) || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFeatured(), refetchNearby(), refetchCategories()]);
    setRefreshing(false);
  }, [refetchFeatured, refetchNearby, refetchCategories]);

  const navigateToRestaurant = (restaurantId: string) => {
    navigation.navigate('RestaurantDetail', { restaurantId });
  };

  const navigateToCart = () => {
    navigation.getParent()?.navigate('Cart');
  };

  const isLoading = loadingFeatured || loadingNearby || loadingCategories;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Olá, {user?.firstName || 'Visitante'}!
          </Text>
          <TouchableOpacity style={styles.locationButton}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              Selecionar endereço
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={navigateToCart}>
          <Ionicons name="cart-outline" size={24} color={COLORS.secondary} />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.getParent()?.navigate('Search')}
      >
        <Ionicons name="search-outline" size={20} color={COLORS.gray} />
        <Text style={styles.searchPlaceholder}>Buscar restaurantes ou pratos</Text>
      </TouchableOpacity>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Categories */}
          {categories && categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <CategoryItem
                    category={item}
                    onPress={() => {
                      navigation.getParent()?.navigate('Search', {
                        screen: 'SearchResults',
                        params: { category: item.id },
                      });
                    }}
                  />
                )}
                contentContainerStyle={styles.categoriesList}
              />
            </View>
          )}

          {/* Featured Restaurants */}
          {featuredRestaurants && featuredRestaurants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Destaques</Text>
              <FlatList
                data={featuredRestaurants}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.featuredCardWrapper}>
                    <RestaurantCard
                      restaurant={item}
                      onPress={() => navigateToRestaurant(item.id)}
                    />
                  </View>
                )}
                contentContainerStyle={styles.featuredList}
              />
            </View>
          )}

          {/* Nearby Restaurants */}
          {nearbyRestaurants && nearbyRestaurants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Perto de você</Text>
              {nearbyRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() => navigateToRestaurant(restaurant.id)}
                />
              ))}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.gray,
    marginHorizontal: 4,
    maxWidth: width * 0.5,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.gray,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    maxWidth: 60,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCardWrapper: {
    width: width * 0.75,
    marginRight: 16,
  },
  restaurantCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
  },
  openBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  closedBadge: {
    backgroundColor: `${COLORS.gray}15`,
  },
  closedBadgeText: {
    color: COLORS.gray,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  bottomSpacer: {
    height: 24,
  },
});
