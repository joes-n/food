import { useEffect, useState } from 'react';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Calendar, Award } from 'lucide-react';

export function DriverEarnings() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const loadEarnings = useDriverStore(state => state.loadEarnings);
  const earnings = useDriverStore(state => state.earnings);
  const deliveryHistory = useDriverStore(state => state.deliveryHistory);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    loadEarnings();
  }, [user, navigate, loadEarnings]);

  const stats = [
    {
      title: 'Total Earnings',
      value: `$${earnings.total.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: "Today's Earnings",
      value: `$${earnings.today.toFixed(2)}`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'This Week',
      value: `$${earnings.week.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'This Month',
      value: `$${earnings.month.toFixed(2)}`,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Earnings Dashboard</h1>
        <p className="text-gray-600">Track your delivery earnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Earnings Breakdown</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">Base Delivery Fees</p>
              <p className="text-sm text-gray-600">Earnings from completed deliveries</p>
            </div>
            <p className="font-bold text-lg">${(earnings.week * 0.9).toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">Tips</p>
              <p className="text-sm text-gray-600">Customer tips (10% estimated)</p>
            </div>
            <p className="font-bold text-lg">${(earnings.week * 0.1).toFixed(2)}</p>
          </div>
          <div className="pt-4 border-t flex justify-between font-bold text-xl">
            <span>Total This Week</span>
            <span className="text-green-600">${earnings.week.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Performance Metrics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">
              {deliveryHistory.filter(d => d.status === 'delivered').length}
            </p>
            <p className="text-gray-600">Total Deliveries</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">
              ${earnings.total > 0 ? 
                (earnings.total / deliveryHistory.length).toFixed(2) : '0.00'}
            </p>
            <p className="text-gray-600">Avg per Delivery</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-600">4.8</p>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}
