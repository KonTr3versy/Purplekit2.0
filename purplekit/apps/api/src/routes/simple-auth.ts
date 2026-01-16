import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Get JWT secret from env or use fallback
const JWT_SECRET = process.env.JWT_SECRET || 'temp-secret-for-dev-only-change-in-production';

/**
 * POST /api/v1/simple-auth/login
 *
 * Dead simple login endpoint - no fancy middleware, no abstractions
 * Just email + password → JWT token
 */
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);

    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      console.log('❌ Password too short');
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user in database
    console.log('🔍 Looking up user:', email);
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    if (!user) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ User found:', user.id, user.email);

    // Check password
    console.log('🔑 Checking password...');
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ Password valid!');

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        orgId: user.orgId,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    console.log('✅ Login successful! Token generated');

    // Return success
    res.json({
      accessToken: token,
      refreshToken: token, // Using same token for now - simple!
      expiresIn: 86400, // 24 hours in seconds
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          subscriptionTier: user.organization.subscriptionTier,
        },
      },
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/simple-auth/health
 *
 * Quick health check
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simple auth is working!' });
});

export { router as simpleAuthRouter };
