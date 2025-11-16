import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { Home } from './pages/Home';
import { RestaurantList } from './pages/RestaurantList';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Navbar } from './components/Navbar';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { RestaurantEdit } from './pages/owner/RestaurantEdit';
import { MenuManagement } from './pages/owner/MenuManagement';
import { OrderManagement } from './pages/owner/OrderManagement';
import { Earnings } from './pages/owner/Earnings';
import './App.css';

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

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

          {/* Restaurant Owner Routes */}
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/edit" element={<RestaurantEdit />} />
          <Route path="/owner/menu" element={<MenuManagement />} />
          <Route path="/owner/orders" element={<OrderManagement />} />
          <Route path="/owner/earnings" element={<Earnings />} />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 LettucEat. No rights reserved :/</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
