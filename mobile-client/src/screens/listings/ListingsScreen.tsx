import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listingService } from '../../services/listingService';
import type { Listing, ListingCategory, ListingQuery } from '../../types';
import { LISTING_CATEGORIES } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

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
  text: '#1A1A1A',
  textLight: '#6C757D',
  white: '#FFFFFF',
};

// ===========================================
// FILTER BAR
// ===========================================
const SORT_OPTIONS = [
  { id: 'createdAt', label: 'Mais recentes' },
  { id: 'priceAsc', label: 'Menor preço' },
  { id: 'priceDesc', label: 'Maior preço' },
  { id: 'viewCount', label: 'Mais vistos' },
];

function FilterBar({
  selectedCategory,
  sortBy,
  onCategoryChange,
  onSortChange,
  onFilterPress,
}: {
  selectedCategory: ListingCategory | undefined;
  sortBy: string;
  onCategoryChange: (cat: ListingCategory | undefined) => void;
  onSortChange: (sort: string) => void;
  onFilterPress: () => void;
}) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const categoryLabel = selectedCategory
    ? LISTING_CATEGORIES.find((c) => c.name === selectedCategory)?.label || 'Categoria'
    : 'Todas';

  const sortLabel = SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Ordenar';

  return (
    <View style={styles.filterBar}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ name: undefined, label: 'Tudo' }, ...LISTING_CATEGORIES]}
        keyExtractor={(item) => item.name || 'all'}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.name && styles.categoryChipActive,
            ]}
            onPress={() => onCategoryChange(item.name as ListingCategory | undefined)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item.name && styles.categoryChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.filterActions}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Ionicons name="swap-vertical-outline" size={18} color={COLORS.secondary} />
          <Text style={styles.sortText}>{sortLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortMenuItem,
                sortBy === option.id && styles.sortMenuItemActive,
              ]}
              onPress={() => {
                onSortChange(option.id);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortMenuItemText,
                  sortBy === option.id && styles.sortMenuItemTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.id && (
                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
              )}
            </TouchableOpacity>
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

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return past.toLocaleDateString('pt-BR');
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
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.listingPrice}>{formatPrice(listing.price, listing.priceType)}</Text>
        <View style={styles.listingMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={COLORS.gray} />
            <Text style={styles.metaText} numberOfLines={1}>
              {listing.city || 'Local não informado'}
            </Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(listing.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ===========================================
// EMPTY STATE
// ===========================================
function EmptyState({ category }: { category?: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={COLORS.lightGray} />
      <Text style={styles.emptyTitle}>Nenhum anúncio encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {category
          ? 'Não há anúncios nesta categoria no momento'
          : 'Seja o primeiro a publicar um anúncio!'}
      </Text>
    </View>
  );
}

// ===========================================
// MAIN SCREEN
// ===========================================
type RouteParams = {
  category?: ListingCategory;
  search?: string;
};

export default function ListingsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const initialCategory = route.params?.category;
  const initialSearch = route.params?.search;

  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | undefined>(
    initialCategory
  );
  const [sortBy, setSortBy] = useState('createdAt');
  const [refreshing, setRefreshing] = useState(false);

  const queryParams: ListingQuery = useMemo(() => ({
    category: selectedCategory,
    search: initialSearch,
    sortBy: sortBy as any,
    limit: 20,
  }), [selectedCategory, initialSearch, sortBy]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['listings', queryParams],
    queryFn: ({ pageParam = 1 }) =>
      listingService.getListings({ ...queryParams, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const listings = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleCategoryChange = (category: ListingCategory | undefined) => {
    setSelectedCategory(category);
  };

  const handleFilterPress = () => {
    // TODO: Open filter modal
  };

  const categoryTitle = selectedCategory
    ? LISTING_CATEGORIES.find((c) => c.name === selectedCategory)?.label
    : 'Todos os Anúncios';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryTitle}</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('SearchListings')}
        >
          <Ionicons name="search-outline" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <FilterBar
        selectedCategory={selectedCategory}
        sortBy={sortBy}
        onCategoryChange={handleCategoryChange}
        onSortChange={setSortBy}
        onFilterPress={handleFilterPress}
      />

      {/* Listing Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={<EmptyState category={selectedCategory} />}
        />
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter Bar
  filterBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
  },
  sortMenu: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  sortMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortMenuItemActive: {
    backgroundColor: COLORS.surface,
  },
  sortMenuItemText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  sortMenuItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // List
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Card
  listingCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: CARD_WIDTH,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  listingContent: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.gray,
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.gray,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
});
