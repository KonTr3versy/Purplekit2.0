import { Router } from 'express';
import { authenticate, requireAnalyst } from '../middleware/auth';

export const techniquesRouter = Router();

// Apply authentication to all routes
techniquesRouter.use(authenticate);

// TODO: Implement techniques routes
// See OpenAPI spec for endpoint definitions

techniquesRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    res.json({ message: 'techniques endpoint - TODO: implement' });
  } catch (error) {
    next(error);
  }
});
