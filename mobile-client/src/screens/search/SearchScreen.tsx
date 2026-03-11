import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '../../services/restaurantService';
import { SearchStackParamList } from '../../navigation/types';
import { Restaurant } from '../../types';

type SearchScreenNavigationProp = NativeStackNavigationProp<SearchStackParamList, 'SearchScreen'>;

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2D3436',
  background: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#F5F5F5',
  success: '#27AE60',
  warning: '#F39C12',
};

const RECENT_SEARCHES_KEY = 'recent_searches';

function RestaurantItem({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.restaurantItem} onPress={onPress}>
      <Image
        source={{ uri: restaurant.bannerUrl || restaurant.logoUrl || 'https://via.placeholder.com/80' }}
        style={styles.restaurantImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {restaurant.tradeName}
        </Text>
        <Text style={styles.restaurantCuisine} numberOfLines={1}>
          {restaurant.cuisineType || 'Restaurante'}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.metaText}>{restaurant.rating?.toFixed(1) || '0.0'}</Text>
          </View>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{restaurant.deliveryTime || '30-45'} min</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee?.toFixed(2)}`}
          </Text>
        </View>
      </View>
      {restaurant.isOpen ? (
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
        </View>
      ) : (
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.gray }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search restaurants
  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['restaurants', 'search', debouncedQuery],
    queryFn: () => restaurantService.search({ query: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  });

  // Fetch cuisine types for suggestions
  const { data: cuisineTypes } = useQuery({
    queryKey: ['cuisineTypes'],
    queryFn: () => restaurantService.getCuisineTypes(),
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    setDebouncedQuery(query);
  };

  const addToRecentSearches = (query: string) => {
    if (query.length >= 2) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== query);
        return [query, ...filtered].slice(0, 5);
      });
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const navigateToRestaurant = (restaurantId: string) => {
    addToRecentSearches(searchQuery);
    Keyboard.dismiss();
    navigation.navigate('RestaurantDetail', { restaurantId });
  };

  const showResults = debouncedQuery.length >= 2;
  const restaurants = searchResults?.data || [];
  const hasResults = restaurants.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar restaurantes ou pratos"
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading || isFetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : showResults ? (
        hasResults ? (
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RestaurantItem
                restaurant={item}
                onPress={() => navigateToRestaurant(item.id)}
              />
            )}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Nenhum resultado</Text>
            <Text style={styles.emptySubtitle}>
              Não encontramos restaurantes para "{debouncedQuery}"
            </Text>
          </View>
        )
      ) : (
        <View style={styles.suggestionsContainer}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Buscas recentes</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearButton}>Limpar</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleRecentSearch(search)}
                >
                  <Ionicons name="time-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.suggestionText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Cuisine Types */}
          {cuisineTypes && cuisineTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categorias populares</Text>
              <View style={styles.cuisineGrid}>
                {cuisineTypes.slice(0, 8).map((cuisine, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.cuisineChip}
                    onPress={() => handleRecentSearch(cuisine)}
                  >
                    <Text style={styles.cuisineChipText}>{cuisine}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    paddingVertical: 8,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  restaurantImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 2,
  },
  metaDot: {
    color: COLORS.gray,
    marginHorizontal: 6,
  },
  statusBadge: {
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  suggestionsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  clearButton: {
    fontSize: 14,
    color: COLORS.primary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.secondary,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cuisineChip: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  cuisineChipText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
});
