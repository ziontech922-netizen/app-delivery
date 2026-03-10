import api from './api';
import Cookies from 'js-cookie';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User 
} from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    // Save tokens
    Cookies.set('accessToken', response.data.accessToken, { expires: 1/96 }); // 15 min
    Cookies.set('refreshToken', response.data.refreshToken, { expires: 7 });
    
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    // Save tokens
    Cookies.set('accessToken', response.data.accessToken, { expires: 1/96 });
    Cookies.set('refreshToken', response.data.refreshToken, { expires: 7 });
    
    return response.data;
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
    
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
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
