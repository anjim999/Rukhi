import { Router } from 'express';
import { studioController } from '../controllers/studio/studioController.js';
import { uploadAsset } from '../utils/fileUpload.js';

const router = Router();

// Series Bibles
router.post('/series', studioController.createSeries);
router.get('/series', studioController.listSeries);
router.get('/series/:id', studioController.getSeries);

// Character DNA Vault
router.post('/characters', studioController.createCharacter);
router.get('/characters/series/:seriesId', studioController.listCharacters);
router.put('/characters/:id', studioController.updateCharacter);
router.delete('/characters/:id', studioController.deleteCharacter);
router.post('/characters/bulk-delete', studioController.bulkDeleteCharacters);

// Location Catalog
router.post('/locations', studioController.createLocation);
router.get('/locations/series/:seriesId', studioController.listLocations);
router.put('/locations/:id', studioController.updateLocation);
router.delete('/locations/:id', studioController.deleteLocation);
router.post('/locations/bulk-delete', studioController.bulkDeleteLocations);

// Orchestration & Assets
router.post('/compile-brief', studioController.compileBrief);
router.post('/preflight-check', studioController.preflightCheck);
router.post('/generate-scene', studioController.generateScene);
router.get('/scenes/series/:seriesId', studioController.listScenes);
router.delete('/scenes/:id', studioController.deleteScene);
router.post('/scenes/bulk-delete', studioController.bulkDeleteScenes);
router.post('/upload-asset', uploadAsset.single('asset'), studioController.uploadAsset);
router.post('/generate-character-candidates', studioController.generateCharacterCandidates);
router.post('/generate-location-candidates', studioController.generateLocationCandidates);
router.post('/generate-ai-shotlist', studioController.generateAiShotList);
router.post('/stitch-episode', studioController.stitchEpisode);

export default router;
