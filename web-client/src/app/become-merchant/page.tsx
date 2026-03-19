'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  Store,
  Building2,
  MapPin,
  Settings,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  DollarSign,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';
import { merchantService, CreateMerchantDto } from '@/services/merchant.service';
import { Button, Card, Input } from '@/components/ui';

// ===========================================
// TYPES
// ===========================================
interface FormData {
  // Step 1: Account (if not logged in)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Step 2: Business
  businessName: string;
  tradeName: string;
  document: string;
  description: string;
  // Step 3: Address
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  // Step 4: Settings
  minimumOrder: string;
  deliveryFee: string;
  estimatedTime: string;
}

interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

// ===========================================
// CONSTANTS
// ===========================================
const INITIAL_FORM_DATA: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  tradeName: '',
  document: '',
  description: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  minimumOrder: '0',
  deliveryFee: '5',
  estimatedTime: '30',
};

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// ===========================================
// HELPERS
// ===========================================
function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, '$1-$2');
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (parseInt(numbers[12]) !== digit) return false;

  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (parseInt(numbers[13]) !== digit) return false;

  return true;
}

// ===========================================
// STEP INDICATOR COMPONENT
// ===========================================
function StepIndicator({
  steps,
  currentStep,
  completedSteps,
}: {
  steps: StepConfig[];
  currentStep: number;
  completedSteps: number[];
}) {
  return (
    <div className="relative">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isCurrent && !isCompleted ? 'bg-primary-600 text-white ring-4 ring-primary-100' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-gray-100 text-gray-400' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={`text-sm font-medium ${isCurrent ? 'text-primary-600' : 'text-gray-500'}`}>
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* Progress line */}
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-0" style={{ marginLeft: '24px', marginRight: '24px' }}>
        <div
          className="h-full bg-primary-600 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ===========================================
// MAIN COMPONENT
// ===========================================
export default function MerchantRegisterPage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Determine steps based on auth status
  const steps: StepConfig[] = isAuthenticated
    ? [
        { id: 1, title: 'Estabelecimento', description: 'Dados do negócio', icon: Store },
        { id: 2, title: 'Endereço', description: 'Localização', icon: MapPin },
        { id: 3, title: 'Configurações', description: 'Opções', icon: Settings },
        { id: 4, title: 'Revisão', description: 'Confirmar', icon: CheckCircle },
      ]
    : [
        { id: 1, title: 'Conta', description: 'Seus dados', icon: User },
        { id: 2, title: 'Estabelecimento', description: 'Dados do negócio', icon: Store },
        { id: 3, title: 'Endereço', description: 'Localização', icon: MapPin },
        { id: 4, title: 'Configurações', description: 'Opções', icon: Settings },
        { id: 5, title: 'Revisão', description: 'Confirmar', icon: CheckCircle },
      ];

  const totalSteps = steps.length;

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Register mutation (for non-authenticated users)
  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; password: string }) => {
      return authService.register(data);
    },
    onError: (error: any) => {
      setGeneralError(error.response?.data?.message || 'Erro ao criar conta');
    },
  });

  // Create merchant mutation
  const createMerchantMutation = useMutation({
    mutationFn: async (data: CreateMerchantDto) => {
      return merchantService.create(data);
    },
    onSuccess: async () => {
      // Fetch updated user data (role changed to MERCHANT)
      try {
        const updatedUser = await authService.getMe();
        setUser(updatedUser);
      } catch (error) {
        console.error('Error fetching updated user:', error);
      }
      // Redirect to success/pending approval page
      router.push('/become-merchant/success');
    },
    onError: (error: any) => {
      setGeneralError(error.response?.data?.message || 'Erro ao cadastrar estabelecimento');
    },
  });

  // Fetch address from CEP
  const fetchAddressFromCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Handle input change
  const handleChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    // Apply masks
    if (field === 'document') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'zipCode') {
      formattedValue = formatCEP(value);
      // Auto-fetch address when CEP is complete
      if (formattedValue.replace(/\D/g, '').length === 8) {
        fetchAddressFromCep(formattedValue);
      }
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isAuthenticated && currentStep === 1) {
      // Validate account step
      if (!formData.firstName.trim()) newErrors.firstName = 'Nome é obrigatório';
      if (!formData.lastName.trim()) newErrors.lastName = 'Sobrenome é obrigatório';
      if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
      if (!formData.password) newErrors.password = 'Senha é obrigatória';
      else if (formData.password.length < 8) {
        newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Senha deve ter maiúscula, minúscula e número';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não conferem';
      }
    }

    const businessStep = isAuthenticated ? 1 : 2;
    const addressStep = isAuthenticated ? 2 : 3;
    const settingsStep = isAuthenticated ? 3 : 4;

    if (currentStep === businessStep) {
      // Validate business step
      if (!formData.businessName.trim()) newErrors.businessName = 'Nome fantasia é obrigatório';
      if (!formData.document.trim()) newErrors.document = 'CNPJ é obrigatório';
      else if (!validateCNPJ(formData.document)) {
        newErrors.document = 'CNPJ inválido';
      }
    }

    if (currentStep === addressStep) {
      // Validate address step
      if (!formData.zipCode.trim()) newErrors.zipCode = 'CEP é obrigatório';
      if (!formData.street.trim()) newErrors.street = 'Rua é obrigatória';
      if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
      if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state) newErrors.state = 'Estado é obrigatório';
    }

    if (currentStep === settingsStep) {
      // Settings are optional, but validate if provided
      const minOrder = parseFloat(formData.minimumOrder);
      const deliveryFee = parseFloat(formData.deliveryFee);
      const estimatedTime = parseInt(formData.estimatedTime);

      if (isNaN(minOrder) || minOrder < 0) {
        newErrors.minimumOrder = 'Valor inválido';
      }
      if (isNaN(deliveryFee) || deliveryFee < 0) {
        newErrors.deliveryFee = 'Valor inválido';
      }
      if (isNaN(estimatedTime) || estimatedTime < 1) {
        newErrors.estimatedTime = 'Tempo inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = async () => {
    if (!validateStep()) return;

    setGeneralError(null);

    // If user is not authenticated and completing account step, register first
    if (!isAuthenticated && currentStep === 1) {
      try {
        await registerMutation.mutateAsync({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          password: formData.password,
        });
        
        // Login after registration
        const loginResponse = await authService.login({
          email: formData.email,
          password: formData.password,
        });
        
        localStorage.setItem('accessToken', loginResponse.tokens.accessToken);
        localStorage.setItem('refreshToken', loginResponse.tokens.refreshToken);
        setUser(loginResponse.user);
      } catch (error: any) {
        setGeneralError(error.response?.data?.message || 'Erro ao criar conta');
        return;
      }
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    // Move to next step or submit
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setGeneralError(null);

    const merchantData: CreateMerchantDto = {
      businessName: formData.businessName.trim(),
      tradeName: formData.tradeName.trim() || undefined,
      document: formData.document.replace(/\D/g, ''),
      description: formData.description.trim() || undefined,
      street: formData.street.trim(),
      number: formData.number.trim(),
      complement: formData.complement.trim() || undefined,
      neighborhood: formData.neighborhood.trim(),
      city: formData.city.trim(),
      state: formData.state.toUpperCase(),
      zipCode: formData.zipCode.replace(/\D/g, ''),
      minimumOrder: parseFloat(formData.minimumOrder) || 0,
      deliveryFee: parseFloat(formData.deliveryFee) || 0,
      estimatedTime: parseInt(formData.estimatedTime) || 30,
    };

    createMerchantMutation.mutate(merchantData);
  };

  // Render step content
  const renderStepContent = () => {
    const businessStep = isAuthenticated ? 1 : 2;
    const addressStep = isAuthenticated ? 2 : 3;
    const settingsStep = isAuthenticated ? 3 : 4;
    const reviewStep = isAuthenticated ? 4 : 5;

    // Account step (only for non-authenticated users)
    if (!isAuthenticated && currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Crie sua conta</h2>
            <p className="text-gray-500 mt-1">Primeiro, precisamos dos seus dados pessoais</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Seu nome"
                error={errors.firstName}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sobrenome <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Seu sobrenome"
                error={errors.lastName}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
                className="pl-10"
                error={errors.email}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="pl-10"
                error={errors.phone}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="pl-10 pr-10"
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            <p className="text-gray-400 text-xs mt-1">
              Deve conter maiúscula, minúscula e número
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Repita a senha"
                className="pl-10"
                error={errors.confirmPassword}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      );
    }

    // Business step
    if (currentStep === businessStep) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Dados do Estabelecimento</h2>
            <p className="text-gray-500 mt-1">Informações sobre seu negócio</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Fantasia <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="Nome do seu estabelecimento"
                className="pl-10"
                error={errors.businessName}
              />
            </div>
            {errors.businessName && (
              <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Comercial <span className="text-gray-400">(opcional)</span>
            </label>
            <Input
              value={formData.tradeName}
              onChange={(e) => handleChange('tradeName', e.target.value)}
              placeholder="Nome para exibição"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={formData.document}
                onChange={(e) => handleChange('document', e.target.value)}
                placeholder="00.000.000/0000-00"
                className="pl-10"
                error={errors.document}
              />
            </div>
            {errors.document && <p className="text-red-500 text-sm mt-1">{errors.document}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Conte um pouco sobre seu estabelecimento..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      );
    }

    // Address step
    if (currentStep === addressStep) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Endereço do Estabelecimento</h2>
            <p className="text-gray-500 mt-1">Onde seu negócio está localizado</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                  error={errors.zipCode}
                />
                {isLoadingCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                )}
              </div>
              {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rua <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.street}
              onChange={(e) => handleChange('street', e.target.value)}
              placeholder="Nome da rua"
              error={errors.street}
            />
            {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="123"
                error={errors.number}
              />
              {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento <span className="text-gray-400">(opcional)</span>
              </label>
              <Input
                value={formData.complement}
                onChange={(e) => handleChange('complement', e.target.value)}
                placeholder="Sala, Loja, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                placeholder="Bairro"
                error={errors.neighborhood}
              />
              {errors.neighborhood && (
                <p className="text-red-500 text-sm mt-1">{errors.neighborhood}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cidade"
                error={errors.city}
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
          </div>
        </div>
      );
    }

    // Settings step
    if (currentStep === settingsStep) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Configurações</h2>
            <p className="text-gray-500 mt-1">Defina as opções do seu estabelecimento</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              💡 Você pode alterar estas configurações a qualquer momento no painel do parceiro.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pedido Mínimo (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimumOrder}
                onChange={(e) => handleChange('minimumOrder', e.target.value)}
                placeholder="0.00"
                className="pl-10"
                error={errors.minimumOrder}
              />
            </div>
            {errors.minimumOrder && (
              <p className="text-red-500 text-sm mt-1">{errors.minimumOrder}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Valor mínimo para aceitar pedidos (0 = sem mínimo)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taxa de Entrega (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => handleChange('deliveryFee', e.target.value)}
                placeholder="5.00"
                className="pl-10"
                error={errors.deliveryFee}
              />
            </div>
            {errors.deliveryFee && (
              <p className="text-red-500 text-sm mt-1">{errors.deliveryFee}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tempo Estimado de Entrega (minutos)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="number"
                min="1"
                value={formData.estimatedTime}
                onChange={(e) => handleChange('estimatedTime', e.target.value)}
                placeholder="30"
                className="pl-10"
                error={errors.estimatedTime}
              />
            </div>
            {errors.estimatedTime && (
              <p className="text-red-500 text-sm mt-1">{errors.estimatedTime}</p>
            )}
          </div>
        </div>
      );
    }

    // Review step
    if (currentStep === reviewStep) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Revisão Final</h2>
            <p className="text-gray-500 mt-1">Confirme os dados do seu estabelecimento</p>
          </div>

          <div className="space-y-6">
            {/* Business Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Store className="h-5 w-5 text-primary-600" />
                Estabelecimento
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Nome Fantasia:</span>
                  <p className="font-medium">{formData.businessName}</p>
                </div>
                {formData.tradeName && (
                  <div>
                    <span className="text-gray-500">Nome Comercial:</span>
                    <p className="font-medium">{formData.tradeName}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">CNPJ:</span>
                  <p className="font-medium">{formData.document}</p>
                </div>
              </div>
              {formData.description && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Descrição:</span>
                  <p className="font-medium">{formData.description}</p>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Endereço
              </h3>
              <p className="text-sm">
                {formData.street}, {formData.number}
                {formData.complement && ` - ${formData.complement}`}
                <br />
                {formData.neighborhood} - {formData.city}/{formData.state}
                <br />
                CEP: {formData.zipCode}
              </p>
            </div>

            {/* Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary-600" />
                Configurações
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Pedido Mínimo:</span>
                  <p className="font-medium">R$ {parseFloat(formData.minimumOrder).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Taxa de Entrega:</span>
                  <p className="font-medium">R$ {parseFloat(formData.deliveryFee).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tempo Estimado:</span>
                  <p className="font-medium">{formData.estimatedTime} min</p>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ Ao cadastrar seu estabelecimento, ele ficará em <strong>análise</strong> até que 
                nossa equipe valide seus dados. Você receberá uma notificação quando for aprovado.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const isLoading = registerMutation.isPending || createMerchantMutation.isPending;
  const reviewStep = isAuthenticated ? 4 : 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Store className="h-8 w-8 text-primary-600" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Seja um Parceiro</h1>
          <p className="text-primary-100 mt-2">Cadastre seu estabelecimento na plataforma</p>
        </div>

        {/* Step Indicator */}
        <Card className="p-6 mb-6">
          <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} />
        </Card>

        {/* Form */}
        <Card className="p-6 sm:p-8">
          {generalError && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Cadastrar Estabelecimento
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Login Link */}
        <p className="text-center text-primary-100 mt-6 text-sm">
          Já possui cadastro?{' '}
          <Link href="/merchant/login" className="text-white font-medium hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
