import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { DollarSign, ShoppingBag, TrendingUp, Clock, AlertTriangle, Star, Home, ChefHat } from 'lucide-react';

// --- Interfaces ---

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

interface StatData {
    orders: {
        total: number;
        pending: number;
        completed: number;
    };
    revenue: {
        monthly: number;
        yearly: number;
    };
    popularItems?: Array<{
        id: string;
        name: string;
        price: number;
        image?: string;
        totalSold: number;
        totalRevenue: number;
    }>;
}

// --- Reusable Components ---

interface StatCardProps {
    title: string;
    value: string | number;
    Icon: React.ElementType;
    color: string; // Tailwind color (e.g., 'text-green-600')
}

/**
 * Displays a single quick metric statistic.
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, Icon, color }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:shadow-xl border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-600 text-sm font-medium">{title}</p>
                <p className="text-4xl font-extrabold text-gray-900 mt-1">{value}</p>
            </div>
            <Icon className={`${color}`} size={40} />
        </div>
    </div>
);

interface PopularItemCardProps {
    item: StatData['popularItems'][number];
}

/**
 * Displays a single popular menu item.
 */
const PopularItemCard: React.FC<PopularItemCardProps> = ({ item }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-shadow hover:shadow-md">
        <div className="flex items-center space-x-4">
            {item.image ? (
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md shadow-sm"
                />
            ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <ChefHat className="text-gray-500" size={24} />
                </div>
            )}
            <div>
                <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                <p className="text-gray-600 text-sm">${item.price.toFixed(2)}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="font-bold text-indigo-600">{item.totalSold} sold</p>
            <p className="text-gray-600 text-sm">${item.totalRevenue.toFixed(2)} revenue</p>
        </div>
    </div>
);

// --- Main Component ---

export function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }));

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatData | null>(null);

  // Memoized function for loading statistics
  const loadStats = useCallback(async (restaurantId: string) => {
    try {
      const response = await ownerService.getRestaurantStats(restaurantId);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load dashboard statistics.');
    }
  }, []);

  // Memoized function for loading restaurant details
  const loadRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ownerService.getMyRestaurants();
      setRestaurant(data);
      if (data) {
        await loadStats(data.id);
      }
    } catch (error) {
      toast.error('Failed to load restaurant details.');
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  useEffect(() => {
    // 1. Authentication and Role Check
    const token = localStorage.getItem('token');
    if (!isAuthenticated && !token) {
      navigate('/login');
      return;
    }
    if (token && !user) {
      // Still waiting for user data from the store
      return;
    }
    if (user?.role !== 'restaurant_owner') {
      navigate('/');
      return;
    }

    setCheckingAuth(false);
    loadRestaurant();
  }, [isAuthenticated, user, navigate, loadRestaurant]);


  if (checkingAuth || loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="mt-4 text-lg text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  // Handle case: Owner is logged in but has no restaurant registered
  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-dashed border-gray-300">
          <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3 text-gray-800">Restaurant Setup Required</h2>
          <p className="text-gray-600 mb-6">It looks like you haven't set up your restaurant yet. Start here to get your business online!</p>
          <Link to="/owner/restaurants/new" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-colors">
            Create New Restaurant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-800">
            👋 Welcome back, {user?.name.split(' ')[0] || 'Owner'}!
        </h1>
        <div className="flex items-center space-x-3 mt-2 text-lg text-gray-600">
            <Home size={20} className="text-indigo-500" />
            <p className="font-semibold">{restaurant.name}</p>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
                {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <p className="text-sm flex items-center">
                <Star size={16} className="text-yellow-500 mr-1" fill="currentColor" /> 
                {restaurant.rating.toFixed(1)} ({restaurant.totalReviews} reviews)
            </p>
            <Link to="/owner/restaurant/edit" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                (Edit Info)
            </Link>
        </div>
      </header>

      {/* Quick Stats */}
      {stats && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Total Orders"
              value={stats.orders.total}
              Icon={ShoppingBag}
              color="text-indigo-600"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${stats.revenue.monthly.toFixed(2)}`}
              Icon={DollarSign}
              color="text-green-600"
            />
            <StatCard
              title="Pending Orders"
              value={stats.orders.pending}
              Icon={Clock}
              color="text-orange-600"
            />
            <StatCard
              title="Completed Orders"
              value={stats.orders.completed}
              Icon={TrendingUp}
              color="text-blue-600"
            />
          </div>

          {/* Popular Items */}
          {stats.popularItems && stats.popularItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Top Popular Items</h2>
              <div className="space-y-4">
                {stats.popularItems.slice(0, 5).map((item) => (
                  <PopularItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {!stats && !loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No dashboard statistics available yet.</p>
        </div>
      )}
    </div>
  );
}