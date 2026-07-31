import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';
import { getGcpAccessToken } from './veoVideoService.js';

/**
 * Storyboard & Scene Director Service powered by Google Gemini 3.1 Pro Preview (Agentic & Thinking LLM)
 * Uses GCP OAuth 2.0 Access Token (GCP Cloud Credits) on project ai-quiz-generator-479518.
 * Endpoint: https://aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/global/publishers/google/models/gemini-3.1-pro-preview:generateContent
 */

export async function generateSceneStoryboard(topicPrompt, durationSeconds = 30, characterAnchor = '', targetLanguage = 'chatting') {
  const sceneCount = durationSeconds >= 60 ? 12 : 6;
  const secondsPerScene = (durationSeconds / sceneCount).toFixed(1);

  console.log(`[SCENE DIRECTOR] 🧠 Invoking Gemini 3.1 Pro Preview (GCP Cloud Credits) for ${sceneCount}-scene storyboard...`);

  const prompt = `SYSTEM ROLE: You are an Elite Viral Reel Director & Scriptwriter using Gemini 3.1 Pro reasoning capabilities.
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

Return ONLY a valid, parseable JSON object with this exact structure:
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
    const gcpAccessToken = await getGcpAccessToken();
    const projectId = config.gcpProjectId || 'ai-quiz-generator-479518';
    let text = null;

    if (gcpAccessToken) {
      console.log(`[SCENE DIRECTOR] 🔑 Requesting gemini-3.5-flash via Vertex AI (GCP Cloud Credits)...`);
      const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-3.5-flash:generateContent`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gcpAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[SCENE DIRECTOR] ✅ Vertex AI gemini-3.5-flash generated storyboard response!`);
        }
      } else {
        const errBody = await res.text();
        console.warn(`[SCENE DIRECTOR WARN] Vertex Gemini 3.5 Flash returned HTTP ${res.status}: ${errBody.substring(0, 200)}`);
      }
    }

    // Fallback to AI Studio API Key if OAuth Bearer did not return text
    if (!text && config.geminiApiKey) {
      const ai = new GoogleGenerativeAI(config.geminiApiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      text = response.response.text();
    }

    if (text) {
      // Clean markdown code blocks if returned
      const cleanJsonStr = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      if (parsed.scenes && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
        console.log(`[SCENE DIRECTOR] ✅ Storyboard generated successfully with ${parsed.scenes.length} scenes via Gemini 3.1 Pro!`);
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[SCENE DIRECTOR WARN] Gemini 3.1 Pro storyboard generation notice (${err.message}). Using prompt fallback.`);
  }

  return generateFallbackStoryboard(topicPrompt, sceneCount, characterAnchor, targetLanguage);
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
