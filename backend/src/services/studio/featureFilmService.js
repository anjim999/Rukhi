import fs from 'fs';
import path from 'path';
import { produceFeatureFilm } from '../../scripts/produceFeatureFilm.js';

/**
 * Rukhi Studio Long-Form Feature Film Orchestrator Service (30 Min to 1 Hour)
 */
export const featureFilmService = {
  activeJobs: new Map(),

  async launchFeatureFilmJob({ seriesId, title, scriptText, scenes = [], concurrency = 3 }) {
    const jobId = `job_film_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Parse script text into structured scenes if provided as raw text
    let parsedScenes = scenes;
    if (scenes.length === 0 && scriptText) {
      parsedScenes = this.parseScriptTextToScenes(scriptText);
    }

    const jobState = {
      jobId,
      seriesId,
      title: title || 'Untitled 30-Min Feature Film',
      status: 'PROCESSING',
      totalScenes: parsedScenes.length,
      renderedClips: 0,
      startTime: new Date().toISOString(),
      outputFile: null,
      error: null
    };

    this.activeJobs.set(jobId, jobState);

    // Launch background execution asynchronously
    produceFeatureFilm({
      title: jobState.title,
      scenesList: parsedScenes,
      concurrency: concurrency || 3,
      outputFileName: `${jobId}_master.mp4`
    }).then(res => {
      jobState.status = 'COMPLETED';
      jobState.outputFile = res.filePath;
      jobState.completedAt = new Date().toISOString();
    }).catch(err => {
      jobState.status = 'FAILED';
      jobState.error = err.message;
    });

    return jobState;
  },

  getJobStatus(jobId) {
    return this.activeJobs.get(jobId) || { status: 'NOT_FOUND' };
  },

  parseScriptTextToScenes(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const scenes = [];
    let currentPrompt = '';
    let currentNarration = '';
    let sceneId = 1;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('scene') || line.toLowerCase().startsWith('act')) {
        if (currentPrompt || currentNarration) {
          scenes.push({
            id: sceneId++,
            prompt: currentPrompt || `Cinematic scene of ${currentNarration.substring(0, 50)}, 3D Pixar style, 16:9 widescreen`,
            narration: currentNarration || 'The story continues...'
          });
          currentPrompt = '';
          currentNarration = '';
        }
      } else if (line.toLowerCase().startsWith('visual:') || line.toLowerCase().startsWith('shot:')) {
        currentPrompt = line.replace(/^(visual:|shot:)/i, '').trim();
      } else if (line.toLowerCase().startsWith('audio:') || line.toLowerCase().startsWith('narration:') || line.toLowerCase().startsWith('dialogue:')) {
        currentNarration = line.replace(/^(audio:|narration:|dialogue:)/i, '').trim();
      } else {
        if (!currentNarration) currentNarration = line;
        else currentNarration += ' ' + line;
      }
    }

    if (currentPrompt || currentNarration) {
      scenes.push({
        id: sceneId,
        prompt: currentPrompt || `Cinematic scene of ${currentNarration.substring(0, 50)}, 3D Pixar style, 16:9 widescreen`,
        narration: currentNarration || 'The story continues...'
      });
    }

    return scenes.length > 0 ? scenes : [
      { id: 1, prompt: 'Cinematic opening shot of a grand landscape, 16:9 widescreen', narration: 'Every great story begins with a single step.' }
    ];
  }
};
