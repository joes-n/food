# Delivery Driver Dashboard - Implementation Plan

## Overview
Create a comprehensive delivery driver dashboard that enables drivers to manage deliveries, track routes, update statuses, and view earnings. The dashboard integrates with the existing food ordering platform using a hybrid assignment model where drivers can accept/decline suggested deliveries.

## System Architecture Integration

### Current System Components
- **Database**: PostgreSQL with Prisma ORM (Delivery, DeliveryRoute, User tables)
- **Backend**: Express.js with TypeScript, JWT authentication
- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **Real-time**: Socket.io for live updates
- **Authentication**: Role-based access control (RBAC)

### Integration Points
- Leverage existing `User` table with `driver` role
- Use existing `Delivery` and `DeliveryRoute` tables
- Extend existing Socket.io implementation
- Integrate with current order management system
- Use established API patterns and middleware

---

## Backend Implementation

### 1. Database Schema Updates

#### Add Driver Status to User Table
```prisma
// Add to User model in backend/prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  driverStatus      DriverStatus? @default(offline)
  driverLocationLat Float?
  driverLocationLng Float?
  lastLocationUpdate DateTime?
  totalDeliveries   Int?          @default(0)
  totalEarnings     Float?        @default(0)
}

enum DriverStatus {
  offline
  online
  busy
}
```

#### Add Driver Fee to Delivery Table
```prisma
// Add to Delivery model in backend/prisma/schema.prisma
model Delivery {
  id                String         @id @default(uuid())
  orderId           String         @unique
  driverId          String
  pickupTime        DateTime?
  deliveryTime      DateTime?
  status            DeliveryStatus @default(assigned)
  distance          Float?
  estimatedDuration Int?
  driverFee         Float?
  estimatedEarnings Float?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}
```

### 2. New API Endpoints

#### Driver Controller (backend/src/controllers/driverController.ts)
```typescript
import { Request, Response } from 'express';
import { prisma } from '../server';

export const getAvailableDeliveries = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'assigned',
        driverId: driverId
      },
      include: {
        order: {
          include: {
            restaurant: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available deliveries'
    });
  }
};

export const acceptDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: { 
        status: 'picked_up',
        pickupTime: new Date()
      },
      include: {
        order: {
          include: {
            restaurant: true,
            customer: true,
            items: true
          }
        }
      }
    });

    await prisma.user.update({
      where: { id: driverId },
      data: { driverStatus: 'busy' }
    });

    res.json({
      success: true,
      data: delivery,
      message: 'Delivery accepted successfully'
    });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept delivery'
    });
  }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { status } = req.body;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: driverId },
      data: { driverStatus: status }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Driver status updated successfully'
    });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver status'
    });
  }
};

export const updateDriverLocation = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { lat, lng } = req.body;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: driverId },
      data: {
        driverLocationLat: lat,
        driverLocationLng: lng,
        lastLocationUpdate: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
};

export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const updateData: any = { status };
    
    if (status === 'in_transit') {
      updateData.pickupTime = new Date();
    } else if (status === 'delivered') {
      updateData.deliveryTime = new Date();
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            restaurant: true,
            customer: true
          }
        }
      }
    });

    if (status === 'delivered') {
      await prisma.user.update({
        where: { id: driverId },
        data: { 
          driverStatus: 'online',
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: delivery.driverFee || 0 }
        }
      });
    }

    res.json({
      success: true,
      data: delivery,
      message: 'Delivery status updated successfully'
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery status'
    });
  }
};

export const getDriverEarnings = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: {
        totalEarnings: true,
        totalDeliveries: true
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const todayEarnings = await prisma.delivery.aggregate({
      where: {
        driverId,
        status: 'delivered',
        deliveryTime: { gte: today }
      },
      _sum: { driverFee: true }
    });

    const weekEarnings = await prisma.delivery.aggregate({
      where: {
        driverId,
        status: 'delivered',
        deliveryTime: { gte: weekAgo }
      },
      _sum: { driverFee: true }
    });

    const monthEarnings = await prisma.delivery.aggregate({
      where: {
        driverId,
        status: 'delivered',
        deliveryTime: { gte: monthAgo }
      },
      _sum: { driverFee: true }
    });

    res.json({
      success: true,
      data: {
        total: driver?.totalEarnings || 0,
        today: todayEarnings._sum.driverFee || 0,
        week: weekEarnings._sum.driverFee || 0,
        month: monthEarnings._sum.driverFee || 0
      }
    });
  } catch (error) {
    console.error('Get driver earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings'
    });
  }
};
```

