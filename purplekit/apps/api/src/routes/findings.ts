import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/error';

export const findingsRouter = Router();

// Apply authentication to all routes
findingsRouter.use(authenticate);

// Validation schemas
const createFindingSchema = z.object({
  engagementId: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string(),
  pillar: z.enum(['PEOPLE', 'PROCESS', 'TECHNOLOGY']),
  category: z.enum([
    'TELEMETRY_GAP',
    'DETECTION_GAP',
    'PREVENTION_GAP',
    'TOOL_MISCONFIGURATION',
    'INTEGRATION_ISSUE',
    'MISSING_PLAYBOOK',
    'PLAYBOOK_NOT_FOLLOWED',
    'ESCALATION_FAILURE',
    'COMMUNICATION_GAP',
    'DOCUMENTATION_GAP',
    'SKILLS_GAP',
    'CAPACITY_ISSUE',
    'AWARENESS_GAP',
  ]),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  recommendation: z.string().optional(),
  remediationEffort: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  relatedTechniqueIds: z.array(z.string()).optional(),
});

const updateFindingSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  pillar: z.enum(['PEOPLE', 'PROCESS', 'TECHNOLOGY']).optional(),
  category: z.enum([
    'TELEMETRY_GAP',
    'DETECTION_GAP',
    'PREVENTION_GAP',
    'TOOL_MISCONFIGURATION',
    'INTEGRATION_ISSUE',
    'MISSING_PLAYBOOK',
    'PLAYBOOK_NOT_FOLLOWED',
    'ESCALATION_FAILURE',
    'COMMUNICATION_GAP',
    'DOCUMENTATION_GAP',
    'SKILLS_GAP',
    'CAPACITY_ISSUE',
    'AWARENESS_GAP',
  ]).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DEFERRED']).optional(),
  recommendation: z.string().optional().nullable(),
  remediationEffort: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().nullable(),
  relatedTechniqueIds: z.array(z.string()).optional(),
});

// GET /findings - List findings
findingsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    const {
      engagementId,
      pillar,
      category,
      severity,
      status,
      limit = '20',
      cursor,
    } = req.query;

    const limitNum = Math.min(Number(limit), 100);

    const where: any = {
      orgId: req.user!.orgId,
    };

    // Filter by engagement
    if (engagementId) {
      where.engagementId = engagementId as string;
    }

    // Filter by pillar
    if (pillar) {
      where.pillar = pillar as any;
    }

    // Filter by category
    if (category) {
      where.category = category as any;
    }

    // Filter by severity
    if (severity) {
      where.severity = severity as any;
    }

    // Filter by status
    if (status) {
      where.status = status as any;
    }

    const findings = await prisma.finding.findMany({
      where,
      take: limitNum + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }], // CRITICAL first
      include: {
        engagement: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    const hasMore = findings.length > limitNum;
    if (hasMore) findings.pop();

    res.json({
      data: findings,
      meta: {
        limit: limitNum,
        cursor: hasMore ? findings[findings.length - 1]?.id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /findings - Create finding
findingsRouter.post('/', requireAnalyst, async (req, res, next) => {
  try {
    const body = createFindingSchema.parse(req.body);

    // Verify engagement exists and belongs to user's org
    const engagement = await prisma.engagement.findUnique({
      where: {
        id: body.engagementId,
        orgId: req.user!.orgId,
      },
    });

    if (!engagement) {
      throw new NotFoundError('Engagement not found');
    }

    // Create finding
    const finding = await prisma.finding.create({
      data: {
        orgId: req.user!.orgId,
        engagementId: body.engagementId,
        title: body.title,
        description: body.description,
        pillar: body.pillar,
        category: body.category,
        severity: body.severity,
        recommendation: body.recommendation,
        remediationEffort: body.remediationEffort,
        relatedTechniqueIds: body.relatedTechniqueIds || [],
        createdById: req.user!.id,
      },
      include: {
        engagement: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(finding);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// GET /findings/:id - Get finding details
findingsRouter.get('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const finding = await prisma.finding.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
      include: {
        engagement: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!finding) {
      throw new NotFoundError('Finding not found');
    }

    res.json(finding);
  } catch (error) {
    next(error);
  }
});

// PATCH /findings/:id - Update finding
findingsRouter.patch('/:id', requireAnalyst, async (req, res, next) => {
  try {
    const body = updateFindingSchema.parse(req.body);

    // Verify finding exists and belongs to user's org
    const existing = await prisma.finding.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Finding not found');
    }

    const finding = await prisma.finding.update({
      where: { id: req.params.id },
      data: body,
      include: {
        engagement: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.json(finding);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// DELETE /findings/:id - Delete finding
findingsRouter.delete('/:id', requireAnalyst, async (req, res, next) => {
  try {
    // Verify finding exists and belongs to user's org
    const existing = await prisma.finding.findUnique({
      where: {
        id: req.params.id,
        orgId: req.user!.orgId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Finding not found');
    }

    await prisma.finding.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
