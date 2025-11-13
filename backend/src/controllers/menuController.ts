import { Request, Response } from 'express';
import { prisma } from '../server';

export const createMenuCategory = async (req: Request, res: Response) => {
  try {
    const { restaurantId, name, description, order } = req.body;
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
        error: 'Not authorized to manage this restaurant',
      });
    }

    const category = await prisma.menuCategory.create({
      data: {
        restaurantId,
        name,
        description,
        order: order || 0,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Menu category created successfully',
    });
  } catch (error) {
    console.error('Create menu category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu category',
    });
  }
};

export const updateMenuCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, order, isActive } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Menu category not found',
      });
    }

    if (userRole !== 'admin' && category.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this category',
      });
    }

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Menu category updated successfully',
    });
  } catch (error) {
    console.error('Update menu category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu category',
    });
  }
};

export const deleteMenuCategory = async (req: Request, res: Response) => {
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

    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Menu category not found',
      });
    }

    if (userRole !== 'admin' && category.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this category',
      });
    }

    await prisma.menuCategory.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Menu category deleted successfully',
    });
  } catch (error) {
    console.error('Delete menu category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu category',
    });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      restaurantId,
      categoryId,
      name,
      description,
      price,
      image,
      preparationTime,
    } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

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
        error: 'Not authorized to manage this restaurant',
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
    const { name, description, price, image, isAvailable, preparationTime } =
      req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }

    if (userRole !== 'admin' && menuItem.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this menu item',
      });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(image && { image }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(preparationTime !== undefined && {
          preparationTime: preparationTime ? Number(preparationTime) : null,
        }),
      },
    });

    res.json({
      success: true,
      data: updated,
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

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }

    if (userRole !== 'admin' && menuItem.restaurant.ownerId !== userId) {
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

export const addMenuItemCustomization = async (req: Request, res: Response) => {
  try {
    const { menuItemId, name, type, required } = req.body;

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: true },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }

    const customization = await prisma.menuItemCustomization.create({
      data: {
        menuItemId,
        name,
        type,
        required: required || false,
      },
    });

    res.status(201).json({
      success: true,
      data: customization,
      message: 'Menu item customization created successfully',
    });
  } catch (error) {
    console.error('Create customization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customization',
    });
  }
};

export const addCustomizationOption = async (req: Request, res: Response) => {
  try {
    const { menuItemCustomizationId, name, priceModifier } = req.body;

    const option = await prisma.customizationOption.create({
      data: {
        menuItemCustomizationId,
        name,
        priceModifier: Number(priceModifier) || 0,
      },
    });

    res.status(201).json({
      success: true,
      data: option,
      message: 'Customization option created successfully',
    });
  } catch (error) {
    console.error('Create customization option error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customization option',
    });
  }
};
