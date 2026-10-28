import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.getMe);

export default router;
