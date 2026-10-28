import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { initSocketManager } from './sockets/socketManager.js';

const app = createApp();
const httpServer = http.createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocketManager(io);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
  console.log(`BookLeaf Support API running on port ${PORT} [${env.NODE_ENV}]`);
});

const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);

  httpServer.close(async () => {
    console.log('HTTP and WebSocket server closed.');
    try {
      await pool.end();
      console.log('PostgreSQL pool closed.');
    } catch (err) {
      console.error('Error closing PostgreSQL pool:', err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
