import { query } from './pool.js';

/**
 * Auto-initialize database tables IF NOT EXISTS on app startup.
 */
export async function initDb() {
  try {
    console.log('[DB INIT] Initializing database tables on Neon Cloud...');

    await query(`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure auth columns exist on users table
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;`);
    } catch (colErr) {
      console.error('[DB INIT] Auth column alteration notice:', colErr.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY,
          user_id UUID,
          title VARCHAR(255) NOT NULL,
          video_url TEXT NOT NULL,
          audio_url TEXT,
          duration NUMERIC(10, 2) DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure error_message column exists on projects if created earlier
    try {
      await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS error_message TEXT;`);
      await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_style VARCHAR(50) DEFAULT 'auto';`);
    } catch (_e) {}

    await query(`
      CREATE TABLE IF NOT EXISTS captions (
          id UUID PRIMARY KEY,
          project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
          timeline_json JSONB NOT NULL,
          version VARCHAR(20) DEFAULT '1.0',
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS style_memory (
          id UUID PRIMARY KEY,
          user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          preference_data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS export_jobs (
          id UUID PRIMARY KEY,
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL DEFAULT 'queued',
          progress INTEGER DEFAULT 0,
          output_video_url TEXT,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      INSERT INTO users (id, name, email)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Developer', 'dev@autocaptions.local')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('[DB INIT] ✅ All database tables created and verified successfully on Neon!');
  } catch (err) {
    console.error('[DB INIT ERROR DETAILS]:', err);
  }
}
