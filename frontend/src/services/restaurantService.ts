import api from './api';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  cuisine: string;
  rating: number;
  totalReviews: number;
  priceRange: 'budget' | 'medium' | 'premium';
  address: string;
  phone?: string;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: number;
  isOpen: boolean;
  categories?: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
  customizations?: MenuItemCustomization[];
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
}

export interface GetRestaurantsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  cuisine?: string;
  priceRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const restaurantService = {
  async getRestaurants(params?: GetRestaurantsParams) {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },

  async getRestaurantById(id: string) {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  async createRestaurant(data: Partial<Restaurant>) {
    const response = await api.post('/restaurants', data);
    return response.data;
  },

  async updateRestaurant(id: string, data: Partial<Restaurant>) {
    const response = await api.put(`/restaurants/${id}`, data);
    return response.data;
  },

  async getMyRestaurants() {
    const response = await api.get('/restaurants/my/all');
    return response.data;
  },
};
