import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { DollarSign, ShoppingBag, TrendingUp, Clock } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  _count: {
    orders: number;
    reviews: number;
    categories: number;
  };
}

export function OwnerDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<any>(null);

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

    setCheckingAuth(false);
    loadRestaurants();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (restaurants.length > 0) {
      const restaurant = restaurants[0];
      setSelectedRestaurant(restaurant);
      loadStats(restaurant.id);
    }
  }, [restaurants]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const response = await ownerService.getMyRestaurants();
      setRestaurants(response);
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (restaurantId: string) => {
    try {
      const response = await ownerService.getRestaurantStats(restaurantId);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  if (checkingAuth || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }
  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Restaurants Found</h2>
          <p className="text-gray-600 mb-6">You don't have any restaurants yet.</p>
          <Link to="/owner/restaurants/new" className="btn-primary">
            Create Restaurant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        </div>
      </div>


      {selectedRestaurant && stats && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{stats.orders.total}</p>
                </div>
                <ShoppingBag className="text-primary-600" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Monthly Revenue</p>
                  <p className="text-3xl font-bold">${stats.revenue.monthly.toFixed(2)}</p>
                </div>
                <DollarSign className="text-green-600" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Orders</p>
                  <p className="text-3xl font-bold">{stats.orders.pending}</p>
                </div>
                <Clock className="text-orange-600" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed Orders</p>
                  <p className="text-3xl font-bold">{stats.orders.completed}</p>
                </div>
                <TrendingUp className="text-blue-600" size={40} />
              </div>
            </div>
          </div>

          {/* Popular Items */}
          {stats.popularItems && stats.popularItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Popular Items</h2>
              <div className="space-y-4">
                {stats.popularItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-gray-600">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.totalSold} sold</p>
                      <p className="text-gray-600">${item.totalRevenue.toFixed(2)} revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}