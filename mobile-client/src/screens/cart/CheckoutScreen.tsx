import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { orderService, addressService } from '../../services/orderService';
import { paymentService, PaymentIntent } from '../../services/paymentService';
import { etaService } from '../../services/etaService';
import { platformFeeService, FeePreview } from '../../services/platformFeeService';
import { useCartStore } from '../../stores/cartStore';
import { CartStackParamList } from '../../navigation/types';
import { Address, Coupon } from '../../types';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<CartStackParamList, 'Checkout'>;

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2D3436',
  background: '#FFFFFF',
  gray: '#95A5A6',
  lightGray: '#F5F5F5',
  success: '#27AE60',
  error: '#E74C3C',
};

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Cartão de Crédito', icon: 'card-outline' },
  { id: 'debit_card', label: 'Cartão de Débito', icon: 'card-outline' },
  { id: 'pix', label: 'PIX', icon: 'qr-code-outline' },
  { id: 'cash', label: 'Dinheiro', icon: 'cash-outline' },
];

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const {
    cart,
    clearCart,
  } = useCartStore();
  
  const items = cart?.items || [];
  const restaurantId = cart?.restaurantId;
  const deliveryFee = cart?.deliveryFee || 0;
  const subtotal = cart?.subtotal || 0;
  const cartTotal = cart?.total || 0;

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [changeFor, setChangeFor] = useState('');
  const [notes, setNotes] = useState('');

  // Payment flow state
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixPaymentIntent, setPixPaymentIntent] = useState<PaymentIntent | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const pixPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch addresses
  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.getMyAddresses(),
  });

  // Fetch ETA when address is selected
  const { data: etaData } = useQuery({
    queryKey: ['eta', restaurantId, selectedAddress?.latitude, selectedAddress?.longitude],
    queryFn: () =>
      etaService.calculateEta(
        restaurantId!,
        selectedAddress!.latitude!,
        selectedAddress!.longitude!,
      ),
    enabled: !!restaurantId && !!selectedAddress?.latitude && !!selectedAddress?.longitude,
  });

  // Fetch platform fee preview
  const { data: feePreview } = useQuery({
    queryKey: ['feePreview', restaurantId, subtotal, deliveryFee, discount],
    queryFn: () =>
      platformFeeService.previewFees(restaurantId!, subtotal, deliveryFee, discount),
    enabled: !!restaurantId && subtotal > 0,
  });

  // Set default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

  // Validate coupon mutation
  const validateCouponMutation = useMutation({
    mutationFn: (code: string) =>
      orderService.validateCoupon(code, restaurantId!, subtotal),
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon);
      if (coupon.discountType === 'PERCENTAGE') {
        setDiscount(subtotal * (coupon.discountValue / 100));
      } else {
        setDiscount(Math.min(coupon.discountValue, subtotal));
      }
      Alert.alert('Cupom aplicado!', `Desconto de R$ ${discount.toFixed(2)}`);
    },
    onError: () => {
      Alert.alert('Erro', 'Cupom inválido ou expirado');
      setAppliedCoupon(null);
      setDiscount(0);
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: () =>
      orderService.create({
        restaurantId: restaurantId!,
        addressId: selectedAddress!.id,
        paymentMethod: paymentMethod.toUpperCase() as 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH',
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
        })),
        couponCode: appliedCoupon?.code,
        notes,
        changeFor: paymentMethod === 'cash' && changeFor ? parseFloat(changeFor) : undefined,
      }),
    onSuccess: async (order) => {
      const pmUpper = paymentMethod.toUpperCase();

      // CASH: pagamento confirmado no backend automaticamente
      if (pmUpper === 'CASH') {
        clearCart();
        Alert.alert('Pedido realizado!', 'Seu pedido foi enviado com sucesso.', [
          {
            text: 'Acompanhar',
            onPress: () => {
              navigation.getParent()?.getParent()?.navigate('OrderTracking', { orderId: order.id });
            },
          },
        ]);
        return;
      }

      // PIX: criar intent e mostrar QR code
      if (pmUpper === 'PIX') {
        setProcessingPayment(true);
        try {
          const intent = await paymentService.createIntent({
            orderId: order.id,
            method: 'PIX',
          });
          setPixPaymentIntent(intent);
          setShowPixModal(true);
          clearCart();

          // Iniciar polling do status
          pixPollRef.current = setInterval(async () => {
            try {
              const updated = await paymentService.getIntent(intent.id);
              if (updated.status === 'SUCCEEDED') {
                if (pixPollRef.current) clearInterval(pixPollRef.current);
                setShowPixModal(false);
                Alert.alert('Pagamento confirmado!', 'Seu pedido está sendo preparado.', [
                  {
                    text: 'Acompanhar',
                    onPress: () => {
                      navigation.getParent()?.getParent()?.navigate('OrderTracking', { orderId: order.id });
                    },
                  },
                ]);
              } else if (updated.status === 'FAILED' || updated.status === 'CANCELLED') {
                if (pixPollRef.current) clearInterval(pixPollRef.current);
                setShowPixModal(false);
                Alert.alert('Pagamento falhou', updated.failureMessage || 'Tente novamente.');
              }
            } catch {
              // Retry silenciosamente
            }
          }, 3000);
        } catch {
          Alert.alert('Erro', 'Não foi possível gerar o pagamento PIX');
        } finally {
          setProcessingPayment(false);
        }
        return;
      }

      // Cartão: redirecionar para acompanhamento (MVP - tokenização via SDK futuro)
      clearCart();
      Alert.alert('Pedido realizado!', 'Seu pedido foi enviado com sucesso.', [
        {
          text: 'Acompanhar',
          onPress: () => {
            navigation.getParent()?.getParent()?.navigate('OrderTracking', { orderId: order.id });
          },
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Erro', error.message || 'Não foi possível criar o pedido');
    },
  });

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pixPollRef.current) clearInterval(pixPollRef.current);
    };
  }, []);

  const handleCopyPixCode = async () => {
    if (pixPaymentIntent?.pixQrCode) {
      await Clipboard.setStringAsync(pixPaymentIntent.pixQrCode);
      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      validateCouponMutation.mutate(couponCode.trim().toUpperCase());
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
  };

  const handleCreateOrder = () => {
    if (!selectedAddress) {
      Alert.alert('Erro', 'Selecione um endereço de entrega');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Erro', 'Seu carrinho está vazio');
      return;
    }

    if (paymentMethod === 'cash' && changeFor) {
      const changeValue = parseFloat(changeFor);
      if (changeValue < cartTotal - discount + deliveryFee) {
        Alert.alert('Erro', 'O valor para troco deve ser maior que o total');
        return;
      }
    }

    createOrderMutation.mutate();
  };

  const finalTotal = cartTotal - discount;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Endereço de entrega</Text>
          </View>

          {loadingAddresses ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : addresses && addresses.length > 0 ? (
            <View>
              {selectedAddress && (
                <View style={styles.selectedAddress}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressLabel}>{selectedAddress.isDefault ? 'Endereço Principal' : 'Endereço'}</Text>
                    <Text style={styles.addressText}>
                      {selectedAddress.street}, {selectedAddress.number}
                    </Text>
                    <Text style={styles.addressText}>
                      {selectedAddress.neighborhood} - {selectedAddress.city}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      // TODO: Navigate to address selection
                    }}
                  >
                    <Text style={styles.changeLink}>Alterar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.addAddressButton}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addAddressText}>Adicionar endereço</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ETA Display */}
        {etaData && (
          <View style={styles.etaSection}>
            <View style={styles.etaHeader}>
              <Ionicons name="time-outline" size={24} color={COLORS.success} />
              <View style={styles.etaInfo}>
                <Text style={styles.etaLabel}>Tempo estimado de entrega</Text>
                <Text style={styles.etaValue}>{etaData.displayTime}</Text>
              </View>
            </View>
            <View style={styles.etaDetails}>
              <View style={styles.etaDetailItem}>
                <Ionicons name="restaurant-outline" size={16} color={COLORS.gray} />
                <Text style={styles.etaDetailText}>
                  Preparo: ~{etaData.breakdown.preparationTimeMinutes} min
                </Text>
              </View>
              <View style={styles.etaDetailItem}>
                <Ionicons name="bicycle-outline" size={16} color={COLORS.gray} />
                <Text style={styles.etaDetailText}>
                  Entrega: ~{etaData.breakdown.merchantToCustomerMinutes} min
                </Text>
              </View>
              <View style={styles.etaDetailItem}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.gray} />
                <Text style={styles.etaDetailText}>
                  Distância: {etaData.distances.merchantToCustomerKm.toFixed(1)} km
                </Text>
              </View>
            </View>
            {etaData.factors && etaData.factors.length > 0 && (
              <View style={styles.etaFactors}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.gray} />
                <Text style={styles.etaFactorsText}>
                  {etaData.factors.join(' • ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Forma de pagamento</Text>
          </View>

          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  paymentMethod === method.id && styles.paymentMethodSelected,
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={paymentMethod === method.id ? COLORS.primary : COLORS.gray}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === method.id && styles.paymentMethodTextSelected,
                  ]}
                >
                  {method.label}
                </Text>
                {paymentMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod === 'cash' && (
            <View style={styles.changeSection}>
              <Text style={styles.changeLabel}>Troco para:</Text>
              <TextInput
                style={styles.changeInput}
                placeholder="R$ 0,00"
                placeholderTextColor={COLORS.gray}
                value={changeFor}
                onChangeText={setChangeFor}
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ticket-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Cupom de desconto</Text>
          </View>

          {appliedCoupon ? (
            <View style={styles.appliedCoupon}>
              <View style={styles.couponInfo}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
                <Text style={styles.couponDiscount}>-R$ {discount.toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInput}>
              <TextInput
                style={styles.couponTextInput}
                placeholder="Digite o código do cupom"
                placeholderTextColor={COLORS.gray}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyCouponButton}
                onPress={handleApplyCoupon}
                disabled={validateCouponMutation.isPending}
              >
                {validateCouponMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.applyCouponText}>Aplicar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Observações</Text>
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Alguma observação para a entrega?"
            placeholderTextColor={COLORS.gray}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={200}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumo do pedido</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>R$ {subtotal.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Desconto</Text>
              <Text style={styles.discountValue}>-R$ {discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de entrega</Text>
            <Text style={styles.summaryValue}>
              {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}
            </Text>
          </View>

          {feePreview && feePreview.serviceFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxa de serviço</Text>
              <Text style={styles.summaryValue}>
                R$ {feePreview.serviceFee.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {feePreview ? feePreview.total.toFixed(2) : finalTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.orderButton,
            createOrderMutation.isPending && styles.orderButtonDisabled,
          ]}
          onPress={handleCreateOrder}
          disabled={createOrderMutation.isPending || processingPayment}
        >
          {createOrderMutation.isPending || processingPayment ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.orderButtonText}>Fazer pedido</Text>
              <Text style={styles.orderButtonTotal}>
                R$ {feePreview ? feePreview.total.toFixed(2) : finalTotal.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* PIX Payment Modal */}
      <Modal
        visible={showPixModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (pixPollRef.current) clearInterval(pixPollRef.current);
          setShowPixModal(false);
        }}
      >
        <SafeAreaView style={pixStyles.container}>
          <View style={pixStyles.header}>
            <Text style={pixStyles.title}>Pague com PIX</Text>
            <TouchableOpacity
              onPress={() => {
                if (pixPollRef.current) clearInterval(pixPollRef.current);
                setShowPixModal(false);
              }}
            >
              <Ionicons name="close" size={28} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={pixStyles.content}>
            {pixPaymentIntent?.pixQrCodeBase64 && (
              <View style={pixStyles.qrContainer}>
                <Image
                  source={{
                    uri: pixPaymentIntent.pixQrCodeBase64.startsWith('data:')
                      ? pixPaymentIntent.pixQrCodeBase64
                      : `data:image/png;base64,${pixPaymentIntent.pixQrCodeBase64}`,
                  }}
                  style={pixStyles.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <Text style={pixStyles.amount}>
              R$ {pixPaymentIntent?.amount.toFixed(2)}
            </Text>

            {pixPaymentIntent?.pixQrCode && (
              <View style={pixStyles.codeContainer}>
                <Text style={pixStyles.codeLabel}>PIX Copia e Cola</Text>
                <Text style={pixStyles.codeText} numberOfLines={3}>
                  {pixPaymentIntent.pixQrCode}
                </Text>
                <TouchableOpacity style={pixStyles.copyButton} onPress={handleCopyPixCode}>
                  <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
                  <Text style={pixStyles.copyText}>Copiar código PIX</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={pixStyles.statusContainer}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={pixStyles.statusText}>Aguardando pagamento...</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginLeft: 8,
  },
  selectedAddress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  changeLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  etaSection: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaInfo: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  etaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
  },
  etaDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
    gap: 8,
  },
  etaDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaDetailText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  etaFactors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  etaFactorsText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.secondary,
    marginLeft: 12,
  },
  paymentMethodTextSelected: {
    fontWeight: '600',
  },
  changeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  changeLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginRight: 12,
  },
  changeInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.secondary,
  },
  couponInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponTextInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.secondary,
    marginRight: 12,
  },
  applyCouponButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyCouponText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${COLORS.success}15`,
    padding: 12,
    borderRadius: 8,
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponCode: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
    marginLeft: 8,
    marginRight: 12,
  },
  couponDiscount: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.success,
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
  summary: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  discountLabel: {
    fontSize: 14,
    color: COLORS.success,
  },
  discountValue: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray,
    opacity: 0.3,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.background,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  orderButtonDisabled: {
    opacity: 0.7,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  orderButtonTotal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const pixStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 24,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  copyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 15,
    color: COLORS.gray,
  },
});
