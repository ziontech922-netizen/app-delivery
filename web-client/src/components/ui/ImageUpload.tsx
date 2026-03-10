'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';
import { UploadType } from '@/services/upload.service';
import { cn } from '@/utils/cn';

export interface ImageUploadProps {
  type: UploadType;
  value?: string;
  onChange?: (url: string | null) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'square' | 'circle' | 'banner';
  placeholder?: string;
  disabled?: boolean;
}

export function ImageUpload({
  type,
  value,
  onChange,
  onError,
  className,
  variant = 'square',
  placeholder = 'Clique ou arraste uma imagem',
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);

  const { upload, isUploading, progress, error, reset } = useUpload({
    type,
    onSuccess: (url) => {
      setPreview(url);
      onChange?.(url);
    },
    onError: (err) => {
      onError?.(err.message);
    },
  });

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Create local preview
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      // Upload file
      const url = await upload(file);

      // Clean up local preview if upload failed
      if (!url) {
        URL.revokeObjectURL(localPreview);
        setPreview(value || null);
      }
    },
    [upload, value],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange?.(null);
    reset();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const variantStyles = {
    square: 'aspect-square rounded-xl',
    circle: 'aspect-square rounded-full',
    banner: 'aspect-[3/1] rounded-xl',
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative overflow-hidden bg-gray-100 border-2 border-dashed transition-all cursor-pointer',
          variantStyles[variant],
          isDragging && 'border-primary-500 bg-primary-50',
          !isDragging && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'cursor-wait',
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Remove button */}
            {!isUploading && !disabled && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{placeholder}</p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG, WebP • Máx 5MB
            </p>
          </div>
        )}

        {/* Upload overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <p className="text-white text-sm font-medium">{progress}%</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default ImageUpload;
