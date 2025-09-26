import { Pool } from 'pg';
import { sql as vercelSql } from '@vercel/postgres';

let pool: Pool | null = null;

export async function getDb() {
  // Always use standard pg pool for Neon
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    });
  }
  
  return { sql: null, pool };
}

export async function initializeDatabase() {
  const db = await getDb();
  
  try {
    if (db.sql) {
      // Vercel Postgres
      await db.sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          meta_user_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          email VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await db.sql`
        CREATE TABLE IF NOT EXISTS user_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          access_token TEXT NOT NULL,
          token_type VARCHAR(50),
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await db.sql`
        CREATE TABLE IF NOT EXISTS ad_accounts_cache (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          account_data JSONB NOT NULL,
          cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } else if (db.pool) {
      // Local Postgres
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          meta_user_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          email VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS user_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          access_token TEXT NOT NULL,
          token_type VARCHAR(50),
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS ad_accounts_cache (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          account_data JSONB NOT NULL,
          cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}