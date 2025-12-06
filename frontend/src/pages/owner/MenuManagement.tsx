import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// --- Interfaces ---

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  preparationTime: number; // Ensure this is always a number
}

interface FormData {
  name: string;
  description: string;
  price: number;
  preparationTime: number;
  isAvailable: boolean;
}

// --- Reusable Components ---

interface MenuItemFormProps {
  initialData: FormData;
  restaurantId: string;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  editingItemId?: string;
}

/**
 * Component for adding or editing a menu item.
 */
const MenuItemForm: React.FC<MenuItemFormProps> = ({ 
  initialData, 
  restaurantId, 
  isEditing, 
  onSave, 
  onCancel, 
  editingItemId 
}) => {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialData changes (e.g., when switching from Add to Edit)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === 'number') {
      newValue = parseFloat(value);
      if (isNaN(newValue)) newValue = 0; // Prevent NaN in price/prepTime
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Safety check for price and prep time
    if (formData.price <= 0 || formData.preparationTime < 0) {
        toast.error('Price must be greater than zero and Preparation Time cannot be negative.');
        setIsSubmitting(false);
        return;
    }

    try {
      const data = {
        ...formData,
        restaurantId: restaurantId,
        // Mock category ID - this would be dynamic in a full application
        categoryId: 'default-category', 
      };

      if (isEditing && editingItemId) {
        await ownerService.updateMenuItem(editingItemId, data);
        toast.success('🍽️ Menu item updated successfully!');
      } else {
        await ownerService.createMenuItem(data);
        toast.success('➕ New menu item created!');
      }

      onSave(); // Trigger parent reload and state reset
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.response?.data?.error || 'Failed to save menu item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="price">Price ($) *</label>
            <input
              id="price"
              type="number"
              name="price"
              step="0.01"
              min="0.01"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="preparationTime">Prep Time (minutes)</label>
            <div className="relative flex items-center">
              <input
                id="preparationTime"
                type="number"
                name="preparationTime"
                min="0"
                className="px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.preparationTime}
                onChange={handleChange}
              />
              <Clock size={18} className="absolute left-3 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center pt-5">
            <input
              id="isAvailable"
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isAvailable" className="ml-3 text-base font-medium text-gray-700">
              Item Available for Order
            </label>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="submit" 
            className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
              isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};


interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
  onToggleAvailability: (item: MenuItem) => void;
}

/**
 * Component for displaying a single menu item in the list.
 */
const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onEdit, onDelete, onToggleAvailability }) => {
  const { id, name, description, price, isAvailable, preparationTime } = item;

  // Functionality to toggle item availability
  const handleToggle = async () => {
    try {
      await ownerService.updateMenuItem(id, { isAvailable: !isAvailable });
      toast.success(`Item ${!isAvailable ? 'enabled' : 'disabled'} successfully.`);
      onToggleAvailability(item);
    } catch (error) {
      toast.error('Failed to update availability.');
    }
  };

  // Functionality to delete item
  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="flex items-start justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white transition-shadow shadow-sm">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-extrabold text-xl text-gray-900">{name}</h3>
          <span className="text-indigo-600 font-extrabold text-lg">${price.toFixed(2)}</span>
          {!isAvailable && (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
              <AlertTriangle size={14} /> Unavailable
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-2">{description}</p>
        <p className="text-gray-500 text-xs flex items-center">
            <Clock size={12} className="mr-1" /> Prep Time: {preparationTime} min
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Availability Toggle Button */}
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
            isAvailable
              ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
          }`}
        >
          {isAvailable ? 'Disable' : 'Enable'}
        </button>
        
        {/* Edit Button */}
        <button
          onClick={() => onEdit(item)}
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Edit Item"
        >
          <Edit size={20} />
        </button>
        
        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Item"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};


// --- Main Component ---

const DEFAULT_FORM_DATA: FormData = {
    name: '',
    description: '',
    price: 0,
    preparationTime: 15,
    isAvailable: true,
};

export function MenuManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }));
  
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Initial form data state for the form component
  const initialFormData = editingItem ? {
      name: editingItem.name,
      description: editingItem.description,
      price: editingItem.price,
      preparationTime: editingItem.preparationTime || 15,
      isAvailable: editingItem.isAvailable,
  } : DEFAULT_FORM_DATA;


  // --- Data Fetching and Auth Logic ---

  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      // Auth/Role checks happen in useEffect, we just load here
      const restaurant = await ownerService.getMyRestaurants();
      if (!restaurant) {
        toast.error('No restaurant found. Redirecting to dashboard.');
        navigate('/owner/dashboard');
        return;
      }

      setRestaurantId(restaurant.id);

      const response = await ownerService.getMenuItems(restaurant.id);
      setMenuItems(response.data.map((item: any) => ({
        ...item,
        // Ensure preparationTime is always present for the interface
        preparationTime: item.preparationTime || 15, 
      })));
    } catch (error) {
      console.error('Failed to load menu items:', error);
      toast.error('Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    if (!isAuthenticated && !token) {
      navigate('/login');
      return;
    }
    if (token && !user) {
      return;
    }
    if (user?.role !== 'restaurant_owner') {
      navigate('/');
      return;
    }

    loadMenuItems();
  }, [isAuthenticated, user, navigate, loadMenuItems]);

  // --- Handlers ---

  const handleFormSave = () => {
    setShowForm(false);
    setEditingItem(null);
    loadMenuItems(); // Reload list after successful save
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleAddClick = () => {
    setEditingItem(null); // Ensure we are in "add" mode
    setShowForm(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    try {
      await ownerService.deleteMenuItem(itemId);
      toast.success('🗑️ Menu item deleted successfully!');
      // Optimistic update or full reload
      setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId)); 
    } catch (error) {
      toast.error('Failed to delete menu item.');
    }
  };

  // Reload list to reflect the toggle change
  const handleToggleAvailability = () => {
    loadMenuItems(); 
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 flex justify-between items-center border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-800">🍳 Menu Management</h1>
        <button
          onClick={handleAddClick}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </header>

      {/* Add/Edit Form */}
      {showForm && restaurantId && (
        <MenuItemForm
          initialData={initialFormData}
          restaurantId={restaurantId}
          isEditing={!!editingItem}
          editingItemId={editingItem?.id}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Menu Items List */}
      <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Current Menu Items ({menuItems.length})</h2>
        {menuItems.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <AlertTriangle size={32} className="text-orange-500 mx-auto mb-3" />
            <p className="text-xl text-gray-600 font-medium">Your menu is empty!</p>
            <p className="text-gray-500 mt-2">Click "Add New Item" to start building your restaurant's offerings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}