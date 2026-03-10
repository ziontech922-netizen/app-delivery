'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (interactive && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(index + 1);
    }
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const filled = index < Math.floor(rating);
        const partial = !filled && index < rating;
        const fillPercentage = partial ? (rating - index) * 100 : 0;

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative focus:outline-none',
              interactive && 'cursor-pointer hover:scale-110 transition-transform',
              !interactive && 'cursor-default'
            )}
            aria-label={`${index + 1} estrela${index === 0 ? '' : 's'}`}
          >
            {/* Empty star */}
            <Star
              className={cn(
                sizeMap[size],
                'text-gray-300 stroke-gray-300'
              )}
            />
            
            {/* Filled star overlay */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: filled ? '100%' : `${fillPercentage}%` }}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  'text-yellow-400 fill-yellow-400 stroke-yellow-400'
                )}
              />
            </div>
          </button>
        );
      })}
      
      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface RatingDisplayProps {
  rating: number | null;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RatingDisplay({
  rating,
  totalReviews,
  size = 'md',
  className,
}: RatingDisplayProps) {
  if (rating === null) {
    return (
      <div className={cn('flex items-center gap-1 text-gray-400', className)}>
        <Star className={cn(sizeMap[size], 'stroke-gray-300')} />
        <span className="text-sm">Sem avaliações</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <StarRating rating={rating} size={size} />
      <span className="text-sm text-gray-600">
        {rating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
      </span>
    </div>
  );
}

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  label?: string;
  required?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingInput({
  value,
  onChange,
  label,
  required,
  error,
  size = 'lg',
}: RatingInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <StarRating
        rating={value}
        size={size}
        interactive
        onChange={onChange}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
