import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const formatDeliveryResponse = (delivery: any) => {
  const { order } = delivery;

  return {
    id: delivery.id,
    orderId: order.id,
    restaurant: {
      name: order.restaurant.name,
      address: order.restaurant.address,
      phone: order.restaurant.phone || '',
      latitude: order.restaurant.latitude,
      longitude: order.restaurant.longitude
    },
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      phone: order.customer.phone || '',
      address: order.deliveryStreet,
      latitude: order.deliveryLatitude,
      longitude: order.deliveryLongitude
    },
    items: order.items.map((item: any) => ({
      name: item.menuItemName || item.name,
      quantity: item.quantity,
      price: item.price
    })),
    total: order.total,
    estimatedEarnings: delivery.estimatedEarnings ?? order.deliveryFee ?? 0,
    distance: delivery.distance ?? 0,
    estimatedDuration: delivery.estimatedDuration ?? order.restaurant.estimatedDeliveryTime ?? 0,
    status: delivery.status,
    pickupTime: delivery.pickupTime,
    deliveryTime: delivery.deliveryTime,
    createdAt: delivery.createdAt
  };
};

const formatAvailableOrder = (order: any) => ({
  id: order.id,
  orderId: order.id,
  restaurant: {
    name: order.restaurant.name,
    address: order.restaurant.address,
    phone: order.restaurant.phone || '',
    latitude: order.restaurant.latitude,
    longitude: order.restaurant.longitude
  },
  customer: {
    id: order.customer.id,
    name: order.customer.name,
    phone: order.customer.phone || '',
    address: order.deliveryStreet,
    latitude: order.deliveryLatitude,
    longitude: order.deliveryLongitude
  },
  items: order.items.map((item: any) => ({
    name: item.menuItemName || item.name,
    quantity: item.quantity,
    price: item.price
  })),
  total: order.total,
  estimatedEarnings: order.deliveryFee ?? 0,
  distance: 0,
  estimatedDuration: order.restaurant.estimatedDeliveryTime ?? 0,
  status: 'assigned',
  pickupTime: null,
  deliveryTime: null,
  createdAt: order.createdAt
});

export const getAvailableDeliveries = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const readyOrders = await prisma.order.findMany({
      where: {
        status: 'ready_for_pickup',
        delivery: null
      },
      include: {
        restaurant: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: readyOrders.map(formatAvailableOrder)
    });
  } catch (error) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available deliveries'
    });
  }
};

export const acceptDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        items: true,
        delivery: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'ready_for_pickup') {
      return res.status(400).json({
        success: false,
        error: 'Order is not ready for pickup'
      });
    }

    if (order.delivery && order.delivery.driverId && order.delivery.driverId !== driverId) {
      return res.status(400).json({
        success: false,
        error: 'Delivery already assigned to another driver'
      });
    }

    let deliveryRecord;

    if (!order.delivery) {
      deliveryRecord = await prisma.delivery.create({
        data: {
          orderId: order.id,
          driverId,
          status: 'assigned',
          estimatedEarnings: order.deliveryFee,
          estimatedDuration: order.restaurant.estimatedDeliveryTime
        },
        include: {
          order: {
            include: {
              restaurant: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              items: true
            }
          }
        }
      });
    } else {
      deliveryRecord = await prisma.delivery.update({
        where: { id: order.delivery.id },
        data: { 
          driverId,
          status: 'assigned'
        },
        include: {
          order: {
            include: {
              restaurant: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              items: true
            }
          }
        }
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'out_for_delivery' }
    });

    await prisma.user.update({
      where: { id: driverId },
      data: { driverStatus: 'busy' }
    });

    res.json({
      success: true,
      data: formatDeliveryResponse(deliveryRecord),
      message: 'Delivery accepted successfully'
    });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept delivery'
    });
  }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { status } = req.body;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: driverId },
      data: { driverStatus: status }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Driver status updated successfully'
    });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver status'
    });
  }
};

export const updateDriverLocation = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { lat, lng } = req.body;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: driverId },
      data: {
        driverLocationLat: lat,
        driverLocationLng: lng,
        lastLocationUpdate: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
};

export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const updateData: any = { status };
    
    if (status === 'in_transit') {
      updateData.pickupTime = new Date();
    } else if (status === 'delivered') {
      updateData.deliveryTime = new Date();
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            restaurant: true,
            customer: true
          }
        }
      }
    });

    if (status === 'picked_up' || status === 'in_transit') {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'out_for_delivery' }
      });
    }

    if (status === 'delivered') {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          status: 'delivered',
          actualDeliveryTime: new Date()
        }
      });

      await prisma.user.update({
        where: { id: driverId },
        data: { 
          driverStatus: 'online',
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: delivery.driverFee || 0 }
        }
      });
    }

    res.json({
      success: true,
      data: formatDeliveryResponse(delivery),
      message: 'Delivery status updated successfully'
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery status'
    });
  }
};

export const getDriverEarnings = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: {
        totalEarnings: true,
        totalDeliveries: true
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const todayEarnings = await prisma.delivery.aggregate({
      where: {
        driverId,
        status: 'delivered',
        deliveryTime: { gte: today }
      },
      _sum: { driverFee: true }
    });

    const weekEarnings = await prisma.delivery.aggregate({
      where: {
        driverId,
        status: 'delivered',
        deliveryTime: { gte: weekAgo }
      },
      _sum: { driverFee: true }
    });

    const monthEarnings = await prisma.delivery.aggregate({
      where: {
        driverId,
        status: 'delivered',
        deliveryTime: { gte: monthAgo }
      },
      _sum: { driverFee: true }
    });

    res.json({
      success: true,
      data: {
        total: driver?.totalEarnings || 0,
        today: todayEarnings._sum.driverFee || 0,
        week: weekEarnings._sum.driverFee || 0,
        month: monthEarnings._sum.driverFee || 0
      }
    });
  } catch (error) {
    console.error('Get driver earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings'
    });
  }
};

export const getMyDeliveries = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId: driverId
      },
      include: {
        order: {
          include: {
            restaurant: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: deliveries.map(formatDeliveryResponse)
    });
  } catch (error) {
    console.error('Get my deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deliveries'
    });
  }
};
