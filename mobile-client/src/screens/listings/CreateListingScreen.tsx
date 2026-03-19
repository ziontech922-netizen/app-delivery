import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '../../services/listingService';
import { LISTING_CATEGORIES } from '../../types';
import type { ListingCategory, AiListingResponse, CreateListingInput } from '../../types';

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
  error: '#E74C3C',
  text: '#1A1A1A',
  textLight: '#6C757D',
  white: '#FFFFFF',
  gradient: ['#FF6B35', '#FF8B5C'] as readonly [string, string],
  recording: '#E74C3C',
};

// ===========================================
// STEP INDICATOR
// ===========================================
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, currentStep >= 1 && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>1</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      <View style={[styles.step, currentStep >= 2 && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
      <View style={[styles.step, currentStep >= 3 && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep >= 3 && styles.stepNumberActive]}>3</Text>
      </View>
    </View>
  );
}

// ===========================================
// RECORDING BUTTON
// ===========================================
function RecordingButton({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
}: {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.recordingContainer}>
      {isRecording && (
        <View style={styles.recordingInfo}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
        </View>
      )}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? onStopRecording : onStartRecording}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={32}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.recordingHint}>
        {isRecording ? 'Toque para finalizar' : 'Segure para gravar áudio'}
      </Text>
    </View>
  );
}

