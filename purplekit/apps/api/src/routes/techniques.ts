import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error';

// Note: This router should be mounted at /engagements/:engagementId/techniques
// So all routes here are relative to that path
export const techniquesRouter = Router({ mergeParams: true });

// Apply authentication to all routes
techniquesRouter.use(authenticate);

// Validation schemas
const addTechniqueSchema = z.object({
  techniqueId: z.string().regex(/^T\d{4}(\.\d{3})?$/, 'Invalid ATT&CK technique ID'),
  notes: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  dependencies: z.array(z.object({
    prerequisiteId: z.string().uuid(),
    dependencyType: z.enum(['REQUIRES_SUCCESS', 'REQUIRES_COMPLETION']),
  })).optional(),
});

const updateTechniqueSchema = z.object({
  status: z.enum(['PLANNED', 'BLOCKED', 'EXECUTING', 'VALIDATING', 'COMPLETE']).optional(),
  orderIndex: z.number().int().optional(),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});

const bulkAddTechniquesSchema = z.object({
  techniqueIds: z.array(z.string().regex(/^T\d{4}(\.\d{3})?$/))
    .min(1, 'At least one technique ID required')
    .max(50, 'Maximum 50 techniques allowed'),
});

// GET / - List engagement techniques
techniquesRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    const { engagementId } = req.params;
    const { status, assignedToId } = req.query;

    // Verify engagement belongs to user's org
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId, orgId: req.user!.orgId },
    });

    if (!engagement) {
      throw new NotFoundError('Engagement not found');
    }

    const where: any = { engagementId };
    if (status) where.status = status as any;
    if (assignedToId) where.assignedToId = assignedToId as string;

    const techniques = await prisma.engagementTechnique.findMany({
      where,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      include: {
        technique: true,
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        dependsOn: {
          include: {
            prerequisite: {
              include: {
                technique: true,
              },
            },
          },
        },
        _count: {
          select: { actions: true },
        },
      },
    });

    const data = techniques.map((t) => ({
      id: t.id,
      engagementId: t.engagementId,
      technique: t.technique,
      status: t.status,
      orderIndex: t.orderIndex,
      notes: t.notes,
      assignedTo: t.assignedTo,
      dependencies: t.dependsOn.map((d) => ({
        techniqueId: d.prerequisiteId,
        dependencyType: d.dependencyType,
      })),
      actionCount: t._count.actions,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// POST / - Add technique to engagement
techniquesRouter.post('/', requireAnalyst, async (req, res, next) => {
  try {
    const { engagementId } = req.params;
    const body = addTechniqueSchema.parse(req.body);

    // Verify engagement belongs to user's org
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId, orgId: req.user!.orgId },
    });

    if (!engagement) {
      throw new NotFoundError('Engagement not found');
    }

    // Verify technique exists
    const attackTechnique = await prisma.attackTechnique.findUnique({
      where: { id: body.techniqueId },
    });

    if (!attackTechnique) {
      throw new NotFoundError('ATT&CK technique not found');
    }

    // Check if technique already added
    const existing = await prisma.engagementTechnique.findUnique({
      where: {
        engagementId_techniqueId: {
          engagementId,
          techniqueId: body.techniqueId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Technique already added to engagement');
    }

    // Get max order index
    const maxOrder = await prisma.engagementTechnique.aggregate({
      where: { engagementId },
      _max: { orderIndex: true },
    });

    // Create engagement technique
    const engagementTechnique = await prisma.engagementTechnique.create({
      data: {
        orgId: req.user!.orgId,
        engagementId,
        techniqueId: body.techniqueId,
        notes: body.notes,
        assignedToId: body.assignedToId,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        ...(body.dependencies && body.dependencies.length > 0 && {
          dependsOn: {
            create: body.dependencies.map((dep) => ({
              orgId: req.user!.orgId,
              prerequisiteId: dep.prerequisiteId,
              dependencyType: dep.dependencyType,
            })),
          },
        }),
      },
      include: {
        technique: true,
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        dependsOn: {
          include: {
            prerequisite: {
              include: {
                technique: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(engagementTechnique);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// POST /bulk - Bulk add techniques
techniquesRouter.post('/bulk', requireAnalyst, async (req, res, next) => {
  try {
    const { engagementId } = req.params;
    const body = bulkAddTechniquesSchema.parse(req.body);

    // Verify engagement belongs to user's org
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId, orgId: req.user!.orgId },
    });

    if (!engagement) {
      throw new NotFoundError('Engagement not found');
    }

    // Get existing techniques in engagement
    const existingTechniques = await prisma.engagementTechnique.findMany({
      where: { engagementId },
      select: { techniqueId: true },
    });

    const existingIds = new Set(existingTechniques.map((t) => t.techniqueId));
    const newTechniqueIds = body.techniqueIds.filter((id) => !existingIds.has(id));

    // Verify all techniques exist
    const attackTechniques = await prisma.attackTechnique.findMany({
      where: { id: { in: newTechniqueIds } },
    });

    const foundIds = new Set(attackTechniques.map((t) => t.id));
    const validTechniqueIds = newTechniqueIds.filter((id) => foundIds.has(id));

    // Get max order index
    const maxOrder = await prisma.engagementTechnique.aggregate({
      where: { engagementId },
      _max: { orderIndex: true },
    });

    let orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    // Create all techniques
    const techniques = await Promise.all(
      validTechniqueIds.map((techniqueId) =>
        prisma.engagementTechnique.create({
          data: {
            orgId: req.user!.orgId,
            engagementId,
            techniqueId,
            orderIndex: orderIndex++,
          },
          include: {
            technique: true,
          },
        })
      )
    );

    res.status(201).json({
      added: techniques.length,
      skipped: body.techniqueIds.length - newTechniqueIds.length + (newTechniqueIds.length - validTechniqueIds.length),
      techniques,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// GET /:techniqueId - Get engagement technique
techniquesRouter.get('/:techniqueId', requireAnalyst, async (req, res, next) => {
  try {
    const { engagementId, techniqueId } = req.params;

    const engagementTechnique = await prisma.engagementTechnique.findUnique({
      where: {
        id: techniqueId,
        engagementId,
        orgId: req.user!.orgId,
      },
      include: {
        technique: true,
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        dependsOn: {
          include: {
            prerequisite: {
              include: {
                technique: true,
              },
            },
          },
        },
        actions: {
          include: {
            executedBy: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!engagementTechnique) {
      throw new NotFoundError('Technique not found in engagement');
    }

    res.json(engagementTechnique);
  } catch (error) {
    next(error);
  }
});

// PATCH /:techniqueId - Update technique
techniquesRouter.patch('/:techniqueId', requireAnalyst, async (req, res, next) => {
  try {
    const { engagementId, techniqueId } = req.params;
    const body = updateTechniqueSchema.parse(req.body);

    // Verify technique exists and belongs to user's org
    const existing = await prisma.engagementTechnique.findUnique({
      where: {
        id: techniqueId,
        engagementId,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Technique not found in engagement');
    }

    const engagementTechnique = await prisma.engagementTechnique.update({
      where: { id: techniqueId },
      data: body,
      include: {
        technique: true,
        assignedTo: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.json(engagementTechnique);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// DELETE /:techniqueId - Remove technique
techniquesRouter.delete('/:techniqueId', requireAnalyst, async (req, res, next) => {
  try {
    const { engagementId, techniqueId } = req.params;

    // Verify technique exists and belongs to user's org
    const existing = await prisma.engagementTechnique.findUnique({
      where: {
        id: techniqueId,
        engagementId,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Technique not found in engagement');
    }

    await prisma.engagementTechnique.delete({
      where: { id: techniqueId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
