'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  regex: RegExp;
}

const requirements: PasswordRequirement[] = [
  { label: 'Mínimo 8 caracteres', regex: /.{8,}/ },
  { label: 'Uma letra maiúscula', regex: /[A-Z]/ },
  { label: 'Uma letra minúscula', regex: /[a-z]/ },
  { label: 'Um número', regex: /\d/ },
  { label: 'Um caractere especial', regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

function calculateStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // Bonus for mixed characters
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (hasLower && hasUpper && hasDigit && hasSpecial) score += 2;
  
  // Normalize to 0-4 scale
  return Math.min(Math.floor(score / 2.5), 4);
}

const strengthConfig = [
  { label: 'Muito fraca', color: 'bg-red-500', textColor: 'text-red-500' },
  { label: 'Fraca', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { label: 'Razoável', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { label: 'Forte', color: 'bg-green-500', textColor: 'text-green-500' },
  { label: 'Muito forte', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
];

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);
  const config = strengthConfig[strength] || strengthConfig[0];

  const metRequirements = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }));
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index <= strength ? config.color : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs font-medium ${config.textColor}`}>
          Força da senha: {config.label}
        </p>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {metRequirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                req.met ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {req.met ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function isPasswordStrong(password: string): boolean {
  return requirements.every((req) => req.regex.test(password));
}
