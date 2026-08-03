import { seriesService } from '../../services/studio/seriesService.js';
import { characterService } from '../../services/studio/characterService.js';
import { locationService } from '../../services/studio/locationService.js';
import { promptCompilerService } from '../../services/studio/promptCompilerService.js';
import { preflightValidatorService } from '../../services/studio/preflightValidatorService.js';
import { directorOrchestratorService } from '../../services/studio/directorOrchestratorService.js';
import { episodeStitcherService } from '../../services/studio/episodeStitcherService.js';
import { vertexService } from '../../services/studio/vertexService.js';

export const studioController = {
  // Series
  async createSeries(req, res) {
    try {
      const { title, genre, canonRules, visualStyle } = req.body;
      const series = await seriesService.createSeries({ userId: req.user?.id, title, genre, canonRules, visualStyle });
      return res.status(201).json({ success: true, data: series });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async listSeries(req, res) {
    try {
      const seriesList = await seriesService.listSeries(req.user?.id);
      return res.json({ success: true, data: seriesList });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getSeries(req, res) {
    try {
      const series = await seriesService.getSeriesById(req.params.id);
      if (!series) return res.status(404).json({ success: false, error: 'Series not found' });
      return res.json({ success: true, data: series });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Characters
  async createCharacter(req, res) {
    try {
      const { seriesId, name, age, personality, voiceProfile, referenceImages, behaviorTraits } = req.body;
      const character = await characterService.createCharacter({ seriesId, name, age, personality, voiceProfile, referenceImages, behaviorTraits });
      return res.status(201).json({ success: true, data: character });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async listCharacters(req, res) {
    try {
      const characters = await characterService.listCharactersBySeries(req.params.seriesId);
      return res.json({ success: true, data: characters });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Locations
  async createLocation(req, res) {
    try {
      const { seriesId, name, locationType, referenceImages, lightingPreset, environmentSpecs } = req.body;
      const location = await locationService.createLocation({ seriesId, name, locationType, referenceImages, lightingPreset, environmentSpecs });
      return res.status(201).json({ success: true, data: location });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async listLocations(req, res) {
    try {
      const locations = await locationService.listLocationsBySeries(req.params.seriesId);
      return res.json({ success: true, data: locations });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Compile Brief
  async compileBrief(req, res) {
    try {
      const brief = await promptCompilerService.compileBrief(req.body);
      return res.json({ success: true, data: brief });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Preflight Check
  async preflightCheck(req, res) {
    try {
      const brief = await promptCompilerService.compileBrief(req.body);
      const report = preflightValidatorService.validateBrief(brief);
      return res.json({ success: true, data: { brief, report } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Orchestrate Scene Generation
  async generateScene(req, res) {
    try {
      const payload = await directorOrchestratorService.orchestrateScene({ ...req.body, userId: req.user?.id });
      return res.json({ success: true, data: payload });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Upload Reference Image Asset
  async uploadAsset(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file uploaded' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      return res.json({ success: true, data: { url: fileUrl, filename: req.file.filename } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // AI Character Candidates Generation (Imagen 3)
  async generateCharacterCandidates(req, res) {
    try {
      const { prompt } = req.body;
      const result = await vertexService.generateCharacterCandidates({ prompt });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // AI Location Candidates Generation (Imagen 3)
  async generateLocationCandidates(req, res) {
    try {
      const { prompt } = req.body;
      const result = await vertexService.generateLocationCandidates({ prompt });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // List All Generated Scenes in Series Timeline
  async listScenes(req, res) {
    try {
      const scenes = await directorOrchestratorService.listScenesBySeries(req.params.seriesId);
      return res.json({ success: true, data: scenes });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Live Gemini AI Shot List Generator
  async generateAiShotList(req, res) {
    try {
      const { characterNames, locationName, lightingPreset, emotion, durationSec, dialogueText } = req.body;
      const shotList = await vertexService.generateAiShotList({ characterNames, locationName, lightingPreset, emotion, durationSec, dialogueText });
      return res.json({ success: true, data: { shotList } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Stitch All Scenes of an Episode into 1 Master Video
  async stitchEpisode(req, res) {
    try {
      const { seriesId, episodeNumber } = req.body;
      const result = await episodeStitcherService.stitchEpisodeScenes({ seriesId, episodeNumber });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Character Management (Update & Delete)
  async updateCharacter(req, res) {
    try {
      const character = await characterService.updateCharacter(req.params.id, req.body);
      return res.json({ success: true, data: character });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteCharacter(req, res) {
    try {
      const result = await characterService.deleteCharacter(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async bulkDeleteCharacters(req, res) {
    try {
      const { ids } = req.body;
      const result = await characterService.bulkDeleteCharacters(ids);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Location Management (Update & Delete)
  async updateLocation(req, res) {
    try {
      const location = await locationService.updateLocation(req.params.id, req.body);
      return res.json({ success: true, data: location });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteLocation(req, res) {
    try {
      const result = await locationService.deleteLocation(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async bulkDeleteLocations(req, res) {
    try {
      const { ids } = req.body;
      const result = await locationService.bulkDeleteLocations(ids);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Scene Management (Delete)
  async deleteScene(req, res) {
    try {
      const result = await directorOrchestratorService.deleteScene(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async bulkDeleteScenes(req, res) {
    try {
      const { ids } = req.body;
      const result = await directorOrchestratorService.bulkDeleteScenes(ids);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
