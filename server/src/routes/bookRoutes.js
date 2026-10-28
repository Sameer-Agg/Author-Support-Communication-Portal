import { Router } from 'express';
import { z } from 'zod';
import * as bookController from '../controllers/bookController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const getBooksSchema = z.object({
  query: z.object({
    authorId: z.coerce.number().positive().optional(),
  }),
});

const getBookByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});

router.use(authenticateToken);

router.get('/', validate(getBooksSchema), bookController.getBooks);
router.get('/:id', validate(getBookByIdSchema), bookController.getBookById);

export default router;
