import { Router } from 'express';
import { z } from 'zod';
import { subDays, differenceInDays } from 'date-fns';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { prisma } from '../lib/database';
import { aggregateOrganizationAnalytics } from '../services/analytics-aggregator';

export const analyticsRouter = Router();

// Apply authentication to all routes
analyticsRouter.use(authenticate);

// Validation schema for query parameters
const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  engagementId: z.string().uuid().optional(),
});

/**
 * GET /api/v1/analytics
 * Get organization-wide analytics data
 */
analyticsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    // Validate query parameters
    const query = analyticsQuerySchema.parse(req.query);

    // Parse dates with defaults
    const startDate = query.startDate
      ? new Date(query.startDate)
      : subDays(new Date(), 90);
    const endDate = query.endDate
      ? new Date(query.endDate)
      : new Date();

    // Validate date range (max 365 days)
    const daysDiff = differenceInDays(endDate, startDate);
    if (daysDiff > 365) {
      return res.status(400).json({
        error: 'Date range cannot exceed 365 days',
        maxDays: 365,
        requestedDays: daysDiff,
      });
    }

    if (daysDiff < 0) {
      return res.status(400).json({
        error: 'End date must be after start date',
      });
    }

    // Get organization ID from authenticated user
    const orgId = req.user!.orgId;

    // Aggregate analytics data
    const data = await aggregateOrganizationAnalytics(
      prisma,
      orgId,
      startDate,
      endDate,
      query.engagementId
    );

    res.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }
    next(error);
  }
});
