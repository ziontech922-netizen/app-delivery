'use client';

import { useState, useEffect } from 'react';
import { Phone, Check } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

// Format phone number as user types
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
}

// Validate Brazilian phone number
function isValidPhone(value: string): boolean {
  const numbers = value.replace(/\D/g, '');
  // Valid if 10 or 11 digits (landline or mobile)
  return numbers.length >= 10 && numbers.length <= 11;
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  error,
  placeholder = '(00) 00000-0000',
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const valid = isValidPhone(value);
    setIsValid(valid);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    const valid = isValidPhone(formatted);
    onChange(formatted, valid);
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <span className="text-gray-400 text-sm font-medium">🇧🇷 +55</span>
        <div className="w-px h-5 bg-gray-300" />
      </div>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full pl-24 pr-10 py-3.5 
          text-base rounded-xl border-2
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : isFocused
              ? 'border-primary-500 focus:border-primary-500 focus:ring-primary-500'
              : isValid && value
                ? 'border-green-500'
                : 'border-gray-300'
          }
        `}
      />
      {/* Valid indicator */}
      {isValid && value && !error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
