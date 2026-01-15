import { Router } from 'express';
import { authenticate, requireAnalyst } from '../middleware/auth';

export const actionsRouter = Router();

// Apply authentication to all routes
actionsRouter.use(authenticate);

// TODO: Implement actions routes
// See OpenAPI spec for endpoint definitions

actionsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    res.json({ message: 'actions endpoint - TODO: implement' });
  } catch (error) {
    next(error);
  }
});
