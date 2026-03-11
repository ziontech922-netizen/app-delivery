import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '../../services/restaurantService';
import { useCartStore } from '../../stores/cartStore';
import { HomeStackParamList } from '../../navigation/types';
import { Product, Category } from '../../types';

type RestaurantDetailRouteProp = RouteProp<HomeStackParamList, 'RestaurantDetail'>;
type RestaurantDetailNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'RestaurantDetail'>;

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2D3436',
  background: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#F5F5F5',
  success: '#27AE60',
  warning: '#F39C12',
};

const HEADER_HEIGHT = 250;

// Product Card Component
function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description}
        </Text>
        <Text style={styles.productPrice}>
          R$ {product.price.toFixed(2)}
        </Text>
      </View>
      {product.imageUrl && (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />
      )}
    </TouchableOpacity>
  );
}

// Product Modal Component
function ProductModal({
  visible,
  product,
  onClose,
  onAddToCart,
}: {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (product) {
      onAddToCart(product, quantity, notes);
      setQuantity(1);
      setNotes('');
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {product.imageUrl && (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.modalImage}
              contentFit="cover"
              transition={200}
            />
          )}

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{product.name}</Text>
            <Text style={styles.modalDescription}>{product.description}</Text>
            <Text style={styles.modalPrice}>R$ {product.price.toFixed(2)}</Text>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Observações</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Ex: Sem cebola, ponto da carne..."
                placeholderTextColor={COLORS.gray}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={200}
              />
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantidade</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>
              Adicionar • R$ {(product.price * quantity).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function RestaurantDetailScreen() {
  const navigation = useNavigation<RestaurantDetailNavigationProp>();
  const route = useRoute<RestaurantDetailRouteProp>();
  const { restaurantId } = route.params;

  const { addItem, cart } = useCartStore();
  const cartItems = cart?.items || [];
  const cartRestaurantId = cart?.restaurantId;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);

  // Fetch restaurant
  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => restaurantService.getById(restaurantId),
  });

  // Fetch products
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['restaurant', restaurantId, 'products'],
    queryFn: () => restaurantService.getProducts(restaurantId),
    enabled: !!restaurant,
  });

  // Get categories from products
  const categories = React.useMemo(() => {
    if (!products) return [];
    const categoryMap = new Map<string, { id: string; name: string }>();
    products.forEach((product) => {
      if (product.categoryId && !categoryMap.has(product.categoryId)) {
        categoryMap.set(product.categoryId, { id: product.categoryId, name: product.categoryName });
      }
    });
    return Array.from(categoryMap.values());
  }, [products]);

  // Filter products by category
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    if (!selectedCategory) return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleAddToCart = (product: Product, quantity: number, notes: string) => {
    if (restaurant) {
      addItem(
        {
          productId: product.id,
          productName: product.name,
          productImage: product.imageUrl,
          quantity,
          unitPrice: product.price,
          notes: notes || undefined,
        },
        restaurant.id,
        restaurant.tradeName
      );
    }
  };

  const navigateToCart = () => {
    navigation.getParent()?.getParent()?.navigate('Cart');
  };

  const cartItemCount = cartRestaurantId === restaurantId ? cartItems.length : 0;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const isLoading = loadingRestaurant || loadingProducts;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray} />
        <Text style={styles.errorText}>Restaurante não encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.animatedHeaderContent}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={styles.animatedHeaderTitle} numberOfLines={1}>
              {restaurant.tradeName}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Fixed Back Button */}
      <SafeAreaView style={styles.fixedHeader} edges={['top']}>
        <TouchableOpacity
          style={styles.fixedBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Restaurant Header Image */}
        <Image
          source={{ uri: restaurant.bannerUrl || restaurant.logoUrl || 'https://via.placeholder.com/400x250' }}
          style={styles.headerImage}
          contentFit="cover"
          transition={200}
        />

        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName}>{restaurant.tradeName}</Text>
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

          <Text style={styles.cuisineText}>
            {restaurant.cuisineType || 'Restaurante'}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color={COLORS.warning} />
              <Text style={styles.metaText}>
                {restaurant.rating?.toFixed(1)} ({restaurant.reviewCount || 0} avaliações)
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>{restaurant.deliveryTime || '30-45'} min</Text>
            </View>
          </View>

          <View style={styles.deliveryInfo}>
            <Ionicons name="bicycle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.deliveryText}>
              Taxa de entrega: {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee?.toFixed(2)}`}
            </Text>
          </View>

          {restaurant.minimumOrder && restaurant.minimumOrder > 0 && (
            <Text style={styles.minOrderText}>
              Pedido mínimo: R$ {restaurant.minimumOrder.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Categories Filter */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Products */}
        <View style={styles.productsSection}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => handleProductPress(product)}
            />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Cart Footer */}
      {cartItemCount > 0 && (
        <SafeAreaView style={styles.cartFooter} edges={['bottom']}>
          <TouchableOpacity style={styles.cartButton} onPress={navigateToCart}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
            <Text style={styles.cartButtonText}>Ver carrinho</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Product Modal */}
      <ProductModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  animatedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99,
  },
  fixedBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 8,
  },
  headerImage: {
    width: width,
    height: HEADER_HEIGHT,
  },
  restaurantInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    flex: 1,
  },
  openBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  closedBadge: {
    backgroundColor: `${COLORS.gray}15`,
  },
  closedBadgeText: {
    color: COLORS.gray,
  },
  cuisineText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 6,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    padding: 12,
    borderRadius: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 8,
  },
  minOrderText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 8,
  },
  categoriesScroll: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productsSection: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
  },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cartBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalImage: {
    width: width,
    height: width * 0.6,
  },
  modalContent: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 24,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.secondary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
