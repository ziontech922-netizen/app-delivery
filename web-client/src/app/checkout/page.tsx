'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MapPin, CreditCard, Banknote, Plus, Check, ArrowLeft, Tag, X } from 'lucide-react';
import Link from 'next/link';
import { useCartStore, useAuthStore, useUIStore } from '@/store';
import { orderService, addressService } from '@/services/order.service';
import { couponService, ApplyCouponResponse } from '@/services/coupon.service';
import { formatCurrency } from '@/utils/format';
import { Button, Card, Input } from '@/components/ui';
import type { Address, PaymentMethod } from '@/types';

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'PIX', label: 'PIX', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'DEBIT_CARD', label: 'Cartão de Débito', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'CASH', label: 'Dinheiro', icon: <Banknote className="h-5 w-5" /> },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, merchant, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState('');
  const [changeFor, setChangeFor] = useState('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressService.list,
    enabled: isAuthenticated,
  });

  // Coupon validation mutation
  const validateCouponMutation = useMutation({
    mutationFn: couponService.validate,
    onSuccess: (result) => {
      if (result.valid) {
        setAppliedCoupon(result);
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(result.error || 'Cupom inválido');
      }
    },
    onError: () => {
      setAppliedCoupon(null);
      setCouponError('Erro ao validar cupom');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: orderService.create,
    onSuccess: (order) => {
      clearCart();
      router.push(`/orders/${order.id}`);
    },
  });

  const subtotal = getTotal();
  const deliveryFee = merchant?.deliveryFee || 0;
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim() || !merchant) return;
    
    validateCouponMutation.mutate({
      code: couponCode.trim(),
      merchantId: merchant.id,
      subtotal,
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleSubmit = () => {
    if (!selectedAddress) {
      alert('Selecione um endereço de entrega');
      return;
    }

    if (!merchant) {
      alert('Erro: restaurante não encontrado');
      return;
    }

    createOrderMutation.mutate({
      merchantId: merchant.id,
      addressId: selectedAddress,
      paymentMethod: selectedPayment,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: '',
      })),
      notes,
      couponCode: appliedCoupon?.code || undefined,
      ...(selectedPayment === 'CASH' && changeFor ? { changeFor: parseFloat(changeFor) } : {}),
    });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Seu carrinho está vazio
        </h1>
        <Link href="/" className="text-primary-600 hover:underline">
          Ver restaurantes
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Faça login para continuar
        </h1>
        <Link href="/login" className="text-primary-600 hover:underline">
          Entrar na conta
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card variant="bordered">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Endereço de Entrega
            </h2>

            {addresses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">Nenhum endereço cadastrado</p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar endereço
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddress === address.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === address.id}
                      onChange={() => setSelectedAddress(address.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {address.neighborhood} - {address.city}/{address.state}
                      </p>
                      <p className="text-sm text-gray-500">CEP: {address.zipCode}</p>
                    </div>
                    {selectedAddress === address.id && (
                      <Check className="h-5 w-5 text-primary-600" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </Card>

          {/* Payment Method */}
          <Card variant="bordered">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-600" />
              Forma de Pagamento
            </h2>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPayment === method.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === method.id}
                    onChange={() => setSelectedPayment(method.id)}
                  />
                  <span className="text-gray-600">{method.icon}</span>
                  <span className="font-medium text-gray-900">{method.label}</span>
                  {selectedPayment === method.id && (
                    <Check className="h-5 w-5 text-primary-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>

            {selectedPayment === 'CASH' && (
              <div className="mt-4">
                <Input
                  label="Troco para quanto?"
                  type="number"
                  placeholder="Ex: 50.00"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                />
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card variant="bordered">
            <h2 className="font-semibold text-gray-900 mb-4">Observações</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma observação para o restaurante? Ex: Sem cebola, ponto da carne..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />
          </Card>

          {/* Coupon */}
          <Card variant="bordered">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary-600" />
              Cupom de Desconto
            </h2>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                  {appliedCoupon.description && (
                    <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                  )}
                  <p className="text-sm text-green-700 font-medium">
                    Desconto: {formatCurrency(appliedCoupon.discount || 0)}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    placeholder="Digite o código do cupom"
                    className="flex-1"
                    error={couponError || undefined}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    variant="outline"
                    isLoading={validateCouponMutation.isPending}
                    disabled={!couponCode.trim()}
                  >
                    Aplicar
                  </Button>
                </div>
                {couponError && (
                  <p className="mt-2 text-sm text-red-600">{couponError}</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card variant="bordered" className="sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>

            {/* Merchant */}
            {merchant && (
              <div className="pb-4 border-b">
                <p className="font-medium text-gray-900">{merchant.name}</p>
              </div>
            )}

            {/* Items */}
            <div className="py-4 border-b space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.product?.name}
                  </span>
                  <span className="text-gray-900">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxa de entrega</span>
                <span className="text-gray-900">
                  {deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Desconto ({appliedCoupon?.code})</span>
                  <span className="text-green-600">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              isLoading={createOrderMutation.isPending}
              disabled={!selectedAddress}
            >
              Confirmar Pedido
            </Button>

            {createOrderMutation.isError && (
              <p className="mt-3 text-sm text-red-600 text-center">
                Erro ao criar pedido. Tente novamente.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
