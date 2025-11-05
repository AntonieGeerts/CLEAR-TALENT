import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { apiLogger } from '../utils/logger';
import config from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Log the error
  apiLogger.error('Error occurred', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database operation failed',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle validation errors (from Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err,
      timestamp: new Date().toISOString(),
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    success: false,
    error: config.env === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Not found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
