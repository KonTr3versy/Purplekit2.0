import { Router } from 'express';
import { authenticate, requireAnalyst } from '../middleware/auth';

export const reportsRouter = Router();

// Apply authentication to all routes
reportsRouter.use(authenticate);

// TODO: Implement reports routes
// See OpenAPI spec for endpoint definitions

reportsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    res.json({ message: 'reports endpoint - TODO: implement' });
  } catch (error) {
    next(error);
  }
});
