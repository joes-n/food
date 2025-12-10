export type UserRole = 'customer' | 'restaurant_owner' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  driverLocationLat?: number;
  driverLocationLng?: number;
  lastLocationUpdate?: string;
  driverStatus?: 'offline' | 'online' | 'busy';
}
