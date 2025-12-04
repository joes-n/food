import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Body parsers for all routes (except upload will use multer)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Routes
import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import menuRoutes from './routes/menuRoutes';
import menuItemRoutes from './routes/menuItemRoutes';
import orderRoutes from './routes/orderRoutes';
import orderManagementRoutes from './routes/orderManagementRoutes';
import paymentRoutes from './routes/paymentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import restaurantStatsRoutes from './routes/restaurantStatsRoutes';
import driverRoutes from './routes/driverRoutes';

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    // Check for Railway-specific env vars
    RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
    RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
    RAILWAY_DEPLOYMENT_ID: process.env.RAILWAY_DEPLOYMENT_ID,
    // List all env vars containing 'URL' or 'RAILWAY'
    relatedEnvVars: Object.keys(process.env).filter(k => k.includes('URL') || k.includes('RAILWAY')),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders/manage', orderManagementRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', restaurantStatsRoutes);
app.use('/api/driver', driverRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join order room for tracking
  socket.on('join-order', (orderId: string) => {
    socket.join(`order-${orderId}`);
    logger.info(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  // Join restaurant room
  socket.on('join-restaurant', (restaurantId: string) => {
    socket.join(`restaurant-${restaurantId}`);
    logger.info(`Socket ${socket.id} joined restaurant room: ${restaurantId}`);
  });

  // Join user room
  socket.on('join-user', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.info(`Socket ${socket.id} joined user room: ${userId}`);
  });

  // Join driver room
  socket.on('join-driver', (driverId: string) => {
    socket.join(`driver-${driverId}`);
    logger.info(`Socket ${socket.id} joined driver room: ${driverId}`);
  });

  // Handle location updates from drivers
  socket.on('driver-location-update', (data: { orderId: string; lat: number; lng: number }) => {
    io.to(`order-${data.orderId}`).emit('location-update', data);
    io.to(`order-${data.orderId}`).emit('driver-location-update', {
      orderId: data.orderId,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date()
    });
  });

  // Handle delivery status updates
  socket.on('delivery-status-update', (data: { orderId: string; restaurantId: string; status: string }) => {
    io.to(`order-${data.orderId}`).emit('order-status-update', {
      orderId: data.orderId,
      status: data.status,
      timestamp: new Date()
    });
    
    io.to(`restaurant-${data.restaurantId}`).emit('order-status-update', {
      orderId: data.orderId,
      status: data.status,
      timestamp: new Date()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in routes
export { io };

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Socket.io ready for connections`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing server`);

  // Close Socket.io connections first
  io.close(() => {
    logger.info('Socket.io closed');
  });

  // Close HTTP server
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    // Disconnect Prisma
    await prisma.$disconnect();
    logger.info('Prisma disconnected');

    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
