import api from './api';
import type { Address } from '@/types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  defaultCity?: string;
  defaultState?: string;
}

export interface CreateAddressData {
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface ReviewData {
  id: string;
  merchantRating: number;
  driverRating?: number;
  merchantComment?: string;
  driverComment?: string;
  createdAt: string;
  merchant: {
    businessName: string;
    tradeName?: string;
    logoUrl?: string;
  };
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
  };
}

export const userService = {
  async getProfile() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData) {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  async getAddresses(): Promise<Address[]> {
    const response = await api.get<Address[]>('/users/me/addresses');
    return response.data;
  },

  async createAddress(data: CreateAddressData): Promise<Address> {
    const response = await api.post<Address>('/users/me/addresses', data);
    return response.data;
  },

  async updateAddress(id: string, data: Partial<CreateAddressData>): Promise<Address> {
    const response = await api.patch<Address>(`/users/me/addresses/${id}`, data);
    return response.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/users/me/addresses/${id}`);
  },

  async getReviews(): Promise<ReviewData[]> {
    const response = await api.get<ReviewData[]>('/users/me/reviews');
    return response.data;
  },
};

export default userService;
