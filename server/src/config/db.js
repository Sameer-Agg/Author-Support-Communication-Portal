import pg from 'pg';
import { env } from './env.js';

const { Pool, types } = pg;

types.setTypeParser(1082, (val) => val);

const isRemoteOrProduction =
  env.NODE_ENV === 'production' ||
  (env.DATABASE_URL &&
    !env.DATABASE_URL.includes('localhost') &&
    !env.DATABASE_URL.includes('127.0.0.1'));

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isRemoteOrProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error in pool:', err);
});
