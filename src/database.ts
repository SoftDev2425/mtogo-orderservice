import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './types';

const dialect = new PostgresDialect({
  pool: async () =>
    new Pool({
      database: process.env.POSTGRES_DB,
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: String(process.env.POSTGRES_PASSWORD),
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      max: 10,
    }),
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
});
