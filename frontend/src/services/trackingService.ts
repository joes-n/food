import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

class TrackingService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem('token');
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to tracking service');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from tracking service');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  joinOrderRoom(orderId: string) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit('join-order', orderId);
  }

  leaveOrderRoom(orderId: string) {
    this.socket?.emit('leave-order', orderId);
  }

  joinRestaurantRoom(restaurantId: string) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit('join-restaurant', restaurantId);
  }

  joinUserRoom(userId: string) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit('join-user', userId);
  }

  // Order status updates
  onOrderStatusUpdate(callback: (data: { orderId: string; status: string; timestamp: string }) => void) {
    this.addListener('order-status-update', callback);
    this.socket?.on('order-status-update', callback);
  }

  offOrderStatusUpdate(callback: Function) {
    this.removeListener('order-status-update', callback);
    this.socket?.off('order-status-update', callback as any);
  }

  // Driver location updates
  onLocationUpdate(callback: (data: { orderId: string; driverId: string; lat: number; lng: number; timestamp: string }) => void) {
    this.addListener('location-update', callback);
    this.socket?.on('location-update', callback);
  }

  offLocationUpdate(callback: Function) {
    this.removeListener('location-update', callback);
    this.socket?.off('location-update', callback as any);
  }

  // Chat messages
  onNewMessage(callback: (message: { id: string; senderId: string; message: string; timestamp: string }) => void) {
    this.addListener('new-message', callback);
    this.socket?.on('new-message', callback);
  }

  offNewMessage(callback: Function) {
    this.removeListener('new-message', callback);
    this.socket?.off('new-message', callback as any);
  }

  // Send location update (for drivers)
  updateDriverLocation(orderId: string, lat: number, lng: number) {
    this.socket?.emit('driver-location-update', {
      orderId,
      lat,
      lng,
    });
  }

  // Send chat message
  sendMessage(receiverId: string, message: string) {
    this.socket?.emit('send-message', {
      receiverId,
      message,
    });
  }

  // Generic event listeners
  private addListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  private removeListener(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const trackingService = new TrackingService();
