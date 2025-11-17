import { Request, Response } from 'express';
import { getRestaurantStats } from '../controllers/restaurantStatsController';

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
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    orderItem: {
      groupBy: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

import { prisma } from '../server';

describe('Restaurant Stats Controller', () => {
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

    // Mock Date to ensure consistent date calculations in tests
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(0); // January (0-indexed)
    jest.spyOn(Date.prototype, 'getDate').mockReturnValue(15);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRestaurantStats', () => {
    it('should fetch restaurant stats successfully for owner', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockOrderCounts = [
        100, // totalOrders
        5, // pendingOrders
        85, // completedOrders
        10, // cancelledOrders
        20, // monthlyOrders
        250, // yearlyOrders
      ];

      const mockMonthlyRevenue = {
        _sum: { total: 2500.0 },
      };

      const mockYearlyRevenue = {
        _sum: { total: 30000.0 },
      };

      const mockDailyOrders = [
        { date: '2024-01-01', count: 10, revenue: 250.0 },
        { date: '2024-01-02', count: 15, revenue: 375.0 },
        { date: '2024-01-03', count: 20, revenue: 500.0 },
      ];

      const mockPopularItems = [
        { menuItemId: 'item-1', _sum: { quantity: 50, subtotal: 500.0 } },
        { menuItemId: 'item-2', _sum: { quantity: 40, subtotal: 400.0 } },
        { menuItemId: 'item-3', _sum: { quantity: 30, subtotal: 300.0 } },
      ];

      const mockMenuItems = [
        { id: 'item-1', name: 'Burger', price: 10.0, image: 'burger.jpg' },
        { id: 'item-2', name: 'Pizza', price: 12.0, image: 'pizza.jpg' },
        { id: 'item-3', name: 'Salad', price: 8.0, image: 'salad.jpg' },
      ];

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      // Mock order.count calls
      mockOrderCounts.forEach((count) => {
        (prisma.order.count as jest.Mock).mockResolvedValueOnce(count);
      });

      // Mock order.aggregate calls
      (prisma.order.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockMonthlyRevenue)
        .mockResolvedValueOnce(mockYearlyRevenue);

      // Mock $queryRaw for daily orders
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockDailyOrders);

      // Mock orderItem.groupBy
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue(mockPopularItems);

      // Mock menuItem.findMany
      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });

      // Verify all order.count calls
      expect(prisma.order.count).toHaveBeenCalledTimes(6);
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1' },
      });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1', status: 'pending' },
      });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1', status: 'delivered' },
      });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { restaurantId: 'rest-1', status: 'cancelled' },
      });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
          createdAt: { gte: expect.any(Date) }, // startOfMonth
        },
      });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
          createdAt: { gte: expect.any(Date) }, // startOfYear
        },
      });

      // Verify order.aggregate calls
      expect(prisma.order.aggregate).toHaveBeenCalledTimes(2);
      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
          status: 'delivered',
          createdAt: { gte: expect.any(Date) },
        },
        _sum: { total: true },
      });
      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
          status: 'delivered',
          createdAt: { gte: expect.any(Date) },
        },
        _sum: { total: true },
      });

      // Verify $queryRaw call
      expect(prisma.$queryRaw).toHaveBeenCalled();

      // Verify orderItem.groupBy call
      expect(prisma.orderItem.groupBy).toHaveBeenCalledWith({
        by: ['menuItemId'],
        where: {
          order: {
            restaurantId: 'rest-1',
            status: 'delivered',
          },
        },
        _sum: {
          quantity: true,
          subtotal: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      });

      // Verify menuItem.findMany call
      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['item-1', 'item-2', 'item-3'] },
        },
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
        },
      });

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: {
            total: 100,
            pending: 5,
            completed: 85,
            cancelled: 10,
            monthly: 20,
            yearly: 250,
          },
          revenue: {
            monthly: 2500.0,
            yearly: 30000.0,
          },
          dailyOrders: mockDailyOrders,
          popularItems: [
            {
              id: 'item-1',
              name: 'Burger',
              price: 10.0,
              image: 'burger.jpg',
              totalSold: 50,
              totalRevenue: 500.0,
            },
            {
              id: 'item-2',
              name: 'Pizza',
              price: 12.0,
              image: 'pizza.jpg',
              totalSold: 40,
              totalRevenue: 400.0,
            },
            {
              id: 'item-3',
              name: 'Salad',
              price: 8.0,
              image: 'salad.jpg',
              totalSold: 30,
              totalRevenue: 300.0,
            },
          ],
        },
      });
    });

    it('should allow admin to view any restaurant stats', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock).mockResolvedValue(100);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: 0 } });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(prisma.order.count).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: {
            total: 100,
            pending: 100,
            completed: 100,
            cancelled: 100,
            monthly: 100,
            yearly: 100,
          },
          revenue: {
            monthly: 0,
            yearly: 0,
          },
          dailyOrders: [],
          popularItems: [],
        },
      });
    });

    it('should handle restaurant with no orders', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: null } });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: {
            total: 0,
            pending: 0,
            completed: 0,
            cancelled: 0,
            monthly: 0,
            yearly: 0,
          },
          revenue: {
            monthly: 0,
            yearly: 0,
          },
          dailyOrders: [],
          popularItems: [],
        },
      });
    });

    it('should handle popular items with no menu items found', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockPopularItems = [
        { menuItemId: 'deleted-item', _sum: { quantity: 10, subtotal: 100.0 } },
      ];

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: 0 } });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue(mockPopularItems);
      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          popularItems: [
            {
              id: 'deleted-item',
              name: 'Unknown',
              price: 0,
              image: undefined,
              totalSold: 10,
              totalRevenue: 100.0,
            },
          ],
        }),
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'nonexistent' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to view stats for this restaurant',
      });
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is customer', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'owner-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'customer@example.com', role: 'customer' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to view stats for this restaurant',
      });
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it('should return 500 on database error during restaurant lookup', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch restaurant statistics',
      });
    });

    it('should return 500 on database error during order count', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch restaurant statistics',
      });
    });

    it('should return 500 on database error during queryRaw', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: 0 } });
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'));
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch restaurant statistics',
      });
    });

    it('should return 500 on database error during menuItem lookup', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockPopularItems = [
        { menuItemId: 'item-1', _sum: { quantity: 10, subtotal: 100.0 } },
      ];

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: 0 } });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue(mockPopularItems);
      (prisma.menuItem.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch restaurant statistics',
      });
    });

    it('should handle zero revenue correctly', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock).mockResolvedValue(0);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: null } });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          revenue: {
            monthly: 0,
            yearly: 0,
          },
        }),
      });
    });

    it('should aggregate data correctly with multiple Promise.all operations', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      // Setup mock return values for all Promise.all operations
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.order.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(80) // completed
        .mockResolvedValueOnce(10) // cancelled
        .mockResolvedValueOnce(30) // monthly
        .mockResolvedValueOnce(300); // yearly

      (prisma.order.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { total: 5000.0 } }) // monthly
        .mockResolvedValueOnce({ _sum: { total: 60000.0 } }); // yearly

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { date: '2024-01-01', count: 5, revenue: 125.0 },
      ]);

      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([]);

      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.user = { id: 'user-1', email: 'owner@example.com', role: 'restaurant_owner' };
      mockRequest.params = { restaurantId: 'rest-1' };

      await getRestaurantStats(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orders: {
            total: 100,
            pending: 10,
            completed: 80,
            cancelled: 10,
            monthly: 30,
            yearly: 300,
          },
          revenue: {
            monthly: 5000.0,
            yearly: 60000.0,
          },
          dailyOrders: [{ date: '2024-01-01', count: 5, revenue: 125.0 }],
          popularItems: [],
        }),
      });
    });
  });
});
