import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/error';

export const engagementsRouter = Router();

// Apply authentication to all routes
engagementsRouter.use(authenticate);

// Validation schemas
const createEngagementSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  methodology: z.enum(['ATOMIC', 'SCENARIO']),
  visibilityMode: z.enum(['OPEN', 'BLIND_BLUE', 'BLIND_RED']).default('OPEN'),
  templateId: z.string().uuid().optional(),
});

const updateEngagementSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETE', 'ARCHIVED']).optional(),
  visibilityMode: z.enum(['OPEN', 'BLIND_BLUE', 'BLIND_RED']).optional(),
});

// GET /engagements - List engagements with pagination
engagementsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    const {
      status,
      methodology,
      isTemplate,
      search,
      limit = '20',
      cursor
    } = req.query;

    const limitNum = Math.min(Number(limit), 100);

    const where: any = {
      orgId: req.user!.orgId,
    };

    if (status) where.status = status as any;
    if (methodology) where.methodology = methodology as any;
    if (isTemplate !== undefined) where.isTemplate = isTemplate === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const engagements = await prisma.engagement.findMany({
      where,
      take: limitNum + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        _count: {
          select: { techniques: true }
        },
      },
    });

    const hasMore = engagements.length > limitNum;
    if (hasMore) engagements.pop();

    // Calculate completion percentage for each engagement
    const data = await Promise.all(
      engagements.map(async (engagement) => {
        const techniqueCounts = await prisma.engagementTechnique.groupBy({
          by: ['status'],
          where: { engagementId: engagement.id },
          _count: true,
        });

        const total = techniqueCounts.reduce((sum, item) => sum + item._count, 0);
        const complete = techniqueCounts.find((item) => item.status === 'COMPLETE')?._count || 0;
        const completionPercent = total > 0 ? Math.round((complete / total) * 100) : 0;

        return {
          id: engagement.id,
          name: engagement.name,
          methodology: engagement.methodology,
          status: engagement.status,
          techniqueCount: engagement._count.techniques,
          completionPercent,
          createdAt: engagement.createdAt,
          updatedAt: engagement.updatedAt,
        };
      })
    );

    res.json({
      data,
      meta: {
        limit: limitNum,
        cursor: hasMore ? engagements[engagements.length - 1]?.id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /engagements - Create new engagement
engagementsRouter.post('/', requireAnalyst, async (req, res, next) => {
  try {
    const body = createEngagementSchema.parse(req.body);

    // If cloning from template, fetch template data
    if (body.templateId) {
      const template = await prisma.engagement.findUnique({
        where: { id: body.templateId },
        include: { techniques: true },
      });

      if (!template || template.orgId !== req.user!.orgId) {
        throw new NotFoundError('Template not found');
      }

      // Create engagement with techniques from template
      const engagement = await prisma.engagement.create({
        data: {
          name: body.name,
          description: body.description || template.description,
          methodology: body.methodology,
          visibilityMode: body.visibilityMode,
          orgId: req.user!.orgId,
          createdById: req.user!.id,
          templateId: body.templateId,
          techniques: {
            create: template.techniques.map((tech) => ({
              orgId: req.user!.orgId,
              techniqueId: tech.techniqueId,
              status: 'PLANNED',
              orderIndex: tech.orderIndex,
              notes: tech.notes,
            })),
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          },
        },
      });

      return res.status(201).json(engagement);
    }

    // Create new engagement
    const engagement = await prisma.engagement.create({
      data: {
        ...body,
        orgId: req.user!.orgId,
        createdById: req.user!.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
      },
    });

    res.status(201).json(engagement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// GET /engagements/:id - Get single engagement
engagementsRouter.get('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const engagement = await prisma.engagement.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
      },
    });

    if (!engagement) {
      throw new NotFoundError('Engagement not found');
    }

    // Calculate stats
    const techniqueCounts = await prisma.engagementTechnique.groupBy({
      by: ['status'],
      where: { engagementId: engagement.id },
      _count: true,
    });

    const total = techniqueCounts.reduce((sum, item) => sum + item._count, 0);
    const complete = techniqueCounts.find((item) => item.status === 'COMPLETE')?._count || 0;
    const completionPercent = total > 0 ? Math.round((complete / total) * 100) : 0;

    const statusCounts: Record<string, number> = {};
    techniqueCounts.forEach((item) => {
      statusCounts[item.status] = item._count;
    });

    res.json({
      ...engagement,
      stats: {
        techniqueCount: total,
        completionPercent,
        statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /engagements/:id - Update engagement
engagementsRouter.patch('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const body = updateEngagementSchema.parse(req.body);

    // Check if engagement exists and belongs to user's org
    const existing = await prisma.engagement.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Engagement not found');
    }

    // Update timestamps based on status changes
    const updateData: any = { ...body };

    if (body.status === 'ACTIVE' && !existing.startedAt) {
      updateData.startedAt = new Date();
    }

    if (body.status === 'COMPLETE' && !existing.completedAt) {
      updateData.completedAt = new Date();
    }

    const engagement = await prisma.engagement.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
      },
    });

    res.json(engagement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// DELETE /engagements/:id - Archive engagement (soft delete)
engagementsRouter.delete('/:id', requireAnalyst, async (req, res, next) => {
  try {
    // Check if engagement exists and belongs to user's org
    const existing = await prisma.engagement.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Engagement not found');
    }

    // Soft delete by setting status to ARCHIVED
    await prisma.engagement.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
