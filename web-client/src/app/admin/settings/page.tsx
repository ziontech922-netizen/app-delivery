'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  CreditCard,
  Bell,
  Globe,
  Shield,
  Smartphone,
  Mail,
  DollarSign,
  Percent,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Wallet,
  QrCode,
  Building,
  Truck,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface PlatformSettings {
  // Payment Methods
  payments: {
    pixEnabled: boolean;
    pixKey: string;
    pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
    creditCardEnabled: boolean;
    debitCardEnabled: boolean;
    cashEnabled: boolean;
    walletEnabled: boolean;
    stripeEnabled: boolean;
    stripePublicKey: string;
    stripeSecretKey: string;
    mercadoPagoEnabled: boolean;
    mercadoPagoPublicKey: string;
    mercadoPagoAccessToken: string;
  };
  // Platform Fees
  fees: {
    defaultPlatformFee: number;
    defaultDeliveryFee: number;
    minOrderValue: number;
    maxDeliveryRadius: number;
  };
  // Notifications
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    emailProvider: 'SENDGRID' | 'SES' | 'SMTP';
    smsProvider: 'TWILIO' | 'ZENVIA' | 'AWS_SNS';
  };
  // General
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
  };
  // Delivery
  delivery: {
    autoAssignDrivers: boolean;
    maxAssignmentAttempts: number;
    driverSearchRadius: number;
    estimatedPrepTimeMinutes: number;
    avgDeliverySpeedKmh: number;
  };
}

const defaultSettings: PlatformSettings = {
  payments: {
    pixEnabled: true,
    pixKey: '',
    pixKeyType: 'RANDOM',
    creditCardEnabled: true,
    debitCardEnabled: true,
    cashEnabled: true,
    walletEnabled: false,
    stripeEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    mercadoPagoEnabled: false,
    mercadoPagoPublicKey: '',
    mercadoPagoAccessToken: '',
  },
  fees: {
    defaultPlatformFee: 10,
    defaultDeliveryFee: 5,
    minOrderValue: 15,
    maxDeliveryRadius: 10,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    emailProvider: 'SENDGRID',
    smsProvider: 'TWILIO',
  },
  general: {
    platformName: 'SuperApp Delivery',
    supportEmail: 'suporte@superapp.com',
    supportPhone: '0800 123 4567',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: false,
    requirePhoneVerification: false,
  },
  delivery: {
    autoAssignDrivers: true,
    maxAssignmentAttempts: 5,
    driverSearchRadius: 5,
    estimatedPrepTimeMinutes: 20,
    avgDeliverySpeedKmh: 25,
  },
};

