import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error';

export const validationsRouter = Router();

// Apply authentication to all routes
validationsRouter.use(authenticate);

// Validation schemas
const createValidationSchema = z.object({
  actionId: z.string().uuid(),
  outcome: z.enum(['LOGGED', 'ALERTED', 'PREVENTED', 'NOT_LOGGED']),
  detectedAt: z.string().datetime().optional(),
  defensiveToolId: z.string().uuid().optional(),
  dataSource: z.string().max(255).optional(),
  query: z.string().optional(),
  alertName: z.string().max(255).optional(),
  alertPriority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
  falsePositive: z.boolean().optional(),
  notes: z.string().optional(),
});

const updateValidationSchema = z.object({
  outcome: z.enum(['LOGGED', 'ALERTED', 'PREVENTED', 'NOT_LOGGED']).optional(),
  detectedAt: z.string().datetime().optional().nullable(),
  defensiveToolId: z.string().uuid().optional().nullable(),
  dataSource: z.string().max(255).optional().nullable(),
  query: z.string().optional().nullable(),
  alertName: z.string().max(255).optional().nullable(),
  alertPriority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional().nullable(),
  falsePositive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

// GET /validations - List validations
validationsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    const {
      engagementId,
      actionId,
      outcome,
      defensiveToolId,
      limit = '20',
      cursor,
    } = req.query;

    const limitNum = Math.min(Number(limit), 100);

    const where: any = {
      orgId: req.user!.orgId,
    };

    // Filter by engagement
    if (engagementId) {
      where.action = {
        engagementTechnique: {
          engagementId: engagementId as string,
        },
      };
    }

    // Filter by action
    if (actionId) {
      where.actionId = actionId as string;
    }

    // Filter by outcome
    if (outcome) {
      where.outcome = outcome as any;
    }

    // Filter by defensive tool
    if (defensiveToolId) {
      where.defensiveToolId = defensiveToolId as string;
    }

    const validations = await prisma.detectionValidation.findMany({
      where,
      take: limitNum + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        action: {
          include: {
            engagementTechnique: {
              include: {
                technique: true,
                engagement: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            executedBy: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        validatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        defensiveTool: true,
      },
    });

    const hasMore = validations.length > limitNum;
    if (hasMore) validations.pop();

    res.json({
      data: validations,
      meta: {
        limit: limitNum,
        cursor: hasMore ? validations[validations.length - 1]?.id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /validations - Create validation
validationsRouter.post('/', requireAnalyst, async (req, res, next) => {
  try {
    const body = createValidationSchema.parse(req.body);

    // Verify action exists and belongs to user's org
    const action = await prisma.action.findUnique({
      where: {
        id: body.actionId,
        orgId: req.user!.orgId,
      },
      include: {
        engagementTechnique: true,
      },
    });

    if (!action) {
      throw new NotFoundError('Action not found');
    }

    // Check if validation already exists for this action
    const existing = await prisma.detectionValidation.findUnique({
      where: { actionId: body.actionId },
    });

    if (existing) {
      throw new ConflictError('Validation already exists for this action');
    }

    // Verify defensive tool if provided
    if (body.defensiveToolId) {
      const tool = await prisma.defensiveTool.findUnique({
        where: {
          id: body.defensiveToolId,
          orgId: req.user!.orgId,
        },
      });

      if (!tool) {
        throw new NotFoundError('Defensive tool not found');
      }
    }

    // Create validation
    const validation = await prisma.detectionValidation.create({
      data: {
        orgId: req.user!.orgId,
        actionId: body.actionId,
        outcome: body.outcome,
        detectedAt: body.detectedAt ? new Date(body.detectedAt) : null,
        validatedById: req.user!.id,
        defensiveToolId: body.defensiveToolId,
        dataSource: body.dataSource,
        query: body.query,
        alertName: body.alertName,
        alertPriority: body.alertPriority,
        falsePositive: body.falsePositive ?? false,
        notes: body.notes,
      },
      include: {
        action: {
          include: {
            engagementTechnique: {
              include: {
                technique: true,
              },
            },
          },
        },
        validatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        defensiveTool: true,
      },
    });

    // Update technique status to VALIDATING if currently EXECUTING
    if (action.engagementTechnique.status === 'EXECUTING') {
      await prisma.engagementTechnique.update({
        where: { id: action.engagementTechniqueId },
        data: { status: 'VALIDATING' },
      });
    }

    res.status(201).json(validation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// GET /validations/:id - Get validation details
validationsRouter.get('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const validation = await prisma.detectionValidation.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
      include: {
        action: {
          include: {
            engagementTechnique: {
              include: {
                technique: true,
                engagement: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            executedBy: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            timingMetrics: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        defensiveTool: true,
      },
    });

    if (!validation) {
      throw new NotFoundError('Validation not found');
    }

    res.json(validation);
  } catch (error) {
    next(error);
  }
});

// PATCH /validations/:id - Update validation
validationsRouter.patch('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const body = updateValidationSchema.parse(req.body);

    // Verify validation exists and belongs to user's org
    const existing = await prisma.detectionValidation.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Validation not found');
    }

    // Verify defensive tool if provided
    if (body.defensiveToolId) {
      const tool = await prisma.defensiveTool.findUnique({
        where: {
          id: body.defensiveToolId,
          orgId: req.user!.orgId,
        },
      });

      if (!tool) {
        throw new NotFoundError('Defensive tool not found');
      }
    }

    const validation = await prisma.detectionValidation.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...(body.detectedAt && { detectedAt: new Date(body.detectedAt) }),
      },
      include: {
        action: {
          include: {
            engagementTechnique: {
              include: {
                technique: true,
              },
            },
          },
        },
        validatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        defensiveTool: true,
      },
    });

    res.json(validation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// DELETE /validations/:id - Delete validation
validationsRouter.delete('/:id', requireAnalyst, async (req, res, next) => {
  try {
    // Verify validation exists and belongs to user's org
    const existing = await prisma.detectionValidation.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Validation not found');
    }

    await prisma.detectionValidation.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
