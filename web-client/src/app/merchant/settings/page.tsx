'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  MapPin,
  Clock,
  DollarSign,
  Camera,
  Save,
  Loader2,
  Phone,
  Mail,
  FileText,
  Package,
  AlertCircle,
  Check,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { merchantDashboardService, MerchantProfile } from '@/services/merchant.dashboard.service';
import { uploadService } from '@/services/upload.service';

// Dias da semana
const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface OpeningHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

export default function MerchantSettingsPage() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'delivery' | 'hours'>('profile');
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    businessName: '',
    tradeName: '',
    description: '',
    phone: '',
    email: '',
    // Address
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    // Delivery
    deliveryFee: 0,
    minOrderValue: 0,
    estimatedDeliveryTime: 30,
  });

  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['merchant', 'profile'],
    queryFn: merchantDashboardService.getProfile,
    onSuccess: (data: MerchantProfile) => {
      setFormData({
        businessName: data.businessName || '',
        tradeName: data.tradeName || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        street: data.address?.street || '',
        number: data.address?.number || '',
        complement: data.address?.complement || '',
        neighborhood: data.address?.neighborhood || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        zipCode: data.address?.zipCode || '',
        deliveryFee: data.deliveryFee || 0,
        minOrderValue: data.minOrderValue || 0,
        estimatedDeliveryTime: data.estimatedDeliveryTime || 30,
      });
      setOpeningHours(data.openingHours || []);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<MerchantProfile>) => merchantDashboardService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'profile'] });
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao salvar');
      setTimeout(() => setError(null), 5000);
    },
  });

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = uploadService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido');
      return;
    }

    setLogoUploading(true);
    setError(null);

    try {
      const logoUrl = await uploadService.upload(file, 'merchant-logo');
      await updateMutation.mutateAsync({ logoUrl });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Handle banner upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = uploadService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido');
      return;
    }

    setBannerUploading(true);
    setError(null);

    try {
      const bannerUrl = await uploadService.upload(file, 'merchant-banner');
      await updateMutation.mutateAsync({ bannerUrl });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Save profile info
  const handleSaveProfile = () => {
    updateMutation.mutate({
      businessName: formData.businessName,
      tradeName: formData.tradeName,
      description: formData.description,
      phone: formData.phone,
    });
  };

  // Save address
  const handleSaveAddress = () => {
    updateMutation.mutate({
      address: {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
    } as any);
  };

  // Save delivery settings
  const handleSaveDelivery = () => {
    updateMutation.mutate({
      deliveryFee: Number(formData.deliveryFee),
      minOrderValue: Number(formData.minOrderValue),
      estimatedDeliveryTime: Number(formData.estimatedDeliveryTime),
    });
  };

  // Opening hours handlers
  const addOpeningHour = () => {
    setOpeningHours((prev) => [
      ...prev,
      { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00' },
    ]);
  };

  const removeOpeningHour = (index: number) => {
    setOpeningHours((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOpeningHour = (index: number, field: keyof OpeningHour, value: any) => {
    setOpeningHours((prev) =>
      prev.map((hour, i) =>
        i === index ? { ...hour, [field]: field === 'dayOfWeek' ? Number(value) : value } : hour
      )
    );
  };

  const handleSaveHours = () => {
    updateMutation.mutate({ openingHours } as any);
  };

  // CEP lookup
  const handleCepLookup = async () => {
    const cep = formData.zipCode.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (e) {
      // Silently fail
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Informações', icon: Store },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'delivery', label: 'Entrega', icon: Package },
    { id: 'hours', label: 'Horários', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie as informações do seu estabelecimento</p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Banner and Logo Section */}
      <Card className="overflow-hidden">
        {/* Banner */}
        <div className="relative h-48 bg-gray-100">
          {profile?.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Banner upload button */}
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium transition-colors"
          >
            {bannerUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Alterar Banner
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerUpload}
            aria-label="Upload de banner"
          />

          {/* Logo */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white">
                {profile?.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Store className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 rounded-full text-white shadow-lg transition-colors"
                aria-label="Alterar logo"
              >
                {logoUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                aria-label="Upload de logo"
              />
            </div>
          </div>
        </div>

        <div className="pt-16 px-6 pb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {profile?.tradeName || profile?.businessName}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {profile?.status === 'ACTIVE' ? (
              <span className="text-green-600">● Ativo</span>
            ) : (
              <span className="text-yellow-600">● {profile?.status}</span>
            )}
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Estabelecimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Fantasia *
              </label>
              <Input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Nome do seu estabelecimento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Comercial
              </label>
              <Input
                name="tradeName"
                value={formData.tradeName}
                onChange={handleChange}
                placeholder="Nome comercial (opcional)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Descreva seu estabelecimento..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefone
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <Input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'address' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço do Estabelecimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <div className="flex gap-2">
                <Input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  onBlur={handleCepLookup}
                  placeholder="00000-000"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
              <Input
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Nome da rua"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <Input
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <Input
                name="complement"
                value={formData.complement}
                onChange={handleChange}
                placeholder="Sala 1, Loja A..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <Input
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="Bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Cidade"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Selecione...</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveAddress}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'delivery' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Entrega</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Taxa de Entrega (R$)
              </label>
              <Input
                name="deliveryFee"
                type="number"
                step="0.01"
                min="0"
                value={formData.deliveryFee}
                onChange={handleChange}
                placeholder="5.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Pedido Mínimo (R$)
              </label>
              <Input
                name="minOrderValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.minOrderValue}
                onChange={handleChange}
                placeholder="20.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Tempo Estimado (min)
              </label>
              <Input
                name="estimatedDeliveryTime"
                type="number"
                min="1"
                value={formData.estimatedDeliveryTime}
                onChange={handleChange}
                placeholder="30"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Essas configurações afetam diretamente a experiência do cliente. 
              O tempo estimado será exibido no cardápio.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveDelivery}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'hours' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Horário de Funcionamento</h3>
            <Button variant="outline" size="sm" onClick={addOpeningHour}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {openingHours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum horário configurado</p>
              <p className="text-sm">Adicione os horários de funcionamento do seu estabelecimento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openingHours.map((hour, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <select
                    value={hour.dayOfWeek}
                    onChange={(e) => updateOpeningHour(index, 'dayOfWeek', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    aria-label="Dia da semana"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hour.openTime}
                      onChange={(e) => updateOpeningHour(index, 'openTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      aria-label="Horário de abertura"
                    />
                    <span className="text-gray-500">às</span>
                    <input
                      type="time"
                      value={hour.closeTime}
                      onChange={(e) => updateOpeningHour(index, 'closeTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      aria-label="Horário de fechamento"
                    />
                  </div>
                  <button
                    onClick={() => removeOpeningHour(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remover horário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              O horário de funcionamento ainda está em implementação no backend. 
              As alterações serão salvas localmente.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveHours}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
