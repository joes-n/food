import { Package, MapPin, DollarSign, Clock, Navigation } from 'lucide-react';

interface DeliveryCardProps {
  delivery: any;
  onAccept: () => void;
}

export function DeliveryCard({ delivery, onAccept }: DeliveryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Order #{delivery.orderId}</h3>
          <p className="text-gray-600">{delivery.restaurant.name}</p>
        </div>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
          Available
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-start">
          <MapPin className="mr-2 mt-1 text-gray-400" size={16} />
          <div>
            <p className="font-semibold">Pickup</p>
            <p className="text-sm text-gray-600">{delivery.restaurant.address}</p>
          </div>
        </div>
        <div className="flex items-start">
          <MapPin className="mr-2 mt-1 text-gray-400" size={16} />
          <div>
            <p className="font-semibold">Delivery</p>
            <p className="text-sm text-gray-600">{delivery.customer.address}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <DollarSign size={16} className="mr-1" />
            ${delivery.estimatedEarnings}
          </div>
          <div className="flex items-center">
            <Navigation size={16} className="mr-1" />
            {delivery.distance} km
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1" />
            {delivery.estimatedDuration} min
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="btn-primary flex-1 flex items-center justify-center"
        >
          <Package className="mr-2" size={20} />
          Accept Delivery
        </button>
        <button className="btn-secondary">
          Details
        </button>
      </div>
    </div>
  );
}