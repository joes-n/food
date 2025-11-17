import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { upload } from '../utils/upload';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const router = Router();

// Upload single file
router.post('/image', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  // Extract restaurant ID from request body (now available after multer processes the form)
  const { restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      error: 'Restaurant ID is required',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  try {
    // Check if the authenticated user owns the restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    // Get user ID from JWT token (assuming it's stored in req.user)
    const userId = (req as any).user?.id;

    if (restaurant.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to upload images for this restaurant',
      });
    }

    // Return the full file URL including backend host
    const serverUrl = process.env.SERVER_URL;
    let baseUrl: string;

    if (serverUrl) {
      // Remove trailing slash if present to avoid double slashes
      baseUrl = serverUrl.replace(/\/$/, '');
    } else {
      baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    }

    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        path: req.file.path,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Serve uploaded files
router.get('/file/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
    });
  }

  res.sendFile(filePath);
});

export default router;