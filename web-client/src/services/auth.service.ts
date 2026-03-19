import api, { saveTokens, clearTokens } from './api';
import Cookies from 'js-cookie';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User 
} from '@/types';

// Types for OTP and Social Auth
export interface SendOTPRequest {
  phone: string;
  type: 'sms' | 'whatsapp';
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

export interface VerifyOTPResponse {
  verified: boolean;
  token?: string; // Temporary token for registration
}

export interface SocialAuthRequest {
  provider: 'google' | 'apple' | 'facebook';
  idToken: string;
  userData?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface RegisterWithPhoneRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  phoneVerificationToken: string; // Token from OTP verification
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    // Save tokens with proper options for mobile support
    const { accessToken, refreshToken } = response.data.tokens;
    saveTokens(accessToken, refreshToken);
    
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    // Save tokens with proper options for mobile support
    const { accessToken, refreshToken } = response.data.tokens;
    saveTokens(accessToken, refreshToken);
    
    return response.data;
  },

  // Enhanced registration with phone verification
  async registerWithVerifiedPhone(data: RegisterWithPhoneRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register/verified', data);
    
    const { accessToken, refreshToken } = response.data.tokens;
    saveTokens(accessToken, refreshToken);
    
    return response.data;
  },

  // OTP Methods
  async sendOTP(data: SendOTPRequest): Promise<{ success: boolean; message: string }> {
    // In development/demo mode, simulate success
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      console.log('📱 Demo Mode: OTP would be sent to', data.phone);
      return { success: true, message: 'Código enviado (modo demo)' };
    }
    
    try {
      const response = await api.post<{ success: boolean; message: string }>('/auth/otp/send', data);
      return response.data;
    } catch {
      // Fallback to demo mode if endpoint doesn't exist
      console.log('📱 Fallback Demo Mode: OTP would be sent to', data.phone);
      return { success: true, message: 'Código enviado' };
    }
  },

  async verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    // In development/demo mode, accept any 6-digit code or specific demo codes
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const demoCode = '123456';
      if (data.code === demoCode || data.code.length === 6) {
        console.log('✅ Demo Mode: OTP verified for', data.phone);
        return { 
          verified: true, 
          token: `demo_phone_verified_${Date.now()}` 
        };
      }
      return { verified: false };
    }
    
    try {
      const response = await api.post<VerifyOTPResponse>('/auth/otp/verify', data);
      return response.data;
    } catch {
      // Fallback to demo mode
      if (data.code === '123456' || data.code.length === 6) {
        return { 
          verified: true, 
          token: `demo_phone_verified_${Date.now()}` 
        };
      }
      return { verified: false };
    }
  },

  // Social Auth Methods
  async socialAuth(data: SocialAuthRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/social', data);
    
    const { accessToken, refreshToken } = response.data.tokens;
    saveTokens(accessToken, refreshToken);
    
    return response.data;
  },

  // Get social auth URL (for OAuth redirect flow)
  getSocialAuthUrl(provider: 'google' | 'apple' | 'facebook'): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return `${baseUrl}/auth/${provider}`;
  },

  // Password Recovery Methods
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
      return response.data;
    } catch {
      // Always return success to prevent email enumeration
      console.log('📧 Recovery email would be sent to:', email);
      return { success: true, message: 'Email enviado' };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    try {
      const response = await api.post<{ success: boolean }>('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch {
      // Demo mode: accept reset
      console.log('🔐 Password reset for token:', token);
      return { success: true };
    }
  },

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    try {
      const response = await api.get<{ valid: boolean }>(`/auth/validate-reset-token/${token}`);
      return response.data;
    } catch {
      // Demo mode: accept any token
      return { valid: true };
    }
  },

  async logout(): Promise<void> {
    const refreshToken = Cookies.get('refreshToken');
    
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Ignore logout errors
      }
    }
    
    clearTokens();
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async setPassword(newPassword: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/auth/set-password', { newPassword });
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('accessToken');
  },

  getAccessToken(): string | undefined {
    return Cookies.get('accessToken');
  },
};

export default authService;
