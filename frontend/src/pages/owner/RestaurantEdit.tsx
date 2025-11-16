import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { ImageUpload } from '../../components/ImageUpload';
import { toast } from 'react-toastify';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  banner?: string;
  logo?: string;
  cuisine: string;
  address: string;
  phone?: string;
  email?: string;
  priceRange: string;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: number;
  isOpen: boolean;
}

export function RestaurantEdit() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [bannerError, setBannerError] = useState('');

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

    loadRestaurant();
  }, [isAuthenticated, user, navigate]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      // First get the owner's restaurant
      const restaurantsResponse = await ownerService.getMyRestaurants();
      if (!restaurantsResponse || restaurantsResponse.length === 0) {
        toast.error('No restaurant found');
        navigate('/owner/dashboard');
        return;
      }

      const restaurant = restaurantsResponse[0];
      setRestaurantId(restaurant.id);
      setRestaurant(restaurant);
      setFormData(restaurant);
    } catch (error) {
      toast.error('Failed to load restaurant');
      navigate('/owner/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? Number(value)
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBannerError('');

    // Validate that banner image is present
    if (!formData.banner) {
      setBannerError('Banner image is required');
      setSaving(false);
      return;
    }

    try {
      await ownerService.updateRestaurant(restaurantId!, formData);
      toast.success('Restaurant updated successfully');
      navigate('/owner/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update restaurant';
      const errorDetails = error.response?.data?.details;

      // Check if this is a validation error about banner
      if (
        errorMessage.toLowerCase().includes('validation') &&
        errorDetails &&
        Array.isArray(errorDetails)
      ) {
        const bannerErrorDetail = errorDetails.find(
          (d: any) => d.path && d.path.includes('banner')
        );
        if (bannerErrorDetail) {
          setBannerError('Banner image is required');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (url: string) => {
    try {
      await ownerService.updateRestaurant(restaurantId!, { banner: url });
      setFormData({ ...formData, banner: url });
      setBannerError(''); // Clear error when banner is uploaded
      toast.success('Banner updated successfully');
    } catch (error) {
      toast.error('Failed to update banner');
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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Restaurant not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mt-2">Edit Restaurant</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">

        {/* Current Banner Preview */}
        {formData.banner && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Current Banner</h2>
            <img
              src={formData.banner}
              alt={formData.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Banner Upload */}
        <div className="mb-6">
          <ImageUpload
            label="Upload Banner Image"
            currentImage={formData.banner}
            restaurantId={restaurantId!}
            onUploadComplete={handleBannerUpload}
          />
          {bannerError && (
            <div className="text-red-600 text-sm font-medium mt-2">
              {bannerError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Restaurant Name *</label>
            <input
              type="text"
              name="name"
              className="input"
              value={formData.name || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              name="description"
              className="input"
              rows={4}
              value={formData.description || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Cuisine Type *</label>
              <select
                name="cuisine"
                className="input"
                value={formData.cuisine || ''}
                onChange={handleChange}
                required
              >
                <option value="">Select cuisine</option>
                <option value="Italian">Italian</option>
                <option value="Japanese">Japanese</option>
                <option value="Chinese">Chinese</option>
                <option value="Indian">Indian</option>
                <option value="Mexican">Mexican</option>
                <option value="American">American</option>
                <option value="Thai">Thai</option>
                <option value="French">French</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Address *</label>
            <input
              type="text"
              name="address"
              className="input"
              value={formData.address || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="input"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Min Order Amount ($) *</label>
              <input
                type="number"
                name="minOrderAmount"
                className="input"
                step="0.01"
                value={formData.minOrderAmount || 0}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOpen"
              name="isOpen"
              className="mr-2"
              checked={formData.isOpen || false}
              onChange={handleChange}
            />
            <label htmlFor="isOpen" className="text-gray-700">
              Restaurant is currently open
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/owner/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}