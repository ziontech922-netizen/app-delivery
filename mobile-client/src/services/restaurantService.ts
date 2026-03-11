import api from '../config/api';
import { Restaurant, Category, Product, SearchFilters } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const restaurantService = {
  // Get featured restaurants
  async getFeatured(): Promise<Restaurant[]> {
    const response = await api.get<Restaurant[]>('/restaurants/featured');
    return response.data;
  },

  // Get nearby restaurants
  async getNearby(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Restaurant>> {
    const response = await api.get('/restaurants/nearby', { params });
    return response.data;
  },

  // Search restaurants
  async search(filters: SearchFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<Restaurant>> {
    const response = await api.get('/restaurants', { params: filters });
    return response.data;
  },

  // Get restaurant by ID
  async getById(id: string): Promise<Restaurant> {
    const response = await api.get<Restaurant>(`/restaurants/${id}`);
    return response.data;
  },

  // Get restaurant categories
  async getCategories(restaurantId: string): Promise<Category[]> {
    const response = await api.get<Category[]>(`/restaurants/${restaurantId}/categories`);
    return response.data;
  },

  // Get restaurant products
  async getProducts(restaurantId: string, params?: {
    categoryId?: string;
    search?: string;
  }): Promise<Product[]> {
    const response = await api.get<Product[]>(`/restaurants/${restaurantId}/products`, { params });
    return response.data;
  },

  // Get product by ID
  async getProduct(restaurantId: string, productId: string): Promise<Product> {
    const response = await api.get<Product>(`/restaurants/${restaurantId}/products/${productId}`);
    return response.data;
  },

  // Get cuisine types
  async getCuisineTypes(): Promise<string[]> {
    const response = await api.get<string[]>('/restaurants/cuisine-types');
    return response.data;
  },
};

export default restaurantService;
