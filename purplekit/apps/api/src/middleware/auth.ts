import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma, setTenantContext } from '../lib/database';
import { UnauthorizedError, ForbiddenError } from './error';
import type { UserRole } from '@prisma/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        orgId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  orgId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Authenticate JWT token
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, orgId: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Set user on request
    req.user = {
      id: user.id,
      orgId: user.orgId,
      email: user.email,
      role: user.role,
    };

    // Set tenant context for RLS
    await setTenantContext(user.orgId);

    next();
  } catch (error) {
    next(error);
  }
}

// Require specific roles
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

// Require at least analyst level (everyone except observer)
export const requireAnalyst = requireRole('ADMIN', 'RED_LEAD', 'BLUE_LEAD', 'ANALYST');

// Require lead level
export const requireLead = requireRole('ADMIN', 'RED_LEAD', 'BLUE_LEAD');

// Require admin
export const requireAdmin = requireRole('ADMIN');

// Red team actions
export const requireRedTeam = requireRole('ADMIN', 'RED_LEAD', 'ANALYST');

// Blue team actions
export const requireBlueTeam = requireRole('ADMIN', 'BLUE_LEAD', 'ANALYST');
