import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/error';

export const actionsRouter = Router();

// Apply authentication to all routes
actionsRouter.use(authenticate);

// Validation schemas
const createActionSchema = z.object({
  engagementTechniqueId: z.string().uuid(),
  executedAt: z.string().datetime(),
  command: z.string().max(10000).optional(),
  targetHost: z.string().max(255).optional(),
  targetUser: z.string().max(255).optional(),
  notes: z.string().max(5000).optional(),
});

const updateActionSchema = z.object({
  command: z.string().max(10000).optional().nullable(),
  targetHost: z.string().max(255).optional().nullable(),
  targetUser: z.string().max(255).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

// GET /actions - List actions
actionsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    const {
      engagementId,
      engagementTechniqueId,
      executedById,
      from,
      to,
      limit = '20',
      cursor,
    } = req.query;

    const limitNum = Math.min(Number(limit), 100);

    const where: any = {
      orgId: req.user!.orgId,
    };

    // Filter by engagement
    if (engagementId) {
      where.engagementTechnique = {
        engagementId: engagementId as string,
      };
    }

    // Filter by engagement technique
    if (engagementTechniqueId) {
      where.engagementTechniqueId = engagementTechniqueId as string;
    }

    // Filter by executor
    if (executedById) {
      where.executedById = executedById as string;
    }

    // Filter by date range
    if (from || to) {
      where.executedAt = {};
      if (from) where.executedAt.gte = new Date(from as string);
      if (to) where.executedAt.lte = new Date(to as string);
    }

    const actions = await prisma.action.findMany({
      where,
      take: limitNum + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      orderBy: { executedAt: 'desc' },
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
        validation: {
          include: {
            validatedBy: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        timingMetrics: true,
      },
    });

    const hasMore = actions.length > limitNum;
    if (hasMore) actions.pop();

    res.json({
      data: actions,
      meta: {
        limit: limitNum,
        cursor: hasMore ? actions[actions.length - 1]?.id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /actions - Create action
actionsRouter.post('/', requireAnalyst, async (req, res, next) => {
  try {
    const body = createActionSchema.parse(req.body);

    // Verify engagement technique exists and belongs to user's org
    const engagementTechnique = await prisma.engagementTechnique.findUnique({
      where: {
        id: body.engagementTechniqueId,
        orgId: req.user!.orgId,
      },
      include: {
        engagement: true,
      },
    });

    if (!engagementTechnique) {
      throw new NotFoundError('Engagement technique not found');
    }

    // Create action
    const action = await prisma.action.create({
      data: {
        orgId: req.user!.orgId,
        engagementTechniqueId: body.engagementTechniqueId,
        executedAt: new Date(body.executedAt),
        executedById: req.user!.id,
        command: body.command,
        targetHost: body.targetHost,
        targetUser: body.targetUser,
        notes: body.notes,
      },
      include: {
        engagementTechnique: {
          include: {
            technique: true,
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
    });

    // Update technique status if still PLANNED
    if (engagementTechnique.status === 'PLANNED') {
      await prisma.engagementTechnique.update({
        where: { id: body.engagementTechniqueId },
        data: { status: 'EXECUTING' },
      });
    }

    res.status(201).json(action);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// GET /actions/:id - Get action details
actionsRouter.get('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const action = await prisma.action.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
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
        validation: {
          include: {
            validatedBy: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            defensiveTool: true,
          },
        },
        timingMetrics: true,
      },
    });

    if (!action) {
      throw new NotFoundError('Action not found');
    }

    res.json(action);
  } catch (error) {
    next(error);
  }
});

// PATCH /actions/:id - Update action
actionsRouter.patch('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const body = updateActionSchema.parse(req.body);

    // Verify action exists and belongs to user's org
    const existing = await prisma.action.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Action not found');
    }

    const action = await prisma.action.update({
      where: { id: req.params.id },
      data: body,
      include: {
        engagementTechnique: {
          include: {
            technique: true,
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
    });

    res.json(action);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// DELETE /actions/:id - Delete action
actionsRouter.delete('/:id', requireAnalyst, async (req, res, next) => {
  try {
    // Verify action exists and belongs to user's org
    const existing = await prisma.action.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Action not found');
    }

    await prisma.action.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
