import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { chatService, Message } from '../../services/chatService';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatStackParamList } from '../../navigation/types';

const COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FFF0EB',
  secondary: '#2D3436',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#E8EAED',
  text: '#1A1D1E',
  textSecondary: '#636E72',
  messageSent: '#FF6B35',
  messageReceived: '#FFFFFF',
  gradient: ['#FF6B35', '#FF8F5C'] as readonly [string, string],
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ChatRoomScreenProps = NativeStackScreenProps<ChatStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen({ route, navigation }: ChatRoomScreenProps) {
  const { conversationId: rawConversationId, recipientId, recipientName, otherUser, listingId } = route.params;
  const [conversationId, setConversationId] = useState(rawConversationId ?? '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [initializingConversation, setInitializingConversation] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();

  const inputScale = useSharedValue(1);
  const micScale = useSharedValue(1);

  // Initialize conversation when we have recipientId but no conversationId
  const initializeConversation = useCallback(async () => {
    if (conversationId || !recipientId) return;
    
    setInitializingConversation(true);
    try {
      const conversation = await chatService.findOrCreateConversation(recipientId, listingId);
      setConversationId(conversation.id);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      setLoading(false);
    } finally {
      setInitializingConversation(false);
    }
  }, [conversationId, recipientId, listingId]);

  useEffect(() => {
    initializeConversation();
  }, [initializeConversation]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data.reverse());
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    
    fetchMessages();

    // Setup realtime listener
    chatService.joinConversation(conversationId);
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
        chatService.markAsRead(conversationId);
      }
    };
    chatService.onNewMessage(handleNewMessage);

    return () => {
      chatService.leaveConversation(conversationId);
      chatService.offNewMessage(handleNewMessage);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const message = await chatService.sendMessage(conversationId, {
        type: 'text',
        content: text,
      });
      setMessages((prev) => [...prev, message]);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSending(true);
      try {
        const message = await chatService.sendMessage(conversationId, {
          type: 'image',
          mediaUrl: result.assets[0].uri,
        });
        setMessages((prev) => [...prev, message]);
      } catch (error) {
        console.error('Erro ao enviar imagem:', error);
      } finally {
        setSending(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      micScale.value = withSpring(1.2);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    setIsRecording(false);
    micScale.value = withSpring(1);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri && recordingDuration >= 1) {
        setSending(true);
        const message = await chatService.sendMessage(conversationId, {
          type: 'audio',
          mediaUrl: uri,
          audioDuration: recordingDuration,
        });
        setMessages((prev) => [...prev, message]);
      }
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
    } finally {
      recordingRef.current = null;
      setRecordingDuration(0);
      setSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (date: string) => {
    try {
      return format(new Date(date), 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  };

  const isMyMessage = (message: Message) => message.senderId === user?.id;

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = isMyMessage(item);
    const showAvatar = !isMine && (index === 0 || messages[index - 1]?.senderId !== item.senderId);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}
      >
        {!isMine && showAvatar && (
          <View style={styles.messageAvatarContainer}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.messageAvatar} />
            ) : (
              <LinearGradient colors={COLORS.gradient} style={styles.messageAvatarPlaceholder}>
                <Text style={styles.messageAvatarText}>
                  {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
          </View>
        )}

        {!isMine && !showAvatar && <View style={styles.messageAvatarSpacer} />}

        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.theirBubble,
            item.type === 'image' && styles.imageBubble,
          ]}
        >
          {item.type === 'text' && (
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
              {item.content}
            </Text>
          )}

          {item.type === 'image' && item.mediaUrl && (
            <Image source={{ uri: item.mediaUrl }} style={styles.messageImage} />
          )}

          {item.type === 'audio' && (
            <View style={styles.audioMessage}>
              <TouchableOpacity style={styles.playButton}>
                <Ionicons
                  name="play"
                  size={20}
                  color={isMine ? COLORS.white : COLORS.primary}
                />
              </TouchableOpacity>
              <View style={styles.audioWaveform}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      { height: 8 + Math.random() * 16 },
                      isMine && styles.waveformBarMine,
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.audioDuration, isMine && styles.audioDurationMine]}>
                {formatTime(item.audioDuration || 0)}
              </Text>
            </View>
          )}

          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {formatMessageTime(item.createdAt)}
            {isMine && (
              <Ionicons
                name={item.status === 'read' ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.status === 'read' ? '#4FC3F7' : 'rgba(255,255,255,0.6)'}
                style={styles.checkIcon}
              />
            )}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.userInfo} activeOpacity={0.7}>
          {otherUser?.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
          ) : (
            <LinearGradient colors={COLORS.gradient} style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.userTextInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser?.name || 'Usuário'}
            </Text>
            {otherUser?.userHandle && (
              <Text style={styles.userHandle}>@{otherUser.userHandle}</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {(loading || initializingConversation) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          {initializingConversation && (
            <Text style={styles.loadingText}>Iniciando conversa...</Text>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          inverted={false}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          {isRecording ? (
            <Animated.View entering={FadeIn} style={styles.recordingContainer}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Gravando...</Text>
                <Text style={styles.recordingTime}>{formatTime(recordingDuration)}</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelRecordingButton}
                onPress={() => {
                  setIsRecording(false);
                  recordingRef.current?.stopAndUnloadAsync();
                  recordingRef.current = null;
                  if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                  }
                }}
              >
                <Ionicons name="trash-outline" size={22} color={COLORS.gray} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendRecordingButton}
                onPress={stopRecording}
              >
                <LinearGradient
                  colors={COLORS.gradient}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color={COLORS.gray} />
              </TouchableOpacity>

              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Digite uma mensagem..."
                  placeholderTextColor={COLORS.gray}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />
              </View>

              {inputText.trim() ? (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={sendMessage}
                  disabled={sending}
                >
                  <LinearGradient
                    colors={COLORS.gradient}
                    style={styles.sendButtonGradient}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Ionicons name="send" size={20} color={COLORS.white} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <AnimatedTouchable
                  style={[styles.micButton, micAnimatedStyle]}
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                >
                  <LinearGradient
                    colors={COLORS.gradient}
                    style={styles.sendButtonGradient}
                  >
                    <Ionicons name="mic" size={22} color={COLORS.white} />
                  </LinearGradient>
                </AnimatedTouchable>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  userTextInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  userHandle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 1,
  },
  moreButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  messageAvatarSpacer: {
    width: 36,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: COLORS.messageSent,
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: COLORS.messageReceived,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  imageBubble: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.white,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 2,
  },
  waveformBarMine: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  audioDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  audioDurationMine: {
    color: 'rgba(255,255,255,0.8)',
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  checkIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  micButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
    marginRight: 10,
  },
  recordingText: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cancelRecordingButton: {
    padding: 10,
    marginRight: 8,
  },
  sendRecordingButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
});
