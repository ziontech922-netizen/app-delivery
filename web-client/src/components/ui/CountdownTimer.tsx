'use client';

import { useState, useEffect } from 'react';
import { Clock, RefreshCcw } from 'lucide-react';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  onResend: () => void;
  isResending?: boolean;
}

export function CountdownTimer({
  seconds,
  onComplete,
  onResend,
  isResending = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const handleResend = () => {
    onResend();
    setTimeLeft(seconds);
    setCanResend(false);
  };

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progress = ((seconds - timeLeft) / seconds) * 100;

  return (
    <div className="text-center space-y-3">
      {!canResend ? (
        <>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Reenviar código em <span className="font-mono font-semibold text-gray-700">{formatTime(timeLeft)}</span>
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="
            inline-flex items-center gap-2 px-4 py-2 
            text-primary-600 hover:text-primary-700
            font-medium text-sm
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <RefreshCcw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
          {isResending ? 'Reenviando...' : 'Reenviar código'}
        </button>
      )}
    </div>
  );
}
