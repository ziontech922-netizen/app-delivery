'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ShoppingBag, 
  MapPin, 
  Bell, 
  CreditCard,
  ChevronRight,
  Check
} from 'lucide-react';
import { useAuthStore } from '@/store';

interface OnboardingStep {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: ShoppingBag,
    title: 'Descubra milhares de opções',
    description: 'Restaurantes, mercados, farmácias e muito mais. Tudo em um único app.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: MapPin,
    title: 'Entrega rápida até você',
    description: 'Acompanhe seu pedido em tempo real e receba onde estiver.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Bell,
    title: 'Ofertas exclusivas',
    description: 'Receba notificações de promoções e descontos especiais.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: CreditCard,
    title: 'Pagamento fácil e seguro',
    description: 'Pix, cartões, vale-refeição e muito mais. Você escolhe!',
    color: 'from-green-500 to-emerald-500',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Auto-advance slides
  useEffect(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Save onboarding completed flag
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Navigate to home after brief animation
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    router.push('/');
  };

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex flex-col">
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSkip}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2"
        >
          Pular
        </button>
      </div>

      {/* Greeting */}
      {user && (
        <div className="pt-12 px-6 text-center">
          <p className="text-gray-600">Olá,</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.name?.split(' ')[0] || 'Bem-vindo'}! 🎉
          </h1>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-sm"
          >
            {/* Icon */}
            <div className={`w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl`}>
              <Icon className="w-12 h-12 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step Indicators */}
        <div className="flex gap-2 mt-12">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`
                h-2 rounded-full transition-all duration-300
                ${index === currentStep 
                  ? 'w-8 bg-primary-500' 
                  : index < currentStep
                    ? 'w-2 bg-primary-300'
                    : 'w-2 bg-gray-300'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-8">
        {isLastStep ? (
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="
              w-full py-4 px-6
              bg-primary-500 hover:bg-primary-600
              text-white font-semibold text-lg rounded-2xl
              transition-all duration-300
              flex items-center justify-center gap-3
              shadow-xl shadow-primary-500/30
              disabled:opacity-70
            "
          >
            {isCompleting ? (
              <>
                <Check className="w-6 h-6" />
                Vamos lá!
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Começar a usar
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="
              w-full py-4 px-6
              bg-white hover:bg-gray-50
              text-gray-900 font-semibold text-lg rounded-2xl
              transition-all duration-300
              flex items-center justify-center gap-2
              border-2 border-gray-200
            "
          >
            Próximo
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Features Preview */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Entrega', sublabel: 'Grátis*' },
            { label: 'Cupons', sublabel: 'Toda hora' },
            { label: 'Super', sublabel: 'Rápido' },
            { label: '24h', sublabel: 'Suporte' },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100"
            >
              <p className="font-bold text-gray-900 text-sm">{feature.label}</p>
              <p className="text-xs text-gray-500">{feature.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
