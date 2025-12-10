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
  acceptDelivery: (deliveryId: string) => Promise<DeliveryAssignment | null>;
  updateDeliveryStatus: (deliveryId: string, status: string) => Promise<void>;
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
      const response = await driverService.acceptDelivery(deliveryId);
      const accepted = response?.data;
      const existing = get().availableDeliveries.find(d => d.id === deliveryId);

      set({
        currentDelivery: accepted || existing || null,
        availableDeliveries: get().availableDeliveries.filter(d => d.id !== deliveryId),
        status: 'busy',
        isLoading: false
      });
      return accepted || existing || null;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateDeliveryStatus: async (deliveryId, status) => {
    set({ isLoading: true });
    try {
      const response = await driverService.updateDeliveryStatus(deliveryId, status);
      const updatedStatus = response?.data?.status || status;
      const updatedDelivery = response?.data
        ? { ...response.data, status: updatedStatus }
        : get().currentDelivery
          ? { ...get().currentDelivery!, status: updatedStatus }
          : null;

      set((state) => {
        const isCurrent = state.currentDelivery?.id === deliveryId;
        const newHistory = state.deliveryHistory.some(d => d.id === deliveryId)
          ? state.deliveryHistory.map(d => d.id === deliveryId ? { ...d, ...(updatedDelivery || { status }) } : d)
          : updatedDelivery
            ? [...state.deliveryHistory, updatedDelivery]
            : state.deliveryHistory;

        const currentData = updatedDelivery || state.currentDelivery || null;

        return {
          currentDelivery: isCurrent
            ? (status === 'delivered' ? null : currentData)
            : state.currentDelivery,
          deliveryHistory: newHistory,
          status: isCurrent && status === 'delivered' ? 'online' : state.status,
          isLoading: false
        };
      });
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
      // driverService already unwraps axios response, so earnings are under response.data
      set({ earnings: response.data ?? { total: 0, today: 0, week: 0, month: 0 } });
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
