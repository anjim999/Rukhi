import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';
import { generateAIVideoClip } from './aiVideoService.js';

/**
 * AI Video B-Roll Service ($0 cost integration)
 * Uses HunyuanVideo & LTX-Video AI Models to generate photorealistic AI Video Clips.
 * Gemini 2.5 / 2.0 Flash extracts visual keywords from transcript segments automatically.
 */

/**
 * Extract visual keywords from transcript text using Gemini Flash
 */
export async function extractVisualKeywords(transcriptText) {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[B-ROLL AI] No GEMINI_API_KEY set. Falling back to basic keyword extraction.');
    return basicKeywordExtract(transcriptText);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `You are a video editor AI. Analyze this transcript and extract 3-8 highly visual, cinematic prompts that would make great AI Video overlay clips.

Rules:
- Return ONLY a JSON array of strings, e.g. ["cinematic galaxy in space", "luxurious city skyline", "happy friends laughing outdoors"]
- Pick scene prompts that are visually concrete and photorealistic — NOT abstract concepts
- Each prompt should be 2-4 words max
- Prioritize dramatic, eye-catching visuals that boost viewer retention
- Do NOT include markdown, code blocks, or explanation

Transcript:
"${transcriptText.slice(0, 2000)}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Parse JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const keywords = JSON.parse(jsonMatch[0]);
      console.log(`[B-ROLL AI] 🎯 Gemini extracted ${keywords.length} visual scene prompts:`, keywords);
      return keywords.filter(k => typeof k === 'string' && k.trim()).slice(0, 8);
    }
  } catch (err) {
    console.warn(`[B-ROLL AI] Gemini keyword extraction warning: ${err.message}. Using basic fallback.`);
  }

  return basicKeywordExtract(transcriptText);
}

/**
 * Basic fallback keyword extractor (no AI required)
 */
function basicKeywordExtract(text) {
  const visualWords = [
    'cinematic money wealth', 'space galaxy stars', 'smart brain thinking',
    'future technology artificial intelligence', 'luxury racing car', 'ocean wave sunset',
    'dramatic lightning storm', 'neon city skyline night', 'gourmet food chef',
    'motivational athlete workout', 'happy friends laughing outdoors', 'romantic couple sunset',
  ];

  const lowerText = text.toLowerCase();
  const found = visualWords.filter(word => lowerText.includes(word.split(' ')[0]));
  return found.length > 0 ? found.slice(0, 5) : ['cinematic nature landscape', 'modern futuristic tech', 'happy young friends'];
}

/**
 * Search/Generate AI Video Clips by keyword using Hunyuan & LTX AI Models with Consistent Character Seed
 */
export async function searchBRollClips(keyword, perPage = 1, options = {}) {
  const { characterAnchor = '', characterSeed = null, isAIFacelessStory = false } = options;
  console.log(`[B-ROLL AI] 🚀 Generating ${perPage} AI Video Clips for keyword: "${keyword}" (Seed: ${characterSeed || 'random'})...`);
  
  const clips = [];
  for (let i = 0; i < perPage; i++) {
    const modelToUse = i % 2 === 0 ? 'hunyuan' : 'ltx';
    const clipResult = await generateAIVideoClip({
      prompt: `${keyword}, cinematic 4k film shot`,
      characterAnchor,
      characterSeed,
      isAIFacelessStory,
      model: modelToUse,
      durationSec: 4,
    });

    clips.push({
      id: `ai_broll_${Date.now()}_${i}`,
      keyword,
      source: 'ai_generator',
      videoUrl: clipResult.videoUrl,
      thumbnailUrl: clipResult.thumbnailUrl || clipResult.videoUrl,
      width: 1080,
      height: 1920,
      duration: 4,
      isAIImage: clipResult.isAIImage || false,
      isRealAIVideo: clipResult.isRealAIVideo || false,
    });
  }

  return clips;
}

/**
 * Auto-detect visual keywords from transcript segments and generate matching AI Video Clips with consistent character faces.
 * Returns an array of AI Video overlay objects mapped to segment timestamps.
 */
export async function autoDetectAndFetchBRoll(segments = [], options = {}) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return { keywords: [], overlays: [] };
  }

  const characterAnchor = options.characterAnchor || '';
  const characterSeed = options.characterSeed || (Math.floor(Math.random() * 900000) + 100000);
  const isAIFacelessStory = options.isAIFacelessStory !== undefined ? options.isAIFacelessStory : true;

  // Build full transcript text
  const transcriptText = segments.map(s => s.text || s.words?.map(w => w.word).join(' ') || '').join(' ');
  const keywords = await extractVisualKeywords(transcriptText);

  if (keywords.length === 0) {
    return { keywords: [], overlays: [] };
  }

  // Generate AI clips for each extracted scene keyword using locked character seed
  const allClips = {};
  await Promise.all(
    keywords.map(async (kw) => {
      const clips = await searchBRollClips(kw, 1, {
        characterAnchor,
        characterSeed,
        isAIFacelessStory,
      });
      if (clips.length > 0) {
        allClips[kw] = clips;
      }
    })
  );

  // Assign AI clips to segments based on keyword match
  const overlays = [];
  const usedKeywords = Object.keys(allClips);
  let clipIndex = 0;

  for (const segment of segments) {
    const segText = (segment.text || '').toLowerCase();
    
    // Find a matching keyword for this segment
    let matchedKw = usedKeywords.find(kw => segText.includes(kw.toLowerCase().split(' ')[0]));
    
    // If no direct match, assign AI clip to every 3rd segment
    if (!matchedKw && usedKeywords.length > 0) {
      if (clipIndex % 3 === 0) {
        matchedKw = usedKeywords[clipIndex % usedKeywords.length];
      }
      clipIndex++;
    }

    if (matchedKw && allClips[matchedKw]?.length > 0) {
      const clip = allClips[matchedKw][0];
      overlays.push({
        segmentId: segment.id,
        keyword: matchedKw,
        start: segment.start,
        end: segment.end,
        clip: {
          id: clip.id,
          source: clip.source,
          videoUrl: clip.videoUrl,
          thumbnailUrl: clip.thumbnailUrl,
          isAIImage: clip.isAIImage || false,
          isRealAIVideo: clip.isRealAIVideo || false,
        },
      });
    }
  }

  console.log(`[B-ROLL AI] 🎬 Generated ${overlays.length} AI Video Overlays (Seed: ${characterSeed}) for ${segments.length} segments`);
  return { keywords, overlays };
}
