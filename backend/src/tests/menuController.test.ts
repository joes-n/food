import { Request, Response } from 'express';
import {
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addMenuItemCustomization,
  addCustomizationOption,
} from '../controllers/menuController';

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
    menuCategory: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuItemCustomization: {
      create: jest.fn(),
    },
    customizationOption: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../server';

describe('Menu Controller', () => {
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

  describe('createMenuCategory', () => {
    const validCategoryData = {
      restaurantId: 'rest-1',
      name: 'Appetizers',
      description: 'Starter dishes',
      order: 1,
    };

    it('should create menu category successfully', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Appetizers',
        description: 'Starter dishes',
        order: 1,
        isActive: true,
        createdAt: new Date(),
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuCategory.create as jest.Mock).mockResolvedValue(mockCategory);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validCategoryData;

      await createMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 'rest-1' },
      });
      expect(prisma.menuCategory.create).toHaveBeenCalledWith({
        data: {
          restaurantId: 'rest-1',
          name: 'Appetizers',
          description: 'Starter dishes',
          order: 1,
        },
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCategory,
        message: 'Menu category created successfully',
      });
    });

    it('should allow admin to create category for any restaurant', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Appetizers',
        description: 'Starter dishes',
        order: 1,
        isActive: true,
        createdAt: new Date(),
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuCategory.create as jest.Mock).mockResolvedValue(mockCategory);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.body = validCategoryData;

      await createMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuCategory.create).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(201);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = validCategoryData;

      await createMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.menuCategory.create).not.toHaveBeenCalled();
    });

    it('should return 404 if restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validCategoryData;

      await createMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Restaurant not found',
      });
      expect(prisma.menuCategory.create).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-2',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validCategoryData;

      await createMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to manage this restaurant',
      });
      expect(prisma.menuCategory.create).not.toHaveBeenCalled();
    });

    it('should use default order when not provided', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Appetizers',
        description: 'Starter dishes',
        order: 0,
        isActive: true,
        createdAt: new Date(),
      };

      const categoryDataWithoutOrder = {
        restaurantId: 'rest-1',
        name: 'Appetizers',
        description: 'Starter dishes',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuCategory.create as jest.Mock).mockResolvedValue(mockCategory);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = categoryDataWithoutOrder;

      await createMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuCategory.create).toHaveBeenCalledWith({
        data: {
          restaurantId: 'rest-1',
          name: 'Appetizers',
          description: 'Starter dishes',
          order: 0,
        },
      });
    });

    it('should return 500 on database error', async () => {
      const mockRestaurant = {
        id: 'rest-1',
        ownerId: 'user-1',
      };

      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(mockRestaurant);
      (prisma.menuCategory.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.body = validCategoryData;

      await createMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create menu category',
      });
    });
  });

  describe('updateMenuCategory', () => {
    const updateData = {
      name: 'Updated Name',
      description: 'Updated description',
      order: 2,
      isActive: false,
    };

    it('should update menu category successfully', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Old Name',
        description: 'Old description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Updated Name',
        description: 'Updated description',
        order: 2,
        isActive: false,
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.menuCategory.update as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = updateData;

      await updateMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: { restaurant: true },
      });
      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'Updated Name',
          description: 'Updated description',
          order: 2,
          isActive: false,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedCategory,
        message: 'Menu category updated successfully',
      });
    });

    it('should allow admin to update any category', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Old Name',
        description: 'Old description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Updated Name',
        description: 'Updated description',
        order: 2,
        isActive: false,
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.menuCategory.update as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = updateData;

      await updateMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuCategory.update).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedCategory,
        message: 'Menu category updated successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = updateData;

      await updateMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.menuCategory.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if category not found', async () => {
      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = updateData;

      await updateMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu category not found',
      });
      expect(prisma.menuCategory.update).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Old Name',
        description: 'Old description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-2',
        },
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = updateData;

      await updateMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to update this category',
      });
      expect(prisma.menuCategory.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates with only provided fields', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Old Name',
        description: 'Old description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const partialUpdate = { name: 'Only Name Updated' };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.menuCategory.update as jest.Mock).mockResolvedValue({ ...mockCategory, name: 'Only Name Updated' });

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = partialUpdate;

      await updateMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'Only Name Updated',
        },
      });
    });

    it('should return 500 on database error', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Old Name',
        description: 'Old description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.menuCategory.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };
      mockRequest.body = updateData;

      await updateMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update menu category',
      });
    });
  });

  describe('deleteMenuCategory', () => {
    it('should delete menu category successfully', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Category Name',
        description: 'Category description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.menuCategory.delete as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };

      await deleteMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: { restaurant: true },
      });
      expect(prisma.menuCategory.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Menu category deleted successfully',
      });
    });

    it('should allow admin to delete any category', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Category Name',
        description: 'Category description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.menuCategory.delete as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
      mockRequest.params = { id: 'cat-1' };

      await deleteMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuCategory.delete).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Menu category deleted successfully',
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'cat-1' };

      await deleteMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.menuCategory.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 if category not found', async () => {
      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };

      await deleteMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu category not found',
      });
      expect(prisma.menuCategory.delete).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Category Name',
        description: 'Category description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-2',
        },
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };

      await deleteMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to delete this category',
      });
      expect(prisma.menuCategory.delete).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockCategory = {
        id: 'cat-1',
        restaurantId: 'rest-1',
        name: 'Category Name',
        description: 'Category description',
        order: 1,
        isActive: true,
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.menuCategory.delete as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'cat-1' };

      await deleteMenuCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete menu category',
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
        createdAt: new Date(),
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
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockMenuItem,
        message: 'Menu item created successfully',
      });
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
        createdAt: new Date(),
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
        createdAt: new Date(),
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
        error: 'Not authorized to manage this restaurant',
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
      isAvailable: false,
      preparationTime: 20,
    };

    it('should update menu item successfully', async () => {
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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockUpdatedItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1',
        name: 'Updated Burger',
        description: 'Updated description',
        price: 14.99,
        image: 'burger.jpg',
        preparationTime: 20,
        isAvailable: false,
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.menuItem.update as jest.Mock).mockResolvedValue(mockUpdatedItem);

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateData;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: { restaurant: true },
      });
      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          name: 'Updated Burger',
          description: 'Updated description',
          price: 14.99,
          isAvailable: false,
          preparationTime: 20,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedItem,
        message: 'Menu item updated successfully',
      });
    });

    it('should handle string price conversion in update', async () => {
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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
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
          isAvailable: false,
          preparationTime: 20,
        },
      });
    });

    it('should handle null preparationTime in update', async () => {
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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.menuItem.update as jest.Mock).mockResolvedValue({});

      const updateDataWithNullPrepTime = { ...updateData, preparationTime: null };

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };
      mockRequest.body = updateDataWithNullPrepTime;

      await updateMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          name: 'Updated Burger',
          description: 'Updated description',
          price: 14.99,
          isAvailable: false,
          preparationTime: null,
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
      mockRequest.params = { id: 'item-1' };
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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-2',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);

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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.menuItem.delete as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
      mockRequest.params = { id: 'item-1' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: { restaurant: true },
      });
      expect(prisma.menuItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
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
      mockRequest.params = { id: 'item-1' };

      await deleteMenuItem(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu item not found',
      });
      expect(prisma.menuItem.delete).not.toHaveBeenCalled();
    });

    it('should return 403 if not authorized', async () => {
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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-2',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);

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
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
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

  describe('addMenuItemCustomization', () => {
    const customizationData = {
      menuItemId: 'item-1',
      name: 'Size',
      type: 'select',
      required: true,
    };

    it('should add menu item customization successfully', async () => {
      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        name: 'Burger',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockCustomization = {
        id: 'custom-1',
        menuItemId: 'item-1',
        name: 'Size',
        type: 'select',
        required: true,
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.menuItemCustomization.create as jest.Mock).mockResolvedValue(
        mockCustomization
      );

      mockRequest.body = customizationData;

      await addMenuItemCustomization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: { restaurant: true },
      });
      expect(prisma.menuItemCustomization.create).toHaveBeenCalledWith({
        data: {
          menuItemId: 'item-1',
          name: 'Size',
          type: 'select',
          required: true,
        },
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCustomization,
        message: 'Menu item customization created successfully',
      });
    });

    it('should use default required value when not provided', async () => {
      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        name: 'Burger',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      const mockCustomization = {
        id: 'custom-1',
        menuItemId: 'item-1',
        name: 'Size',
        type: 'select',
        required: false,
      };

      const { required, ...customizationDataWithoutRequired } = customizationData;

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.menuItemCustomization.create as jest.Mock).mockResolvedValue(
        mockCustomization
      );

      mockRequest.body = customizationDataWithoutRequired;

      await addMenuItemCustomization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.menuItemCustomization.create).toHaveBeenCalledWith({
        data: {
          menuItemId: 'item-1',
          name: 'Size',
          type: 'select',
          required: false,
        },
      });
    });

    it('should return 404 if menu item not found', async () => {
      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.body = customizationData;

      await addMenuItemCustomization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Menu item not found',
      });
      expect(prisma.menuItemCustomization.create).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockMenuItem = {
        id: 'item-1',
        restaurantId: 'rest-1',
        name: 'Burger',
        restaurant: {
          id: 'rest-1',
          ownerId: 'user-1',
        },
      };

      (prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (prisma.menuItemCustomization.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.body = customizationData;

      await addMenuItemCustomization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create customization',
      });
    });
  });

  describe('addCustomizationOption', () => {
    const optionData = {
      menuItemCustomizationId: 'custom-1',
      name: 'Large',
      priceModifier: 2.0,
    };

    it('should add customization option successfully', async () => {
      const mockOption = {
        id: 'option-1',
        menuItemCustomizationId: 'custom-1',
        name: 'Large',
        priceModifier: 2.0,
      };

      (prisma.customizationOption.create as jest.Mock).mockResolvedValue(mockOption);

      mockRequest.body = optionData;

      await addCustomizationOption(mockRequest as Request, mockResponse as Response);

      expect(prisma.customizationOption.create).toHaveBeenCalledWith({
        data: {
          menuItemCustomizationId: 'custom-1',
          name: 'Large',
          priceModifier: 2.0,
        },
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockOption,
        message: 'Customization option created successfully',
      });
    });

    it('should handle string priceModifier conversion', async () => {
      const mockOption = {
        id: 'option-1',
        menuItemCustomizationId: 'custom-1',
        name: 'Large',
        priceModifier: 2.0,
      };

      const optionDataWithStringPrice = { ...optionData, priceModifier: '2.0' };

      (prisma.customizationOption.create as jest.Mock).mockResolvedValue(mockOption);

      mockRequest.body = optionDataWithStringPrice;

      await addCustomizationOption(mockRequest as Request, mockResponse as Response);

      expect(prisma.customizationOption.create).toHaveBeenCalledWith({
        data: {
          menuItemCustomizationId: 'custom-1',
          name: 'Large',
          priceModifier: 2.0,
        },
      });
    });

    it('should use default priceModifier when not provided', async () => {
      const mockOption = {
        id: 'option-1',
        menuItemCustomizationId: 'custom-1',
        name: 'Large',
        priceModifier: 0,
      };

      const { priceModifier, ...optionDataWithoutModifier } = optionData;

      (prisma.customizationOption.create as jest.Mock).mockResolvedValue(mockOption);

      mockRequest.body = optionDataWithoutModifier;

      await addCustomizationOption(mockRequest as Request, mockResponse as Response);

      expect(prisma.customizationOption.create).toHaveBeenCalledWith({
        data: {
          menuItemCustomizationId: 'custom-1',
          name: 'Large',
          priceModifier: 0,
        },
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.customizationOption.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.body = optionData;

      await addCustomizationOption(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create customization option',
      });
    });
  });
});
