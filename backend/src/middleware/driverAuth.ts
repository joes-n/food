import { Request, Response, NextFunction } from 'express';

export const requireDriver = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'driver') {
    return res.status(403).json({
      success: false,
      error: 'Driver access required'
    });
  }
  next();
};