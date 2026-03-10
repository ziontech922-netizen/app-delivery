import api from './api';
import type { Product, Category, PaginatedResponse } from '@/types';

export const productService = {
  async getByMerchant(merchantId: string): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>(`/products/merchant/${merchantId}`);
    return response.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  async getCategories(merchantId: string): Promise<Category[]> {
    const response = await api.get<Category[]>(`/products/categories/${merchantId}`);
    return response.data;
  },
};

export default productService;
