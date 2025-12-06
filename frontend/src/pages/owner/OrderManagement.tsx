import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock, Truck, Home, AlertTriangle, Package, Utensils } from 'lucide-react';

// --- Interfaces ---

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

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
  items: OrderItem[];
  deliveryAddress?: string;
  delivery_address?: string; // Handle API inconsistencies
}

// --- Status Map for Centralized Styling and Iconography ---

interface StatusDetail {
  label: string;
  Icon: React.ElementType;
  color: string; // Tailwind color class suffix
}

const ORDER_STATUS_MAP: { [key: string]: StatusDetail } = {
  pending: { label: 'Pending', Icon: Clock, color: 'yellow' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle, color: 'blue' },
  preparing: { label: 'Preparing', Icon: Utensils, color: 'purple' },
  ready_for_pickup: { label: 'Ready for Pickup', Icon: Package, color: 'indigo' },
  out_for_delivery: { label: 'Out for Delivery', Icon: Truck, color: 'orange' },
  delivered: { label: 'Delivered', Icon: CheckCircle, color: 'green' },
  cancelled: { label: 'Cancelled', Icon: XCircle, color: 'red' },
};

const getStatusDetails = (status: string): StatusDetail => 
  ORDER_STATUS_MAP[status] || { label: status, Icon: AlertTriangle, color: 'gray' };

// --- Reusable Order Card Component ---

interface OrderCardProps {
  order: Order;
  onOrderAction: () => void; // Callback to reload orders after an action
}

/**
 * Component for displaying a single order and handling actions.
 */
const OrderCard: React.FC<OrderCardProps> = ({ order, onOrderAction }) => {
  const statusDetails = getStatusDetails(order.status);
  const StatusIcon = statusDetails.Icon;

  // Use the service functions directly within the card's actions
  const handleAcceptOrder = async () => {
    try {
      await ownerService.acceptOrder(order.id);
      toast.success(`Order #${order.orderNumber} accepted.`);
      onOrderAction();
    } catch (error) {
      toast.error('Failed to accept order.');
    }
  };

  const handleRejectOrder = async () => {
    if (!window.confirm(`Are you sure you want to reject order #${order.orderNumber}?`)) {
      return;
    }

    try {
      await ownerService.rejectOrder(order.id);
      toast.success(`Order #${order.orderNumber} rejected.`);
      onOrderAction();
    } catch (error) {
      toast.error('Failed to reject order.');
    }
  };
  
  // Choose the appropriate address field
  const deliveryAddress = order.deliveryAddress || order.delivery_address || 'Address not available';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4 border-b pb-4">
        <div>
          <h3 className="text-2xl font-extrabold text-gray-900">Order #{order.orderNumber}</h3>
          <p className="text-gray-500 text-sm mt-1">
            Placed: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-4 py-1 rounded-full text-sm font-bold bg-${statusDetails.color}-100 text-${statusDetails.color}-800`}>
          <StatusIcon size={16} />
          {statusDetails.label.toUpperCase()}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div>
          <h4 className="font-bold mb-2 text-gray-700 flex items-center gap-1">
            <Home size={16} className="text-indigo-500" /> Customer
          </h4>
          <p className="text-gray-800 font-semibold">{order.customer.name}</p>
          <p className="text-gray-600 text-sm truncate">{order.customer.email}</p>
          <p className="text-gray-600 text-sm">{order.customer.phone}</p>
        </div>

        {/* Delivery Info */}
        <div className='md:col-span-1'>
          <h4 className="font-bold mb-2 text-gray-700 flex items-center gap-1">
            <Truck size={16} className="text-indigo-500" /> Delivery Address
          </h4>
          <p className="text-gray-700 text-sm leading-relaxed">{deliveryAddress}</p>
        </div>

        {/* Order Items & Total */}
        <div className='md:col-span-1'>
            <h4 className="font-bold mb-2 text-gray-700">Items & Total</h4>
            <div className="space-y-1 text-sm">
                {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-gray-600">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between font-extrabold text-lg text-gray-900">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
            </div>
        </div>
      </div>

      {/* Action Buttons (Only for Pending) */}
      {order.status === 'pending' && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleAcceptOrder}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle size={20} />
            Accept Order
          </button>
          <button
            onClick={handleRejectOrder}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-300 rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <XCircle size={20} />
            Reject Order
          </button>
        </div>
      )}
    </div>
  );
};


// --- Main Component ---

export function OrderManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }));
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      // First get the owner's restaurant
      const restaurant = await ownerService.getMyRestaurants();
      if (!restaurant) {
        toast.error('No restaurant found. Redirecting to dashboard.');
        navigate('/owner/dashboard');
        return;
      }

      const response = await ownerService.getRestaurantOrders(
        restaurant.id,
        filter === 'all' ? undefined : filter
      );
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    if (!isAuthenticated && !token) {
      navigate('/login');
      return;
    }
    if (token && !user) {
      return;
    }
    if (user?.role !== 'restaurant_owner') {
      navigate('/');
      return;
    }

    // Load orders whenever the filter changes
    loadOrders();
  }, [filter, isAuthenticated, user, navigate, loadOrders]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading orders...</p>
      </div>
    );
  }

  // Reload handler passed to OrderCard
  const handleOrderAction = () => {
    loadOrders();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-800">🛒 Order Management</h1>
        <p className="text-gray-500 mt-1">View, filter, and manage incoming orders for your restaurant.</p>
      </header>

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
        <h2 className="text-lg font-bold mb-3 text-gray-700">Filter Orders by Status</h2>
        <div className="flex gap-3 flex-wrap">
          {Object.keys(ORDER_STATUS_MAP).concat('all').sort((a, b) => a === 'all' ? -1 : 1).map((status) => {
            const details = getStatusDetails(status);
            const label = status === 'all' ? 'All Orders' : details.label;
            
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors border ${
                  filter === status
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Showing {filter === 'all' ? 'All' : getStatusDetails(filter).label} Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center border border-dashed border-gray-300">
            <AlertTriangle size={32} className="text-orange-500 mx-auto mb-3" />
            <p className="text-xl text-gray-600 font-medium">No {filter === 'all' ? '' : getStatusDetails(filter).label.toLowerCase()} orders found.</p>
            <p className="text-sm text-gray-500 mt-2">Check your other filters or wait for new orders to come in.</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onOrderAction={handleOrderAction} />
          ))
        )}
      </section>
    </div>
  );
}