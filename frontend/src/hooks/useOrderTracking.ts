import { useEffect, useState } from 'react';
import { trackingService } from '../services/trackingService';

export interface OrderStatus {
  orderId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';
  timestamp: string;
}

export interface DriverLocation {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export function useOrderTracking(orderId: string | null) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    trackingService.connect();

    // Check connection status periodically
    const checkConnection = () => {
      setIsConnected(trackingService.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    if (orderId) {
      trackingService.joinOrderRoom(orderId);
    }

    const handleOrderStatusUpdate = (data: { orderId: string; status: string; timestamp: string }) => {
      console.log('Order status update:', data);
      setOrderStatus(data as OrderStatus);
    };

    const handleLocationUpdate = (data: DriverLocation) => {
      console.log('Driver location update:', data);
      setDriverLocation(data);
    };

    trackingService.onOrderStatusUpdate(handleOrderStatusUpdate);
    trackingService.onLocationUpdate(handleLocationUpdate);

    return () => {
      clearInterval(interval);
      trackingService.offOrderStatusUpdate(handleOrderStatusUpdate);
      trackingService.offLocationUpdate(handleLocationUpdate);

      if (orderId) {
        trackingService.leaveOrderRoom(orderId);
      }
    };
  }, [orderId]);

  return {
    orderStatus,
    driverLocation,
    isConnected,
    updateDriverLocation: trackingService.updateDriverLocation.bind(trackingService),
  };
}
