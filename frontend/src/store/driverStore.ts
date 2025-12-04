import { create } from 'zustand';
import { driverService, DeliveryAssignment } from '../services/driverService';

interface DriverState {
  driver: any | null;
  status: 'offline' | 'online' | 'busy';
  currentDelivery: DeliveryAssignment | null;
  availableDeliveries: DeliveryAssignment[];
  deliveryHistory: DeliveryAssignment[];
  earnings: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
  location: { lat: number; lng: number } | null;
  isLoading: boolean;
  
  setStatus: (status: 'offline' | 'online' | 'busy') => Promise<void>;
  setLocation: (location: { lat: number; lng: number }) => void;
  acceptDelivery: (deliveryId: string) => Promise<void>;
  updateDeliveryStatus: (status: string) => Promise<void>;
  loadAvailableDeliveries: () => Promise<void>;
  loadDeliveryHistory: () => Promise<void>;
  loadEarnings: () => Promise<void>;
  initializeDriver: () => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  driver: null,
  status: 'offline',
  currentDelivery: null,
  availableDeliveries: [],
  deliveryHistory: [],
  earnings: { total: 0, today: 0, week: 0, month: 0 },
  location: null,
  isLoading: false,

  setStatus: async (status) => {
    set({ isLoading: true });
    try {
      await driverService.updateDriverStatus({ status });
      set({ status, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setLocation: (location) => {
    set({ location });
    driverService.updateDriverLocation(location);
  },

  acceptDelivery: async (deliveryId) => {
    set({ isLoading: true });
    try {
      await driverService.acceptDelivery(deliveryId);
      const delivery = get().availableDeliveries.find(d => d.id === deliveryId);
      if (delivery) {
        set({ 
          currentDelivery: delivery,
          availableDeliveries: get().availableDeliveries.filter(d => d.id !== deliveryId),
          status: 'busy'
        });
      }
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateDeliveryStatus: async (status) => {
    const currentDelivery = get().currentDelivery;
    if (!currentDelivery) return;
    
    set({ isLoading: true });
    try {
      await driverService.updateDeliveryStatus(currentDelivery.id, status);
      set({ 
        currentDelivery: { ...currentDelivery, status },
        isLoading: false 
      });
      
      if (status === 'delivered') {
        set({ 
          currentDelivery: null,
          status: 'online'
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadAvailableDeliveries: async () => {
    set({ isLoading: true });
    try {
      const response = await driverService.getAvailableDeliveries();
      set({ availableDeliveries: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadDeliveryHistory: async () => {
    set({ isLoading: true });
    try {
      const response = await driverService.getMyDeliveries();
      set({ deliveryHistory: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadEarnings: async () => {
    try {
      const response = await driverService.getEarnings();
      set({ earnings: response.data });
    } catch (error) {
      throw error;
    }
  },

  initializeDriver: async () => {
    set({ isLoading: true });
    try {
      await get().loadAvailableDeliveries();
      await get().loadDeliveryHistory();
      await get().loadEarnings();
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));