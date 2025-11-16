import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  deliveryAddress?: string;
  delivery_address?: string;
}

export function OrderManagement() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!isAuthenticated && !token) {
      navigate('/login');
      return;
    }

    // If there's a token but user hasn't loaded yet, wait
    if (token && !user) {
      return;
    }

    // Check if user is a restaurant owner
    if (user?.role !== 'restaurant_owner') {
      navigate('/');
      return;
    }

    loadOrders();
  }, [filter, isAuthenticated, user, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // First get the owner's restaurant
      const restaurantsResponse = await ownerService.getMyRestaurants();
      if (!restaurantsResponse || restaurantsResponse.length === 0) {
        toast.error('No restaurant found');
        navigate('/owner/dashboard');
        return;
      }

      const restaurant = restaurantsResponse[0];

      const response = await ownerService.getRestaurantOrders(
        restaurant.id,
        filter === 'all' ? undefined : filter
      );
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await ownerService.acceptOrder(orderId);
      toast.success('Order accepted successfully');
      loadOrders();
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to reject this order?')) {
      return;
    }

    try {
      await ownerService.rejectOrder(orderId);
      toast.success('Order rejected successfully');
      loadOrders();
    } catch (error) {
      toast.error('Failed to reject order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready_for_pickup':
        return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mt-2">Order Management</h1>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Order #{order.orderNumber}</h3>
                  <p className="text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2">Customer</h4>
                  <p className="text-gray-700">{order.customer.name}</p>
                  <p className="text-gray-600 text-sm">{order.customer.email}</p>
                  <p className="text-gray-600 text-sm">{order.customer.phone}</p>
                </div>

                <div>
                  <h4 className="font-bold mb-2">Delivery Address</h4>
                  <p className="text-gray-700">
                    {order.deliveryAddress || order.delivery_address || 'Address not available'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-bold mb-2">Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              {order.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAcceptOrder(order.id)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Accept Order
                  </button>
                  <button
                    onClick={() => handleRejectOrder(order.id)}
                    className="btn-secondary flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle size={20} />
                    Reject Order
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}