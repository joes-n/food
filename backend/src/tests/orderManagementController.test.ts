import { Request, Response } from 'express';
import {
  getRestaurantOrders,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
} from '../controllers/orderManagementController';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Mock prisma
jest.mock('../server', () => ({
  prisma: {
    restaurant: {
      findUnique: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../server';

describe('Order Management Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    jest.clearAllMocks();

    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {};
    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };
  });

  describe('getRestaurantOrders', () => {
    it('should fetch restaurant orders successfully', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockOrders = [
        {
          id: 'order-1',
          restaurantId: 'rest-1',
          status: 'pending',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          customer: {
            id: 'customer-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
          },
          items: [
            {
              id: 'item-1',
              menuItem: {
                id: 'menu-item-1',
                name: 'Burger',
              },
              customizations: [
                {
                  id: 'custom-1',
                  option: {
                    id: 'opt-1',
                    name: 'Large',
                  },
                },
              ],
            },
          ],
          payment: {
            id: 'payment-1',
            amount: 25.99,
          },
          driver: {
            id: 'driver-1',
            name: 'Mike Driver',
            phone: '555-5678',
          },
        },
      ];

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.query = { restaurantId: 'rest-1' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              menuItem: true,
              customizations: {
                include: {
                  option: true,
                },
              },
            },
          },
          payment: true,
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            ...mockOrders[0],
            deliveryAddress: '123 Main St, Anytown, CA 12345',
          },
        ],
      });
    });

    it('should fetch orders with status filter', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockOrders = [
        {
          id: 'order-1',
          restaurantId: 'rest-1',
          status: 'confirmed',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          customer: {
            id: 'customer-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
          },
          items: [],
          payment: null,
          driver: null,
        },
      ];

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.query = { restaurantId: 'rest-1', status: 'confirmed' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
          status: 'confirmed',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              menuItem: true,
              customizations: {
                include: {
                  option: true,
                },
              },
            },
          },
          payment: true,
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should allow admin to view orders for any restaurant', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
      };

      const mockOrders = [
        {
          id: 'order-1',
          restaurantId: 'rest-1',
          status: 'pending',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          customer: {
            id: 'customer-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
          },
          items: [],
          payment: null,
          driver: null,
        },
      ];

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.query = { restaurantId: 'rest-1' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findMany).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            ...mockOrders[0],
            deliveryAddress: '123 Main St, Anytown, CA 12345',
          },
        ],
      });
    });

    it('should return empty array when no orders found', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.query = { restaurantId: 'rest-1' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.query = { restaurantId: 'rest-1' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.query = { restaurantId: 'nonexistent' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.query = { restaurantId: 'rest-1' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to view orders for this restaurant',
      });
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.query = { restaurantId: 'rest-1' };

      await getRestaurantOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch orders',
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        status: 'confirmed',
        restaurantId: 'rest-1',
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        items: [],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          restaurant: true,
        },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'confirmed' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order status updated successfully',
      });
    });

    it('should allow admin to update any order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'owner-1',
        },
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        status: 'cancelled',
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        items: [],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'cancelled' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.update).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order status updated successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'owner-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to update this order',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update order status',
      });
    });
  });

  describe('acceptOrder', () => {
    it('should accept pending order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        status: 'confirmed',
        restaurantId: 'rest-1',
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          restaurant: true,
        },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'confirmed' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order accepted successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'order-1' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'nonexistent' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'owner-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 400 if order is not pending', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'confirmed',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Only pending orders can be accepted',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should reject order with status preparing', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'preparing',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Only pending orders can be accepted',
      });
    });

    it('should return 500 on database error during find', async () => {
      (prisma.order.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to accept order',
      });
    });

    it('should return 500 on database error during update', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await acceptOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to accept order',
      });
    });
  });

  describe('rejectOrder', () => {
    it('should reject pending order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        status: 'cancelled',
        restaurantId: 'rest-1',
        customer: {
          id: 'customer-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          restaurant: true,
        },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'cancelled' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order rejected successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'nonexistent' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'owner-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 400 if order is not pending', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'confirmed',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Only pending orders can be rejected',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should reject order with status preparing', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'preparing',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Only pending orders can be rejected',
      });
    });

    it('should reject order with status ready_for_pickup', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'ready_for_pickup',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Only pending orders can be rejected',
      });
    });

    it('should return 500 on database error during find', async () => {
      (prisma.order.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to reject order',
      });
    });

    it('should return 500 on database error during update', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await rejectOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to reject order',
      });
    });
  });
});
