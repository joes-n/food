import { Request, Response } from 'express';
import { prisma } from '../server';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod,
      scheduledFor,
      notes,
    } = req.body;

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    // Verify restaurant is open
    if (!restaurant.isOpen) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant is currently closed',
      });
    }

    // Validate items and calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: {
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
          error: `Menu item not found: ${item.menuItemId}`,
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          error: `Menu item ${menuItem.name} is not available`,
        });
      }

      // Calculate item price with customizations
      let itemPrice = menuItem.price;

      if (item.customizations && item.customizations.length > 0) {
        for (const selected of item.customizations) {
          const customization = menuItem.customizations.find(
            (c) => c.id === selected.customizationId
          );
          const option = customization?.options.find(
            (o) => o.id === selected.optionId
          );

          if (option) {
            itemPrice += option.priceModifier;
          }
        }
      }

      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        customizations: {
          create: item.customizations?.map((c: any) => ({
            customizationId: c.customizationId,
            optionId: c.optionId,
            optionName: c.optionName || '',
            priceModifier: c.priceModifier || 0,
          })),
        },
      });
    }

    // Check minimum order amount
    if (subtotal < restaurant.minOrderAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount is $${restaurant.minOrderAmount}`,
      });
    }

    // Calculate totals
    const deliveryFee = restaurant.deliveryFee;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: userId,
        restaurantId,
        subtotal,
        deliveryFee,
        tax,
        total,
        status: 'pending',
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: 'cash_on_delivery' === paymentMethod
          ? 'pending'
          : 'pending',
        deliveryStreet: deliveryAddress.street,
        deliveryCity: deliveryAddress.city,
        deliveryState: deliveryAddress.state,
        deliveryZipCode: deliveryAddress.zipCode,
        deliveryCountry: deliveryAddress.country,
        deliveryLatitude: deliveryAddress.latitude,
        deliveryLongitude: deliveryAddress.longitude,
        deliveryInstructions: deliveryAddress.instructions,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            customizations: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            estimatedDeliveryTime: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
};

export const getOrder = async (req: Request, res: Response) => {
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

    const order = await prisma.order.findUnique({
      where: { id },
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
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        payment: true,
        delivery: {
          include: {
            route: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check authorization
    const isOwner = order.customerId === userId;
    const isRestaurantOwner = order.restaurant.ownerId === userId;
    const isDriver = order.driverId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isRestaurantOwner && !isDriver && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this order',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
    });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { page = 1, pageSize = 10, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    let where: any = {};

    if (userRole === 'customer') {
      where.customerId = userId;
    } else if (userRole === 'restaurant_owner') {
      // Get restaurant IDs owned by user
      const restaurants = await prisma.restaurant.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      where.restaurantId = {
        in: restaurants.map((r) => r.id),
      };
    } else if (userRole === 'driver') {
      where.driverId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
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
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check authorization
    const isRestaurantOwner = order.restaurant.ownerId === userId;
    const isDriver = order.driverId === userId;
    const isAdmin = userRole === 'admin';

    if (!isRestaurantOwner && !isDriver && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order',
      });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready_for_pickup', 'out_for_delivery', 'cancelled'],
      ready_for_pickup: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const allowedStatuses = validTransitions[order.status] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        ...(status === 'delivered' && { actualDeliveryTime: new Date() }),
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

    res.json({
      success: true,
      data: updated,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
};

export const assignDriver = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: 'confirmed',
      },
      include: {
        restaurant: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Driver assigned successfully',
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign driver',
    });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
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

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Only customer or admin can cancel, and only if order is not out for delivery or delivered
    if (order.customerId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order',
      });
    }

    if (['out_for_delivery', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel order that is out for delivery or delivered',
      });
    }

    const cancelled = await prisma.order.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({
      success: true,
      data: cancelled,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
};
