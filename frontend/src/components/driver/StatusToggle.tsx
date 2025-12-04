import { useState } from 'react';
import { useDriverStore } from '../../store/driverStore';
import { toast } from 'react-toastify';
import { Power, Wifi, WifiOff } from 'lucide-react';

export function StatusToggle() {
  const driverStore = useDriverStore();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const newStatus = driverStore.status === 'online' ? 'offline' : 'online';
      await driverStore.setStatus(newStatus);
      toast.success(`You are now ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  const isOnline = driverStore.status === 'online';
  const isBusy = driverStore.status === 'busy';

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="text-green-600" size={20} />
        ) : (
          <WifiOff className="text-gray-400" size={20} />
        )}
        <span className={`font-semibold ${
          isOnline ? 'text-green-600' : 'text-gray-600'
        }`}>
          {isBusy ? 'Busy' : isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={isToggling || isBusy}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
          isOnline ? 'bg-green-600' : 'bg-gray-300'
        } ${(isToggling || isBusy) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            isOnline ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      
      <Power 
        className={`${isOnline ? 'text-green-600' : 'text-gray-400'}`} 
        size={20} 
      />
    </div>
  );
}