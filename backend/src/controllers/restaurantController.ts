import { Request, Response } from 'express';
import { prisma } from '../server';

export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      cuisine,
      priceRange,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = req.query;

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (cuisine) {
      where.cuisine = { equals: cuisine as string };
    }

    if (priceRange) {
      where.priceRange = priceRange;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: { orders: true, reviews: true, favorites: true },
          },
        },
      }),
      prisma.restaurant.count({ where }),
    ]);

    res.json({
      success: true,
      data: restaurants,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurants',
    });
  }
};

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
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
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant',
    });
  }
};

export const createRestaurant = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    if (userRole !== 'restaurant_owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only restaurant owners can create restaurants',
      });
    }

    const {
      name,
      description,
      cuisine,
      address,
      phone,
      email,
      priceRange,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryTime,
    } = req.body;

    // Check if user already has a restaurant
    if (userRole === 'restaurant_owner') {
      const existingRestaurant = await prisma.restaurant.findFirst({
        where: { ownerId: userId },
      });

      if (existingRestaurant) {
        return res.status(400).json({
          success: false,
          error: 'You already have a restaurant',
        });
      }
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        cuisine,
        address,
        phone,
        email,
        priceRange,
        deliveryFee: Number(deliveryFee) || 0,
        minOrderAmount: Number(minOrderAmount) || 0,
        estimatedDeliveryTime: Number(estimatedDeliveryTime) || 30,
        ownerId: userId,
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

    res.status(201).json({
      success: true,
      data: restaurant,
      message: 'Restaurant created successfully',
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create restaurant',
    });
  }
};

export const updateRestaurant = async (req: Request, res: Response) => {
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

    // Check if restaurant exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    // Check ownership
    if (userRole !== 'admin' && existingRestaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this restaurant',
      });
    }

    const {
      name,
      description,
      cuisine,
      address,
      phone,
      email,
      priceRange,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryTime,
      isOpen,
    } = req.body;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(cuisine && { cuisine }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(priceRange && { priceRange }),
        ...(deliveryFee !== undefined && { deliveryFee: Number(deliveryFee) }),
        ...(minOrderAmount !== undefined && {
          minOrderAmount: Number(minOrderAmount),
        }),
        ...(estimatedDeliveryTime !== undefined && {
          estimatedDeliveryTime: Number(estimatedDeliveryTime),
        }),
        ...(isOpen !== undefined && { isOpen }),
      },
    });

    res.json({
      success: true,
      data: restaurant,
      message: 'Restaurant updated successfully',
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant',
    });
  }
};

export const deleteRestaurant = async (req: Request, res: Response) => {
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

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
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
        error: 'Not authorized to delete this restaurant',
      });
    }

    await prisma.restaurant.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete restaurant',
    });
  }
};

export const getMyRestaurants = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    if (userRole !== 'restaurant_owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only restaurant owners can view their restaurants',
      });
    }

    const where = userRole === 'admin' ? {} : { ownerId: userId };

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        _count: {
          select: { orders: true, reviews: true, categories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    console.error('Get my restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurants',
    });
  }
};
