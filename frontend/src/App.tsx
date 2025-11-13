import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { Home } from './pages/Home';
import { RestaurantList } from './pages/RestaurantList';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuthStore } from './store/authStore';
import { ShoppingCart } from 'lucide-react';
import './App.css';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {!['/login', '/register'].includes(window.location.pathname) && (
            <nav className="bg-white shadow-md">
              <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                  <Link to="/" className="text-2xl font-bold text-primary-600">
                    FoodOrder
                  </Link>
                  <div className="flex items-center space-x-6">
                    <Link to="/" className="text-gray-700 hover:text-primary-600">
                      Home
                    </Link>
                    <Link to="/restaurants" className="text-gray-700 hover:text-primary-600">
                      Restaurants
                    </Link>
                    {isAuthenticated && (
                      <>
                        <Link to="/cart" className="text-gray-700 hover:text-primary-600 flex items-center gap-1">
                          <ShoppingCart size={20} />
                          <span>Cart</span>
                        </Link>
                        <span className="text-gray-600">Hello, {user?.name}</span>
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
              </div>
            </nav>
          )}

          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/restaurants" element={<RestaurantList />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders/:id" element={<OrderTracking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>

          {!['/login', '/register'].includes(window.location.pathname) && (
            <footer className="bg-gray-800 text-white py-6 mt-12">
              <div className="container mx-auto px-4 text-center">
                <p>&copy; 2024 Food Ordering App. All rights reserved.</p>
              </div>
            </footer>
          )}
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
