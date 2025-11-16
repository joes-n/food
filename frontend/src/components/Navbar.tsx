import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShoppingCart, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';

export function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-lime-400 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-primary-500">LettucEat
          </Link>
          <div className="flex items-center space-x-6">
            {user?.role !== 'restaurant_owner' && (
              <Link to="/restaurants" className="text-gray-700 hover:text-primary-600">
                Restaurants
              </Link>
            )}
            {isAuthenticated && user?.role !== 'restaurant_owner' && (
              <Link to="/cart" className="text-gray-700 hover:text-primary-600 flex items-center gap-1">
                <ShoppingCart size={20} />
                <span>Cart</span>
              </Link>
            )}
            {isAuthenticated && (
              <>
                <span className="text-gray-600">Hello, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary-600 flex items-center gap-1"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </Link>
                <Link to="/register" className="text-gray-700 hover:text-primary-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Owner Navigation Tabs */}
        {isAuthenticated && user?.role === 'restaurant_owner' && (
          <div className="border-t border-gray-200">
            <div className="flex space-x-8 py-3">
              <Link
                to="/owner/dashboard"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/owner/orders"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Orders
              </Link>
              <Link
                to="/owner/edit"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Edit
              </Link>
              <Link
                to="/owner/earnings"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Earnings
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}