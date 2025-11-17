import { Request, Response } from 'express';
import {
  createOrder,
  getOrder,
  getMyOrders,
  updateOrderStatus,
  assignDriver,
  cancelOrder,
} from '../controllers/orderController';

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
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItem: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    delivery: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../server';

describe('Order Controller', () => {
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

  describe('createOrder', () => {
    const validOrderData = {
      restaurantId: 'rest-1',
      items: [
        {
          menuItemId: 'item-1',
          quantity: 2,
          customizations: [
            {
              customizationId: 'custom-1',
              optionId: 'opt-1',
              optionName: 'Large',
              priceModifier: 2.0,
            },
          ],
        },
      ],
      deliveryAddress: {
        street: '123 Main St',
        latitude: 37.7749,
        longitude: -122.4194,
        instructions: 'Leave at door',
      },
      paymentMethod: 'credit_card',
      scheduledFor: null,
      notes: 'No onions please',
    };

    it('should create order successfully', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
        isOpen: true,
        minOrderAmount: 10,
        deliveryFee: 3.99,
      };

      const mockMenuItem = {
        id: 'item-1',
        name: 'Burger',
        price: 12.99,
        isAvailable: true,
        customizations: [
          {
            id: 'custom-1',
            name: 'Size',
            options: [
              {
                id: 'opt-1',
                name: 'Large',
                priceModifier: 2.0,
              },
            ],
          },
        ],
      };

      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        restaurantId: 'rest-1',
        subtotal: 29.98,
        deliveryFee: 3.99,
        tax: 2.4,
        total: 36.37,
        status: 'pending',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        deliveryStreet: '123 Main St',
        deliveryCountry: 'USA',
        deliveryLatitude: 37.7749,
        deliveryLongitude: -122.4194,
        deliveryInstructions: 'Leave at door',
        scheduledFor: null,
        notes: 'No onions please',
        items: [
          {
            id: 'order-item-1',
            menuItemId: 'item-1',
            menuItemName: 'Burger',
            price: 14.99,
            quantity: 2,
            subtotal: 29.98,
            customizations: [
              {
                id: 'custom-item-1',
                customizationId: 'custom-1',
                optionId: 'opt-1',
                optionName: 'Large',
                priceModifier: 2.0,
              },
            ],
          },
        ],
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
          estimatedDeliveryTime: 30,
        },
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = validOrderData;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });
      expect(prisma.order.create).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order created successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = validOrderData;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = validOrderData;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
    });

    it('should return 400 if restaurant is closed', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
        isOpen: false,
        minOrderAmount: 10,
        deliveryFee: 3.99,
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = validOrderData;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant is currently closed',
      });
    });

    it('should return 404 if menu item not found', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
        isOpen: true,
        minOrderAmount: 10,
        deliveryFee: 3.99,
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = validOrderData;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu item not found: item-1',
      });
    });

    it('should return 400 if menu item is not available', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
        isOpen: true,
        minOrderAmount: 10,
        deliveryFee: 3.99,
      };

      const mockMenuItem = {
        id: 'item-1',
        name: 'Burger',
        price: 12.99,
        isAvailable: false,
        customizations: [],
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = validOrderData;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu item Burger is not available',
      });
    });

    it('should return 400 if minimum order amount not met', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
        isOpen: true,
        minOrderAmount: 50,
        deliveryFee: 3.99,
      };

      const mockMenuItem = {
        id: 'item-1',
        name: 'Burger',
        price: 12.99,
        isAvailable: true,
        customizations: [],
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);

      const orderDataWithSmallQuantity = {
        ...validOrderData,
        items: [{ menuItemId: 'item-1', quantity: 1, customizations: [] }],
      };

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = orderDataWithSmallQuantity;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Minimum order amount is $50',
      });
    });

    it('should return 500 on database error', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
        isOpen: true,
        minOrderAmount: 10,
        deliveryFee: 3.99,
      };

      const mockMenuItem = {
        id: 'item-1',
        name: 'Burger',
        price: 12.99,
        isAvailable: true,
        customizations: [],
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.order.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const orderDataWithNoCustomizations = {
        ...validOrderData,
        items: [{ menuItemId: 'item-1', quantity: 1, customizations: [] }],
      };

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = orderDataWithNoCustomizations;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create order',
      });
    });

    it('should handle scheduled orders', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
        isOpen: true,
        minOrderAmount: 10,
        deliveryFee: 3.99,
      };

      const mockMenuItem = {
        id: 'item-1',
        name: 'Burger',
        price: 12.99,
        isAvailable: true,
        customizations: [],
      };

      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        restaurantId: 'rest-1',
        subtotal: 12.99,
        deliveryFee: 3.99,
        tax: 1.04,
        total: 18.02,
        status: 'pending',
        scheduledFor: new Date('2025-12-31T18:00:00Z'),
        items: [],
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
          estimatedDeliveryTime: 30,
        },
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

      const orderDataWithSchedule = {
        ...validOrderData,
        scheduledFor: '2025-12-31T18:00:00Z',
        items: [{ menuItemId: 'item-1', quantity: 1, customizations: [] }],
      };

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.body = orderDataWithSchedule;

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Order created successfully',
      });
    });
  });

  describe('getOrder', () => {
    it('should fetch order by id successfully as customer', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        restaurantId: 'rest-1',
        status: 'pending',
        deliveryStreet: '123 Main St',
        items: [
          {
            id: 'order-item-1',
            menuItemId: 'item-1',
            menuItemName: 'Burger',
            price: 12.99,
            quantity: 2,
            subtotal: 25.98,
            customizations: [],
            menuItem: {
              image: 'burger.jpg',
            },
          },
        ],
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
          logo: 'logo.png',
          phone: '123-456-7890',
          ownerId: 'owner-1',
        },
        driver: null,
        payment: null,
        delivery: null,
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          items: {
            include: {
              customizations: true,
              menuItem: {
                select: {
                  image: true,
                },
              },
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
              phone: true,
              ownerId: true,
            },
          },
          payment: true,
          delivery: {
            include: {
              driver: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
              route: true,
            },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockOrder,
          deliveryAddress: '123 Main St',
        },
      });
    });

    it('should fetch order successfully as restaurant owner', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        restaurantId: 'rest-1',
        status: 'preparing',
        deliveryStreet: '123 Main St',
        items: [],
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
          logo: 'logo.png',
          phone: '123-456-7890',
          ownerId: 'user-1',
        },
        driver: {
          id: 'driver-1',
          name: 'John Driver',
          phone: '555-1234',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockOrder,
          deliveryAddress: '123 Main St',
        },
      });
    });

    it('should fetch order successfully as driver', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        restaurantId: 'rest-1',
        status: 'out_for_delivery',
        deliveryStreet: '123 Main St',
        items: [],
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
          logo: 'logo.png',
          phone: '123-456-7890',
          ownerId: 'owner-1',
        },
        driver: {
          id: 'user-1',
          name: 'John Driver',
          phone: '555-1234',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'driver@example.com', role: 'driver' };
      mockRequest.params = { id: 'order-1' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockOrder,
          deliveryAddress: '123 Main St',
        },
      });
    });

    it('should fetch order successfully as admin', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        restaurantId: 'rest-1',
        status: 'pending',
        deliveryStreet: '123 Main St',
        items: [],
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
          logo: 'logo.png',
          phone: '123-456-7890',
          ownerId: 'owner-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'order-1' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockOrder,
          deliveryAddress: '123 Main St',
        },
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'order-1' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should return 404 if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'nonexistent' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found',
      });
    });

    it('should return 403 if not authorized to view order', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-2',
        restaurantId: 'rest-1',
        status: 'pending',
        deliveryStreet: '123 Main St',
        items: [],
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
          logo: 'logo.png',
          phone: '123-456-7890',
          ownerId: 'owner-1',
        },
        driver: {
          id: 'driver-1',
          name: 'John Driver',
          phone: '555-1234',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to view this order',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.order.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await getOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch order',
      });
    });
  });

  describe('getMyOrders', () => {
    it('should fetch orders for customer', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'user-1',
          restaurantId: 'rest-1',
          status: 'pending',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          items: [],
          restaurant: {
            id: 'rest-1',
            name: 'Test Restaurant',
            logo: 'logo.png',
          },
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.query = {};

      await getMyOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'user-1',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          items: true,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            ...mockOrders[0],
            deliveryAddress: '123 Main St',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should fetch orders for restaurant owner', async () => {
      const mockRestaurant = { id: 'rest-1' };

      const mockOrders = [
        {
          id: 'order-1',
          restaurantId: 'rest-1',
          status: 'pending',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          items: [],
          restaurant: {
            id: 'rest-1',
            name: 'Test Restaurant',
            logo: 'logo.png',
          },
        },
      ];

      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.query = {};

      await getMyOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          items: true,
        },
      });
    });

    it('should fetch orders for driver', async () => {
      const mockOrders = [
        {
          id: 'order-1',
            status: 'out_for_delivery',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          items: [],
          restaurant: {
            id: 'rest-1',
            name: 'Test Restaurant',
            logo: 'logo.png',
          },
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      mockRequest.user = { id: 'user-1', email: 'driver@example.com', role: 'driver' };
      mockRequest.query = {};

      await getMyOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          delivery: {
            driverId: 'user-1',
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          items: true,
        },
      });
    });

    it('should filter orders by status', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          status: 'pending',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          items: [],
          restaurant: {
            id: 'rest-1',
            name: 'Test Restaurant',
            logo: 'logo.png',
          },
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.query = { status: 'pending' };

      await getMyOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'user-1',
          status: 'pending',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          items: true,
        },
      });
    });

    it('should handle pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          status: 'pending',
          deliveryStreet: '123 Main St',
          deliveryCity: 'Anytown',
          deliveryState: 'CA',
          deliveryZipCode: '12345',
          items: [],
          restaurant: {
            id: 'rest-1',
            name: 'Test Restaurant',
            logo: 'logo.png',
          },
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.order.count as jest.Mock).mockResolvedValue(25);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.query = { page: '2', pageSize: '20' };

      await getMyOrders(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'user-1',
        },
        skip: 20,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          items: true,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            ...mockOrders[0],
            deliveryAddress: '123 Main St',
          },
        ],
        pagination: {
          page: 2,
          pageSize: 20,
          total: 25,
          totalPages: 2,
        },
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.query = {};

      await getMyOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.order.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.query = {};

      await getMyOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch orders',
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully by restaurant owner', async () => {
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
        items: [],
        restaurant: {
          name: 'Test Restaurant',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: 'confirmed',
        },
        include: {
          items: true,
          restaurant: {
            select: {
              name: true,
            },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order status updated successfully',
      });
    });

    it('should update order status successfully by driver', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'ready_for_pickup',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'owner-1',
        },
        delivery: {
          driverId: 'user-1',
        },
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        status: 'out_for_delivery',
        items: [],
        restaurant: {
          name: 'Test Restaurant',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      mockRequest.user = { id: 'user-1', email: 'driver@example.com', role: 'driver' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'out_for_delivery' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.update).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order status updated successfully',
      });
    });

    it('should update order status successfully by admin', async () => {
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
        items: [],
        restaurant: {
          name: 'Test Restaurant',
        },
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

    it('should set actualDeliveryTime when status changes to delivered', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'out_for_delivery',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'owner-1',
        },
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        status: 'delivered',
        actualDeliveryTime: new Date(),
        items: [],
        restaurant: {
          name: 'Test Restaurant',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'delivered' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: 'delivered',
          actualDeliveryTime: expect.any(Date),
        },
        include: {
          items: true,
          restaurant: {
            select: {
              name: true,
            },
          },
        },
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

      mockRequest.user = { id: 'user-1', email: 'customer@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to update this order',
      });
    });

    it('should return 400 for invalid status transition', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'delivered',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'order-1' };
      mockRequest.body = { status: 'confirmed' };

      await updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot change status from delivered to confirmed',
      });
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

  describe('assignDriver', () => {
    it('should assign driver successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        restaurant: {
          id: 'rest-1',
          name: 'Test Restaurant',
        },
        delivery: {
          driver: {
            id: 'driver-1',
            name: 'John Driver',
            phone: '555-1234',
          },
        },
      };

      (prisma.order.update as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.delivery.create as jest.Mock).mockResolvedValue({});
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.params = { orderId: 'order-1' };
      mockRequest.body = { driverId: 'driver-1' };

      await assignDriver(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: 'confirmed',
        },
        include: {
          restaurant: true,
          delivery: {
            include: {
              driver: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: 'Driver assigned successfully',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.order.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.params = { orderId: 'order-1' };
      mockRequest.body = { driverId: 'driver-1' };

      await assignDriver(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to assign driver',
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully as customer', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'pending',
      };

      const mockCancelledOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'cancelled',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockCancelledOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'cancelled' },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCancelledOrder,
        message: 'Order cancelled successfully',
      });
    });

    it('should cancel order successfully as admin', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-2',
        status: 'confirmed',
      };

      const mockCancelledOrder = {
        id: 'order-1',
        customerId: 'user-2',
        status: 'cancelled',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockCancelledOrder);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.update).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCancelledOrder,
        message: 'Order cancelled successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should return 404 if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'nonexistent' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found',
      });
    });

    it('should return 403 if not authorized to cancel', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-2',
        status: 'pending',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to cancel this order',
      });
    });

    it('should return 400 if order is out for delivery', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'out_for_delivery',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot cancel order that is out for delivery or delivered',
      });
    });

    it('should return 400 if order is delivered', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'delivered',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot cancel order that is out for delivery or delivered',
      });
    });

    it('should allow cancellation of pending order', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'pending',
      };

      const mockCancelledOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'cancelled',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockCancelledOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCancelledOrder,
        message: 'Order cancelled successfully',
      });
    });

    it('should allow cancellation of confirmed order', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'confirmed',
      };

      const mockCancelledOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'cancelled',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue(mockCancelledOrder);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCancelledOrder,
        message: 'Order cancelled successfully',
      });
    });

    it('should return 500 on database error', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        status: 'pending',
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'customer' };
      mockRequest.params = { id: 'order-1' };

      await cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to cancel order',
      });
    });
  });
});
