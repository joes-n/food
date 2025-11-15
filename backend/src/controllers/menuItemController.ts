import { Request, Response } from 'express';
import { prisma } from '../server';

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { restaurantId, categoryId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
    }

    const where: any = {
      restaurantId: restaurantId as string,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
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

    res.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items',
    });
  }
};

export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        customizations: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu item',
    });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const { restaurantId, categoryId, name, description, price, image, preparationTime } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Check if restaurant exists and user owns it
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    if (userRole !== 'admin' && restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create menu items for this restaurant',
      });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        name,
        description,
        price: Number(price),
        image,
        preparationTime: preparationTime ? Number(preparationTime) : null,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      data: menuItem,
      message: 'Menu item created successfully',
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu item',
    });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, isAvailable, preparationTime } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Check if menu item exists and user owns the restaurant
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!existingMenuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }

    if (userRole !== 'admin' && existingMenuItem.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this menu item',
      });
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(image && { image }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(preparationTime !== undefined && { preparationTime: Number(preparationTime) }),
      },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      data: menuItem,
      message: 'Menu item updated successfully',
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item',
    });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!existingMenuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }

    if (userRole !== 'admin' && existingMenuItem.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this menu item',
      });
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item',
    });
  }
};