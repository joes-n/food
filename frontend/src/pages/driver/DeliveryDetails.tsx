import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { trackingService } from '../../services/trackingService';
import type { DeliveryAssignment } from '../../services/driverService';
import { toast } from 'react-toastify';
import { Package, MapPin, Phone, Clock, Navigation } from 'lucide-react';

export function DeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const driverStore = useDriverStore();
  const user = useAuthStore(state => state.user);
  const [delivery, setDelivery] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    const foundDelivery = driverStore.currentDelivery || 
      driverStore.deliveryHistory.find(d => d.id === id);
    
    if (foundDelivery) {
      setDelivery(foundDelivery);
    }
    setLoading(false);
  }, [id, user, navigate, driverStore]);

  useEffect(() => {
    if (delivery && delivery.status === 'in_transit') {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          driverStore.setLocation({ lat: latitude, lng: longitude });
          trackingService.updateDriverLocation(delivery.orderId, latitude, longitude);
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [delivery, driverStore]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!delivery?.id) {
      toast.error('Delivery not found');
      return;
    }

    try {
      await driverStore.updateDeliveryStatus(delivery.id, newStatus);
      setDelivery(prev => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Delivery status updated to ${newStatus}`);
      
      if (newStatus === 'delivered') {
        navigate('/driver/dashboard');
      }
    } catch (error) {
      toast.error('Failed to update delivery status');
    }
  };

  const getStatusButtonConfig = () => {
    switch (delivery?.status) {
      case 'assigned':
        return {
          text: 'Mark as Picked Up',
          nextStatus: 'in_transit',
          color: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'picked_up':
        return {
          text: 'Start Delivery',
          nextStatus: 'in_transit',
          color: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'in_transit':
        return {
          text: 'Mark as Delivered',
          nextStatus: 'delivered',
          color: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Delivery Not Found</h2>
          <button onClick={() => navigate('/driver/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const buttonConfig = getStatusButtonConfig();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Delivery Details</h1>
        <p className="text-gray-600">Order #{delivery.orderId}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <MapPin className="mr-2" size={24} />
            Pickup Location
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">{delivery.restaurant?.name || 'N/A'}</p>
              <p className="text-gray-600">{delivery.restaurant?.address || 'N/A'}</p>
            </div>
            <div className="flex items-center">
              <Phone className="mr-2" size={16} />
              <a href={`tel:${delivery.restaurant?.phone || ''}`} className="text-blue-600">
                {delivery.restaurant?.phone || 'N/A'}
              </a>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.restaurant?.address || '')}&dir_action=navigate`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center"
            >
              <Navigation className="mr-2" size={16} />
              Get Directions
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <MapPin className="mr-2" size={24} />
            Delivery Location
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">{delivery.customer?.name || 'N/A'}</p>
              <p className="text-gray-600">{delivery.customer?.address || 'N/A'}</p>
            </div>
            <div className="flex items-center">
              <Phone className="mr-2" size={16} />
              <a href={`tel:${delivery.customer?.phone || ''}`} className="text-blue-600">
                {delivery.customer?.phone || 'N/A'}
              </a>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.customer?.address || '')}&dir_action=navigate`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center"
            >
              <Navigation className="mr-2" size={16} />
              Get Directions
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Package className="mr-2" size={24} />
            Order Items
          </h2>
          <div className="space-y-2">
            {delivery.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between py-2 border-b">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${delivery.total.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-green-600 font-bold">
            <span>Your Earnings</span>
            <span>${delivery.estimatedEarnings.toFixed(2)}</span>
          </div>
        </div>

        {buttonConfig && (
          <div className="lg:col-span-2">
            <button
              onClick={() => handleStatusUpdate(buttonConfig.nextStatus)}
              className={`w-full ${buttonConfig.color} text-white py-4 px-6 rounded-lg font-bold text-lg`}
            >
              {buttonConfig.text}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
