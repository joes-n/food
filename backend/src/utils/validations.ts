import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Auth validations
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    role: z.enum(['customer', 'restaurant_owner', 'driver', 'admin']),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'Password too long'),
  }),
});

// User validations
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
    role: z.enum(['customer', 'restaurant_owner', 'driver', 'admin']).optional(),
  }),
});

// Generic validations
export const uuidSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)).pipe(z.number().min(1)),
    pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)).pipe(z.number().min(1).max(100)),
  }),
});

// Restaurant validations
export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    cuisine: z.string().min(2, 'Cuisine is required'),
    address: z.string().min(5, 'Address is required'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional(),
    priceRange: z.enum(['budget', 'medium', 'premium']),
    deliveryFee: z.number().min(0).default(0),
    minOrderAmount: z.number().min(0).default(0),
    estimatedDeliveryTime: z.number().min(15).max(180),
  }),
});

export const updateRestaurantSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid restaurant ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    cuisine: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional(),
    priceRange: z.enum(['budget', 'medium', 'premium']).optional(),
    deliveryFee: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).optional(),
    estimatedDeliveryTime: z.number().min(15).max(180).optional(),
    isOpen: z.boolean().optional(),
  }),
});

// Order validations
export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid('Invalid restaurant ID'),
    items: z.array(
      z.object({
        menuItemId: z.string().uuid('Invalid menu item ID'),
        quantity: z.number().min(1),
        customizations: z
          .array(
            z.object({
              customizationId: z.string().uuid(),
              optionId: z.string().uuid(),
            })
          )
          .optional(),
      })
    ),
    deliveryAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      instructions: z.string().optional(),
    }),
    paymentMethod: z.enum(['card', 'digital_wallet', 'cash_on_delivery']),
    scheduledFor: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum([
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ]),
  }),
});

// Review validations
export const createReviewSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    rating: z.number().min(1).max(5),
    comment: z.string().max(500).optional(),
  }),
});

// Chat validations
export const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid('Invalid receiver ID'),
    message: z.string().min(1).max(1000),
  }),
});

// Promo code validations
export const validatePromoCodeSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    orderAmount: z.number().min(0),
  }),
});
