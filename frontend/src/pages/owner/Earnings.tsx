import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { DollarSign, TrendingUp, ShoppingBag, Star } from 'lucide-react';

export function Earnings() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    loadStats();
  }, [isAuthenticated, user, navigate]);

  const loadStats = async () => {
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

      const response = await ownerService.getRestaurantStats(restaurant.id);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mt-2">Earnings & Statistics</h1>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Monthly Revenue</h3>
            <DollarSign className="text-green-600" size={32} />
          </div>
          <p className="text-3xl font-bold">${stats.revenue.monthly.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Current month</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Yearly Revenue</h3>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
          <p className="text-3xl font-bold">${stats.revenue.yearly.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Current year</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Total Orders</h3>
            <ShoppingBag className="text-purple-600" size={32} />
          </div>
          <p className="text-3xl font-bold">{stats.orders.total}</p>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">Average Order Value</h3>
            <Star className="text-yellow-600" size={32} />
          </div>
          <p className="text-3xl font-bold">
            ${stats.orders.total > 0 ? (stats.revenue.yearly / stats.orders.total).toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Per order</p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 text-sm font-semibold">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.orders.pending}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm font-semibold">Completed</p>
            <p className="text-2xl font-bold text-green-900">{stats.orders.completed}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm font-semibold">This Month</p>
            <p className="text-2xl font-bold text-blue-900">{stats.orders.monthly}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-red-800 text-sm font-semibold">Cancelled</p>
            <p className="text-2xl font-bold text-red-900">{stats.orders.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Popular Items */}
      {stats.popularItems && stats.popularItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Top 5 Popular Items</h2>
          <div className="space-y-4">
            {stats.popularItems.map((item: any, index: number) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-gray-600">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.totalSold} sold</p>
                  <p className="text-gray-600 text-sm">${item.totalRevenue.toFixed(2)} revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}