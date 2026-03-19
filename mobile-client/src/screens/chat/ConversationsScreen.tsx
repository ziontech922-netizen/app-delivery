import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { chatService, Conversation } from '../../services/chatService';
import { useAuthStore } from '../../stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = {
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  secondary: '#2D3436',
  background: '#FAFBFC',
  white: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#F0F2F5',
  text: '#1A1D1E',
  textSecondary: '#636E72',
  success: '#00B894',
  error: '#FF6B6B',
  online: '#00D26A',
  gradient: ['#FF6B35', '#FF8F5C'] as readonly [string, string],
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ConversationsScreenProps {
  navigation: any;
}

export default function ConversationsScreen({ navigation }: ConversationsScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();

  const fetchConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Setup realtime listener
    chatService.onNewMessage((message) => {
      fetchConversations();
    });

    return () => {
      chatService.disconnect();
    };
  }, [fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants?.find((p) => p.id !== user?.id);
    return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participants?.find((p) => p.id !== user?.id);
  };

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => {
    const otherUser = getOtherUser(item);
    const lastMessage = item.lastMessage;
    const isUnread = item.unreadCount > 0;

    return (
      <AnimatedTouchable
        entering={FadeInDown.delay(index * 50).springify()}
        style={[styles.conversationItem, isUnread && styles.conversationUnread]}
        onPress={() => navigation.navigate('ChatRoom', { conversationId: item.id, otherUser })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {otherUser?.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={COLORS.gradient} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          )}
          {otherUser?.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, isUnread && styles.userNameUnread]} numberOfLines={1}>
              {otherUser?.name || 'Usuário'}
            </Text>
            <Text style={[styles.timeText, isUnread && styles.timeTextUnread]}>
              {lastMessage?.createdAt ? formatTime(lastMessage.createdAt) : ''}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            {lastMessage?.type === 'audio' ? (
              <View style={styles.audioPreview}>
                <Ionicons name="mic" size={14} color={COLORS.textSecondary} />
                <Text style={styles.audioText}>Mensagem de áudio</Text>
              </View>
            ) : lastMessage?.type === 'image' ? (
              <View style={styles.audioPreview}>
                <Ionicons name="image" size={14} color={COLORS.textSecondary} />
                <Text style={styles.audioText}>Imagem</Text>
              </View>
            ) : (
              <Text
                style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                numberOfLines={1}
              >
                {lastMessage?.content || 'Iniciar conversa'}
              </Text>
            )}

            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </AnimatedTouchable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Animated.View entering={FadeInDown.springify()}>
        <LinearGradient colors={['#F0F2F5', '#E8EAED']} style={styles.emptyIconContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={COLORS.gray} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
        <Text style={styles.emptySubtitle}>
          Encontre anúncios e inicie uma conversa com vendedores
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Explore')}
        >
          <LinearGradient
            colors={COLORS.gradient}
            style={styles.exploreButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.exploreButtonText}>Explorar Anúncios</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Mensagens</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="create-outline" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Animated.View entering={FadeInRight.delay(100).springify()} style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversas..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
  },
  listContent: {
    paddingTop: 8,
  },
  listContentEmpty: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  conversationUnread: {
    backgroundColor: '#FFF8F5',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  userNameUnread: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  timeTextUnread: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: COLORS.text,
    fontWeight: '500',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  exploreButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
