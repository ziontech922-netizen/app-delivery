import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { useDeliveryStore } from '../stores/deliveryStore';
import { deliveryService } from '../services/deliveryService';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DeliveryConfirmation'>;

export default function DeliveryConfirmationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { orderId, type } = route.params;

  const { currentDelivery, updateDeliveryStatus, clearDelivery, startNavigation } = useDeliveryStore();

  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isPickup = type === 'pickup';

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);

    try {
      if (isPickup) {
        await deliveryService.confirmPickup(orderId);
        updateDeliveryStatus('PICKED_UP');
        startNavigation('customer');
        
        Alert.alert('Retirada confirmada!', 'Agora siga para o endereço do cliente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await deliveryService.confirmDelivery(orderId, { photo: photo || undefined });
        clearDelivery();
        
        Alert.alert('Entrega concluída!', 'Parabéns pela entrega!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível confirmar'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isPickup ? 'Confirmar Retirada' : 'Confirmar Entrega'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, isPickup ? styles.iconBlue : styles.iconGreen]}>
          <Ionicons
            name={isPickup ? 'restaurant' : 'checkmark-circle'}
            size={48}
            color="#ffffff"
          />
        </View>

        {/* Info */}
        <Text style={styles.title}>
          {isPickup ? 'Você chegou no restaurante?' : 'Entrega realizada?'}
        </Text>
        <Text style={styles.subtitle}>
          {isPickup
            ? 'Confirme que você retirou o pedido'
            : 'Confirme que o pedido foi entregue ao cliente'}
        </Text>

        {/* Photo (delivery only) */}
        {!isPickup && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Foto da entrega (opcional)</Text>
            
            {photo ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhoto(null)}
                >
                  <Ionicons name="close-circle" size={28} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={32} color="#6b7280" />
                <Text style={styles.addPhotoText}>Tirar foto</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Observações (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ex: Deixei com o porteiro"
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Confirm button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#ffffff" />
              <Text style={styles.confirmButtonText}>
                {isPickup ? 'Confirmar retirada' : 'Confirmar entrega'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBlue: {
    backgroundColor: '#3b82f6',
  },
  iconGreen: {
    backgroundColor: '#16a34a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  photoSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  addPhotoButton: {
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  notesSection: {
    width: '100%',
  },
  notesInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
