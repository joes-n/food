import { Request, Response } from 'express';
import { prisma } from '../server';

export const getRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const { restaurantId, status } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Verify ownership
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId as string },
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
        error: 'Not authorized to view orders for this restaurant',
      });
    }

    const where: any = {
      restaurantId: restaurantId as string,
    };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
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

    // Transform orders to include deliveryAddress
    const ordersWithAddress = orders.map((order) => ({
      ...order,
      deliveryAddress: `${order.deliveryStreet}, ${order.deliveryCity}, ${order.deliveryState} ${order.deliveryZipCode}`,
    }));

    res.json({
      success: true,
      data: ordersWithAddress,
    });
  } catch (error) {
    console.error('Get restaurant orders error:', error);
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

    // Check if order exists and user owns the restaurant
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (userRole !== 'admin' && existingOrder.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order',
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
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

    res.json({
      success: true,
      data: order,
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

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

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

    if (order.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending orders can be accepted',
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
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

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order accepted successfully',
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept order',
    });
  }
};

export const rejectOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

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

    if (order.restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending orders can be rejected',
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
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

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order rejected successfully',
    });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject order',
    });
  }
};