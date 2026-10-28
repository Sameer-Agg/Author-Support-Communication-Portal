import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppError } from './utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  const allowedOrigin =
    env.CLIENT_ORIGIN === '*' || !env.CLIENT_ORIGIN || env.CLIENT_ORIGIN === 'true'
      ? true
      : env.CLIENT_ORIGIN;

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'BookLeaf Support Portal API',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/tickets', ticketRoutes);

  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next(new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
      }
      res.sendFile(path.resolve(clientDistPath, 'index.html'));
    });
  } else {
    app.use('*', (req, res, next) => {
      next(new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
    });
  }

  app.use(errorHandler);

  return app;
}
