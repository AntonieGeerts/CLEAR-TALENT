import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../types';

/**
 * Validate request body against Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(new ValidationError(error instanceof Error ? error.message : 'Validation failed'));
    }
  };
};

/**
 * Validate request query against Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert numeric strings to numbers for query params
      const query: any = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (value && !isNaN(Number(value))) {
          query[key] = Number(value);
        } else {
          query[key] = value;
        }
      }

      req.query = schema.parse(query) as any;
      next();
    } catch (error) {
      next(new ValidationError(error instanceof Error ? error.message : 'Validation failed'));
    }
  };
};

/**
 * Validate request params against Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      next(new ValidationError(error instanceof Error ? error.message : 'Validation failed'));
    }
  };
};
