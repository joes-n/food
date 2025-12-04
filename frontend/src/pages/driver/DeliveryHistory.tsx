import { useEffect, useState } from 'react';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, Calendar, Filter } from 'lucide-react';

export function DeliveryHistory() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { deliveryHistory, loadDeliveryHistory } = useDriverStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    loadDeliveryHistory();
  }, [user, navigate, loadDeliveryHistory]);

  const filteredDeliveries = deliveryHistory.filter(delivery => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toDateString();
      return new Date(delivery.createdAt).toDateString() === today;
    }
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(delivery.createdAt) >= weekAgo;
    }
    return delivery.status === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Delivery History</h1>
        <p className="text-gray-600">Track your completed deliveries</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="text-gray-600" size={20} />
          {['all', 'today', 'week', 'delivered', 'cancelled'].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-4 py-2 rounded ${
                filter === option
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">No deliveries found</p>
          </div>
        ) : (
          filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Order #{delivery.orderId}</h3>
                  <p className="text-gray-600">
                    {new Date(delivery.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  delivery.status === 'delivered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {delivery.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Restaurant</p>
                  <p className="font-semibold">{delivery.restaurant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">{delivery.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-semibold">{delivery.distance} km</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center text-green-600 font-bold">
                  <DollarSign size={20} className="mr-1" />
                  ${delivery.estimatedEarnings.toFixed(2)}
                </div>
                <button
                  onClick={() => navigate(`/driver/delivery/${delivery.id}`)}
                  className="btn-secondary"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}