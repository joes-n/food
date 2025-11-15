import { Request, Response } from 'express';
import { prisma } from '../server';

export const getRestaurantStats = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.query;
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
        error: 'Not authorized to view stats for this restaurant',
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get order statistics
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      monthlyOrders,
      yearlyOrders,
      monthlyRevenue,
      yearlyRevenue,
    ] = await Promise.all([
      prisma.order.count({
        where: { restaurantId: restaurantId as string },
      }),
      prisma.order.count({
        where: { restaurantId: restaurantId as string, status: 'pending' },
      }),
      prisma.order.count({
        where: { restaurantId: restaurantId as string, status: 'delivered' },
      }),
      prisma.order.count({
        where: { restaurantId: restaurantId as string, status: 'cancelled' },
      }),
      prisma.order.count({
        where: {
          restaurantId: restaurantId as string,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.order.count({
        where: {
          restaurantId: restaurantId as string,
          createdAt: { gte: startOfYear },
        },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId: restaurantId as string,
          status: 'delivered',
          createdAt: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId: restaurantId as string,
          status: 'delivered',
          createdAt: { gte: startOfYear },
        },
        _sum: { total: true },
      }),
    ]);

    // Get daily orders for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyOrders = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count,
        SUM("total") as revenue
      FROM "Order"
      WHERE "restaurantId" = ${restaurantId as string}
        AND "createdAt" >= ${thirtyDaysAgo}
        AND "status" = 'delivered'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get popular items
    const popularItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          restaurantId: restaurantId as string,
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

    // Get menu items for popular items
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: popularItems.map((item) => item.menuItemId),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
      },
    });

    const popularItemsWithDetails = popularItems.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      return {
        id: item.menuItemId,
        name: menuItem?.name || 'Unknown',
        price: menuItem?.price || 0,
        image: menuItem?.image,
        totalSold: item._sum.quantity,
        totalRevenue: item._sum.subtotal,
      };
    });

    const stats = {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        monthly: monthlyOrders,
        yearly: yearlyOrders,
      },
      revenue: {
        monthly: monthlyRevenue._sum.total || 0,
        yearly: yearlyRevenue._sum.total || 0,
      },
      dailyOrders,
      popularItems: popularItemsWithDetails,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get restaurant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant statistics',
    });
  }
};