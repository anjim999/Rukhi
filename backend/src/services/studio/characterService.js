import { query } from '../../db/pool.js';
import { v4 as uuidv4 } from 'uuid';

export const characterService = {
  async createCharacter({ seriesId, name, age = 28, personality = '', voiceProfile = {}, referenceImages = [], behaviorTraits = [] }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO studio_characters (id, series_id, name, age, personality, voice_profile, reference_images, behavior_traits)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, seriesId, name, age, personality, JSON.stringify(voiceProfile), JSON.stringify(referenceImages), JSON.stringify(behaviorTraits)]
    );
    return result.rows[0];
  },

  async getCharacterById(id) {
    const result = await query(`SELECT * FROM studio_characters WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async listCharactersBySeries(seriesId) {
    const result = await query(`SELECT * FROM studio_characters WHERE series_id = $1 ORDER BY created_at ASC`, [seriesId]);
    return result.rows;
  },

  async updateCharacter(id, { name, age, personality, voiceProfile, referenceImages, behaviorTraits, incrementVersion = false }) {
    const versionQuery = incrementVersion ? 'version = version + 1,' : '';
    const result = await query(
      `UPDATE studio_characters
       SET ${versionQuery}
           name = COALESCE($1, name),
           age = COALESCE($2, age),
           personality = COALESCE($3, personality),
           voice_profile = COALESCE($4, voice_profile),
           reference_images = COALESCE($5, reference_images),
           behavior_traits = COALESCE($6, behavior_traits),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        name,
        age,
        personality,
        voiceProfile ? JSON.stringify(voiceProfile) : null,
        referenceImages ? JSON.stringify(referenceImages) : null,
        behaviorTraits ? JSON.stringify(behaviorTraits) : null,
        id
      ]
    );
    return result.rows[0];
  },

  async deleteCharacter(id) {
    await query(`DELETE FROM studio_characters WHERE id = $1`, [id]);
    return { success: true, deletedId: id };
  },

  async bulkDeleteCharacters(ids = []) {
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    await query(`DELETE FROM studio_characters WHERE id = ANY($1::uuid[])`, [ids]);
    return { success: true, count: ids.length };
  }
};
