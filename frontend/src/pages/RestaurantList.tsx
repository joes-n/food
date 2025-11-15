import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { restaurantService, Restaurant } from '../services/restaurantService';
import { toast } from 'react-toastify';

export function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    loadRestaurants();
  }, [searchTerm, selectedCuisine, priceRange]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getRestaurants({
        search: searchTerm || undefined,
        cuisine: selectedCuisine || undefined,
        priceRange: priceRange || undefined,
      });
      setRestaurants(response.data);
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Restaurants</h1>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Cuisine</label>
            <select
              className="input"
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
            >
              <option value="">All Cuisines</option>
              <option value="italian">Italian</option>
              <option value="chinese">Chinese</option>
              <option value="indian">Indian</option>
              <option value="mexican">Mexican</option>
              <option value="american">American</option>
            </select>
          </div>
          <div>
            <label className="label">Price Range</label>
            <select
              className="input"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">Any Price</option>
              <option value="budget">Budget</option>
              <option value="medium">Medium</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Restaurant grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/restaurants/${restaurant.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              {restaurant.banner && (
                <img
                  src={restaurant.banner}
                  alt={restaurant.name}
                  className="w-full h-48 object-cover rounded-t-lg -m-6 mb-4"
                />
              )}
              <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
              <p className="text-gray-600 mb-2">{restaurant.cuisine}</p>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-green-600 mr-2">
                  {restaurant.rating.toFixed(1)} ★
                </span>
                <span className="text-gray-500 text-sm">
                  ({restaurant.totalReviews} reviews)
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
