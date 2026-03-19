import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://superapp-api-beta.fly.dev/api/v1';

// Cookie options optimized for mobile browsers
const COOKIE_OPTIONS = {
  sameSite: 'lax' as const,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to save tokens with correct options
export const saveTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('accessToken', accessToken, { ...COOKIE_OPTIONS, expires: 1 }); // 1 day (refresh will handle expiry)
  Cookies.set('refreshToken', refreshToken, { ...COOKIE_OPTIONS, expires: 30 }); // 30 days
  // Also save to localStorage as backup for mobile browsers
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } catch {
      // localStorage may be blocked in some browsers
    }
  }
};

// Helper to get token (cookie first, then localStorage fallback)
const getToken = (name: string): string | undefined => {
  let token = Cookies.get(name);
  if (!token && typeof window !== 'undefined') {
    try {
      token = localStorage.getItem(name) || undefined;
    } catch {
      // localStorage may be blocked
    }
  }
  return token;
};

// Helper to clear tokens
export const clearTokens = () => {
  Cookies.remove('accessToken', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch {
      // localStorage may be blocked
    }
  }
};

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = getToken('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Save new tokens with proper options
          saveTokens(accessToken, newRefreshToken);
          
          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch {
          // Refresh failed - logout
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Initialize auth on app load - try to refresh token if needed
export const initializeAuth = async (): Promise<boolean> => {
  const accessToken = getToken('accessToken');
  const refreshToken = getToken('refreshToken');
  
  // If we have access token, we're good
  if (accessToken) {
    return true;
  }
  
  // If we only have refresh token, try to get new access token
  if (refreshToken) {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      saveTokens(newAccessToken, newRefreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    }
  }
  
  return false;
};

export default api;