#### Driver Routes (backend/src/routes/driverRoutes.ts)
```typescript
import { Router } from 'express';
import {
  getAvailableDeliveries,
  acceptDelivery,
  updateDriverStatus,
  updateDriverLocation,
  updateDeliveryStatus,
  getDriverEarnings
} from '../controllers/driverController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uuidSchema } from '../utils/validations';

const router = Router();
router.use(authenticate);

router.get('/available-deliveries', getAvailableDeliveries);
router.post('/deliveries/:id/accept', validate(uuidSchema), acceptDelivery);
router.put('/status', updateDriverStatus);
router.put('/location', updateDriverLocation);
router.put('/deliveries/:id/status', validate(uuidSchema), updateDeliveryStatus);
router.get('/earnings', getDriverEarnings);

export default router;
```

### 3. Socket.io Events for Drivers

#### Server-Side Events (backend/src/server.ts)
```typescript
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-driver', (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Driver ${driverId} joined their room`);
  });

  socket.on('driver-location-update', (data) => {
    const { orderId, lat, lng } = data;
    
    socket.to(`order-${orderId}`).emit('driver-location-update', {
      orderId,
      lat,
      lng,
      timestamp: new Date()
    });
  });

  socket.on('delivery-status-update', (data) => {
    const { orderId, restaurantId, status } = data;
    
    socket.to(`order-${orderId}`).emit('order-status-update', {
      orderId,
      status,
      timestamp: new Date()
    });
    
    socket.to(`restaurant-${restaurantId}`).emit('order-status-update', {
      orderId,
      status,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

---

## Frontend Implementation

### 1. Driver Service Layer (frontend/src/services/driverService.ts)
```typescript
import api from './api';

export interface DriverStatus {
  status: 'offline' | 'online' | 'busy';
  location?: { lat: number; lng: number };
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  estimatedEarnings: number;
  distance: number;
  estimatedDuration: number;
  status: string;
  pickupTime?: Date;
  deliveryTime?: Date;
}

export const driverService = {
  async getAvailableDeliveries(): Promise<{ success: boolean; data: DeliveryAssignment[] }> {
    const response = await api.get('/driver/available-deliveries');
    return response.data;
  },

  async acceptDelivery(deliveryId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/driver/deliveries/${deliveryId}/accept`);
    return response.data;
  },

  async updateDriverStatus(status: DriverStatus): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/driver/status', status);
    return response.data;
  },

  async updateDriverLocation(location: { lat: number; lng: number }): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/driver/location', location);
    return response.data;
  },

  async updateDeliveryStatus(deliveryId: string, status: string): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/driver/deliveries/${deliveryId}/status`, { status });
    return response.data;
  },

  async getEarnings(): Promise<{ success: boolean; data: { total: number; today: number; week: number; month: number } }> {
    const response = await api.get('/driver/earnings');
    return response.data;
  }
};
```

