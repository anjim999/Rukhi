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
      CREATE TABLE IF NOT EXISTS studio_series (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          genre VARCHAR(100) DEFAULT 'Drama',
          canon_rules JSONB DEFAULT '[]'::jsonb,
          visual_style JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS studio_characters (
          id UUID PRIMARY KEY,
          series_id UUID REFERENCES studio_series(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          age INTEGER,
          personality TEXT,
          version INTEGER DEFAULT 1,
          voice_profile JSONB DEFAULT '{}'::jsonb,
          reference_images JSONB DEFAULT '[]'::jsonb,
          embeddings JSONB DEFAULT '{}'::jsonb,
          behavior_traits JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS studio_locations (
          id UUID PRIMARY KEY,
          series_id UUID REFERENCES studio_series(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          location_type VARCHAR(100) DEFAULT 'Interior',
          reference_images JSONB DEFAULT '[]'::jsonb,
          lighting_preset VARCHAR(100) DEFAULT 'Natural',
          environment_specs JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS studio_scene_graphs (
          id UUID PRIMARY KEY,
          series_id UUID REFERENCES studio_series(id) ON DELETE CASCADE,
          episode_number INTEGER DEFAULT 1,
          scene_number INTEGER DEFAULT 1,
          title VARCHAR(255) NOT NULL,
          characters_json JSONB DEFAULT '[]'::jsonb,
          location_id UUID REFERENCES studio_locations(id) ON DELETE SET NULL,
          camera_preset VARCHAR(100) DEFAULT '35mm Cinematic',
          lighting_preset VARCHAR(100) DEFAULT 'Natural Soft',
          dialogue_json JSONB DEFAULT '[]'::jsonb,
          emotion_state VARCHAR(100) DEFAULT 'Neutral',
          continuity_references JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS studio_production_manifests (
          id UUID PRIMARY KEY,
          scene_id UUID REFERENCES studio_scene_graphs(id) ON DELETE CASCADE,
          compiled_brief JSONB NOT NULL,
          preflight_status VARCHAR(50) DEFAULT 'pending',
          preflight_report JSONB DEFAULT '{}'::jsonb,
          generation_status VARCHAR(50) DEFAULT 'draft',
          output_video_url TEXT,
          quality_score NUMERIC(5, 2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS studio_generation_costs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          generation_id VARCHAR(64) UNIQUE NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          user_email VARCHAR(255),
          project_id VARCHAR(255),
          series_id VARCHAR(255),
          feature_type VARCHAR(50) DEFAULT 'studio_render',
          episode INTEGER DEFAULT 1,
          scene INTEGER DEFAULT 1,
          gemini_model VARCHAR(100),
          gemini_input_tokens INTEGER DEFAULT 0,
          gemini_output_tokens INTEGER DEFAULT 0,
          gemini_cost_usd NUMERIC(12, 6) DEFAULT 0,
          imagen_model VARCHAR(100),
          imagen_requested INTEGER DEFAULT 0,
          imagen_generated INTEGER DEFAULT 0,
          imagen_cost_usd NUMERIC(12, 6) DEFAULT 0,
          veo_model VARCHAR(100),
          veo_clips INTEGER DEFAULT 0,
          veo_seconds NUMERIC(10, 2) DEFAULT 0,
          veo_resolution VARCHAR(50) DEFAULT '1080p',
          veo_cost_usd NUMERIC(12, 6) DEFAULT 0,
          stt_provider VARCHAR(50),
          stt_minutes NUMERIC(10, 2) DEFAULT 0,
          stt_cost_usd NUMERIC(12, 6) DEFAULT 0,
          dubbing_minutes NUMERIC(10, 2) DEFAULT 0,
          dubbing_cost_usd NUMERIC(12, 6) DEFAULT 0,
          voice_clone_samples INTEGER DEFAULT 0,
          tts_characters INTEGER DEFAULT 0,
          voice_cost_usd NUMERIC(12, 6) DEFAULT 0,
          storage_mb NUMERIC(10, 2) DEFAULT 0,
          storage_cost_usd NUMERIC(12, 6) DEFAULT 0,
          total_cost_usd NUMERIC(12, 6) DEFAULT 0,
          total_cost_inr NUMERIC(12, 2) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'COMPLETED',
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
