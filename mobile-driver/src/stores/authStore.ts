import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Driver } from '../types';
import api from '../config/api';

interface AuthState {
  driver: Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<Driver>) => Promise<void>;
  updateStatus: (status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  driver: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    try {
      set({ error: null, isLoading: true });
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;

      // Verify user is a driver
      if (user.role !== 'DRIVER') {
        throw new Error('Acesso permitido apenas para entregadores');
      }

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({ driver: user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao fazer login';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Update status to offline before logout
      const driver = get().driver;
      if (driver) {
        await api.patch('/drivers/me/status', { status: 'OFFLINE' }).catch(() => {});
      }

      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ driver: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = await SecureStore.getItemAsync('accessToken');

      if (!token) {
        set({ driver: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const response = await api.get('/auth/me');
      
      // Verify user is a driver
      if (response.data.role !== 'DRIVER') {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        set({ driver: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({ driver: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ driver: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data: Partial<Driver>) => {
    try {
      const response = await api.patch('/drivers/me', data);
      set({ driver: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Erro ao atualizar perfil' });
      throw error;
    }
  },

  updateStatus: async (status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
    try {
      const response = await api.patch('/drivers/me/status', { status });
      set((state) => ({
        driver: state.driver ? { ...state.driver, status } : null,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Erro ao atualizar status' });
      throw error;
    }
  },
}));
