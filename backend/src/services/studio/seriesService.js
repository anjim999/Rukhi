import { query } from '../../db/pool.js';
import { v4 as uuidv4 } from 'uuid';

export const seriesService = {
  async createSeries({ userId, title, genre = 'Drama', canonRules = [], visualStyle = {} }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO studio_series (id, user_id, title, genre, canon_rules, visual_style)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId || '00000000-0000-0000-0000-000000000001', title, genre, JSON.stringify(canonRules), JSON.stringify(visualStyle)]
    );
    return result.rows[0];
  },

  async getSeriesById(id) {
    const result = await query(`SELECT * FROM studio_series WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async listSeries(userId) {
    const uid = userId || '00000000-0000-0000-0000-000000000001';
    const result = await query(`SELECT * FROM studio_series WHERE user_id = $1 ORDER BY created_at DESC`, [uid]);
    return result.rows;
  },

  async updateSeries(id, { title, genre, canonRules, visualStyle }) {
    const result = await query(
      `UPDATE studio_series
       SET title = COALESCE($1, title),
           genre = COALESCE($2, genre),
           canon_rules = COALESCE($3, canon_rules),
           visual_style = COALESCE($4, visual_style),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, genre, canonRules ? JSON.stringify(canonRules) : null, visualStyle ? JSON.stringify(visualStyle) : null, id]
    );
    return result.rows[0];
  }
};