type TabKey = 'payments' | 'fees' | 'notifications' | 'general' | 'delivery';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('payments');
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch settings (mock for now)
  const { isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      // TODO: Implement API call
      return defaultSettings;
    },
    onSuccess: (data) => {
      setSettings(data);
    },
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PlatformSettings) => {
      // TODO: Implement API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const updateSettings = <K extends keyof PlatformSettings>(
    section: K,
    field: keyof PlatformSettings[K],
    value: PlatformSettings[K][keyof PlatformSettings[K]]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const tabs = [
    { key: 'payments' as TabKey, label: 'Pagamentos', icon: CreditCard },
    { key: 'fees' as TabKey, label: 'Taxas', icon: Percent },
    { key: 'delivery' as TabKey, label: 'Entrega', icon: Truck },
    { key: 'notifications' as TabKey, label: 'Notificações', icon: Bell },
    { key: 'general' as TabKey, label: 'Geral', icon: Settings },
  ];

  const Toggle = ({
    enabled,
    onChange,
    label,
  }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 mt-1">Gerencie as configurações da plataforma</p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Salvo com sucesso!</span>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            isLoading={saveMutation.isPending}
            className={hasChanges ? '' : 'opacity-50 cursor-not-allowed'}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-4 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <>
            {/* Payment Methods */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary-600" />
                Métodos de Pagamento
              </h3>
              <div className="space-y-1 divide-y divide-gray-100">
                <Toggle
                  enabled={settings.payments.pixEnabled}
                  onChange={(v) => updateSettings('payments', 'pixEnabled', v)}
                  label="PIX"
                />
                <Toggle
                  enabled={settings.payments.creditCardEnabled}
                  onChange={(v) => updateSettings('payments', 'creditCardEnabled', v)}
                  label="Cartão de Crédito"
                />
                <Toggle
                  enabled={settings.payments.debitCardEnabled}
                  onChange={(v) => updateSettings('payments', 'debitCardEnabled', v)}
                  label="Cartão de Débito"
                />
                <Toggle
                  enabled={settings.payments.cashEnabled}
                  onChange={(v) => updateSettings('payments', 'cashEnabled', v)}
                  label="Dinheiro na Entrega"
                />
                <Toggle
                  enabled={settings.payments.walletEnabled}
                  onChange={(v) => updateSettings('payments', 'walletEnabled', v)}
                  label="Carteira Digital"
                />
              </div>
            </Card>

            {/* PIX Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-green-600" />
                Configurações PIX
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Chave
                  </label>
                  <select
                    value={settings.payments.pixKeyType}
                    onChange={(e) =>
                      updateSettings('payments', 'pixKeyType', e.target.value as any)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="RANDOM">Chave Aleatória</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={settings.payments.pixKey}
                    onChange={(e) => updateSettings('payments', 'pixKey', e.target.value)}
                    placeholder="Sua chave PIX"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </Card>

            {/* Stripe */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Stripe
                </h3>
                <Toggle
                  enabled={settings.payments.stripeEnabled}
                  onChange={(v) => updateSettings('payments', 'stripeEnabled', v)}
                  label=""
                />
              </div>
              {settings.payments.stripeEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Public Key
                    </label>
                    <input
                      type="text"
                      value={settings.payments.stripePublicKey}
                      onChange={(e) =>
                        updateSettings('payments', 'stripePublicKey', e.target.value)
                      }
                      placeholder="pk_live_..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secret Key
                    </label>
                    <input
                      type="password"
                      value={settings.payments.stripeSecretKey}
                      onChange={(e) =>
                        updateSettings('payments', 'stripeSecretKey', e.target.value)
                      }
                      placeholder="sk_live_..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Mercado Pago */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Mercado Pago
                </h3>
                <Toggle
                  enabled={settings.payments.mercadoPagoEnabled}
                  onChange={(v) => updateSettings('payments', 'mercadoPagoEnabled', v)}
                  label=""
                />
              </div>
              {settings.payments.mercadoPagoEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Public Key
                    </label>
                    <input
                      type="text"
                      value={settings.payments.mercadoPagoPublicKey}
                      onChange={(e) =>
                        updateSettings('payments', 'mercadoPagoPublicKey', e.target.value)
                      }
                      placeholder="APP_USR-..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={settings.payments.mercadoPagoAccessToken}
                      onChange={(e) =>
                        updateSettings('payments', 'mercadoPagoAccessToken', e.target.value)
                      }
                      placeholder="APP_USR-..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary-600" />
                Taxas Padrão
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa da Plataforma (%)
                  </label>
                  <input
                    type="number"
                    value={settings.fees.defaultPlatformFee}
                    onChange={(e) =>
                      updateSettings('fees', 'defaultPlatformFee', Number(e.target.value))
                    }
                    min="0"
                    max="50"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comissão cobrada sobre cada pedido
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa de Entrega Padrão (R$)
                  </label>
                  <input
                    type="number"
                    value={settings.fees.defaultDeliveryFee}
                    onChange={(e) =>
                      updateSettings('fees', 'defaultDeliveryFee', Number(e.target.value))
                    }
                    min="0"
                    step="0.50"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Limites
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Mínimo do Pedido (R$)
                  </label>
                  <input
                    type="number"
                    value={settings.fees.minOrderValue}
                    onChange={(e) =>
                      updateSettings('fees', 'minOrderValue', Number(e.target.value))
                    }
                    min="0"
                    step="1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raio Máximo de Entrega (km)
                  </label>
                  <input
                    type="number"
                    value={settings.fees.maxDeliveryRadius}
                    onChange={(e) =>
                      updateSettings('fees', 'maxDeliveryRadius', Number(e.target.value))
                    }
                    min="1"
                    max="100"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary-600" />
                Atribuição de Entregadores
              </h3>
              <div className="space-y-4">
                <Toggle
                  enabled={settings.delivery.autoAssignDrivers}
                  onChange={(v) => updateSettings('delivery', 'autoAssignDrivers', v)}
                  label="Atribuição Automática"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tentativas Máximas de Atribuição
                  </label>
                  <input
                    type="number"
                    value={settings.delivery.maxAssignmentAttempts}
                    onChange={(e) =>
                      updateSettings('delivery', 'maxAssignmentAttempts', Number(e.target.value))
                    }
                    min="1"
                    max="20"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raio de Busca de Entregadores (km)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery.driverSearchRadius}
                    onChange={(e) =>
                      updateSettings('delivery', 'driverSearchRadius', Number(e.target.value))
                    }
                    min="1"
                    max="50"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Estimativas de Tempo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo Médio de Preparo (minutos)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery.estimatedPrepTimeMinutes}
                    onChange={(e) =>
                      updateSettings('delivery', 'estimatedPrepTimeMinutes', Number(e.target.value))
                    }
                    min="5"
                    max="120"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Velocidade Média de Entrega (km/h)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery.avgDeliverySpeedKmh}
                    onChange={(e) =>
                      updateSettings('delivery', 'avgDeliverySpeedKmh', Number(e.target.value))
                    }
                    min="5"
                    max="60"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usado para calcular ETA de entrega
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-600" />
                Canais de Notificação
              </h3>
              <div className="space-y-1 divide-y divide-gray-100">
                <Toggle
                  enabled={settings.notifications.emailEnabled}
                  onChange={(v) => updateSettings('notifications', 'emailEnabled', v)}
                  label="E-mail"
                />
                <Toggle
                  enabled={settings.notifications.smsEnabled}
                  onChange={(v) => updateSettings('notifications', 'smsEnabled', v)}
                  label="SMS"
                />
                <Toggle
                  enabled={settings.notifications.pushEnabled}
                  onChange={(v) => updateSettings('notifications', 'pushEnabled', v)}
                  label="Push Notifications"
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Provedores
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provedor de E-mail
                  </label>
                  <select
                    value={settings.notifications.emailProvider}
                    onChange={(e) =>
                      updateSettings('notifications', 'emailProvider', e.target.value as any)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="SENDGRID">SendGrid</option>
                    <option value="SES">Amazon SES</option>
                    <option value="SMTP">SMTP Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provedor de SMS
                  </label>
                  <select
                    value={settings.notifications.smsProvider}
                    onChange={(e) =>
                      updateSettings('notifications', 'smsProvider', e.target.value as any)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="TWILIO">Twilio</option>
                    <option value="ZENVIA">Zenvia</option>
                    <option value="AWS_SNS">Amazon SNS</option>
                  </select>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary-600" />
                Informações da Plataforma
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Plataforma
                  </label>
                  <input
                    type="text"
                    value={settings.general.platformName}
                    onChange={(e) => updateSettings('general', 'platformName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail de Suporte
                  </label>
                  <input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone de Suporte
                  </label>
                  <input
                    type="tel"
                    value={settings.general.supportPhone}
                    onChange={(e) => updateSettings('general', 'supportPhone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Segurança e Acesso
              </h3>
              <div className="space-y-1 divide-y divide-gray-100">
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-700">Modo Manutenção</span>
                      <p className="text-xs text-gray-500">
                        Bloqueia acesso de usuários à plataforma
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateSettings('general', 'maintenanceMode', !settings.general.maintenanceMode)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.general.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <Toggle
                  enabled={settings.general.allowNewRegistrations}
                  onChange={(v) => updateSettings('general', 'allowNewRegistrations', v)}
                  label="Permitir Novos Cadastros"
                />
                <Toggle
                  enabled={settings.general.requireEmailVerification}
                  onChange={(v) => updateSettings('general', 'requireEmailVerification', v)}
                  label="Exigir Verificação de E-mail"
                />
                <Toggle
                  enabled={settings.general.requirePhoneVerification}
                  onChange={(v) => updateSettings('general', 'requirePhoneVerification', v)}
                  label="Exigir Verificação de Telefone"
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
