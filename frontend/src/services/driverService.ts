import api from './api';

export interface DriverStatus {
  status: 'offline' | 'online' | 'busy';
  location?: { lat: number; lng: number };
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  estimatedEarnings: number;
  distance: number;
  estimatedDuration: number;
  status: string;
  pickupTime?: Date;
  deliveryTime?: Date;
  createdAt: string;
}

export const driverService = {
  async getAvailableDeliveries(): Promise<{ success: boolean; data: DeliveryAssignment[] }> {
    const response = await api.get('/driver/available-deliveries');
    return response.data;
  },

  async acceptDelivery(deliveryId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/driver/deliveries/${deliveryId}/accept`);
    return response.data;
  },

  async updateDriverStatus(status: DriverStatus): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/driver/status', status);
    return response.data;
  },

  async updateDriverLocation(location: { lat: number; lng: number }): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/driver/location', location);
    return response.data;
  },

  async updateDeliveryStatus(deliveryId: string, status: string): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/driver/deliveries/${deliveryId}/status`, { status });
    return response.data;
  },

  async getEarnings(): Promise<{ success: boolean; data: { total: number; today: number; week: number; month: number } }> {
    const response = await api.get('/driver/earnings');
    return response.data;
  },

  async getMyDeliveries(): Promise<{ success: boolean; data: DeliveryAssignment[] }> {
    const response = await api.get('/driver/deliveries');
    return response.data;
  }
};