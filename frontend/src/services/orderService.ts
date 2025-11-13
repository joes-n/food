import api from './api';

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  customizations?: {
    customizationId: string;
    optionId: string;
    optionName?: string;
    priceModifier?: number;
  }[];
}

export interface CreateOrderRequest {
  restaurantId: string;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'card' | 'digital_wallet' | 'cash_on_delivery';
  scheduledFor?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerId: string;
  restaurantId: string;
  driverId?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZipCode: string;
  deliveryCountry: string;
  deliveryInstructions?: string;
  scheduledFor?: string;
  notes?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  restaurant?: {
    id: string;
    name: string;
    logo?: string;
    phone?: string;
    estimatedDeliveryTime: number;
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface PaginatedOrders {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const orderService = {
  async createOrder(orderData: CreateOrderRequest): Promise<{ success: boolean; data: Order }> {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getOrder(id: string): Promise<{ success: boolean; data: Order }> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async getMyOrders(params?: { page?: number; pageSize?: number; status?: string }): Promise<PaginatedOrders> {
    const response = await api.get('/orders/my', { params });
    return response.data;
  },

  async updateOrderStatus(id: string, status: string): Promise<{ success: boolean; data: Order }> {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  async cancelOrder(id: string): Promise<{ success: boolean; data: Order }> {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
  },

  async assignDriver(orderId: string, driverId: string): Promise<{ success: boolean; data: Order }> {
    const response = await api.put(`/orders/${orderId}/assign-driver`, { driverId });
    return response.data;
  },
};
