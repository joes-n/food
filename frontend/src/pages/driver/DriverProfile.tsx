import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDriverStore } from '../../store/driverStore';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Package, DollarSign, MapPin, Clock } from 'lucide-react';

export function DriverProfile() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const driverStore = useDriverStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user, navigate]);

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the profile
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please login to view your profile</h2>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Driver Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="btn-secondary"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <User className="mr-3 text-gray-400" size={20} />
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  ) : (
                    <p className="font-semibold">{user.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <Mail className="mr-3 text-gray-400" size={20} />
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Email</label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  ) : (
                    <p className="font-semibold">{user.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="mr-3 text-gray-400" size={20} />
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  ) : (
                    <p className="font-semibold">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {editing && (
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Vehicle Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Current Location</p>
                  <p className="font-semibold">
                    {user.driverLocationLat && user.driverLocationLng 
                      ? `${user.driverLocationLat.toFixed(4)}, ${user.driverLocationLng.toFixed(4)}`
                      : 'Not available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Last Location Update</p>
                  <p className="font-semibold">
                    {user.lastLocationUpdate 
                      ? new Date(user.lastLocationUpdate).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="mr-2 text-blue-600" size={20} />
                  <span>Total Deliveries</span>
                </div>
                <span className="font-bold text-lg">{user.totalDeliveries || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="mr-2 text-green-600" size={20} />
                  <span>Total Earnings</span>
                </div>
                <span className="font-bold text-lg">${(user.totalEarnings || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="mr-2 text-purple-600" size={20} />
                  <span>Avg per Delivery</span>
                </div>
                <span className="font-bold text-lg">
                  ${user.totalDeliveries > 0 
                    ? (user.totalEarnings / user.totalDeliveries).toFixed(2) 
                    : '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  user.driverStatus === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : user.driverStatus === 'busy'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.driverStatus || 'offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-semibold">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}