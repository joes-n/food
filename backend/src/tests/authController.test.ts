import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
} from '../controllers/authController';

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

// Mock bcrypt
jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jwt
jest.mock('jsonwebtoken');
const jwtMock = jwt as jest.Mocked<typeof jwt>;

// Mock prisma
jest.mock('../server', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../server';

describe('Auth Controller', () => {
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

    // Default JWT token
    (jwtMock.sign as jest.Mock).mockReturnValue('mock-jwt-token');
    (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'CUSTOMER' as const,
      phone: '1234567890',
    };

    it('should register a new user successfully', async () => {
      const mockCreatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        phone: '1234567890',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      mockRequest.body = validUserData;

      await register(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcryptMock.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
          name: 'Test User',
          role: 'CUSTOMER',
          phone: '1234567890',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      });
      expect(jwtMock.sign).toHaveBeenCalledWith(
        { userId: '1', email: 'test@example.com', role: 'CUSTOMER' },
        'test-jwt-secret-key-for-testing-only',
        { expiresIn: '7d' }
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockCreatedUser,
          token: 'mock-jwt-token',
        },
        message: 'User registered successfully',
      });
    });

    it('should return 400 if user already exists', async () => {
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Existing User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      mockRequest.body = validUserData;

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'User already exists with this email',
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.body = validUserData;

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Registration failed',
      });
    });

    it('should handle missing optional phone field', async () => {
      const { phone, ...userDataWithoutPhone } = validUserData;

      const mockCreatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      mockRequest.body = userDataWithoutPhone;

      await register(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
          name: 'Test User',
          role: 'CUSTOMER',
          phone: undefined,
        },
        select: expect.any(Object),
      });
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'CUSTOMER',
        phone: '1234567890',
        avatar: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.body = validLoginData;

      await login(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
        },
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
      expect(jwtMock.sign).toHaveBeenCalledWith(
        { userId: '1', email: 'test@example.com', role: 'CUSTOMER' },
        'test-jwt-secret-key-for-testing-only',
        { expiresIn: '7d' }
      );
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'CUSTOMER',
            phone: '1234567890',
            avatar: null,
          },
          token: 'mock-jwt-token',
        },
        message: 'Login successful',
      });
    });

    it('should return 401 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.body = validLoginData;

      await login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email or password',
      });
    });

    it('should return 401 if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'CUSTOMER',
        phone: null,
        avatar: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      mockRequest.body = validLoginData;

      await login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email or password',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.body = validLoginData;

      await login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Login failed',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        phone: '1234567890',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };

      await getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch user',
      });
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      name: 'Updated Name',
      phone: '9876543210',
      avatar: 'new-avatar-url',
    };

    it('should update profile successfully', async () => {
      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'CUSTOMER',
        phone: '9876543210',
        avatar: 'new-avatar-url',
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = updateData;

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Name',
          phone: '9876543210',
          avatar: 'new-avatar-url',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          updatedAt: true,
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser,
        message: 'Profile updated successfully',
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = updateData;

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Only Name Updated' };

      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Only Name Updated',
        role: 'CUSTOMER',
        phone: null,
        avatar: null,
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = partialUpdate;

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Only Name Updated',
        },
        select: expect.any(Object),
      });
    });

    it('should return 500 on database error', async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = updateData;

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update profile',
      });
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    };

    it('should change password successfully', async () => {
      const mockUser = {
        id: '1',
        password: 'hashed-current-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = passwordData;

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          id: true,
          password: true,
        },
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        'old-password',
        'hashed-current-password'
      );
      expect(bcryptMock.hash).toHaveBeenCalledWith('new-password', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          password: 'hashed-new-password',
        },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = passwordData;

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated',
      });
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = passwordData;

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 400 if current password is incorrect', async () => {
      const mockUser = {
        id: '1',
        password: 'hashed-current-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = passwordData;

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Current password is incorrect',
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return 500 on database error during user lookup', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = passwordData;

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to change password',
      });
    });

    it('should return 500 on database error during password update', async () => {
      const mockUser = {
        id: '1',
        password: 'hashed-current-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };
      mockRequest.body = passwordData;

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to change password',
      });
    });
  });
});
