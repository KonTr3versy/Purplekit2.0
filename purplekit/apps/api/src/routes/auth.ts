import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, setTenantContext } from '../lib/database';
import { redis } from '../lib/redis';
import { config } from '../config';
import { ValidationError, UnauthorizedError } from '../middleware/error';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

interface RefreshTokenPayload {
  sub: string;
  orgId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Helper to generate tokens
function generateTokens(user: { id: string; orgId: string; email: string; role: string }) {
  const payload = {
    sub: user.id,
    orgId: user.orgId,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
}

// POST /auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    // Find user (need to search across all orgs for login)
    const user = await prisma.user.findFirst({
      where: { email: body.email, isActive: true },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    await setTenantContext(user.orgId);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organization: {
          name: user.organization.name,
          subscriptionTier: user.organization.subscriptionTier,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);

    let tokenPayload: RefreshTokenPayload;
    try {
      tokenPayload = jwt.verify(body.refreshToken, config.jwt.secret) as RefreshTokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await setTenantContext(tokenPayload.orgId);

    // Find session with this refresh token
    const session = await prisma.session.findUnique({
      where: { refreshToken: body.refreshToken },
      include: {
        user: {
          include: { organization: true }
        }
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(session.user);

    // Delete old session and create new one
    await prisma.session.delete({ where: { id: session.id } });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: session.user.id,
        refreshToken: tokens.refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        expiresAt,
      },
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        role: session.user.role,
        organization: {
          name: session.user.organization.name,
          subscriptionTier: session.user.organization.subscriptionTier,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
authRouter.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Delete all sessions for this user
    await prisma.session.deleteMany({
      where: { userId: req.user!.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionTier: true,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});
