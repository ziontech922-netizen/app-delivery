'use client';

import { useState, useCallback } from 'react';
import { uploadService, UploadType } from '@/services/upload.service';

export interface UseUploadOptions {
  type: UploadType;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export interface UseUploadResult {
  upload: (file: File) => Promise<string | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

export function useUpload(options: UseUploadOptions): UseUploadResult {
  const { type, onSuccess, onError } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      // Validate file
      const validation = uploadService.validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido');
        onError?.(new Error(validation.error));
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const url = await uploadService.upload(file, type, (percent) => {
          setProgress(percent);
        });

        setProgress(100);
        onSuccess?.(url);
        return url;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error.message);
        onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [type, onSuccess, onError],
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  };
}

export default useUpload;
