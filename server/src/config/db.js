import pg from 'pg';
import { env } from './env.js';

const { Pool, types } = pg;

types.setTypeParser(1082, (val) => val);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error in pool:', err);
});
