import { Router } from 'express';
import { authenticate, requireAnalyst } from '../middleware/auth';

export const findingsRouter = Router();

// Apply authentication to all routes
findingsRouter.use(authenticate);

// TODO: Implement findings routes
// See OpenAPI spec for endpoint definitions

findingsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    res.json({ message: 'findings endpoint - TODO: implement' });
  } catch (error) {
    next(error);
  }
});
