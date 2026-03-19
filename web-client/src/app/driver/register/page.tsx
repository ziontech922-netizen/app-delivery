'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  Mail,
  Lock,
  User,
  Phone,
  CreditCard,
  Car,
  Bike,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui';

type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'CAR';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cpf: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  acceptTerms: boolean;
}

export default function DriverRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    vehicleType: 'MOTORCYCLE',
    vehiclePlate: '',
    acceptTerms: false,
  });

  const updateForm = (field: keyof RegisterForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!form.name || form.name.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return false;
    }
    if (!form.email || !form.email.includes('@')) {
      setError('Email inválido');
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError('Telefone deve ter 10 ou 11 dígitos');
      return false;
    }
    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (!cpfDigits || cpfDigits.length !== 11) {
      setError('CPF deve ter 11 dígitos');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!form.vehicleType) {
      setError('Selecione um tipo de veículo');
      return false;
    }
    if (form.vehicleType !== 'BICYCLE' && (!form.vehiclePlate || form.vehiclePlate.length < 7)) {
      setError('Placa do veículo inválida');
      return false;
    }
    if (!form.acceptTerms) {
      setError('Você deve aceitar os termos de uso');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) return;

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://superapp-api-beta.fly.dev/api/v1';
      const response = await fetch(
        `${baseUrl}/drivers/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone.replace(/\D/g, ''),
            cpf: form.cpf.replace(/\D/g, ''),
            vehicleType: form.vehicleType,
            vehiclePlate: form.vehiclePlate || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/driver/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h1>
          <p className="text-gray-600 mb-6">
            Sua conta foi criada com sucesso. Você será redirecionado para o login.
          </p>
          <div className="animate-pulse text-green-600 font-medium">Redirecionando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Truck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Seja um Entregador</h1>
          <p className="text-gray-500 mt-1">Ganhe dinheiro fazendo entregas</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? 'bg-green-600 text-white'
                    : s < step
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 ${s < step ? 'bg-green-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Account Info */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => updateForm('confirmPassword', e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={nextStep}
                className="w-full bg-green-600 hover:bg-green-700 py-3"
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) => updateForm('cpf', formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-3"
                >
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Vehicle Info */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Veículo
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'MOTORCYCLE' as VehicleType, label: 'Moto', icon: Bike },
                    { type: 'BICYCLE' as VehicleType, label: 'Bicicleta', icon: Bike },
                    { type: 'CAR' as VehicleType, label: 'Carro', icon: Car },
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateForm('vehicleType', type)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        form.vehicleType === type
                          ? 'border-green-600 bg-green-50 text-green-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.vehicleType !== 'BICYCLE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa do Veículo
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.vehiclePlate}
                      onChange={(e) =>
                        updateForm('vehiclePlate', e.target.value.toUpperCase().slice(0, 7))
                      }
                      placeholder="ABC1D23"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={form.acceptTerms}
                  onChange={(e) => updateForm('acceptTerms', e.target.checked)}
                  className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Li e aceito os{' '}
                  <Link href="/terms" className="text-green-600 hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link href="/privacy" className="text-green-600 hover:underline">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-3"
                >
                  Cadastrar
                </Button>
              </div>
            </>
          )}
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-6">
          Já tem uma conta?{' '}
          <Link href="/driver/login" className="text-green-600 font-medium hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
