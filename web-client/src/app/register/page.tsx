'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Mail, 
  User, 
  Lock,
  Loader2,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';

import { SocialButtonsGroup, AuthDivider } from '@/components/ui/SocialButtons';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { OTPInput } from '@/components/ui/OTPInput';
import { PasswordStrength, isPasswordStrong } from '@/components/ui/PasswordStrength';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store';
import { 
  signInWithGoogle, 
  signInWithFacebook, 
  signInWithApple,
  isOAuthConfigured 
} from '@/lib/oauth';

// Registration steps
const STEPS = [
  { id: 1, title: 'Identificação' },
  { id: 2, title: 'Verificação' },
  { id: 3, title: 'Criar Conta' },
];

// Animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  
  // Form data
  const [phone, setPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading states
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<'google' | 'apple' | 'facebook' | null>(null);
  
  // Error states
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [formError, setFormError] = useState('');
  
  // Success states
  const [otpSent, setOtpSent] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  // Navigation between steps
  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!isPhoneValid) {
      setPhoneError('Digite um número de telefone válido');
      return;
    }

    setPhoneError('');
    setIsSendingOTP(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      await authService.sendOTP({ phone: cleanPhone, type: 'sms' });
      setOtpSent(true);
      goToStep(2);
    } catch (error: any) {
      setPhoneError(error?.response?.data?.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (code: string) => {
    setIsVerifyingOTP(true);
    setOtpError('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const result = await authService.verifyOTP({ phone: cleanPhone, code });
      
      if (result.verified && result.token) {
        setPhoneVerificationToken(result.token);
        goToStep(3);
      } else {
        setOtpError('Código inválido. Verifique e tente novamente.');
        setOtpCode('');
      }
    } catch (error: any) {
      setOtpError(error?.response?.data?.message || 'Erro ao verificar código.');
      setOtpCode('');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtpError('');
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      await authService.sendOTP({ phone: cleanPhone, type: 'sms' });
    } catch (error: any) {
      setOtpError('Erro ao reenviar código.');
    }
  };

  // Step 3: Complete registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setFormError('Digite seu nome completo');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Digite um email válido');
      return;
    }
    if (!isPasswordStrong(password)) {
      setFormError('A senha não atende aos requisitos mínimos');
      return;
    }

    setFormError('');
    setIsRegistering(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        password,
      });

      setUser(response.user);
      setRegistrationSuccess(true);
      
      // Redirect after showing success
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message || 
        'Erro ao criar conta. Tente novamente.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  // Social auth handlers
  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    setSocialLoadingProvider(provider);
    setFormError('');
    
    try {
      // Check if provider is configured
      if (!isOAuthConfigured(provider)) {
        setFormError(`Login com ${provider} ainda não está configurado.`);
        return;
      }

      let idToken: string;
      let userData: { firstName?: string; lastName?: string } | undefined;

      // Get token from OAuth provider
      switch (provider) {
        case 'google':
          const googleResult = await signInWithGoogle();
          idToken = googleResult.idToken;
          break;
        case 'facebook':
          const fbResult = await signInWithFacebook();
          idToken = fbResult.accessToken;
          break;
        case 'apple':
          const appleResult = await signInWithApple();
          idToken = appleResult.idToken;
          userData = appleResult.userData;
          break;
        default:
          throw new Error('Provider não suportado');
      }

      // Send to backend for verification and registration/login
      const response = await authService.socialAuth({ provider, idToken, userData });
      
      // Set user in store
      setUser(response.user);
      
      // Show success and redirect
      setRegistrationSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      console.error('Social auth error:', err);
      if (err.message?.includes('cancelado')) {
        return;
      }
      setFormError(err.response?.data?.message || err.message || `Erro ao fazer login com ${provider}`);
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  // Success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conta criada com sucesso!
          </h1>
          <p className="text-gray-600 mb-6">
            Bem-vindo(a) ao SuperApp! Redirecionando...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/login" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">SuperApp</span>
          </div>
          
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Step Indicator */}
          <div className="py-6">
            <StepIndicator steps={STEPS} currentStep={currentStep} />
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 1: Phone Input */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="p-6 sm:p-8"
                >
                  <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      Criar sua conta
                    </h1>
                    <p className="text-gray-500">
                      Comece informando seu número de telefone
                    </p>
                  </div>

                  {/* Social Login */}
                  <SocialButtonsGroup
                    onGoogleClick={() => handleSocialAuth('google')}
                    onAppleClick={() => handleSocialAuth('apple')}
                    onFacebookClick={() => handleSocialAuth('facebook')}
                    loadingProvider={socialLoadingProvider}
                  />

                  {/* Social Auth Error */}
                  {formError && currentStep === 1 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {formError}
                    </div>
                  )}

                  <AuthDivider />

                  {/* Phone Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de telefone
                      </label>
                      <PhoneInput
                        value={phone}
                        onChange={(value, isValid) => {
                          setPhone(value);
                          setIsPhoneValid(isValid);
                          setPhoneError('');
                        }}
                        error={phoneError}
                        disabled={isSendingOTP}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={!isPhoneValid || isSendingOTP}
                      className="
                        w-full py-3.5 px-4 
                        bg-primary-500 hover:bg-primary-600 
                        text-white font-semibold rounded-xl
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                        shadow-lg shadow-primary-500/25
                      "
                    >
                      {isSendingOTP ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando código...
                        </>
                      ) : (
                        <>
                          Continuar
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Terms */}
                  <p className="mt-6 text-center text-xs text-gray-500">
                    Ao continuar, você concorda com nossos{' '}
                    <Link href="/terms" className="text-primary-600 hover:underline">
                      Termos de Uso
                    </Link>{' '}
                    e{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline">
                      Política de Privacidade
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* Step 2: OTP Verification */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="p-6 sm:p-8"
                >
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Alterar número
                  </button>

                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                      <Shield className="w-8 h-8 text-primary-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Verificação de segurança
                    </h1>
                    <p className="text-gray-500">
                      Digite o código de 6 dígitos enviado para
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">
                      +55 {phone}
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-6">
                    <OTPInput
                      value={otpCode}
                      onChange={setOtpCode}
                      onComplete={handleVerifyOTP}
                      error={!!otpError}
                      disabled={isVerifyingOTP}
                    />

                    {otpError && (
                      <p className="text-center text-sm text-red-500">
                        {otpError}
                      </p>
                    )}

                    {isVerifyingOTP && (
                      <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      </div>
                    )}

                    <CountdownTimer
                      seconds={60}
                      onComplete={() => {}}
                      onResend={handleResendOTP}
                    />
                  </div>

                  {/* Demo hint */}
                  <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-800 text-center">
                      💡 <strong>Modo Demo:</strong> Use o código <code className="bg-amber-100 px-2 py-0.5 rounded">123456</code>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Account Details */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="p-6 sm:p-8"
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <Zap className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Quase lá!
                    </h1>
                    <p className="text-gray-500">
                      Complete suas informações para finalizar
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Verified Phone Display */}
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-xs text-green-600">Telefone verificado</p>
                        <p className="font-medium text-green-700">+55 {phone}</p>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nome completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Como você gostaria de ser chamado?"
                          className="
                            w-full pl-10 pr-4 py-3.5
                            border-2 border-gray-300 rounded-xl
                            focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                            transition-all duration-200
                          "
                          disabled={isRegistering}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="
                            w-full pl-10 pr-4 py-3.5
                            border-2 border-gray-300 rounded-xl
                            focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                            transition-all duration-200
                          "
                          disabled={isRegistering}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Crie uma senha forte"
                          className="
                            w-full pl-10 pr-12 py-3.5
                            border-2 border-gray-300 rounded-xl
                            focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                            transition-all duration-200
                          "
                          disabled={isRegistering}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <PasswordStrength password={password} />
                    </div>

                    {/* Error Message */}
                    {formError && (
                      <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                        {formError}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isRegistering || !name || !email || !isPasswordStrong(password)}
                      className="
                        w-full py-3.5 px-4 mt-2
                        bg-primary-500 hover:bg-primary-600 
                        text-white font-semibold rounded-xl
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                        shadow-lg shadow-primary-500/25
                      "
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Criar minha conta
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Fazer login
            </Link>
          </p>
        </div>
      </main>

      {/* Benefits Section (only on step 1) */}
      {currentStep === 1 && (
        <section className="max-w-lg mx-auto px-4 pb-8">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Shield, label: 'Seguro', desc: 'Dados protegidos' },
              { icon: Zap, label: 'Rápido', desc: 'Cadastro fácil' },
              { icon: Sparkles, label: 'Benefícios', desc: 'Ofertas exclusivas' },
            ].map((item, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-white/50 border border-gray-100">
                <item.icon className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
