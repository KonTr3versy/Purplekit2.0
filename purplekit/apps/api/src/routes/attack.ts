import { Router } from 'express';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { NotFoundError } from '../middleware/error';

export const attackRouter = Router();

// Apply authentication to all routes
attackRouter.use(authenticate);

// GET /attack/techniques - List ATT&CK techniques
attackRouter.get('/techniques', requireAnalyst, async (req, res, next) => {
  try {
    const {
      tactic,
      platform,
      search,
      includeSubtechniques = 'true',
      includeDeprecated = 'false',
      limit = '50',
      cursor,
    } = req.query;

    const limitNum = Math.min(Number(limit), 100);

    const where: any = {};

    // Filter by tactic
    if (tactic) {
      where.tactics = { has: tactic as string };
    }

    // Filter by platform
    if (platform) {
      where.platforms = { has: platform as string };
    }

    // Search by ID or name
    if (search) {
      where.OR = [
        { id: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Include/exclude subtechniques
    if (includeSubtechniques === 'false') {
      where.isSubtechnique = false;
    }

    // Include/exclude deprecated
    if (includeDeprecated === 'false') {
      where.deprecated = false;
    }

    const techniques = await prisma.attackTechnique.findMany({
      where,
      take: limitNum + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      orderBy: { id: 'asc' },
    });

    const hasMore = techniques.length > limitNum;
    if (hasMore) techniques.pop();

    res.json({
      data: techniques,
      meta: {
        limit: limitNum,
        cursor: hasMore ? techniques[techniques.length - 1]?.id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /attack/techniques/:techniqueId - Get technique details
attackRouter.get('/techniques/:techniqueId', requireAnalyst, async (req, res, next) => {
  try {
    const { techniqueId } = req.params;

    const technique = await prisma.attackTechnique.findUnique({
      where: { id: techniqueId },
      include: {
        parent: true,
        subtechniques: true,
      },
    });

    if (!technique) {
      throw new NotFoundError('ATT&CK technique not found');
    }

    res.json(technique);
  } catch (error) {
    next(error);
  }
});

// POST /attack/sync - Trigger sync with MITRE ATT&CK
// Note: This would typically trigger a background job to sync data from MITRE
// For now, it returns a placeholder response
attackRouter.post('/sync', requireAnalyst, async (req, res, next) => {
  try {
    // In a real implementation, this would:
    // 1. Trigger a BullMQ job to fetch data from MITRE ATT&CK
    // 2. Parse and upsert techniques into the database
    // 3. Track sync status

    // For now, just return accepted status
    res.status(202).json({
      message: 'ATT&CK sync initiated',
      status: 'queued',
      note: 'Sync functionality requires background job implementation',
    });
  } catch (error) {
    next(error);
  }
});
