import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '../../services/listingService';
import { useAuthStore } from '../../stores/authStore';
import { LISTING_CATEGORIES } from '../../types';
import type { Listing } from '../../types';

const { width, height } = Dimensions.get('window');

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
  text: '#1A1A1A',
  textLight: '#6C757D',
  white: '#FFFFFF',
  gradient: ['#FF6B35', '#FF8B5C'] as readonly [string, string],
};

// ===========================================
// IMAGE GALLERY
// ===========================================
function ImageGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const displayImages = images.length > 0 ? images : ['https://via.placeholder.com/400'];

  return (
    <View style={styles.gallery}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
      >
        {displayImages.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={styles.galleryImage}
            contentFit="cover"
          />
        ))}
      </ScrollView>
      {displayImages.length > 1 && (
        <View style={styles.pagination}>
          {displayImages.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ===========================================
// USER CARD
// ===========================================
function SellerCard({
  user,
  onChat,
  onCall,
}: {
  user: Listing['user'];
  onChat: () => void;
  onCall: () => void;
}) {
  return (
    <View style={styles.sellerCard}>
      <View style={styles.sellerInfo}>
        <Image
          source={{ uri: user.avatarUrl || 'https://via.placeholder.com/60' }}
          style={styles.sellerAvatar}
        />
        <View style={styles.sellerDetails}>
          <Text style={styles.sellerName}>{`${user.firstName} ${user.lastName}`}</Text>
          {user.userHandle && (
            <Text style={styles.sellerHandle}>@{user.userHandle}</Text>
          )}
        </View>
      </View>
      <View style={styles.sellerActions}>
        <TouchableOpacity style={styles.chatButton} onPress={onChat}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.white} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
        {user.phone && (
          <TouchableOpacity style={styles.callButton} onPress={onCall}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ===========================================
// MAIN SCREEN
// ===========================================
type RouteParams = {
  listingId: string;
};

export default function ListingDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { listingId } = route.params;
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listingService.getListing(listingId),
  });

  const favoriteMutation = useMutation({
    mutationFn: () =>
      isFavorite
        ? listingService.removeFavorite(listingId)
        : listingService.addFavorite(listingId),
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
    },
  });

  const handleFavorite = () => {
    if (!isAuthenticated) {
      Alert.alert('Entrar', 'Faça login para salvar favoritos', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entrar', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    favoriteMutation.mutate();
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        message: `Confira: ${listing.title} - R$ ${listing.price?.toLocaleString('pt-BR') || 'A combinar'}`,
        title: listing.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleChat = () => {
    if (!listing) return;
    if (!isAuthenticated) {
      Alert.alert('Entrar', 'Faça login para iniciar uma conversa', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entrar', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    if (listing.user.id === user?.id) {
      Alert.alert('Aviso', 'Você não pode conversar consigo mesmo');
      return;
    }
    navigation.navigate('Chat', {
      recipientId: listing.user.id,
      listingId: listing.id,
      recipientName: `${listing.user.firstName} ${listing.user.lastName}`,
    });
  };

  const handleCall = () => {
    if (!listing?.user.phone) return;
    Linking.openURL(`tel:${listing.user.phone}`);
  };

  const formatPrice = (price: number | null, priceType: string) => {
    if (priceType === 'FREE') return 'Grátis';
    if (priceType === 'CONTACT') return 'Consultar';
    if (!price) return 'A combinar';
    return `R$ ${price.toLocaleString('pt-BR')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const categoryInfo = listing
    ? LISTING_CATEGORIES.find((c) => c.name === listing.category)
    : null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray} />
        <Text style={styles.errorText}>Anúncio não encontrado</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOwner = user?.id === listing.user.id;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery images={listing.images} />

        {/* Header Actions (over gallery) */}
        <SafeAreaView style={styles.headerActions} edges={['top']}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleFavorite}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? COLORS.primary : COLORS.secondary}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Content */}
        <View style={styles.content}>
          {/* Price & Title */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatPrice(listing.price, listing.priceType)}</Text>
            {listing.priceType === 'NEGOTIABLE' && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableText}>Negociável</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{listing.title}</Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color={COLORS.gray} />
              <Text style={styles.statText}>{listing.viewCount} visualizações</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray} />
              <Text style={styles.statText}>{formatDate(listing.createdAt)}</Text>
            </View>
          </View>

          {/* Category & Location */}
          <View style={styles.metaSection}>
            {categoryInfo && (
              <View style={styles.metaItem}>
                <Ionicons name={categoryInfo.icon as any} size={18} color={COLORS.primary} />
                <Text style={styles.metaLabel}>{categoryInfo.label}</Text>
              </View>
            )}
            {listing.city && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.metaLabel}>
                  {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
                  {listing.city}
                  {listing.state ? `, ${listing.state}` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {listing.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Seller Card */}
          {!isOwner && (
            <SellerCard user={listing.user} onChat={handleChat} onCall={handleCall} />
          )}

          {/* Owner Actions */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditListing', { listingId: listing.id })}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                <Text style={styles.editButtonText}>Editar anúncio</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Spacer for bottom bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {!isOwner && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.contactButton} onPress={handleChat}>
            <LinearGradient colors={COLORS.gradient} style={styles.contactGradient}>
              <Ionicons name="chatbubble-outline" size={22} color="#FFF" />
              <Text style={styles.contactButtonText}>Conversar com vendedor</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 12,
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Gallery
  gallery: {
    width,
    height: width,
    backgroundColor: COLORS.surface,
  },
  galleryImage: {
    width,
    height: width,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: COLORS.white,
  },

  // Header Actions
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // Content
  content: {
    padding: 16,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  negotiableBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  negotiableText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 28,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.gray,
  },

  // Meta Section
  metaSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: COLORS.text,
  },

  // Description
  descriptionSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
  },

  // Tags
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.secondary,
  },

  // Seller Card
  sellerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sellerHandle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  sellerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  chatButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  callButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
  },

  // Owner Actions
  ownerActions: {
    marginTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
  },
  editButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  contactButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  contactButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
