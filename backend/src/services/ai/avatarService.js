import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';

/**
 * Master Character Avatar Generator Service
 * Generates 9:16 high-definition Master Character Reference Seeds using Google Imagen 3.
 */

export const AVATAR_STYLE_PRESETS = {
  CINEMATIC: 'Photorealistic, 8k resolution, IMAX 65mm lens, natural physics, dynamic volumetric depth of field, hyper-detailed textures, fluid camera motion, 24fps moody cinematic film lighting',
  ENTREPRENEUR: 'young professional Indian male entrepreneur in navy blue blazer, clean-shaven, short black hair, modern office backdrop',
  FEMALE_VLOGGER: 'stylish young Indian female content creator in casual smart outfit, warm natural lighting, cozy studio background',
  ANIME_HERO: 'cinematic 3D anime style hero character, vibrant lighting, highly detailed 8k render, hyper-realistic anime aesthetic',
  CINEMATIC_3D: '3D Pixar-style animated character, expressive eyes, warm soft lighting, colorful 3D animation style',
  FITNESS_COACH: 'athletic fitness coach in sportswear, gym background, energetic confident posture',
  TECH_GURU: 'modern tech influencer with glasses, neon cyber backdrop, futuristic aesthetic',
};

/**
 * Generates a Master Character Avatar Image Seed.
 * @param {Object} options
 * @param {string} [options.stylePreset='ENTREPRENEUR'] - Key from AVATAR_STYLE_PRESETS or custom prompt
 * @param {string} [options.customDescription] - User's custom character prompt
 * @returns {Promise<{ avatarPrompt: string, styleKey: string }>}
 */
export async function generateMasterAvatarSeed(options = {}) {
  const { stylePreset = 'ENTREPRENEUR', customDescription } = options;

  let baseStyle = AVATAR_STYLE_PRESETS[stylePreset] || AVATAR_STYLE_PRESETS.ENTREPRENEUR;
  if (customDescription && customDescription.trim().length > 0) {
    baseStyle = `${customDescription.trim()}, photorealistic 8k vertical 9:16 ratio portrait`;
  }

  const avatarPrompt = `${baseStyle}, highly detailed facial features, consistent character anchor, 9:16 aspect ratio vertical format, studio lighting, masterpiece quality`;

  console.log(`[AVATAR SERVICE] Generated Master Avatar Prompt Anchor: "${avatarPrompt}"`);

  return {
    avatarPrompt,
    styleKey: stylePreset,
    anchorKeywords: baseStyle,
  };
}
