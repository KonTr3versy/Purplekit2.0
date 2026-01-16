import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../lib/database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error';

export const usersRouter = Router();

// Apply authentication to all routes
usersRouter.use(authenticate);

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(100),
  role: z.enum(['ADMIN', 'RED_LEAD', 'BLUE_LEAD', 'ANALYST', 'OBSERVER']),
});

const updateUserSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'RED_LEAD', 'BLUE_LEAD', 'ANALYST', 'OBSERVER']).optional(),
  isActive: z.boolean().optional(),
});

// GET /users - List users with filters and pagination
usersRouter.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { role, isActive, search, limit = '20', cursor } = req.query;
    const limitNum = Math.min(Number(limit), 100);

    const where: any = { orgId: req.user!.orgId };

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { displayName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limitNum + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash
      },
    });

    const hasMore = users.length > limitNum;
    if (hasMore) users.pop();

    res.json({
      data: users,
      meta: {
        cursor: hasMore ? users[users.length - 1].id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /users - Invite new user
usersRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const body = createUserSchema.parse(req.body);

    // Check for duplicate email in org
    const existing = await prisma.user.findUnique({
      where: {
        orgId_email: {
          orgId: req.user!.orgId,
          email: body.email,
        },
      },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        orgId: req.user!.orgId,
        email: body.email,
        displayName: body.displayName,
        role: body.role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // TODO: Send invite email
    console.log(`[USER INVITE] Email: ${body.email}, Temporary Password: ${tempPassword}`);

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// GET /users/:userId - Get user details
usersRouter.get('/:userId', requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        orgId: req.user!.orgId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PATCH /users/:userId - Update user
usersRouter.patch('/:userId', requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const body = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, orgId: req.user!.orgId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Business rule: Cannot change your own role
    if (body.role && req.user!.id === userId) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    // Business rule: Cannot deactivate yourself
    if (body.isActive === false && req.user!.id === userId) {
      return res.status(403).json({ error: 'Cannot deactivate yourself' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid request data', error.errors));
    } else {
      next(error);
    }
  }
});

// DELETE /users/:userId - Deactivate user (soft delete)
usersRouter.delete('/:userId', requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id: userId, orgId: req.user!.orgId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Business rule: Cannot deactivate yourself
    if (req.user!.id === userId) {
      return res.status(403).json({ error: 'Cannot deactivate yourself' });
    }

    // Business rule: Must have at least one active admin
    if (user.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: {
          orgId: req.user!.orgId,
          role: 'ADMIN',
          isActive: true,
        },
      });

      if (activeAdminCount === 1) {
        return res.status(403).json({ error: 'Cannot deactivate the last admin' });
      }
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
