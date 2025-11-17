// Shared TypeScript types used across frontend and backend

export enum UserRole {
  CUSTOMER = 'customer',
  RESTAURANT_OWNER = 'restaurant_owner',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CARD = 'card',
  DIGITAL_WALLET = 'digital_wallet',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  cuisine: string;
  rating: number;
  totalReviews: number;
  priceRange: 'budget' | 'medium' | 'premium';
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  ownerId: string;
  isActive: boolean;
  isOpen: boolean;
  openingHours: OpeningHours[];
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface OpeningHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isClosed: boolean;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number; // in minutes
  customizations?: MenuItemCustomization[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number; // additional cost (can be negative)
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  driverId?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: DeliveryAddress;
  scheduledFor?: Date;
  notes?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  reviewId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  customizations?: SelectedCustomization[];
  subtotal: number;
}

export interface SelectedCustomization {
  customizationId: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

export interface DeliveryAddress {
  street: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  pickupTime?: Date;
  deliveryTime?: Date;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  route?: DeliveryRoute;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryRoute {
  pickup: DeliveryAddress;
  destination: DeliveryAddress;
  distance: number; // in km
  estimatedDuration: number; // in minutes
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorite {
  id: string;
  customerId: string;
  restaurantId: string;
  createdAt: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Socket.io event types
export interface LocationUpdate {
  orderId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  timestamp: Date;
}
