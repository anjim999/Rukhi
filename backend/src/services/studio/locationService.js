import { query } from '../../db/pool.js';
import { v4 as uuidv4 } from 'uuid';

export const locationService = {
  async createLocation({ seriesId, name, locationType = 'Interior', referenceImages = [], lightingPreset = 'Natural', environmentSpecs = {} }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO studio_locations (id, series_id, name, location_type, reference_images, lighting_preset, environment_specs)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, seriesId, name, locationType, JSON.stringify(referenceImages), lightingPreset, JSON.stringify(environmentSpecs)]
    );
    return result.rows[0];
  },

  async getLocationById(id) {
    const result = await query(`SELECT * FROM studio_locations WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async listLocationsBySeries(seriesId) {
    const result = await query(`SELECT * FROM studio_locations WHERE series_id = $1 ORDER BY created_at ASC`, [seriesId]);
    return result.rows;
  },

  async updateLocation(id, { name, locationType, referenceImages, lightingPreset, environmentSpecs }) {
    const result = await query(
      `UPDATE studio_locations
       SET name = COALESCE($1, name),
           location_type = COALESCE($2, location_type),
           reference_images = COALESCE($3, reference_images),
           lighting_preset = COALESCE($4, lighting_preset),
           environment_specs = COALESCE($5, environment_specs),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name,
        locationType,
        referenceImages ? JSON.stringify(referenceImages) : null,
        lightingPreset,
        environmentSpecs ? JSON.stringify(environmentSpecs) : null,
        id
      ]
    );
    return result.rows[0];
  },

  async deleteLocation(id) {
    await query(`DELETE FROM studio_locations WHERE id = $1`, [id]);
    return { success: true, deletedId: id };
  },

  async bulkDeleteLocations(ids = []) {
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    await query(`DELETE FROM studio_locations WHERE id = ANY($1::uuid[])`, [ids]);
    return { success: true, count: ids.length };
  }
};
