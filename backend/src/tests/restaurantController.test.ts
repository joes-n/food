import { Request, Response } from 'express';
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getMyRestaurants,
} from '../controllers/restaurantController';

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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../server';

describe('Restaurant Controller', () => {
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

  describe('getRestaurants', () => {
    it('should fetch restaurants with pagination only', async () => {
      const mockRestaurants = [
        {
          id: 'rest-1',
          name: 'Restaurant 1',
          description: 'Great food',
          isActive: true,
          _count: {
            orders: 10,
            reviews: 5,
            favorites: 3,
          },
        },
        {
          id: 'rest-2',
          name: 'Restaurant 2',
          description: 'Another great place',
          isActive: true,
          _count: {
            orders: 15,
            reviews: 8,
            favorites: 6,
          },
        },
      ];

      (prisma.restaurant.findMany as jest.Mock).mockResolvedValue(mockRestaurants);
      (prisma.restaurant.count as jest.Mock).mockResolvedValue(25);

      mockRequest.query = {};

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        skip: 0,
        take: 10,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { orders: true, reviews: true, favorites: true },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurants,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should fetch restaurants with search query', async () => {
      const mockRestaurants = [
        {
          id: 'rest-1',
          name: 'Pizza Palace',
          description: 'Best pizza in town',
          isActive: true,
          _count: {
            orders: 10,
            reviews: 5,
            favorites: 3,
          },
        },
      ];

      (prisma.restaurant.findMany as jest.Mock).mockResolvedValue(mockRestaurants);
      (prisma.restaurant.count as jest.Mock).mockResolvedValue(1);

      mockRequest.query = { search: 'pizza' };

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'pizza', mode: 'insensitive' } },
            { description: { contains: 'pizza', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { orders: true, reviews: true, favorites: true },
          },
        },
      });
    });

    it('should filter by cuisine', async () => {
      const mockRestaurants = [
        {
          id: 'rest-1',
          name: 'Italian Place',
          cuisine: 'Italian',
          isActive: true,
          _count: {
            orders: 10,
            reviews: 5,
            favorites: 3,
          },
        },
      ];

      (prisma.restaurant.findMany as jest.Mock).mockResolvedValue(mockRestaurants);
      (prisma.restaurant.count as jest.Mock).mockResolvedValue(1);

      mockRequest.query = { cuisine: 'Italian' };

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          cuisine: { equals: 'Italian' },
        },
        skip: 0,
        take: 10,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { orders: true, reviews: true, favorites: true },
          },
        },
      });
    });

    it('should filter by priceRange', async () => {
      const mockRestaurants = [
        {
          id: 'rest-1',
          name: 'Fancy Place',
          priceRange: 'expensive',
          isActive: true,
          _count: {
            orders: 10,
            reviews: 5,
            favorites: 3,
          },
        },
      ];

      (prisma.restaurant.findMany as jest.Mock).mockResolvedValue(mockRestaurants);
      (prisma.restaurant.count as jest.Mock).mockResolvedValue(1);

      mockRequest.query = { priceRange: 'expensive' };

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          priceRange: 'expensive',
        },
        skip: 0,
        take: 10,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { orders: true, reviews: true, favorites: true },
          },
        },
      });
    });

    it('should use custom pagination', async () => {
      const mockRestaurants = [
        {
          id: 'rest-1',
          name: 'Restaurant 1',
          isActive: true,
          _count: {
            orders: 10,
            reviews: 5,
            favorites: 3,
          },
        },
      ];

      (prisma.restaurant.findMany as jest.Mock).mockResolvedValue(mockRestaurants);
      (prisma.restaurant.count as jest.Mock).mockResolvedValue(50);

      mockRequest.query = { page: '2', pageSize: '20' };

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        skip: 20,
        take: 20,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { orders: true, reviews: true, favorites: true },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurants,
        pagination: {
          page: 2,
          pageSize: 20,
          total: 50,
          totalPages: 3,
        },
      });
    });

    it('should use custom sortBy and sortOrder', async () => {
      const mockRestaurants = [
        {
          id: 'rest-1',
          name: 'Restaurant 1',
          isActive: true,
          _count: {
            orders: 10,
            reviews: 5,
            favorites: 3,
          },
        },
      ];

      (prisma.restaurant.findMany as jest.Mock).mockResolvedValue(mockRestaurants);
      (prisma.restaurant.count as jest.Mock).mockResolvedValue(1);

      mockRequest.query = { sortBy: 'name', sortOrder: 'asc' };

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { orders: true, reviews: true, favorites: true },
          },
        },
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.restaurant.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.query = {};

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch restaurants',
      });
    });

    it('should return empty array when no restaurants found', async () => {
      (prisma.restaurant.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.restaurant.count as jest.Mock).mockResolvedValue(0);

      mockRequest.query = {};

      await getRestaurants(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });

  describe('getRestaurantById', () => {
    it('should fetch restaurant by id successfully', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        name: 'Test Restaurant',
        description: 'Great food',
        operatingHours: [
          {
            dayOfWeek: 1,
            openTime: '09:00',
            closeTime: '22:00',
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: 'Main Course',
            isActive: true,
            order: 1,
            items: [
              {
                id: 'item-1',
                name: 'Burger',
                price: 12.99,
                isAvailable: true,
              },
            ],
          },
        ],
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            comment: 'Excellent!',
            customer: {
              id: 'customer-1',
              name: 'John Doe',
            },
          },
        ],
        _count: {
          orders: 10,
          reviews: 5,
        },
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.params = { id: 'rest-1' };

      await getRestaurantById(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        include: {
          operatingHours: {
            orderBy: { dayOfWeek: 'asc' },
          },
          categories: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
              items: {
                where: { isAvailable: true },
                orderBy: { name: 'asc' },
              },
            },
          },
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: { orders: true, reviews: true },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurant,
      });
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: 'nonexistent' };

      await getRestaurantById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.params = { id: 'rest-1' };

      await getRestaurantById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch restaurant',
      });
    });

    it('should handle restaurant with no categories', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        name: 'Test Restaurant',
        description: 'Great food',
        operatingHours: [],
        categories: [],
        reviews: [],
        _count: {
          orders: 10,
          reviews: 5,
        },
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.params = { id: 'rest-1' };

      await getRestaurantById(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurant,
      });
    });
  });

  describe('createRestaurant', () => {
    const validRestaurantData = {
      name: 'New Restaurant',
      description: 'Great food',
      cuisine: 'Italian',
      address: '123 Main St',
      phone: '555-1234',
      email: 'contact@example.com',
      minOrderAmount: 20,
    };

    it('should create restaurant successfully', async () => {
      const mockRestaurant = {
        id: 'New Restaurant',
        name: 'New Restaurant',
        description: 'Great food',
        cuisine: 'Italian',
        address: '123 Main St',
        phone: '555-1234',
        email: 'contact@example.com',
        priceRange: 'medium',
        deliveryFee: 2.99,
        minOrderAmount: 20,
        estimatedDeliveryTime: 30,
        ownerId: 'user-1',
        owner: {
          id: 'user-1',
          name: 'Owner Name',
          email: 'owner@example.com',
        },
      };

      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.restaurant.create as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.body = validRestaurantData;

      await createRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
      });
      expect(prisma.restaurant.create).toHaveBeenCalledWith({
        data: {
          name: 'New Restaurant',
          description: 'Great food',
          cuisine: 'Italian',
          address: '123 Main St',
          phone: '555-1234',
          email: 'contact@example.com',
          priceRange: 'medium',
          deliveryFee: 2.99,
          minOrderAmount: 20,
          estimatedDeliveryTime: 30,
          ownerId: 'user-1',
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurant,
        message: 'Restaurant created successfully',
      });
    });

    it('should allow admin to create restaurant', async () => {
      const mockRestaurant = {
        id: 'New Restaurant',
        name: 'New Restaurant',
        description: 'Great food',
        cuisine: 'Italian',
        address: '123 Main St',
        phone: '555-1234',
        email: 'contact@example.com',
        priceRange: 'medium',
        deliveryFee: 2.99,
        minOrderAmount: 20,
        estimatedDeliveryTime: 30,
        ownerId: 'user-1',
      };

      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.restaurant.create as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.body = validRestaurantData;

      await createRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.create).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(201);
    });

    it('should use default minOrderAmount when not provided', async () => {
      const mockRestaurant = {
        id: 'New Restaurant',
        name: 'New Restaurant',
        description: 'Great food',
        cuisine: 'Italian',
        address: '123 Main St',
        phone: '555-1234',
        email: 'contact@example.com',
        priceRange: 'medium',
        deliveryFee: 2.99,
        minOrderAmount: 0,
        estimatedDeliveryTime: 30,
        ownerId: 'user-1',
      };

      const { minOrderAmount, ...restaurantDataWithoutMinOrder } = validRestaurantData;

      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.restaurant.create as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.body = restaurantDataWithoutMinOrder;

      await createRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.create).toHaveBeenCalledWith({
        data: {
          name: 'New Restaurant',
          description: 'Great food',
          cuisine: 'Italian',
          address: '123 Main St',
          phone: '555-1234',
          email: 'contact@example.com',
          priceRange: 'medium',
          deliveryFee: 2.99,
          minOrderAmount: 0,
          estimatedDeliveryTime: 30,
          ownerId: 'user-1',
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = validRestaurantData;

      await createRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should return 403 if not restaurant_owner or admin', async () => {
      mockRequest.user = { id: 'user-1', email: 'customer@example.com', role: 'customer' };
      mockRequest.body = validRestaurantData;

      await createRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Only restaurant owners can create restaurants',
      });
      expect(prisma.restaurant.create).not.toHaveBeenCalled();
    });

    it('should return 400 if restaurant owner already has a restaurant', async () => {
      const existingRestaurant = {
        id: 'Existing Restaurant',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(existingRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.body = validRestaurantData;

      await createRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'You already have a restaurant',
      });
      expect(prisma.restaurant.create).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.restaurant.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.body = validRestaurantData;

      await createRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create restaurant',
      });
    });
  });

  describe('updateRestaurant', () => {
    const updateData = {
      name: 'Updated Restaurant',
      description: 'Updated description',
      cuisine: 'American',
      address: '456 Oak St',
      phone: '555-5678',
      email: 'updated@example.com',
      minOrderAmount: 25,
      isOpen: true,
      banner: 'new-banner.jpg',
    };

    it('should update restaurant successfully', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockUpdatedRestaurant = {
        id: 'rest-1',
        name: 'Updated Restaurant',
        description: 'Updated description',
        cuisine: 'American',
        address: '456 Oak St',
        phone: '555-5678',
        email: 'updated@example.com',
        minOrderAmount: 25,
        isOpen: true,
        banner: 'new-banner.jpg',
        priceRange: 'medium',
        deliveryFee: 2.99,
        estimatedDeliveryTime: 30,
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (prisma.restaurant.update as jest.Mock).mockResolvedValue(mockUpdatedRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });
      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: {
          name: 'Updated Restaurant',
          description: 'Updated description',
          cuisine: 'American',
          address: '456 Oak St',
          phone: '555-5678',
          email: 'updated@example.com',
          banner: 'new-banner.jpg',
          priceRange: 'medium',
          deliveryFee: 2.99,
          minOrderAmount: 25,
          estimatedDeliveryTime: 30,
          isOpen: true,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedRestaurant,
        message: 'Restaurant updated successfully',
      });
    });

    it('should allow admin to update any restaurant', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-2',
      };

      const mockUpdatedRestaurant = {
        id: 'rest-1',
        name: 'Updated Restaurant',
        description: 'Updated description',
        cuisine: 'American',
        address: '456 Oak St',
        phone: '555-5678',
        email: 'updated@example.com',
        minOrderAmount: 25,
        isOpen: true,
        banner: 'new-banner.jpg',
        priceRange: 'medium',
        deliveryFee: 2.99,
        estimatedDeliveryTime: 30,
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (prisma.restaurant.update as jest.Mock).mockResolvedValue(mockUpdatedRestaurant);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.update).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedRestaurant,
        message: 'Restaurant updated successfully',
      });
    });

    it('should handle partial updates with only provided fields', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (prisma.restaurant.update as jest.Mock).mockResolvedValue({});

      const partialUpdate = { name: 'Only Name Updated' };

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = partialUpdate;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: {
          name: 'Only Name Updated',
          priceRange: 'medium',
          deliveryFee: 2.99,
          estimatedDeliveryTime: 30,
        },
      });
    });

    it('should update isOpen field when provided', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (prisma.restaurant.update as jest.Mock).mockResolvedValue({});

      const updateData = { isOpen: false };

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: {
          isOpen: false,
          priceRange: 'medium',
          deliveryFee: 2.99,
          estimatedDeliveryTime: 30,
        },
      });
    });

    it('should update banner field when provided', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (prisma.restaurant.update as jest.Mock).mockResolvedValue({});

      const updateData = { banner: 'new-banner.jpg' };

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: {
          banner: 'new-banner.jpg',
          priceRange: 'medium',
          deliveryFee: 2.99,
          estimatedDeliveryTime: 30,
        },
      });
    });

    it('should handle string to number conversion for minOrderAmount', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (prisma.restaurant.update as jest.Mock).mockResolvedValue({});

      const updateData = { minOrderAmount: '30' };

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
        data: {
          minOrderAmount: 30,
          priceRange: 'medium',
          deliveryFee: 2.99,
          estimatedDeliveryTime: 30,
        },
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.restaurant.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
      expect(prisma.restaurant.update).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-2',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to update this restaurant',
      });
      expect(prisma.restaurant.update).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockExistingRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (prisma.restaurant.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };
      mockRequest.body = updateData;

      await updateRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update restaurant',
      });
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete restaurant successfully', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.restaurant.delete as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };

      await deleteRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });
      expect(prisma.restaurant.delete).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Restaurant deleted successfully',
      });
    });

    it('should allow admin to delete any restaurant', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-2',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.restaurant.delete as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'rest-1' };

      await deleteRestaurant(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.delete).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Restaurant deleted successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'rest-1' };

      await deleteRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.restaurant.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'nonexistent' };

      await deleteRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
      expect(prisma.restaurant.delete).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-2',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };

      await deleteRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to delete this restaurant',
      });
      expect(prisma.restaurant.delete).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.restaurant.delete as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { id: 'rest-1' };

      await deleteRestaurant(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete restaurant',
      });
    });
  });

  describe('getMyRestaurants', () => {
    it('should fetch restaurants for restaurant owner', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        name: 'My Restaurant',
        isActive: true,
        _count: {
          orders: 10,
          reviews: 5,
          categories: 3,
        },
      };

      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };

      await getMyRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findFirst).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        include: {
          _count: {
            select: { orders: true, reviews: true, categories: true },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurant,
      });
    });

    it('should fetch all restaurants for admin', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        name: 'Restaurant 1',
        isActive: true,
        _count: {
          orders: 10,
          reviews: 5,
          categories: 3,
        },
      };

      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };

      await getMyRestaurants(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findFirst).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: {
            select: { orders: true, reviews: true, categories: true },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurant,
      });
    });

    it('should return empty array when owner has no restaurants', async () => {
      (prisma.restaurant.findFirst as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };

      await getMyRestaurants(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await getMyRestaurants(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.restaurant.findMany).not.toHaveBeenCalled();
    });

    it('should return 403 if not restaurant_owner or admin', async () => {
      mockRequest.user = { id: 'user-1', email: 'customer@example.com', role: 'customer' };

      await getMyRestaurants(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Only restaurant owners can view their restaurants',
      });
      expect(prisma.restaurant.findFirst).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      (prisma.restaurant.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };

      await getMyRestaurants(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch restaurant',
      });
    });
  });
});
