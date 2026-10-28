import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    const userRes = await pool.query(
      'SELECT id, name, email, role, author_code FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    const dbUser = userRes.rows[0];
    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      authorCode: dbUser.author_code,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  if (req.user.role !== role) {
    return next(new AppError('Access forbidden: insufficient permissions', 403, 'FORBIDDEN'));
  }
  next();
};
