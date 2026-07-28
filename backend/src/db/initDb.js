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

    // Ensure auth & subscription columns exist on users table
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;`);
    } catch (colErr) {
      console.error('[DB INIT] Auth & Plan column alteration notice:', colErr.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
          id UUID PRIMARY KEY,
          ticket_number VARCHAR(20) UNIQUE NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'general',
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'open',
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          admin_reply TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          plan VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          gateway VARCHAR(20) NOT NULL,
          gateway_subscription_id VARCHAR(255),
          gateway_order_id VARCHAR(255),
          amount NUMERIC(10, 2) DEFAULT 0,
          currency VARCHAR(10) DEFAULT 'INR',
          current_period_end TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          amount NUMERIC(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'INR',
          gateway VARCHAR(20) NOT NULL,
          payment_id VARCHAR(255),
          order_id VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
