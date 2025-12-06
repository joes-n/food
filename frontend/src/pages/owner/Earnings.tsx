import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { DollarSign, TrendingUp, ShoppingBag, Star, LucideIcon } from 'lucide-react';

// --- Reusable Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  Icon: LucideIcon;
  iconColor: string;
}

/**
 * A reusable card component for displaying a single statistic.
 */
const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, Icon, iconColor }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-semibold text-base">{title}</h3>
      <Icon className={iconColor} size={28} />
    </div>
    <p className="text-3xl font-extrabold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
  </div>
);

// --- Main Component ---

export function Earnings() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }));
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching and Auth Logic ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Redirect if not authenticated
    if (!isAuthenticated && !token) {
      navigate('/login');
      return;
    }

    // Wait for user data if token exists
    if (token && !user) {
      return;
    }

    // Redirect if user is not a restaurant owner
    if (user?.role !== 'restaurant_owner') {
      navigate('/');
      return;
    }

    loadStats();
  }, [isAuthenticated, user, navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // First get the owner's restaurant (one owner = one restaurant)
      const restaurant = await ownerService.getMyRestaurants();
      if (!restaurant) {
        toast.error('No restaurant found. Please create one.');
        navigate('/owner/dashboard'); // Or to a restaurant creation page
        return;
      }

      const response = await ownerService.getRestaurantStats(restaurant.id);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load statistics.');
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Values ---
  const averageOrderValue = useMemo(() => {
    if (!stats) return '0.00';
    const { revenue, orders } = stats;
    return orders.total > 0 
      ? (revenue.yearly / orders.total).toFixed(2) 
      : '0.00';
  }, [stats]);


  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
          <p className="text-xl text-gray-600 font-medium">
            No statistics available for your restaurant at this time.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Ensure your restaurant is set up and has processed orders.
          </p>
        </div>
      </div>
    );
  }

  // Destructure for cleaner access in the render block
  const { revenue, orders, popularItems } = stats;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-800">📊 Restaurant Performance Dashboard</h1>
        <p className="text-gray-500 mt-1">Review your earnings and key operational metrics.</p>
      </header>

      {/* Revenue & Key Metrics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Monthly Revenue" 
          value={`$${revenue.monthly.toFixed(2)}`} 
          subtitle="Current month's earnings"
          Icon={DollarSign} 
          iconColor="text-green-600"
        />
        <StatCard 
          title="Yearly Revenue" 
          value={`$${revenue.yearly.toFixed(2)}`} 
          subtitle="Current year's total"
          Icon={TrendingUp} 
          iconColor="text-blue-600"
        />
        <StatCard 
          title="Total Orders" 
          value={orders.total} 
          subtitle="All-time orders received"
          Icon={ShoppingBag} 
          iconColor="text-purple-600"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`$${averageOrderValue}`} 
          subtitle="Average spend per order"
          Icon={Star} 
          iconColor="text-yellow-600"
        />
      </section>

      {/* Order Status Breakdown */}
      <section className="bg-white rounded-xl shadow-lg p-8 mb-10 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm font-semibold">Pending</p>
            <p className="text-3xl font-extrabold text-yellow-900 mt-1">{orders.pending}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm font-semibold">This Month</p>
            <p className="text-3xl font-extrabold text-blue-900 mt-1">{orders.monthly}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm font-semibold">Completed</p>
            <p className="text-3xl font-extrabold text-green-900 mt-1">{orders.completed}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800 text-sm font-semibold">Cancelled</p>
            <p className="text-3xl font-extrabold text-red-900 mt-1">{orders.cancelled}</p>
          </div>
        </div>
      </section>

      {/* Popular Items */}
      {popularItems && popularItems.length > 0 && (
        <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⭐ Top 5 Popular Items</h2>
          <div className="space-y-4">
            {popularItems.slice(0, 5).map((item: any, index: number) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">Price: ${item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-lg text-indigo-700">{item.totalSold} sold</p>
                  <p className="text-sm text-gray-600">Revenue: ${item.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}