import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';

/**
 * Storyboard & Scene Director Service
 * Decomposes any prompt or topic into a 6-scene (30s) or 12-scene (60s) structured storyboard
 * with speech narration text and Character Anchor Prompt Strings.
 */

export async function generateSceneStoryboard(topicPrompt, durationSeconds = 30, characterAnchor = '', targetLanguage = 'chatting') {
  if (!config.geminiApiKey) {
    throw new Error('Gemini API Key is required for Scene Director.');
  }

  const ai = new GoogleGenerativeAI(config.geminiApiKey);
  const model = ai.getGenerativeModel({ model: config.geminiModel || 'gemini-2.5-flash' });

  const sceneCount = durationSeconds >= 60 ? 12 : 6;
  const secondsPerScene = (durationSeconds / sceneCount).toFixed(1);

  console.log(`[SCENE DIRECTOR] Generating ${sceneCount}-scene storyboard for topic: "${topicPrompt}" (${durationSeconds}s total)...`);

  const prompt = `SYSTEM ROLE: You are an Elite Viral Reel Director & Scriptwriter.
I need a continuous ${durationSeconds}-second short video script divided into exactly ${sceneCount} sequential 5-second scenes.

TOPIC / IDEA: "${topicPrompt}"
TARGET SCRIPT STYLE: "${targetLanguage}" (If chatting/tel_eng, write Telugu spoken words in Roman chat script e.g. "tammudu okka nimisham")
CHARACTER ANCHOR: "${characterAnchor}"

INSTRUCTIONS:
1. Create exactly ${sceneCount} consecutive scenes. Each scene duration is ~${secondsPerScene} seconds.
2. For each scene, write:
   - "scenePrompt": Visual description of what the character is doing in this scene, including the CHARACTER ANCHOR string so character appearance remains 100% consistent!
   - "speechNarration": The exact spoken voiceover dialogue for this 5-second scene (written in requested target script/language).
   - "emotion": "excited" | "curious" | "dramatic" | "confident" | "inspiring"

Return ONLY a compact JSON object with this exact structure:
{
  "title": "<VIRAL HOOK TITLE>",
  "scenes": [
    {
      "sceneIndex": 0,
      "duration": 5.0,
      "scenePrompt": "<Visual prompt with character anchor>",
      "speechNarration": "<Spoken narration text>",
      "emotion": "<emotion>"
    }
  ]
}`;

  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.response.text();
    const parsed = JSON.parse(text);

    if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      throw new Error('Invalid storyboard JSON structure returned from Gemini.');
    }

    console.log(`[SCENE DIRECTOR] ✅ Storyboard generated successfully with ${parsed.scenes.length} scenes!`);
    return parsed;
  } catch (err) {
    console.error(`[SCENE DIRECTOR ERROR] Failed to generate storyboard: ${err.message}`);
    // Deterministic fallback storyboard
    return generateFallbackStoryboard(topicPrompt, sceneCount, characterAnchor, targetLanguage);
  }
}

function generateFallbackStoryboard(topic, sceneCount, characterAnchor, targetLanguage) {
  const scenes = [];
  const defaultPhrases = [
    'Tammudu okka nimisham ee video chudu.',
    'Life lo success ravallante ee 3 rules follow avvu.',
    'Rule number 1: Daily hardwork and discipline super important.',
    'Rule number 2: Continuous learning process keep growing.',
    'Rule number 3: Never give up on your dreams bro.',
    'Ee reel ni ippude nee friends ki share cheyyi!',
  ];

  for (let i = 0; i < sceneCount; i++) {
    scenes.push({
      sceneIndex: i,
      duration: 5.0,
      scenePrompt: `${characterAnchor}, scene ${i + 1} of ${topic}, dynamic motion, cinematic lighting, 9:16 vertical format`,
      speechNarration: defaultPhrases[i % defaultPhrases.length],
      emotion: 'confident',
    });
  }

  return {
    title: topic.toUpperCase(),
    scenes,
  };
}
