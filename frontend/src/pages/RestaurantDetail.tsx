import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService, Restaurant, MenuItem } from '../services/restaurantService';
import { SelectedCustomization } from '../store/cartStore';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import { Plus, Minus, ArrowLeft } from 'lucide-react';

export function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addItem } = useCart();

  useEffect(() => {
    if (id) {
      loadRestaurant();
    }
  }, [id]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getRestaurantById(id!);
      setRestaurant(response.data);
      if (response.data.categories && response.data.categories.length > 0) {
        setSelectedCategory(response.data.categories[0].id);
      }
    } catch (error) {
      toast.error('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCategory = () => {
    return restaurant?.categories?.find((cat) => cat.id === selectedCategory);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const handleAddToCart = (item: MenuItem, restaurant: Restaurant) => {
    const quantity = quantities[item.id] || 0;
    if (quantity === 0) {
      toast.error('Please select a quantity');
      return;
    }

    addItem(item, restaurant.id, restaurant.name, quantity);
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }));
    toast.success(`${item.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/restaurants')}
        className="mb-6 flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
      >
        <ArrowLeft size={20} />
        Back to Restaurants
      </button>

      {/* Restaurant header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-gray-600 mb-2">{restaurant.cuisine}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold">
                {restaurant.rating.toFixed(1)} ★ ({restaurant.totalReviews} reviews)
              </span>
              <span>{restaurant.estimatedDeliveryTime} min</span>
              <span>${restaurant.deliveryFee} delivery</span>
            </div>
          </div>
          {restaurant.logo && (
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-24 h-24 rounded-lg object-cover"
            />
          )}
        </div>
        <p className="text-gray-700">{restaurant.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
            <h3 className="font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              {restaurant.categories?.map((category) => (
                <li key={category.id}>
                  <button
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedCategory === category.id
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Menu items */}
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-6">
            {getCurrentCategory()?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getCurrentCategory()?.items?.map((item) => (
              <div key={item.id} className="card">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">${item.price.toFixed(2)}</span>
                  {item.preparationTime && (
                    <span className="text-sm text-gray-500">
                      {item.preparationTime} min
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {quantities[item.id] || 0}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <button
                  onClick={() => handleAddToCart(item, restaurant)}
                  className="btn-primary w-full"
                  disabled={!item.isAvailable}
                >
                  {!item.isAvailable ? 'Unavailable' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