### 2. Driver Store (frontend/src/store/driverStore.ts)
```typescript
import { create } from 'zustand';
import { driverService, DeliveryAssignment } from '../services/driverService';

interface DriverState {
  driver: any | null;
  status: 'offline' | 'online' | 'busy';
  currentDelivery: DeliveryAssignment | null;
  availableDeliveries: DeliveryAssignment[];
  deliveryHistory: DeliveryAssignment[];
  earnings: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
  location: { lat: number; lng: number } | null;
  isLoading: boolean;
  
  setStatus: (status: 'offline' | 'online' | 'busy') => Promise<void>;
  setLocation: (location: { lat: number; lng: number }) => void;
  acceptDelivery: (deliveryId: string) => Promise<void>;
  updateDeliveryStatus: (status: string) => Promise<void>;
  loadAvailableDeliveries: () => Promise<void>;
  loadDeliveryHistory: () => Promise<void>;
  loadEarnings: () => Promise<void>;
  initializeDriver: () => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  driver: null,
  status: 'offline',
  currentDelivery: null,
  availableDeliveries: [],
  deliveryHistory: [],
  earnings: { total: 0, today: 0, week: 0, month: 0 },
  location: null,
  isLoading: false,

  setStatus: async (status) => {
    set({ isLoading: true });
    try {
      await driverService.updateDriverStatus({ status });
      set({ status, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setLocation: (location) => {
    set({ location });
    driverService.updateDriverLocation(location);
  },

  acceptDelivery: async (deliveryId) => {
    set({ isLoading: true });
    try {
      await driverService.acceptDelivery(deliveryId);
      const delivery = get().availableDeliveries.find(d => d.id === deliveryId);
      if (delivery) {
        set({ 
          currentDelivery: delivery,
          availableDeliveries: get().availableDeliveries.filter(d => d.id !== deliveryId),
          status: 'busy'
        });
      }
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateDeliveryStatus: async (status) => {
    const currentDelivery = get().currentDelivery;
    if (!currentDelivery) return;
    
    set({ isLoading: true });
    try {
      await driverService.updateDeliveryStatus(currentDelivery.id, status);
      set({ 
        currentDelivery: { ...currentDelivery, status },
        isLoading: false 
      });
      
      if (status === 'delivered') {
        set({ 
          currentDelivery: null,
          status: 'online'
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadAvailableDeliveries: async () => {
    set({ isLoading: true });
    try {
      const response = await driverService.getAvailableDeliveries();
      set({ availableDeliveries: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadDeliveryHistory: async () => {
    set({ isLoading: true });
    try {
      const response = await driverService.getMyDeliveries();
      set({ deliveryHistory: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadEarnings: async () => {
    try {
      const response = await driverService.getEarnings();
      set({ earnings: response.data });
    } catch (error) {
      throw error;
    }
  },

  initializeDriver: async () => {
    set({ isLoading: true });
    try {
      await get().loadAvailableDeliveries();
      await get().loadDeliveryHistory();
      await get().loadEarnings();
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
```

### 3. Driver Dashboard Pages

#### Main Dashboard (frontend/src/pages/driver/DriverDashboard.tsx)
```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDriverStore } from '../../store/driverStore';
import { StatusToggle } from '../../components/driver/StatusToggle';
import { DeliveryCard } from '../../components/driver/DeliveryCard';
import { toast } from 'react-toastify';
import { Package, DollarSign, MapPin, Clock } from 'lucide-react';

export function DriverDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const driverStore = useDriverStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user && !token) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    setCheckingAuth(false);
    driverStore.initializeDriver();
  }, [user, navigate, driverStore]);

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      await driverStore.acceptDelivery(deliveryId);
      toast.success('Delivery accepted successfully');
      navigate(`/driver/delivery/${deliveryId}`);
    } catch (error) {
      toast.error('Failed to accept delivery');
    }
  };

  if (checkingAuth || driverStore.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Driver Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <StatusToggle />
      </div>

      {driverStore.currentDelivery && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Current Delivery</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {driverStore.currentDelivery.status}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2 flex items-center">
                <Package className="mr-2" size={20} />
                Order #{driverStore.currentDelivery.orderId}
              </h3>
              <p className="text-gray-600">{driverStore.currentDelivery.restaurant.name}</p>
              <p className="text-gray-600">{driverStore.currentDelivery.customer.address}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${driverStore.currentDelivery.estimatedEarnings}
                </p>
                <p className="text-gray-600">Estimated Earnings</p>
              </div>
              <button
                onClick={() => navigate(`/driver/delivery/${driverStore.currentDelivery.id}`)}
                className="btn-primary"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {driverStore.status === 'online' && !driverStore.currentDelivery && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Available Deliveries ({driverStore.availableDeliveries.length})</h2>
          <div className="grid gap-4">
            {driverStore.availableDeliveries.map(delivery => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onAccept={() => handleAcceptDelivery(delivery.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Earnings</p>
              <p className="text-3xl font-bold">${driverStore.earnings.today.toFixed(2)}</p>
            </div>
            <DollarSign className="text-green-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed Today</p>
              <p className="text-3xl font-bold">
                {driverStore.deliveryHistory.filter(d => {
                  const today = new Date().toDateString();
                  return new Date(d.deliveryTime || d.createdAt).toDateString() === today;
                }).length}
              </p>
            </div>
            <Package className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Earnings</p>
              <p className="text-3xl font-bold">${driverStore.earnings.total.toFixed(2)}</p>
            </div>
            <DollarSign className="text-purple-600" size={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Delivery Details (frontend/src/pages/driver/DeliveryDetails.tsx)
```typescript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { trackingService } from '../../services/trackingService';
import { toast } from 'react-toastify';
import { Package, MapPin, Phone, Clock, Navigation } from 'lucide-react';

