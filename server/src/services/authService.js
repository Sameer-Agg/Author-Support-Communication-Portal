import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export async function login(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  const userRes = await pool.query(
    `SELECT id, name, email, phone, city, role, author_code, password_hash, joined_date
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  if (userRes.rows.length === 0) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const user = userRes.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      authorCode: user.author_code,
      joinedDate: user.joined_date,
    },
  };
}

export async function getCurrentUser(userId) {
  const userRes = await pool.query(
    `SELECT id, name, email, phone, city, role, author_code, joined_date
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const user = userRes.rows[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    role: user.role,
    authorCode: user.author_code,
    joinedDate: user.joined_date,
  };
}
