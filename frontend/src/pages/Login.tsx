import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await authService.login(formData);
      if (response.success) {
        login(response.data.token, response.data.user);
        toast.success('Login successful!');
        // Redirect based on user role
        if (response.data.user.role === 'restaurant_owner') {
          navigate('/owner/dashboard');
        } else if (response.data.user.role === 'driver') {
          navigate('/driver/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      // The API returns { success: false, error: "Invalid email or password" }
      // axios wraps this in error.response.data
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      // Show "Incorrect password" for authentication errors (no account or wrong password)
      if (
        errorMsg.toLowerCase().includes('invalid') ||
        errorMsg.toLowerCase().includes('incorrect') ||
        errorMsg.toLowerCase().includes('credentials') ||
        errorMsg.toLowerCase().includes('password') ||
        errorMsg.toLowerCase().includes('email') ||
        errorMsg.toLowerCase().includes('not found')
      ) {
        setErrorMessage('Incorrect password');
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-gray-600 mt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign up
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                className="input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="text-red-600 text-sm font-medium">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
