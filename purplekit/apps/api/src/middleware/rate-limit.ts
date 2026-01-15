import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Stricter rate limit for report generation
export const reportRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Report generation rate limit exceeded',
    },
  },
});

// Very strict rate limit for ATT&CK sync
export const attackSyncRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'ATT&CK sync can only be triggered once per hour',
    },
  },
});
