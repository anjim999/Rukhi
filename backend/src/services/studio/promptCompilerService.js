import { seriesService } from './seriesService.js';
import { characterService } from './characterService.js';
import { locationService } from './locationService.js';
import { storyEngine } from './departments/storyEngine.js';
import { cinematographyEngine } from './departments/cinematographyEngine.js';
import { performanceEngine } from './departments/performanceEngine.js';
import { lightingEngine } from './departments/lightingEngine.js';
import { editingEngine } from './departments/editingEngine.js';
import { soundEngine } from './departments/soundEngine.js';
import { realismEngine } from './departments/realismEngine.js';

export const promptCompilerService = {
  async compileBrief({ seriesId, characterIds = [], locationId, sceneTitle, cameraPreset = '35mm Cinematic', lightingPreset = 'Natural Soft', durationSec = 45, dialogue = [], emotion = 'Calm', customPrompt = '' }) {
    const series = seriesId ? await seriesService.getSeriesById(seriesId) : null;
    const characters = [];
    for (const charId of characterIds) {
      const char = await characterService.getCharacterById(charId);
      if (char) characters.push(char);
    }
    const location = locationId ? await locationService.getLocationById(locationId) : null;

    const canonRules = series?.canon_rules || [];
    const visualStyle = series?.visual_style || {};

    // Run the 7 Hollywood Studio Department Engines
    const storyBeats = await storyEngine.evaluateStoryBeats({ sceneTitle, emotion, customPrompt, durationSec });
    const cameraGrammar = await cinematographyEngine.evaluateCameraGrammar({ storyBeats, cameraPreset });
    const performanceSpecs = await performanceEngine.evaluatePerformance({ characters, scriptDialogue: dialogue });
    const lightingSpecs = await lightingEngine.evaluateLightingSetup({ location, lightingPreset, emotion });
    const editingSpecs = await editingEngine.evaluateEditingGrammar({ durationSec });
    const soundSpecs = await soundEngine.evaluateSoundStorytelling({ scriptDialogue: dialogue });
    const realismSpecs = await realismEngine.enforceAntiAiRules();

    const compiledBrief = {
      series_title: series?.title || 'Default Series',
      scene_title: sceneTitle || 'Untitled Scene',
      target_duration_seconds: durationSec || 45,
      canon_constraints: canonRules,
      department_manifest: {
        story: storyBeats,
        cinematography: cameraGrammar,
        performance: performanceSpecs,
        lighting: lightingSpecs,
        editing: editingSpecs,
        sound: soundSpecs,
        realism: realismSpecs
      },
      visual_grammar: {
        camera: cameraGrammar.optical_lens_choice,
        elevation: cameraGrammar.camera_elevation,
        motivation: cameraGrammar.camera_motivation,
        lighting: lightingSpecs.key_light,
        color_grading: lightingSpecs.atmosphere.color_script.lut_grade
      },
      characters: characters.map(c => ({
        id: c.id,
        name: c.name,
        version: c.version,
        age: c.age,
        personality: c.personality,
        voice: c.voice_profile,
        reference_images: c.reference_images,
        behavior_traits: c.behavior_traits
      })),
      location: location ? {
        id: location.id,
        name: location.name,
        type: location.location_type,
        reference_images: location.reference_images,
        lighting: location.lighting_preset
      } : null,
      emotion_state: emotion,
      script_dialogue: dialogue,
      user_notes: customPrompt,
      formatted_vertex_prompt: `[SERIES: ${series?.title || 'Rukhi'}] [SCENE: ${sceneTitle}] [DURATION: ${durationSec || 45}s] [MOTIVATION: ${cameraGrammar.camera_motivation}] ` +
        `[CHARACTERS: ${characters.map(c => `${c.name} (v${c.version})`).join(', ')}] ` +
        `[LOCATION: ${location?.name || 'Set'}] [LIGHTING: ${lightingSpecs.key_light}] [EMOTION: ${emotion}] ${customPrompt ? `[DIRECTOR VISION: ${customPrompt}]` : ''}`
    };

    return compiledBrief;
  }
};
