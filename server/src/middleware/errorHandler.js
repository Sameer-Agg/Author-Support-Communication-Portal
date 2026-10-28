import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
      },
    });
  }

  if (err.name === 'ZodError') {
    const issues = err.issues || err.errors || [];
    const details = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details,
      },
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A record with this identifier already exists',
        details: null,
      },
    });
  }
  
  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error',
      details: null,
    },
  });
};

