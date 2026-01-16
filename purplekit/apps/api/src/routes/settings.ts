import { Router } from 'express';
import { z } from 'zod';
import * as _ from 'lodash';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst, requireAdmin } from '../middleware/auth';
import { NotFoundError } from '../middleware/error';

export const settingsRouter = Router();

// Apply authentication to all routes
settingsRouter.use(authenticate);

// Default settings constant
export const DEFAULT_SETTINGS = {
  profile: {
    description: null,
    timezone: 'America/New_York',
    dateFormat: 'ISO',
    timeFormat: '24h'
  },
  reports: {
    defaultType: 'TACTICAL',
    defaultFormat: 'pdf'
  },
  security: {
    sessionTimeoutMinutes: 480,
    requirePasswordChangeOnFirstLogin: true
  }
};

// Validation schemas
const profileSettingsSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  timezone: z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/),
  dateFormat: z.enum(['ISO', 'US', 'EU']),
  timeFormat: z.enum(['12h', '24h'])
});

const reportSettingsSchema = z.object({
  defaultType: z.enum(['TACTICAL', 'OPERATIONAL', 'STRATEGIC']),
  defaultFormat: z.enum(['pdf', 'html', 'docx'])
});

const securitySettingsSchema = z.object({
  sessionTimeoutMinutes: z.number().int().min(15).max(10080), // 15 min to 1 week
  requirePasswordChangeOnFirstLogin: z.boolean()
});

const updateSettingsSchema = z.object({
  profile: profileSettingsSchema.partial().optional(),
  reports: reportSettingsSchema.partial().optional(),
  security: securitySettingsSchema.partial().optional()
});

// GET /settings - Fetch organization settings with defaults applied
settingsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user!.orgId },
      select: { settings: true }
    });

    if (!org) {
      throw new NotFoundError('Organization');
    }

    // Deep merge with defaults
    const settings = _.merge({}, DEFAULT_SETTINGS, org.settings);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PATCH /settings - Update organization settings (admin only)
settingsRouter.patch('/', requireAdmin, async (req, res, next) => {
  try {
    const body = updateSettingsSchema.parse(req.body);

    // Fetch current settings
    const org = await prisma.organization.findUnique({
      where: { id: req.user!.orgId },
      select: { settings: true }
    });

    if (!org) {
      throw new NotFoundError('Organization');
    }

    // Deep merge: defaults → current → updates
    const currentSettings = _.merge({}, DEFAULT_SETTINGS, org.settings);
    const newSettings = _.merge({}, currentSettings, body);

    // Update organization
    await prisma.organization.update({
      where: { id: req.user!.orgId },
      data: { settings: newSettings }
    });

    res.json(newSettings);
  } catch (error) {
    next(error);
  }
});
