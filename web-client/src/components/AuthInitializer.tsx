'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store';
import { initializeAuth } from '@/services/api';
import { authService } from '@/services/auth.service';

/**
 * AuthInitializer - Handles auth persistence for mobile browsers
 * 
 * This component runs once on app mount and:
 * 1. Checks if we have valid tokens (in cookies or localStorage)
 * 2. If we only have refreshToken, gets a new accessToken
 * 3. Loads user data if authenticated
 * 4. Handles session restoration for mobile browsers that may clear cookies
 */
export function AuthInitializer() {
  const hasInitialized = useRef(false);
  const { setUser, setLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      setLoading(true);
      
      try {
        // Try to restore session from tokens
        const hasValidTokens = await initializeAuth();
        
        if (hasValidTokens) {
          // If we have valid tokens but no user data, fetch it
          if (!user) {
            try {
              const userData = await authService.getMe();
              setUser(userData);
            } catch {
              // Token might be invalid, clear everything
              setUser(null);
            }
          } else {
            setLoading(false);
          }
        } else {
          // No valid tokens - user is not authenticated
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    initAuth();
  }, [setUser, setLoading, user]);

  // Also reinitialize when tab becomes visible (mobile browser resuming)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Silently refresh session when returning to tab
        try {
          const hasValidTokens = await initializeAuth();
          if (!hasValidTokens) {
            // Session expired while away
            setUser(null);
          }
        } catch {
          // Ignore errors on visibility refresh
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, setUser]);

  return null;
}

export default AuthInitializer;
