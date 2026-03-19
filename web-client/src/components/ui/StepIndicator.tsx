'use client';

import { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className = '' }: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center
                  font-semibold text-sm transition-all duration-300
                  ${isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.id
                )}
                
                {/* Pulse animation for current step */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-25" />
                )}
              </div>
              
              {/* Step Title */}
              <span
                className={`
                  mt-2 text-xs font-medium text-center max-w-[80px]
                  transition-colors duration-200
                  ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                `}
              >
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={`
                  w-12 sm:w-16 md:w-24 h-0.5 mx-2 transition-all duration-500
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
