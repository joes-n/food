import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
}

export function MenuManagement() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    preparationTime: 15,
    isAvailable: true,
  });

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

    loadMenuItems();
  }, [isAuthenticated, user, navigate]);

  const loadMenuItems = async () => {
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

      const response = await ownerService.getMenuItems(restaurant.id);
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        restaurantId: restaurantId,
        categoryId: 'default-category', // You'd want to select category in a real app
      };

      if (editingItem) {
        await ownerService.updateMenuItem(editingItem.id, data);
        toast.success('Menu item updated successfully');
      } else {
        await ownerService.createMenuItem(data);
        toast.success('Menu item created successfully');
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: 0, preparationTime: 15, isAvailable: true });
      loadMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      preparationTime: item.preparationTime || 15,
      isAvailable: item.isAvailable,
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await ownerService.deleteMenuItem(itemId);
      toast.success('Menu item deleted successfully');
      loadMenuItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await ownerService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      toast.success(`Menu item ${!item.isAvailable ? 'enabled' : 'disabled'} successfully`);
      loadMenuItems();
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mt-2">Menu Management</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingItem(null);
            setFormData({ name: '', description: '', price: 0, preparationTime: 15, isAvailable: true });
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Menu Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Prep Time (minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center mt-8">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isAvailable" className="text-gray-700">
                  Available
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                {editingItem ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Menu Items</h2>
        {menuItems.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No menu items yet. Add your first item!</p>
        ) : (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <span className="text-green-600 font-bold">${item.price.toFixed(2)}</span>
                    {!item.isAvailable && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`px-3 py-1 rounded text-sm ${
                      item.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.isAvailable ? 'Available' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}