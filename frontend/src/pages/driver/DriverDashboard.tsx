import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDriverStore } from '../../store/driverStore';
import { StatusToggle } from '../../components/driver/StatusToggle';
import { DeliveryCard } from '../../components/driver/DeliveryCard';
import { toast } from 'react-toastify';
import { Package, DollarSign, MapPin, Clock } from 'lucide-react';

export function DriverDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const driverStore = useDriverStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user && !token) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    setCheckingAuth(false);
    driverStore.initializeDriver();
  }, [user, navigate]);

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      await driverStore.acceptDelivery(deliveryId);
      toast.success('Delivery accepted successfully');
      navigate(`/driver/delivery/${deliveryId}`);
    } catch (error) {
      toast.error('Failed to accept delivery');
    }
  };

  if (checkingAuth || driverStore.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Driver Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <StatusToggle />
      </div>

      {driverStore.currentDelivery && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Current Delivery</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {driverStore.currentDelivery.status}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2 flex items-center">
                <Package className="mr-2" size={20} />
                Order #{driverStore.currentDelivery.orderId}
              </h3>
              <p className="text-gray-600">{driverStore.currentDelivery.restaurant.name}</p>
              <p className="text-gray-600">{driverStore.currentDelivery.customer.address}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${driverStore.currentDelivery.estimatedEarnings}
                </p>
                <p className="text-gray-600">Estimated Earnings</p>
              </div>
              <button
                onClick={() => driverStore.currentDelivery && navigate(`/driver/delivery/${driverStore.currentDelivery.id}`)}
                className="btn-primary"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {driverStore.status === 'online' && !driverStore.currentDelivery && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Available Deliveries ({driverStore.availableDeliveries.length})</h2>
          <div className="grid gap-4">
            {driverStore.availableDeliveries.map(delivery => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onAccept={() => handleAcceptDelivery(delivery.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Earnings</p>
              <p className="text-3xl font-bold">${driverStore.earnings.today.toFixed(2)}</p>
            </div>
            <DollarSign className="text-green-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed Today</p>
              <p className="text-3xl font-bold">
                {driverStore.deliveryHistory.filter(d => {
                  const today = new Date().toDateString();
                  return new Date(d.deliveryTime || d.createdAt || '').toDateString() === today;
                }).length}
              </p>
            </div>
            <Package className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Earnings</p>
              <p className="text-3xl font-bold">${driverStore.earnings.total.toFixed(2)}</p>
            </div>
            <DollarSign className="text-purple-600" size={40} />
          </div>
        </div>
      </div>
    </div>
  );
}