export function DeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const driverStore = useDriverStore();
  const user = useAuthStore(state => state.user);
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    const foundDelivery = driverStore.currentDelivery || 
      driverStore.deliveryHistory.find(d => d.id === id);
    
    if (foundDelivery) {
      setDelivery(foundDelivery);
    }
    setLoading(false);
  }, [id, user, navigate, driverStore]);

  useEffect(() => {
    if (delivery && delivery.status === 'in_transit') {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          driverStore.setLocation({ lat: latitude, lng: longitude });
          trackingService.updateDriverLocation(delivery.orderId, latitude, longitude);
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [delivery, driverStore]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await driverStore.updateDeliveryStatus(newStatus);
      toast.success(`Delivery status updated to ${newStatus}`);
      
      if (newStatus === 'delivered') {
        navigate('/driver/dashboard');
      }
    } catch (error) {
      toast.error('Failed to update delivery status');
    }
  };

  const getStatusButtonConfig = () => {
    switch (delivery?.status) {
      case 'assigned':
        return {
          text: 'Mark as Picked Up',
          nextStatus: 'picked_up',
          color: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'picked_up':
        return {
          text: 'Start Delivery',
          nextStatus: 'in_transit',
          color: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'in_transit':
        return {
          text: 'Mark as Delivered',
          nextStatus: 'delivered',
          color: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Delivery Not Found</h2>
          <button onClick={() => navigate('/driver/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const buttonConfig = getStatusButtonConfig();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Delivery Details</h1>
        <p className="text-gray-600">Order #{delivery.orderId}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <MapPin className="mr-2" size={24} />
            Pickup Location
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">{delivery.restaurant.name}</p>
              <p className="text-gray-600">{delivery.restaurant.address}</p>
            </div>
            <div className="flex items-center">
              <Phone className="mr-2" size={16} />
              <a href={`tel:${delivery.restaurant.phone}`} className="text-blue-600">
                {delivery.restaurant.phone}
              </a>
            </div>
            <a
              href={`https://maps.google.com/?q=${delivery.restaurant.latitude},${delivery.restaurant.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center"
            >
              <Navigation className="mr-2" size={16} />
              Get Directions
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <MapPin className="mr-2" size={24} />
            Delivery Location
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">{delivery.customer.name}</p>
              <p className="text-gray-600">{delivery.customer.address}</p>
            </div>
            <div className="flex items-center">
              <Phone className="mr-2" size={16} />
              <a href={`tel:${delivery.customer.phone}`} className="text-blue-600">
                {delivery.customer.phone}
              </a>
            </div>
            <a
              href={`https://maps.google.com/?q=${delivery.customer.latitude},${delivery.customer.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center"
            >
              <Navigation className="mr-2" size={16} />
              Get Directions
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Package className="mr-2" size={24} />
            Order Items
          </h2>
          <div className="space-y-2">
            {delivery.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between py-2 border-b">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${delivery.total.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-green-600 font-bold">
            <span>Your Earnings</span>
            <span>${delivery.estimatedEarnings.toFixed(2)}</span>
          </div>
        </div>

        {buttonConfig && (
          <div className="lg:col-span-2">
            <button
              onClick={() => handleStatusUpdate(buttonConfig.nextStatus)}
              className={`w-full ${buttonConfig.color} text-white py-4 px-6 rounded-lg font-bold text-lg`}
            >
              {buttonConfig.text}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Delivery History (frontend/src/pages/driver/DeliveryHistory.tsx)
```typescript
import { useEffect, useState } from 'react';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, Calendar, Filter } from 'lucide-react';

export function DeliveryHistory() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const driverStore = useDriverStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    driverStore.loadDeliveryHistory();
  }, [user, navigate, driverStore]);

  const filteredDeliveries = driverStore.deliveryHistory.filter(delivery => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toDateString();
      return new Date(delivery.createdAt).toDateString() === today;
    }
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(delivery.createdAt) >= weekAgo;
    }
    return delivery.status === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Delivery History</h1>
        <p className="text-gray-600">Track your completed deliveries</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="text-gray-600" size={20} />
          {['all', 'today', 'week', 'delivered', 'cancelled'].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-4 py-2 rounded ${
                filter === option
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">No deliveries found</p>
          </div>
        ) : (
          filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Order #{delivery.orderId}</h3>
                  <p className="text-gray-600">
                    {new Date(delivery.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  delivery.status === 'delivered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {delivery.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Restaurant</p>
                  <p className="font-semibold">{delivery.restaurant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">{delivery.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-semibold">{delivery.distance} km</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center text-green-600 font-bold">
                  <DollarSign size={20} className="mr-1" />
                  ${delivery.estimatedEarnings.toFixed(2)}
                </div>
                <button
                  onClick={() => navigate(`/driver/delivery/${delivery.id}`)}
                  className="btn-secondary"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

#### Driver Earnings (frontend/src/pages/driver/DriverEarnings.tsx)
```typescript
import { useEffect, useState } from 'react';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Calendar, Award } from 'lucide-react';

export function DriverEarnings() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const driverStore = useDriverStore();
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/');
      return;
    }

    driverStore.loadEarnings();
  }, [user, navigate, driverStore]);

  const stats = [
    {
      title: 'Total Earnings',
      value: `$${driverStore.earnings.total.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: "Today's Earnings",
      value: `$${driverStore.earnings.today.toFixed(2)}`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'This Week',
      value: `$${driverStore.earnings.week.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'This Month',
      value: `$${driverStore.earnings.month.toFixed(2)}`,
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
            <p className="font-bold text-lg">${(driverStore.earnings.week * 0.9).toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">Tips</p>
              <p className="text-sm text-gray-600">Customer tips (10% estimated)</p>
            </div>
            <p className="font-bold text-lg">${(driverStore.earnings.week * 0.1).toFixed(2)}</p>
          </div>
          <div className="pt-4 border-t flex justify-between font-bold text-xl">
            <span>Total This Week</span>
            <span className="text-green-600">${driverStore.earnings.week.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Performance Metrics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">
              {driverStore.deliveryHistory.filter(d => d.status === 'delivered').length}
            </p>
            <p className="text-gray-600">Total Deliveries</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">
              ${driverStore.earnings.total > 0 ? 
                (driverStore.earnings.total / driverStore.deliveryHistory.length).toFixed(2) : '0.00'}
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
```

### 4. Driver Components

#### Status Toggle Component (frontend/src/components/driver/StatusToggle.tsx)
```typescript
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
```

#### Delivery Card Component (frontend/src/components/driver/DeliveryCard.tsx)
```typescript
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
```

---

## Routing Configuration

### Update App.tsx
```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { RestaurantList } from './pages/RestaurantList';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';
import { TrackOrderStatus } from './pages/TrackOrderStatus';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Navbar } from './components/Navbar';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { RestaurantEdit } from './pages/owner/RestaurantEdit';
import { MenuManagement } from './pages/owner/MenuManagement';
import { OrderManagement } from './pages/owner/OrderManagement';
import { Earnings } from './pages/owner/Earnings';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DeliveryDetails } from './pages/driver/DeliveryDetails';
import { DeliveryHistory } from './pages/driver/DeliveryHistory';
import { DriverEarnings } from './pages/driver/DriverEarnings';
import { DriverProfile } from './pages/driver/DriverProfile';
import './App.css';

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<RestaurantList />} />
          <Route path="/restaurants" element={<RestaurantList />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track-order" element={<TrackOrderStatus />} />
          <Route path="/orders/:id" element={<OrderTracking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/edit" element={<RestaurantEdit />} />
          <Route path="/owner/menu" element={<MenuManagement />} />
          <Route path="/owner/orders" element={<OrderManagement />} />
          <Route path="/owner/earnings" element={<Earnings />} />
          
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/delivery/:id" element={<DeliveryDetails />} />
          <Route path="/driver/history" element={<DeliveryHistory />} />
          <Route path="/driver/earnings" element={<DriverEarnings />} />
          <Route path="/driver/profile" element={<DriverProfile />} />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 LettucEat. No rights reserved :/</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
```

---

## Security & Authorization

### 1. Middleware Updates
```typescript
// backend/src/middleware/driverAuth.ts
import { Request, Response, NextFunction } from 'express';

export const requireDriver = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'driver') {
    return res.status(403).json({
      success: false,
      error: 'Driver access required'
    });
  }
  next();
};
```

### 2. Frontend Route Protection
```typescript
// frontend/src/components/ProtectedDriverRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedDriverRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'driver') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
```

---

## Testing Strategy

### 1. Backend Tests
```typescript
// backend/src/tests/driverController.test.ts
import request from 'supertest';
import app from '../server';
import { prisma } from '../server';

describe('Driver Controller', () => {
  let driverToken: string;
  let deliveryId: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'driver@test.com',
        password: 'password123'
      });
    
    driverToken = loginResponse.body.data.token;
  });

  describe('GET /api/driver/available-deliveries', () => {
    it('should return available deliveries for authenticated driver', async () => {
      const response = await request(app)
        .get('/api/driver/available-deliveries')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/driver/available-deliveries');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/driver/deliveries/:id/accept', () => {
    it('should allow driver to accept delivery', async () => {
      const delivery = await prisma.delivery.create({
        data: {
          orderId: 'test-order-id',
          driverId: 'test-driver-id',
          status: 'assigned'
        }
      });

      const response = await request(app)
        .post(`/api/driver/deliveries/${delivery.id}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('picked_up');
    });
  });
});
```

---

## Phase 2 Enhancements (Future)

### Advanced Features
1. **Route Optimization**: Integration with Google Maps/Mapbox for optimal routes
2. **Push Notifications**: Native push notifications for new assignments
3. **Driver Ratings**: Customer rating system for drivers
4. **Advanced Analytics**: Detailed performance metrics and insights
5. **Scheduling**: Driver shift scheduling and management
6. **Multi-stop Deliveries**: Batch delivery assignments
7. **Driver Wallet**: In-app earnings management and instant payouts
8. **Document Management**: License, insurance, vehicle registration
9. **Heat Maps**: High-demand area identification
10. **Driver Incentives**: Bonus and promotion system

---

## Implementation Priority

### MVP Features (Must Have)
- ✅ Driver authentication and dashboard access
- ✅ Online/offline status management
- ✅ Available delivery listings
- ✅ Accept/decline delivery functionality
- ✅ Delivery status updates
- ✅ Basic earnings tracking
- ✅ Real-time location sharing
- ✅ Delivery history view

### Phase 2 Features (Should Have)
- Advanced route mapping and navigation
- Driver ratings and reviews
- Detailed analytics and insights
- Push notifications
- Driver wallet and instant payouts

### Phase 3 Features (Nice to Have)
- Driver scheduling system
- Multi-stop delivery optimization
- Advanced incentive programs
- Driver community features

---

## File Structure
```
backend/
├── src/
│   ├── controllers/
│   │   └── driverController.ts
│   ├── routes/
│   │   └── driverRoutes.ts
│   └── middleware/
│       └── driverAuth.ts

frontend/
├── src/
│   ├── pages/
│   │   └── driver/
│   │       ├── DriverDashboard.tsx
│   │       ├── DeliveryDetails.tsx
│   │       ├── DeliveryHistory.tsx
│   │       ├── DriverEarnings.tsx
│   │       └── DriverProfile.tsx
│   ├── components/
│   │   └── driver/
│   │       ├── StatusToggle.tsx
│   │       ├── DeliveryCard.tsx
│   │       ├── RouteMap.tsx
│   │       └── EarningsChart.tsx
│   ├── services/
│   │   └── driverService.ts
│   └── store/
│       └── driverStore.ts
```

---

## Success Metrics
- Driver onboarding time
- Average delivery acceptance rate
- Delivery completion rate
- Driver retention rate
- Average delivery time
- Customer satisfaction scores
- Driver earnings growth

---

## Dependencies
- Existing authentication system
- Current order management infrastructure
- Real-time Socket.io implementation
- Database schema extensions
- Geolocation API access
- Map service integration (Phase 2)

---

## Risk Mitigation
1. **Location Privacy**: Clear opt-in for location sharing with privacy controls
2. **Driver Availability**: Implement timeout for inactive drivers
3. **Delivery Conflicts**: Handle race conditions for multiple drivers accepting same delivery
4. **Network Issues**: Offline mode and sync when connection restored
5. **Battery Drain**: Optimize location update frequency

---

This plan provides a comprehensive roadmap for implementing a production-ready driver dashboard that integrates seamlessly with the existing food ordering platform while providing drivers with the tools they need to efficiently manage their deliveries.