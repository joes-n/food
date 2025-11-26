import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { orderService, Order } from '../services/orderService';
import { OrderTracker } from '../components/OrderTracker';
import { useAuthStore } from '../store/authStore';

const ACTIVE_STATUSES = new Set([
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
]);

const COMPLETED_STATUSES = new Set(['delivered', 'cancelled']);

const STATUS_META: Record<string, { label: string; badge: string; description: string }> = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-100 text-amber-800',
    description: 'Waiting for the restaurant to confirm your order.',
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-blue-100 text-blue-800',
    description: 'Restaurant confirmed your order.',
  },
  preparing: {
    label: 'Preparing',
    badge: 'bg-primary-100 text-primary-800',
    description: 'Chefs are cooking up your food.',
  },
  ready_for_pickup: {
    label: 'Ready for pickup',
    badge: 'bg-emerald-100 text-emerald-800',
    description: 'Ready for pickup or driver handoff.',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    badge: 'bg-indigo-100 text-indigo-800',
    description: 'Driver is on the way.',
  },
  delivered: {
    label: 'Delivered',
    badge: 'bg-gray-200 text-gray-900',
    description: 'Enjoy your meal!'
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-100 text-red-800',
    description: 'Order was cancelled.',
  },
};

type FilterType = 'active' | 'completed' | 'all';

const formatDate = (value?: string) => {
  if (!value) return '--';
  try {
    return format(new Date(value), 'MMM d, yyyy h:mm a');
  } catch (error) {
    return '--';
  }
};

export function TrackOrderStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('active');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const isCustomer = isAuthenticated && user?.role === 'customer';

  useEffect(() => {
    if (isCustomer) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [isCustomer]);

  const loadOrders = async (showPrimaryLoader = true) => {
    try {
      showPrimaryLoader ? setLoading(true) : setRefreshing(true);
      const response = await orderService.getMyOrders({ pageSize: 50 });
      setOrders(response.data);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Unable to load your orders.';
      toast.error(message);
    } finally {
      showPrimaryLoader ? setLoading(false) : setRefreshing(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'active'
          ? ACTIVE_STATUSES.has(order.status)
          : COMPLETED_STATUSES.has(order.status);

      const matchesSearch = term
        ? order.orderNumber?.toString().includes(term) ||
          order.restaurant?.name?.toLowerCase().includes(term) ||
          order.status.toLowerCase().includes(term)
        : true;

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !filteredOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId) || null
    : null;

  const stats = useMemo(
    () => [
      {
        label: 'Active orders',
        value: orders.filter((order) => ACTIVE_STATUSES.has(order.status)).length,
        helper: 'Currently moving through kitchens and drivers.',
      },
      {
        label: 'Delivered',
        value: orders.filter((order) => order.status === 'delivered').length,
        helper: 'Successfully completed orders.',
      },
      {
        label: 'Cancelled',
        value: orders.filter((order) => order.status === 'cancelled').length,
        helper: 'Orders that were cancelled or refunded.',
      },
    ],
    [orders]
  );

  if (!isCustomer) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Track your orders</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Please sign in with a customer account to view the status of your recent orders.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">No orders to track yet</h1>
        <p className="text-gray-600 mb-8">Once you place an order you'll see its progress here in real time.</p>
        <Link to="/restaurants" className="btn-primary inline-flex items-center gap-2">
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Track Your Orders</h1>
          <p className="text-gray-600">Monitor active orders, revisit past ones, and jump into live status updates.</p>
        </div>
        <button
          onClick={() => loadOrders(false)}
          disabled={refreshing}
          className="btn-secondary whitespace-nowrap"
        >
          {refreshing ? 'Refreshing...' : 'Refresh list'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="flex flex-wrap gap-2">
                {(['active', 'completed', 'all'] as FilterType[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setFilter(option)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      filter === option
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {option === 'active' ? 'Active' : option === 'completed' ? 'Completed' : 'All'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="input w-full lg:w-64"
                  placeholder="Search by order # or restaurant"
                />
              </div>
            </div>

            {!filteredOrders.length ? (
              <div className="text-center text-gray-500 py-16">
                No orders match your current filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const meta = STATUS_META[order.status] || STATUS_META.pending;
                  const isSelected = order.id === selectedOrderId;
                  const itemCount = order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) ?? 0;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full text-left border rounded-lg px-4 py-4 transition-all ${
                        isSelected ? 'border-primary-500 shadow-md bg-primary-50/40' : 'border-gray-200 hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                          <p className="text-lg font-semibold text-gray-900">{order.restaurant?.name || 'Restaurant'}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${meta.badge}`}>
                            {meta.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-2 max-w-[200px]">{meta.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-between mt-4 text-sm text-gray-600">
                        <span>{itemCount} items</span>
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {selectedOrder ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Live Status</h2>
                  <Link to={`/orders/${selectedOrder.id}`} className="text-primary-600 text-sm font-medium">
                    Full view ->
                  </Link>
                </div>
                <OrderTracker
                  orderId={selectedOrder.id}
                  orderStatus={selectedOrder.status}
                  estimatedDeliveryTime={selectedOrder.estimatedDeliveryTime}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Order details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Placed</span>
                    <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Restaurant</span>
                    <span className="font-medium text-right">{selectedOrder.restaurant?.name || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-semibold">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery address</span>
                    <span className="text-right max-w-[180px]">{selectedOrder.deliveryStreet || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="capitalize">{selectedOrder.paymentMethod.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
                  <ul className="divide-y divide-gray-100">
                    {selectedOrder.items?.map((item, index) => (
                      <li key={`${item.menuItemId}-${index}`} className="py-2 flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.menuItemName || 'Item'}
                        </span>
                        {typeof item.subtotal === 'number' ? (
                          <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              Select an order to see its live status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
