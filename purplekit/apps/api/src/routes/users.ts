import { Router } from 'express';
import { authenticate, requireAnalyst } from '../middleware/auth';

export const usersRouter = Router();

// Apply authentication to all routes
usersRouter.use(authenticate);

// TODO: Implement users routes
// See OpenAPI spec for endpoint definitions

usersRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    res.json({ message: 'users endpoint - TODO: implement' });
  } catch (error) {
    next(error);
  }
});
