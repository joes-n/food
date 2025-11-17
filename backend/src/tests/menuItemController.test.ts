import { Request, Response } from 'express';
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuItemController';

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
    menuItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../server';

describe('Menu Item Controller', () => {
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

  describe('getMenuItems', () => {
    it('should fetch menu items successfully with restaurantId', async () => {
      const mockMenuItems = [
        {
          id: 'item-1',
          restaurantId: 'rest-1',
          categoryId: 'cat-1',
          name: 'Burger',
          description: 'Delicious burger',
          price: 12.99,
          image: 'burger.jpg',
          preparationTime: 15,
          isAvailable: true,
          category: {
            id: 'cat-1',
            name: 'Main Course',
          },
          customizations: [
            {
              id: 'custom-1',
              name: 'Size',
              type: 'select',
              required: false,
              options: [
                {
                  id: 'opt-1',
                  name: 'Large',
                  priceModifier: 2.0,
                },
              ],
            },
          ],
        },
        {
          id: 'item-2',
          restaurantId: 'rest-1',
          categoryId: 'cat-2',
          name: 'Pizza',
          description: 'Tasty pizza',
          price: 15.99,
          image: 'pizza.jpg',
          preparationTime: 20,
          isAvailable: true,
          category: {
            id: 'cat-2',
            name: 'Main Course',
          },
          customizations: [],
        },
      ];

      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      mockRequest.query = { restaurantId: 'rest-1' };

      await getMenuItems(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
        },
        include: {
          category: true,
          customizations: {
            include: {
              options: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockMenuItems,
      });
    });

    it('should fetch menu items with restaurantId and categoryId filter', async () => {
      const mockMenuItems = [
        {
          id: 'item-1',
          restaurantId: 'rest-1',
          categoryId: 'cat-1',
          name: 'Burger',
          description: 'Delicious burger',
          price: 12.99,
          image: 'burger.jpg',
          preparationTime: 15,
          isAvailable: true,
          category: {
            id: 'cat-1',
            name: 'Main Course',
          },
          customizations: [],
        },
      ];

      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      mockRequest.query = { restaurantId: 'rest-1', categoryId: 'cat-1' };

      await getMenuItems(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'rest-1',
          categoryId: 'cat-1',
        },
        include: {
          category: true,
          customizations: {
            include: {
              options: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockMenuItems,
      });
    });

    it('should return 400 if restaurantId is not provided', async () => {
      mockRequest.query = {};

      await getMenuItems(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant ID is required',
      });
      expect(prisma.menuItem.findMany).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      (prisma.menuItem.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.query = { restaurantId: 'rest-1' };

      await getMenuItems(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch menu items',
      });
    });

    it('should return empty array when no menu items found', async () => {
      (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      mockRequest.query = { restaurantId: 'rest-1' };

      await getMenuItems(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('getMenuItemById', () => {
    it('should fetch menu item by id successfully', async () => {
      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        category: {
          id: 'cat-1',
          name: 'Main Course',
        },
        customizations: [
          {
            id: 'custom-1',
            name: 'Size',
            type: 'select',
            required: false,
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

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);

      mockRequest.params = { id: 'item-1' };

      await getMenuItemById(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: {
          category: true,
          customizations: {
            include: {
              options: true,
            },
          },
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockMenuItem,
      });
    });

    it('should return 404 if menu item not found', async () => {
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: 'nonexistent' };

      await getMenuItemById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu item not found',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.menuItem.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.params = { id: 'item-1' };

      await getMenuItemById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch menu item',
      });
    });
  });

  describe('createMenuItem', () => {
    const validMenuItemData = {
      restaurantId: 'rest-1',
      categoryId: 'cat-1',
      name: 'Burger',
      description: 'Delicious beef burger',
      price: 12.99,
      image: 'burger.jpg',
      preparationTime: 15,
    };

    it('should create menu item successfully', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious beef burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        category: {
          id: 'cat-1',
          name: 'Main Course',
        },
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.create as jest.Mock).mockResolvedValue(mockMenuItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validMenuItemData;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });
      expect(prisma.menuItem.create).toHaveBeenCalledWith({
        data: {
          restaurantId: 'rest-1',
          categoryId: 'cat-1',
          name: 'Burger',
          description: 'Delicious beef burger',
          price: 12.99,
          image: 'burger.jpg',
          preparationTime: 15,
        },
        include: {
          category: true,
        },
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockMenuItem,
        message: 'Menu item created successfully',
      });
    });

    it('should allow admin to create menu item for any restaurant', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious beef burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        category: {
          id: 'cat-1',
          name: 'Main Course',
        },
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.create as jest.Mock).mockResolvedValue(mockMenuItem);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.body = validMenuItemData;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.create).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(201);
    });

    it('should handle string price conversion', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious beef burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        category: {
          id: 'cat-1',
          name: 'Main Course',
        },
      };

      const itemDataWithStringPrice = { ...validMenuItemData, price: '12.99' };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.create as jest.Mock).mockResolvedValue(mockMenuItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = itemDataWithStringPrice;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.create).toHaveBeenCalledWith({
        data: {
          restaurantId: 'rest-1',
          categoryId: 'cat-1',
          name: 'Burger',
          description: 'Delicious beef burger',
          price: 12.99,
          image: 'burger.jpg',
          preparationTime: 15,
        },
        include: {
          category: true,
        },
      });
    });

    it('should handle null preparationTime', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious beef burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: null,
        isAvailable: true,
        category: {
          id: 'cat-1',
          name: 'Main Course',
        },
      };

      const { preparationTime, ...itemDataWithoutPrepTime } = validMenuItemData;

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.create as jest.Mock).mockResolvedValue(mockMenuItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = itemDataWithoutPrepTime;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.create).toHaveBeenCalledWith({
        data: {
          restaurantId: 'rest-1',
          categoryId: 'cat-1',
          name: 'Burger',
          description: 'Delicious beef burger',
          price: 12.99,
          image: 'burger.jpg',
          preparationTime: null,
        },
        include: {
          category: true,
        },
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = validMenuItemData;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.menuItem.create).not.toHaveBeenCalled();
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validMenuItemData;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
      expect(prisma.menuItem.create).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-2',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validMenuItemData;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to create menu items for this restaurant',
      });
      expect(prisma.menuItem.create).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuItem.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validMenuItemData;

      await createMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create menu item',
      });
    });
  });

  describe('updateMenuItem', () => {
    const updateData = {
      name: 'Updated Burger',
      description: 'Updated description',
      price: 14.99,
      image: 'new-burger.jpg',
      isAvailable: false,
      preparationTime: 20,
    };

    it('should update menu item successfully', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Updated Burger',
        description: 'Updated description',
        price: 14.99,
        image: 'new-burger.jpg',
        preparationTime: 20,
        isAvailable: false,
        category: {
          id: 'cat-1',
          name: 'Main Course',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.update as jest.Mock).mockResolvedValue(mockUpdatedMenuItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateData;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: {
          restaurant: true,
        },
      });
      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          name: 'Updated Burger',
          description: 'Updated description',
          price: 14.99,
          image: 'new-burger.jpg',
          isAvailable: false,
          preparationTime: 20,
        },
        include: {
          category: true,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedMenuItem,
        message: 'Menu item updated successfully',
      });
    });

    it('should allow admin to update any menu item', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Updated Burger',
        description: 'Updated description',
        price: 14.99,
        image: 'new-burger.jpg',
        preparationTime: 20,
        isAvailable: false,
        category: {
          id: 'cat-1',
          name: 'Main Course',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.update as jest.Mock).mockResolvedValue(mockUpdatedMenuItem);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateData;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.update).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedMenuItem,
        message: 'Menu item updated successfully',
      });
    });

    it('should handle string price conversion in update', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.update as jest.Mock).mockResolvedValue({});

      const updateDataWithStringPrice = { ...updateData, price: '14.99' };

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateDataWithStringPrice;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          name: 'Updated Burger',
          description: 'Updated description',
          price: 14.99,
          image: 'new-burger.jpg',
          isAvailable: false,
          preparationTime: 20,
        },
        include: {
          category: true,
        },
      });
    });

    it('should handle partial updates with only provided fields', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.update as jest.Mock).mockResolvedValue({});

      const partialUpdate = { name: 'Only Name Updated' };

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = partialUpdate;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          name: 'Only Name Updated',
        },
        include: {
          category: true,
        },
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateData;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.menuItem.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if menu item not found', async () => {
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = updateData;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu item not found',
      });
      expect(prisma.menuItem.update).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-2',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateData;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to update this menu item',
      });
      expect(prisma.menuItem.update).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateData;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update menu item',
      });
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete menu item successfully', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.delete as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: {
          restaurant: true,
        },
      });
      expect(prisma.menuItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Menu item deleted successfully',
      });
    });

    it('should allow admin to delete any menu item', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.delete as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'item-1' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.delete).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Menu item deleted successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'item-1' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.menuItem.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if menu item not found', async () => {
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'nonexistent' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu item not found',
      });
      expect(prisma.menuItem.delete).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-2',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to delete this menu item',
      });
      expect(prisma.menuItem.delete).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockExistingMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Burger',
        description: 'Delicious burger',
        price: 12.99,
        image: 'burger.jpg',
        preparationTime: 15,
        isAvailable: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockExistingMenuItem);
      (prisma.menuItem.delete as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete menu item',
      });
    });
  });
});
