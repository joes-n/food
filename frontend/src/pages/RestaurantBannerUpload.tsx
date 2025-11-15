import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ImageUpload } from '../components/ImageUpload';
import { restaurantService, Restaurant } from '../services/restaurantService';
import { toast } from 'react-toastify';

export function RestaurantBannerUpload() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      toast.error('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (url: string) => {
    try {
      // Update restaurant with new banner URL
      await restaurantService.updateRestaurant(id!, {
        banner: url,
      });

      // Reload restaurant data to get updated info
      await loadRestaurant();

      toast.success('Banner uploaded and updated successfully!');
    } catch (error) {
      toast.error('Failed to update restaurant banner');
      // Reload to reset to previous state
      await loadRestaurant();
    }
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
      <div className="text-center py-8">
        <p className="text-gray-600">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6">Edit Restaurant Banner</h1>

        {/* Current Banner Preview */}
        {restaurant.banner && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Current Banner</h2>
            <img
              src={restaurant.banner}
              alt={restaurant.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Upload Component */}
        <div className="mb-6">
          <ImageUpload
            label="Upload New Banner"
            currentImage={restaurant.banner}
            restaurantId={id!}
            onUploadComplete={handleBannerUpload}
          />
        </div>

        {/* Restaurant Info */}
        <div className="mt-8 pt-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Restaurant Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-semibold">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Cuisine</p>
              <p className="font-semibold">{restaurant.cuisine}</p>
            </div>
            <div>
              <p className="text-gray-600">Price Range</p>
              <p className="font-semibold">{restaurant.priceRange}</p>
            </div>
            <div>
              <p className="text-gray-600">Rating</p>
              <p className="font-semibold">
                {restaurant.rating.toFixed(1)} ★ ({restaurant.totalReviews} reviews)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
Usage:

1. Add this route to your App.tsx:
   <Route path="/restaurants/:id/banner" element={<RestaurantBannerUpload />} />

2. Link to this page from your restaurant management page:
   <Link to={`/restaurants/${restaurant.id}/banner`} className="btn-primary">
     Edit Banner
   </Link>

3. Or access directly at: http://localhost:3000/restaurants/<restaurant-id>/banner
*/