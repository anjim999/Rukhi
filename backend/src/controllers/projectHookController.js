import * as projectService from '../services/projectService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function autoAddEmojisToProjectTimeline(req, res, next) {
  try {
    const { timeline } = req.body || {};
    let sourceTimeline = timeline;

    if (!sourceTimeline && req.params.id && req.params.id !== 'temp') {
      const project = await projectService.getProjectById(req.params.id);
      sourceTimeline = project ? (project.timeline || await projectService.getTimeline(req.params.id)) : null;
    }

    if (!sourceTimeline) {
      throw new AppError('No caption timeline found.', 400);
    }

    const { GeminiCaptionDirector } = await import('../services/llm/GeminiCaptionDirector.js');
    const director = new GeminiCaptionDirector();
    const updatedTimeline = await director.autoAddViralEmojisToTimeline(sourceTimeline);

    if (req.params.id && req.params.id !== 'temp') {
      try {
        await projectService.updateProjectTimeline(req.params.id, updatedTimeline);
      } catch (_saveErr) {}
    }

    res.json({
      success: true,
      data: { timeline: updatedTimeline },
      message: 'AI viral emojis applied successfully!',
    });
  } catch (err) {
    next(err);
  }
}

export async function generateHookBannersForProject(req, res, next) {
  try {
    const { timeline: incomingTimeline } = req.body;
    let sourceTimeline = incomingTimeline;

    if (!sourceTimeline && req.params.id && req.params.id !== 'temp') {
      const project = await projectService.getProjectById(req.params.id);
      sourceTimeline = project ? (project.timeline || await projectService.getTimeline(req.params.id)) : null;
    }

    if (!sourceTimeline) {
      throw new AppError('No caption timeline found.', 400);
    }

    const { GeminiCaptionDirector } = await import('../services/llm/GeminiCaptionDirector.js');
    const director = new GeminiCaptionDirector();
    const suggestions = await director.generateTop5HookBannersForTimeline(sourceTimeline);

    const updatedBanner = {
      ...(sourceTimeline.topBanner || {
        enabled: true,
        backgroundColor: '#FFE600',
        textColor: '#000000',
        fontFamily: 'Montserrat',
      }),
      enabled: true,
      text: suggestions[0] || 'VIRAL REELS SECRET 🚨',
    };

    const updatedTimeline = {
      ...sourceTimeline,
      topBanner: updatedBanner,
      topBannerSuggestions: suggestions,
    };

    if (req.params.id && req.params.id !== 'temp') {
      try {
        await projectService.updateProjectTimeline(req.params.id, updatedTimeline);
      } catch (_saveErr) {}
    }

    res.json({
      success: true,
      data: {
        suggestions,
        topBanner: updatedBanner,
        timeline: updatedTimeline,
      },
      message: 'Generated Top 5 AI Hook Banners successfully!',
    });
  } catch (err) {
    next(err);
  }
}
