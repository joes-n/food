import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderService, Order } from '../services/orderService';
import { OrderTracker } from '../components/OrderTracker';
import { toast } from 'react-toastify';

export function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrder(id!);
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-700 mb-2">Order not found</h2>
        <p className="text-gray-500">The order you're looking for doesn't exist</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Order Tracking</h1>
        <p className="text-gray-600">Order #{order.orderNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order tracker */}
        <div className="lg:col-span-2">
          <OrderTracker
            orderId={order.id}
            orderStatus={order.status}
            estimatedDeliveryTime={order.estimatedDeliveryTime}
          />
        </div>

        {/* Order details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Order Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Restaurant</p>
                <p className="font-semibold">{order.restaurant?.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Order Total</p>
                <p className="font-semibold text-xl">${order.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Payment Method</p>
                <p className="font-semibold capitalize">
                  {order.paymentMethod.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Payment Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    order.paymentStatus === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Delivery Address</h2>
            <p className="text-gray-700">
              {order.deliveryStreet}
            </p>
            {order.deliveryInstructions && (
              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-1">Delivery Instructions</p>
                <p className="text-gray-700">{order.deliveryInstructions}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
