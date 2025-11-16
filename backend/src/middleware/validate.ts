import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodObject, ZodRawShape } from 'zod';

type ValidationSchema = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
} | ZodObject<ZodRawShape>;

export const validate =
  (schema: ValidationSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if it's a ZodObject with shape containing body/query/params
      if ('shape' in schema) {
        const shape = schema.shape as Record<string, ZodSchema>;
        if (shape.body) {
          req.body = shape.body.parse(req.body);
        }
        if (shape.query) {
          req.query = shape.query.parse(req.query);
        }
        if (shape.params) {
          req.params = shape.params.parse(req.params);
        }
      } else {
        // Legacy format: separate schemas
        if (schema.body) {
          req.body = schema.body.parse(req.body);
        }
        if (schema.query) {
          req.query = schema.query.parse(req.query);
        }
        if (schema.params) {
          req.params = schema.params.parse(req.params);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