// ===========================================
// IMAGE PICKER
// ===========================================
function ImagePickerSection({
  images,
  onAddImage,
  onRemoveImage,
}: {
  images: string[];
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
}) {
  return (
    <View style={styles.imageSection}>
      <Text style={styles.sectionLabel}>Fotos (opcional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.imageList}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.imagePreview} contentFit="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => onRemoveImage(index)}
              >
                <Ionicons name="close" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={onAddImage}>
              <Ionicons name="camera-outline" size={28} color={COLORS.gray} />
              <Text style={styles.addImageText}>Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ===========================================
// AI PREVIEW CARD
// ===========================================
function AiPreviewCard({
  preview,
  onEdit,
  onConfirm,
  isLoading,
}: {
  preview: AiListingResponse;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { listing, aiExtraction } = preview;
  const categoryInfo = LISTING_CATEGORIES.find((c) => c.name === aiExtraction.category);

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <View style={styles.aiTag}>
          <Ionicons name="sparkles" size={14} color={COLORS.primary} />
          <Text style={styles.aiTagText}>Gerado por IA</Text>
        </View>
        <Text style={styles.confidenceText}>
          {Math.round(aiExtraction.confidence * 100)}% confiança
        </Text>
      </View>

      <Text style={styles.previewTitle}>{aiExtraction.title}</Text>

      {aiExtraction.description && (
        <Text style={styles.previewDescription} numberOfLines={2}>
          {aiExtraction.description}
        </Text>
      )}

      <View style={styles.previewMeta}>
        {aiExtraction.price && (
          <View style={styles.previewMetaItem}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
            <Text style={styles.previewMetaText}>
              R$ {aiExtraction.price.toLocaleString('pt-BR')}
            </Text>
          </View>
        )}
        {categoryInfo && (
          <View style={styles.previewMetaItem}>
            <Ionicons name={categoryInfo.icon as any} size={16} color={COLORS.primary} />
            <Text style={styles.previewMetaText}>{categoryInfo.label}</Text>
          </View>
        )}
      </View>

      {aiExtraction.tags && aiExtraction.tags.length > 0 && (
        <View style={styles.previewTags}>
          {aiExtraction.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.previewTag}>
              <Text style={styles.previewTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.previewActions}>
        <TouchableOpacity style={styles.editPreviewButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.editPreviewText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmPreviewButton}
          onPress={onConfirm}
          disabled={isLoading}
        >
          <LinearGradient colors={COLORS.gradient} style={styles.confirmGradient}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={22} color={COLORS.white} />
                <Text style={styles.confirmPreviewText}>Publicar</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===========================================
// MAIN SCREEN
// ===========================================
export default function CreateListingScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [aiPreview, setAiPreview] = useState<AiListingResponse | null>(null);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mutations
  const textToListingMutation = useMutation({
    mutationFn: (text: string) =>
      listingService.createFromText(text, images.length > 0 ? images : undefined),
    onSuccess: (data) => {
      setAiPreview(data);
      setCurrentStep(2);
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível processar sua mensagem. Tente novamente.');
    },
  });

  const audioToListingMutation = useMutation({
    mutationFn: (audioUrl: string) => listingService.createFromAudio(audioUrl, images),
    onSuccess: (data) => {
      setAiPreview(data);
      setCurrentStep(2);
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível processar o áudio. Tente novamente.');
    },
  });

  const createListingMutation = useMutation({
    mutationFn: (data: CreateListingInput) => listingService.createListing(data),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setCurrentStep(3);
      setTimeout(() => {
        navigation.navigate('ListingDetail', { listingId: listing.id });
      }, 2000);
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível publicar o anúncio. Tente novamente.');
    },
  });

  // Image picker
  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Recording
  const startRecording = useCallback(async () => {
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
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        setAudioUri(uri);
        // Auto-process audio
        audioToListingMutation.mutate(uri);
      }

      recordingRef.current = null;
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  }, []);

  // Submit text
  const handleSubmitText = () => {
    if (!inputText.trim()) {
      Alert.alert('Atenção', 'Digite o que você deseja anunciar');
      return;
    }
    textToListingMutation.mutate(inputText);
  };

  // Confirm listing
  const handleConfirmListing = () => {
    if (!aiPreview) return;

    const listingData: CreateListingInput = {
      title: aiPreview.aiExtraction.title,
      description: aiPreview.aiExtraction.description || undefined,
      price: aiPreview.aiExtraction.price || undefined,
      priceType: aiPreview.aiExtraction.priceType,
      category: aiPreview.aiExtraction.category,
      subcategory: aiPreview.aiExtraction.subcategory || undefined,
      tags: aiPreview.aiExtraction.tags,
      images: images,
      audioUrl: audioUri || undefined,
    };

    createListingMutation.mutate(listingData);
  };

  // Edit listing (go to full form)
  const handleEditListing = () => {
    if (!aiPreview) return;
    navigation.navigate('EditListingForm', {
      initialData: {
        ...aiPreview.aiExtraction,
        images,
        audioUrl: audioUri,
      },
    });
  };

  const isProcessing =
    textToListingMutation.isPending ||
    audioToListingMutation.isPending ||
    createListingMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Publicar</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && (
            <>
              {/* Main Input */}
              <View style={styles.inputSection}>
                <Text style={styles.mainLabel}>O que você quer anunciar?</Text>
                <Text style={styles.subLabel}>
                  Digite ou grave um áudio descrevendo seu anúncio
                </Text>

                <TextInput
                  style={styles.mainInput}
                  placeholder="Ex: Vendo iPhone 12 128GB por R$ 2.500"
                  placeholderTextColor={COLORS.gray}
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                  maxLength={500}
                />

                <Text style={styles.charCount}>{inputText.length}/500</Text>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Recording */}
              <RecordingButton
                isRecording={isRecording}
                recordingTime={recordingTime}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
              />

              {/* Images */}
              <ImagePickerSection
                images={images}
                onAddImage={handleAddImage}
                onRemoveImage={handleRemoveImage}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!inputText.trim() || isProcessing) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitText}
                disabled={!inputText.trim() || isProcessing}
              >
                <LinearGradient
                  colors={inputText.trim() ? COLORS.gradient : [COLORS.lightGray, COLORS.lightGray] as const}
                  style={styles.submitGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={22} color={COLORS.white} />
                      <Text style={styles.submitButtonText}>Gerar anúncio com IA</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {currentStep === 2 && aiPreview && (
            <>
              <Text style={styles.previewLabel}>Confira seu anúncio</Text>
              <AiPreviewCard
                preview={aiPreview}
                onEdit={handleEditListing}
                onConfirm={handleConfirmListing}
                isLoading={createListingMutation.isPending}
              />
            </>
          )}

          {currentStep === 3 && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Publicado!</Text>
              <Text style={styles.successSubtitle}>Seu anúncio está no ar</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },

  // Input Section
  inputSection: {
    marginBottom: 20,
  },
  mainLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  mainInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    fontSize: 14,
    color: COLORS.gray,
    marginHorizontal: 16,
  },

  // Recording
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.recording,
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: COLORS.recording,
  },
  recordingHint: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 12,
  },

  // Image Section
  imageSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  imageList: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.lightGray,
  },
  addImageText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },

  // Submit Button
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },

  // Preview
  previewLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewMetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  previewTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewTagText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editPreviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
  },
  editPreviewText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  confirmPreviewButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  confirmPreviewText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
});
