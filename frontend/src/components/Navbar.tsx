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
    <nav className="bg-lime-400 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-[#ffffff]">LettucEat
          </Link>
          <div className="flex items-center space-x-6">
            {isAuthenticated && user?.role === 'customer' && (
              <>
                <Link to="/track-order" className="text-[#ffffff] hover:text-[#10b981]">
                  Track Order
                </Link>
                <Link to="/cart" className="text-[#ffffff] hover:text-[#10b981] flex items-center gap-1">
                  <ShoppingCart size={20} />
                  <span>Cart</span>
                </Link>
              </>
            )}
            {isAuthenticated && user && user.role !== 'restaurant_owner' && user.role !== 'customer' && (
              <Link to="/cart" className="text-[#ffffff] hover:text-[#10b981] flex items-center gap-1">
                <ShoppingCart size={20} />
                <span>Cart</span>
              </Link>
            )}
            {isAuthenticated && (
              <>
                <span className="text-gray-600">Hello, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-[#ffffff] hover:text-[#10b981] flex items-center gap-1"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="text-[#ffffff] hover:text-[#10b981]">
                  Login
                </Link>
                <Link to="/register" className="text-[#ffffff] hover:text-[#10b981]">
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
                className="text-[#ffffff] hover:text-[#10b981] font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/owner/orders"
                className="text-[#ffffff] hover:text-[#10b981] font-medium"
              >
                Orders
              </Link>
              <Link
                to="/owner/menu"
                className="text-[#ffffff] hover:text-[#10b981] font-medium"
              >
                Menu
              </Link>
              <Link
                to="/owner/edit"
                className="text-[#ffffff] hover:text-[#10b981] font-medium"
              >
                Info
              </Link>
              <Link
                to="/owner/earnings"
                className="text-[#ffffff] hover:text-[#10b981] font-medium"
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
