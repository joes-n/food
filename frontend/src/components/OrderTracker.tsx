import { useOrderTracking, OrderStatus } from '../hooks/useOrderTracking';

interface OrderTrackerProps {
  orderId: string;
  orderStatus: string;
  estimatedDeliveryTime?: string;
  driverLocation?: { lat: number; lng: number };
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', description: 'Your order has been placed' },
  { key: 'confirmed', label: 'Confirmed', description: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', description: 'Restaurant is preparing your food' },
  { key: 'ready_for_pickup', label: 'Ready', description: 'Order is ready' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Your order is on the way' },
  { key: 'delivered', label: 'Delivered', description: 'Order delivered successfully' },
];

export function OrderTracker({ orderId, orderStatus }: OrderTrackerProps) {
  const { orderStatus: trackedStatus, driverLocation } = useOrderTracking(orderId);

  const currentStatus = trackedStatus?.status || orderStatus;
  const currentStepIndex = statusSteps.findIndex((step) => step.key === currentStatus);

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-bold mb-6">Track Your Order</h3>

      <div className="relative">
        {statusSteps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div key={step.key} className="flex items-start mb-8 last:mb-0">
              {/* Step indicator */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 relative z-10">
                {status === 'completed' ? (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : status === 'current' ? (
                  <div className="w-6 h-6 rounded-full bg-primary-500 animate-pulse"></div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                )}
              </div>

              {/* Connection line */}
              {index < statusSteps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}

              {/* Step content */}
              <div className="ml-4">
                <h4 className={`font-semibold ${
                  status === 'completed' || status === 'current' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.label}
                </h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver location */}
      {driverLocation && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900">Driver is on the way</p>
              <p className="text-sm text-blue-700">
                Live location tracking active
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
