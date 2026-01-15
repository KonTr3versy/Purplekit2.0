import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { config } from '../config';

// Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMITED', message);
    this.name = 'RateLimitError';
  }
}

// Error response format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  const response: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(response);
}

// Global error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  logger.error({
    err,
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
  }, 'Request error');

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    };
    return res.status(400).json(response);
  }

  // Handle our custom errors
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        ...(config.isDev && { stack: err.stack }),
      },
    };
    return res.status(err.statusCode).json(response);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };
    
    if (prismaError.code === 'P2002') {
      const response: ErrorResponse = {
        error: {
          code: 'CONFLICT',
          message: 'A record with this value already exists',
          details: { fields: prismaError.meta?.target },
        },
      };
      return res.status(409).json(response);
    }

    if (prismaError.code === 'P2025') {
      const response: ErrorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      };
      return res.status(404).json(response);
    }
  }

  // Default 500 error
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProd ? 'An unexpected error occurred' : err.message,
      ...(config.isDev && { stack: err.stack }),
    },
  };
  return res.status(500).json(response);
}
