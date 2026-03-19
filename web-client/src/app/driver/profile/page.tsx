'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  Car,
  Star,
  Bike,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Bell,
  Shield,
} from 'lucide-react';
import { driverService, Driver } from '@/services/driver.service';
import { Button } from '@/components/ui';

export default function DriverProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch driver profile
  const { data: profile, isLoading } = useQuery<Driver>({
    queryKey: ['driver', 'profile'],
    queryFn: driverService.getProfile,
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        vehicleType: profile.vehicleType,
        vehiclePlate: profile.vehiclePlate,
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Driver>) => driverService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
      setIsEditing(false);
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const getVehicleIcon = (type?: string) => {
    switch (type) {
      case 'MOTORCYCLE':
        return <Bike className="h-6 w-6" />;
      case 'CAR':
        return <Car className="h-6 w-6" />;
      case 'BICYCLE':
        return <Bike className="h-6 w-6" />;
      default:
        return <Bike className="h-6 w-6" />;
    }
  };

  const getVehicleLabel = (type?: string) => {
    switch (type) {
      case 'MOTORCYCLE':
        return 'Moto';
      case 'CAR':
        return 'Carro';
      case 'BICYCLE':
        return 'Bicicleta';
      default:
        return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-500 mt-1">Gerencie suas informações</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-green-600" />
                )}
              </div>
              {isEditing && (
                <button 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white hover:bg-green-800"
                  aria-label="Alterar foto de perfil"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{profile?.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  <span>{profile?.rating?.toFixed(1) || '5.0'}</span>
                </div>
                <span>•</span>
                <span>{profile?.totalDeliveries || 0} entregas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    id="name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{profile?.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{profile?.email}</span>
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                {isEditing ? (
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{profile?.phone || '-'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span>{profile?.cpf || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Veículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Veículo
                </label>
                {isEditing ? (
                  <select
                    id="vehicleType"
                    value={formData.vehicleType || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicleType: e.target.value as 'MOTORCYCLE' | 'BICYCLE' | 'CAR',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="MOTORCYCLE">Moto</option>
                    <option value="BICYCLE">Bicicleta</option>
                    <option value="CAR">Carro</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    {getVehicleIcon(profile?.vehicleType)}
                    <span>{getVehicleLabel(profile?.vehicleType)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.vehiclePlate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })
                    }
                    placeholder="ABC-1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span>{profile?.vehiclePlate || '-'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Conta</h3>
            <div className="flex flex-wrap gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  profile?.isVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {profile?.isVerified ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {profile?.isVerified ? 'Conta Verificada' : 'Verificação Pendente'}
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Membro desde{' '}
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <Bike className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profile?.totalDeliveries || 0}</p>
            <p className="text-sm text-gray-500">Entregas</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {profile?.rating?.toFixed(1) || '5.0'}
            </p>
            <p className="text-sm text-gray-500">Avaliação</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">98%</p>
            <p className="text-sm text-gray-500">Taxa de Conclusão</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">85%</p>
            <p className="text-sm text-gray-500">Taxa de Aceitação</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Zona de Perigo</h3>
        <p className="text-gray-500 text-sm mb-4">
          Ações irreversíveis relacionadas à sua conta
        </p>
        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
          Desativar Conta
        </Button>
      </div>
    </div>
  );
}
