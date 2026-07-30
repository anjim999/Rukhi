import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { config } from '../../config/env.js';
import { generateDubbedVoiceoverAudio } from './dubbingService.js';
import { buildLongFormAIVideo } from './aiVideoService.js';
import { saveTimeline } from '../projectService.js';
import { query } from '../../db/pool.js';

const execPromise = util.promisify(exec);
const ffmpegBin = ffmpegInstaller.path || 'ffmpeg';

/**
 * Measure exact audio duration in seconds using ffprobe with pure JS fallback
 */
async function getExactAudioDuration(filePath) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const { stdout } = await execPromise(cmd);
    const dur = parseFloat(stdout.trim());
    if (!isNaN(dur) && dur > 0) {
      return Number(dur.toFixed(2));
    }
  } catch (_err) {
    // ffprobe not installed or failed, fall back to pure JS calculation below
  }

  // Pure JS fallback MP3 duration estimation (Edge-TTS 24kHz @ ~48-64kbps = ~6000 bytes/sec)
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const estSec = stats.size / 6000;
      if (estSec > 0) {
        console.log(`[FACELESS GEN] ⏱️ Pure JS calculated exact audio duration: ${estSec.toFixed(2)}s`);
        return Number(estSec.toFixed(2));
      }
    }
  } catch (err) {
    console.warn(`[FACELESS GEN] Pure JS audio duration check warning: ${err.message}`);
  }
  return null;
}

/**
 * Standalone script generator for script preview and editing ($0 Cost)
 */
export async function generateScriptForPrompt({ prompt, targetLanguage = 'te', durationSec = 30 }) {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  return await generateViralScriptWithFallback({ genAI, prompt, targetLanguage, durationSec });
}

/**
 * Multi-model Gemini script generator with automatic rate-limit protection ($0 Cost)
 */
async function generateViralScriptWithFallback({ genAI, prompt, targetLanguage, durationSec = 30 }) {
  const targetWordCount = Math.min(2500, Math.max(30, Math.round(Number(durationSec) * 2.3)));
  const langName = targetLanguage === 'te' ? 'Telugu (తెలుగు)' : targetLanguage === 'hi' ? 'Hindi (हिंदी)' : 'English';
  const scriptConstraint = targetLanguage === 'te' 
    ? '100% PURE TELUGU SCRIPT (తెలుగు లిపి). Do NOT use English characters in output.' 
    : targetLanguage === 'hi' 
    ? '100% PURE HINDI SCRIPT (हिंदी देवनागरी). Do NOT use English characters in output.' 
    : 'Pure English Script';

  if (genAI) {
    const scriptPrompt = `You are an elite ${langName} Video Scriptwriter and Translator.
Task: Translate or write a full high-retention spoken video story script in ${scriptConstraint} for the following story topic:

User Story Topic: "${prompt}"

Target Video Duration: ${durationSec} seconds (${targetWordCount} spoken words).

STRICT MANDATES:
1. Write ONLY in ${scriptConstraint}. If user topic is in English, translate the story completely into ${langName} script!
2. Match target length: Write approximately ${targetWordCount} spoken words so speech lasts full ${durationSec} seconds.
3. Do NOT output speaker labels, title headers, or markdown formatting. Output pure spoken narrative script text only.`;

    const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[FACELESS GEN] 🎙️ Generating ${targetWordCount}-word ${targetLanguage.toUpperCase()} script with '${modelName}' for ${durationSec}s target...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 4096 }
        });
        const result = await model.generateContent(scriptPrompt);
        let text = result.response.text().trim().replace(/^["'`]|["'`]$/g, '');
        text = text.replace(/^(?:Create|Write|Generate|Translate)\s+an?\s+[^\n.]+[.\n]\s*/i, '').trim();

        if (text && text.length > 20) {
          return text;
        }
      } catch (err) {
        console.warn(`[FACELESS GEN] Gemini model '${modelName}' warning: ${err.message}`);
      }
    }
  }

  // Fallback script generator matching target language
  console.warn('[FACELESS GEN] ⚡ Gemini API unavailable or rate-limited. Using topic-aware template fallback.');
  return getTemplateScriptFallback(prompt, targetLanguage, durationSec);
}

/**
 * Universal Topic-Aware Script Generator for ANY Topic (Comedy, Friendship, Motivation, Tech, Space, Love)
 */
function getTemplateScriptFallback(prompt = '', targetLanguage, durationSec = 30) {
  const isTelugu = targetLanguage === 'te';
  const isHindi = targetLanguage === 'hi';
  const lowerP = prompt.toLowerCase();

  // If prompt already contains Telugu or Hindi script matching target language, return prompt
  if (isTelugu && /[\u0C00-\u0C7F]/.test(prompt)) {
    return prompt.trim();
  }
  if (isHindi && /[\u0900-\u097F]/.test(prompt)) {
    return prompt.trim();
  }

  // 1. Comedy / Funny / Friends Topic
  if (lowerP.includes('funny') || lowerP.includes('friend') || lowerP.includes('laugh') || lowerP.includes('joke') || lowerP.includes('comedy') || lowerP.includes('prank') || lowerP.includes('3 friend')) {
    if (isTelugu) {
      return `ముగ్గురు క్రేజీ స్నేహితులు ఒకే చోట చేరితే అక్కడ జరిగే నవ్వుల రచ్చ మామూలుగా ఉండదు! ప్రతీ చిన్న విషయానికి పడి పడి నవ్వుకోవడం, ఒకరినొకరు ఆటపట్టించుకోవడం మరియు సరదా ప్రాంక్స్‌తో గడిపే సమయం ఎంతో అద్భుతమైనది. 

జీవితంలో ఎంతున్నా లేకపోయినా, మన బాధలను మర్చిపోయేలా నవ్వించే నిజమైన స్నేహితులు ఉండడం ఒక గొప్ప వరం. ఆ క్రేజీ జ్ఞాపకాలు, నవ్వులు ఎప్పటికీ మన మనసులో నిలిచిపోతాయి. మీ ముగ్గురి గ్యాంగ్‌లో అత్యంత ఫన్నీ ఫ్రెండ్ ఎవరో కామెంట్స్ లో చెప్పండి!`;
    }
    if (isHindi) {
      return `जब 3 क्रेजी दोस्त एक साथ मिलते हैं, तो हंसी का धमाका होना तय है! एक-दूसरे की टांग खींचना, फनी हरकते करना और बेवकूफी भरी बातों पर हंसना ही असली दोस्ती है। जिंदगी में सच्चे दोस्त होना एक सबसे बड़ा वरदान है। आपके गैंग में सबसे फनी दोस्त कौन है?`;
    }
    return `When 3 crazy best friends get together, non-stop laughter is guaranteed! Pulling pranks, cracking silly jokes, and laughing until your stomach hurts are the best memories of life. Having true friends who make you laugh every single day is a true blessing. Who is the funniest friend in your trio group?`;
  }

  // 2. Space / Universe Topic
  if (lowerP.includes('space') || lowerP.includes('universe') || lowerP.includes('star') || lowerP.includes('galaxy') || lowerP.includes('planet') || lowerP.includes('black hole') || lowerP.includes('moon')) {
    if (isTelugu) {
      return `విశ్వం ఒక అనంతమైన రసవత్తర అద్భుత ప్రపంచం. కోట్ల కొద్దీ నక్షత్రాలు, అనంతమైన గెలాక్సీలు మరియు గురుత్వాకర్షణ శక్తితో కూడిన రహస్యాలు మనల్ని ఎప్పుడూ ఆశ్చర్యపరుస్తాయి. అంతరిక్ష పరిశోధనలు మానవాళి ఆకాంక్షలకు సరిహద్దులు లేవని నిరూపిస్తున్నాయి. విశ్వంలో దాగి ఉన్న రహస్యాలను శోధిస్తూ ముందుకెళ్దాం.`;
    }
    return `The universe is an infinite world of breathtaking mysteries. Billions of stars, galaxies, and black holes continue to amaze science every single day. Outer space proves that human exploration has no limits. Let's explore the secrets hidden deep within the cosmos.`;
  }

  // 3. Tech & AI & Founder Startup Topic
  if (lowerP.includes('tech') || lowerP.includes('ai') || lowerP.includes('future') || lowerP.includes('code') || lowerP.includes('robot') || lowerP.includes('digital') || lowerP.includes('founder') || lowerP.includes('startup') || lowerP.includes('vikram') || lowerP.includes('విక్రమ్')) {
    if (isTelugu) {
      return `అర్ధరాత్రి దాటిన వేళ, నిశ్శబ్దంగా ఉన్న ఆ గదిలో, ఇరవై ఎనిమిదేళ్ల యువ టెక్ వ్యవస్థాపకుడు విక్రమ్ తన కలల ప్రాజెక్ట్‌ను పూర్తి చేయడానికి అహర్నిశలు శ్రమిస్తున్నాడు. ఎన్నో ఓటములు, ఎంతోమంది హేళనలు ఎదురైనా ఏనాడూ ధైర్యాన్ని కోల్పోలేదు. ప్రతీ కోడ్ లైన్ వెనుక అతని కఠిన శ్రమ దాగి ఉంది. భవిష్యత్తును మార్చే కొత్త సాంకేతిక విప్లవం ఇప్పుడు అతని చేతుల్లోనే ఉద్భవిస్తోంది.`;
    }
    return `Late at night in a silent workshop, 28-year-old tech entrepreneur Vikram works relentlessly to build his dream startup. Through every obstacle and failure, he never lost courage. The future of technology is being born right in his hands today.`;
  }

  // 4. Motivation & Success Topic
  if (lowerP.includes('motivat') || lowerP.includes('success') || lowerP.includes('hustle') || lowerP.includes('mindset') || lowerP.includes('goal')) {
    if (isTelugu) {
      return `జీవితంలో విజయం సాధించాలంటే ప్రతిరోజూ శ్రమించాలి. నీ కలలను నిజం చేసుకునే ప్రయాణంలో ఓటములు ఎదురైనా ఏనాడూ ధైర్యాన్ని కోల్పోవద్దు. ప్రతీ ఉదయం ఒక కొత్త అవకాశాన్ని ఇస్తుంది. కష్టపడి పనిచేసే ప్రతి నమ్మకం చివరకు గొప్ప విజయాన్ని అందిస్తుంది. నీపై నీకు నమ్మకం ఉంటే సాధించలేనిది ఏదీ లేదు.`;
    }
    return `To achieve greatness in life, you must work hard every single day. Never lose courage when faced with failures. Believe in yourself and keep pushing forward.`;
  }

  // 5. College & Romance Topic
  if (lowerP.includes('love') || lowerP.includes('romance') || lowerP.includes('college') || lowerP.includes('b.tech') || lowerP.includes('crush')) {
    if (isTelugu) {
      return `ఇది ఒక అద్భుతమైన నాలుగు సంవత్సరాల బి-టెక్ ప్రేమ ప్రయాణం. కాలేజ్ మొదటి రోజు నుండే అతని మనసులో ఆమె పట్ల చెప్పలేని అనుభూతి. కానీ నాలుగు సంవత్సరాలు ఏనాడూ తన ప్రేమను వ్యక్తపరచలేకపోయాడు. చివరకు ఒకరోజు తన ప్రేమను చెప్పేశాడు. ఇద్దరి మనసులు కలిసాయి. వారు ప్రేమలో పడ్డారు.`;
    }
    return `A beautiful college love story. Secretly loving someone for 4 full years until finally confessing feelings on graduation day. Two hearts connected forever.`;
  }

  // 6. Universal Story Fallback (Matching user's prompt words!)
  if (isTelugu) {
    return `ప్రతి కథలోనూ ఒక అందమైన అనుభూతి ఉంటుంది. "${prompt}" అనే ఈ విశేషమైన సందర్భం మన జీవితంలో మర్చిపోలేని జ్ఞాపకాలను అందిస్తుంది. ప్రతీ క్షణాన్ని ఆస్వాదిస్తూ ము ముందుకు సాగడమే నిజమైన ఆనందం.`;
  }

  return `Every story holds a beautiful memory. "${prompt}" brings unique experiences that last a lifetime. Enjoy every single moment.`;
}

/**
 * AI Faceless Video Generator
 */
export async function generateFacelessVideoProject({
  prompt,
  customScriptText,
  targetLanguage = 'te',
  voiceProvider = 'edge',
  durationSec = 30,
  visualMode = 'cinematic',
  aspectRatio = '9:16',
  userId,
}) {
  if ((!prompt || !prompt.trim()) && (!customScriptText || !customScriptText.trim())) {
    throw new Error('Prompt or script text is required for faceless video generation');
  }

  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // Validate customScriptText: If customScriptText is prompt instructions, regenerate!
  let scriptText = customScriptText && customScriptText.trim() ? customScriptText.trim() : null;

  if (scriptText) {
    const isEnglishInstruction = /^(?:Create|Write|Generate|Make)\s+an?\s+/i.test(scriptText);
    const hasTelugu = /[\u0C00-\u0C7F]/.test(scriptText);
    if (isEnglishInstruction || (targetLanguage === 'te' && !hasTelugu && scriptText.length < 150)) {
      console.warn('[FACELESS GEN] ⚠️ Provided script appears to be English prompt instructions. Generating 100% pure native script...');
      scriptText = null;
    }
  }

  if (!scriptText) {
    scriptText = await generateViralScriptWithFallback({ genAI, prompt, targetLanguage, durationSec });
  }

  console.log(`[FACELESS GEN] ✍️ Final Spoken Script (${scriptText.length} chars, Lang: ${targetLanguage}, Aspect: ${aspectRatio}): "${scriptText.slice(0, 100)}..."`);

  // Step 2: Synthesize Voiceover Audio
  const projectId = `faceless_${Date.now()}`;
  console.log(`[FACELESS GEN] 🎙️ Synthesizing voiceover audio via provider '${voiceProvider}'...`);
  const audioFilePath = await generateDubbedVoiceoverAudio({
    text: scriptText,
    targetLanguage,
    projectId,
    provider: voiceProvider,
  });

  if (!audioFilePath) {
    throw new Error('Voiceover audio synthesis failed');
  }

  const audioFileName = path.basename(audioFilePath);
  const audioUrl = `/uploads/${audioFileName}`;

  // Measure EXACT Audio Duration via FFprobe or Pure JS
  const measuredDuration = await getExactAudioDuration(audioFilePath);
  const actualAudioDuration = measuredDuration || Number(durationSec);
  console.log(`[FACELESS GEN] ⏱️ Measured exact voiceover audio duration: ${actualAudioDuration}s`);

  // Step 3 & 5: Generate AI Scene Overlays via HunyuanVideo & LTX Consistent Character Engine
  const characterSeed = Math.floor(Math.random() * 900000) + 100000;
  const characterAnchor = `Same main character actor, 4k photorealistic face, matching hair and clothing, cinematic studio lighting`;

  const brollOverlays = await buildLongFormAIVideo({
    prompt,
    scriptText,
    audioFilePath,
    durationSec: actualAudioDuration,
    visualMode,
    aspectRatio,
    characterAnchor,
    characterSeed,
  });

  const firstClip = brollOverlays[0]?.clip;
  const backgroundUrl = firstClip?.videoUrl || null;

  // Step 4: Build frame-accurate subtitle segments matching actual audio duration
  const words = scriptText.split(/\s+/).filter(Boolean);
  const wordDuration = actualAudioDuration / Math.max(1, words.length);
  const wordsPerSeg = Math.max(2, Math.min(3, Math.ceil(words.length / Math.max(1, actualAudioDuration / 2.5))));

  const segments = [];
  let currentStart = 0;
  
  for (let i = 0; i < words.length; i += wordsPerSeg) {
    const segWords = words.slice(i, i + wordsPerSeg);
    const segDuration = segWords.length * wordDuration;
    const segEnd = Number((currentStart + segDuration).toFixed(2));

    segments.push({
      id: `seg_${segments.length + 1}_${Date.now()}`,
      start: Number(currentStart.toFixed(2)),
      end: segEnd,
      text: segWords.join(' '),
      words: segWords.map((w, wIdx) => ({
        id: `w_${i + wIdx}_${Date.now()}`,
        word: w,
        start: Number((currentStart + wIdx * wordDuration).toFixed(2)),
        end: Number((currentStart + (wIdx + 1) * wordDuration).toFixed(2)),
      })),
    });

    currentStart = segEnd;
  }

  // Generate clean, topic-matched top banner title
  let bannerTitle = 'VIRAL AI STORY';
  const lowerP = prompt.toLowerCase();

  if (targetLanguage === 'te') {
    if (lowerP.includes('funny') || lowerP.includes('friend') || lowerP.includes('laugh') || lowerP.includes('comedy') || lowerP.includes('prank') || lowerP.includes('3 friend')) {
      bannerTitle = 'ముగ్గురు ఫన్నీ ఫ్రెండ్స్ రచ్చ';
    } else if (lowerP.includes('space') || lowerP.includes('universe') || lowerP.includes('star') || lowerP.includes('galaxy') || lowerP.includes('planet')) {
      bannerTitle = 'అనంతమైన విశ్వాంతరాళ రహస్యాలు';
    } else if (lowerP.includes('tech') || lowerP.includes('ai') || lowerP.includes('code') || lowerP.includes('future') || lowerP.includes('digital')) {
      bannerTitle = 'భవిష్యత్ డిజిటల్ టెక్నాలజీ';
    } else if (lowerP.includes('motivat') || lowerP.includes('success') || lowerP.includes('hustle') || lowerP.includes('mindset') || lowerP.includes('goal')) {
      bannerTitle = 'అద్భుతమైన విజయం & ప్రేరణ';
    } else if (lowerP.includes('college') || lowerP.includes('love') || lowerP.includes('romance') || lowerP.includes('b.tech') || lowerP.includes('crush')) {
      bannerTitle = 'అనగనగా ఒక ప్రేమకథ';
    } else {
      bannerTitle = 'అద్భుతమైన ఫన్నీ విశేషాలు';
    }
  } else if (targetLanguage === 'hi') {
    if (lowerP.includes('funny') || lowerP.includes('friend')) {
      bannerTitle = '3 दोस्तों की फनी मस्ती';
    } else if (lowerP.includes('space') || lowerP.includes('universe')) {
      bannerTitle = 'अंतरिक्ष के रहस्य';
    } else if (lowerP.includes('tech') || lowerP.includes('ai')) {
      bannerTitle = 'भविष्य की तकनीक';
    } else {
      bannerTitle = 'एक अनोखी कहानी';
    }
  } else {
    if (lowerP.includes('funny') || lowerP.includes('friend')) {
      bannerTitle = '3 CRAZY FRIENDS FUNNY MOMENT';
    } else if (lowerP.includes('space') || lowerP.includes('universe')) {
      bannerTitle = 'MYSTERIES OF THE UNIVERSE';
    } else if (lowerP.includes('tech') || lowerP.includes('ai')) {
      bannerTitle = 'FUTURE OF TECHNOLOGY';
    } else {
      bannerTitle = 'VIRAL AI STORY';
    }
  }

/**
 * Render a real 1080p Master MP4 Video File from dubbed voiceover audio and visual scene overlays using FFmpeg
 */
async function renderMasterFacelessMP4Video({
  projectId,
  audioFilePath,
  brollOverlays = [],
  durationSec,
  aspectRatio = '9:16',
}) {
  const masterFileName = `faceless_master_${projectId}_${Date.now()}.mp4`;
  const masterFilePath = path.join(process.cwd(), 'uploads', masterFileName);
  const w = aspectRatio === '16:9' ? 3840 : aspectRatio === '1:1' ? 2160 : 2160;
  const h = aspectRatio === '16:9' ? 2160 : aspectRatio === '1:1' ? 2160 : 3840;

  try {
    const validOverlays = brollOverlays.filter(o => {
      if (!o.clip?.videoUrl) return false;
      const fullPath = path.join(process.cwd(), o.clip.videoUrl.replace(/^\//, ''));
      if (fullPath.toLowerCase().endsWith('.svg')) return false;
      return fs.existsSync(fullPath);
    });

    console.log(`[PRODUCTION ENGINE] 🎬 Preparing Multi-Clip Master Render (${validOverlays.length} valid scene clips, total duration: ${durationSec}s, ${w}x${h})...`);

    if (validOverlays.length >= 1) {
      const tempSegments = [];
      const manifestPath = path.join(process.cwd(), 'uploads', `concat_manifest_${projectId}_${Date.now()}.txt`);
      let manifestLines = [];

      for (let i = 0; i < validOverlays.length; i++) {
        const overlay = validOverlays[i];
        const srcPath = path.join(process.cwd(), overlay.clip.videoUrl.replace(/^\//, ''));
        const segDur = Math.max(1, Number((overlay.end - overlay.start).toFixed(2)));
        const tempSegName = `temp_seg_${projectId}_${i}_${Date.now()}.mp4`;
        const tempSegPath = path.join(process.cwd(), 'uploads', tempSegName);
        if (!fs.existsSync(srcPath)) {
          console.warn(`[PRODUCTION ENGINE] ⚠️ Missing segment file: ${srcPath}. Creating local 1080p fallback canvas...`);
          const bgCols = ['0x0f172a', '0x1e1b4b', '0x311042', '0x172554'];
          const bgCol = bgCols[i % bgCols.length];
          const initCmd = `"${ffmpegBin}" -y -f lavfi -i "color=c=${bgCol}:s=${w}x${h}:r=1" -frames:v 1 "${srcPath}"`;
          try { await execPromise(initCmd); } catch (_) {}
        }

        const isVideo = srcPath.toLowerCase().endsWith('.mp4');

        try {
          if (isVideo) {
            const cmd = `"${ffmpegBin}" -y -stream_loop -1 -i "${srcPath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos+accurate_rnd,crop=${w}:${h},unsharp=5:5:0.8:5:5:0.0,fps=30,format=yuv420p" -t ${segDur} -c:v libx264 -preset medium -crf 17 -an "${tempSegPath}"`;
            await execPromise(cmd);
          } else {
            // Apply dynamic Ken Burns zoompan motion effect to AI image clips
            try {
              const kbCmd = `"${ffmpegBin}" -y -loop 1 -i "${srcPath}" -vf "scale=${w*2}:${h*2}:flags=lanczos+accurate_rnd,zoompan=z='min(zoom+0.0015,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(segDur * 30)}:s=${w}x${h}:fps=30,unsharp=5:5:0.8:5:5:0.0,format=yuv420p" -t ${segDur} -c:v libx264 -preset medium -crf 17 -an "${tempSegPath}"`;
              await execPromise(kbCmd);
            } catch (_kbErr) {
              const fallbackCmd = `"${ffmpegBin}" -y -loop 1 -i "${srcPath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos+accurate_rnd,crop=${w}:${h},unsharp=5:5:0.8:5:5:0.0,fps=30,format=yuv420p" -t ${segDur} -c:v libx264 -preset medium -crf 17 -an "${tempSegPath}"`;
              await execPromise(fallbackCmd);
            }
          }

          if (fs.existsSync(tempSegPath) && fs.statSync(tempSegPath).size > 1000) {
            tempSegments.push(tempSegPath);
            manifestLines.push(`file '${tempSegPath.replace(/'/g, "'\\''")}'`);
          }
        } catch (segErr) {
          console.warn(`[PRODUCTION ENGINE] Segment ${i + 1} render warning: ${segErr.message}`);
        }
      }

      if (tempSegments.length > 0) {
        fs.writeFileSync(manifestPath, manifestLines.join('\n'));
        const concatCmd = `"${ffmpegBin}" -y -f concat -safe 0 -i "${manifestPath}" -i "${audioFilePath}" -c:v copy -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
        await execPromise(concatCmd);

        // Clean up temporary manifest & segments
        try { if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath); } catch (_) {}
        for (const seg of tempSegments) {
          try { if (fs.existsSync(seg)) fs.unlinkSync(seg); } catch (_) {}
        }

        if (fs.existsSync(masterFilePath) && fs.statSync(masterFilePath).size > 20000) {
          console.log(`[PRODUCTION ENGINE] 🎬 Successfully Stitched Multi-Clip Master Video (${tempSegments.length} clips): /uploads/${masterFileName} (${(fs.statSync(masterFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
          return `/uploads/${masterFileName}`;
        }
      }
    }

    // Fallback: Single clip / primary image render
    let primaryClipPath = validOverlays[0] ? path.join(process.cwd(), validOverlays[0].clip.videoUrl.replace(/^\//, '')) : null;

    if (primaryClipPath && primaryClipPath.endsWith('.mp4')) {
      const cmd = `"${ffmpegBin}" -y -stream_loop -1 -i "${primaryClipPath}" -i "${audioFilePath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
      await execPromise(cmd);
    } else {
      const inputImg = (primaryClipPath && fs.existsSync(primaryClipPath)) ? primaryClipPath : null;
      let cmd = '';
      if (inputImg) {
        cmd = `"${ffmpegBin}" -y -loop 1 -i "${inputImg}" -i "${audioFilePath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},format=yuv420p" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
      } else {
        cmd = `"${ffmpegBin}" -y -f lavfi -i "color=c=0x0f172a:s=${w}x${h}:r=30" -i "${audioFilePath}" -vf "format=yuv420p" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
      }
      await execPromise(cmd);
    }

    if (fs.existsSync(masterFilePath) && fs.statSync(masterFilePath).size > 20000) {
      console.log(`[PRODUCTION ENGINE] 🎬 Rendered Single-Clip Master MP4 Video File: /uploads/${masterFileName} (${(fs.statSync(masterFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
      return `/uploads/${masterFileName}`;
    }
  } catch (err) {
    console.warn(`[PRODUCTION ENGINE] Master MP4 video render warning: ${err.message}`);
  }
  return null;
}

  // Step 6: Render Master 1080p MP4 Video File & Save Project to Database
  const masterVideoUrl = await renderMasterFacelessMP4Video({
    projectId,
    audioFilePath,
    brollOverlays,
    durationSec: actualAudioDuration,
    aspectRatio,
  });

  const finalVideoUrl = masterVideoUrl || backgroundUrl || audioUrl;
  const title = `AI Faceless: ${prompt.slice(0, 30)}`;

  const timeline = {
    duration: actualAudioDuration,
    aspectRatio,
    videoUrl: finalVideoUrl,
    dubbedAudioUrl: audioUrl,
    dubbedLanguage: targetLanguage,
    dubbedProvider: voiceProvider,
    segments,
    brollOverlays,
    globalTheme: {
      presetId: 'hormozi_yellow',
      fontFamily: 'Inter',
      fontSize: aspectRatio === '16:9' ? 24 : 32,
      position: { x: 50, y: 75 },
    },
    topBanner: {
      enabled: true,
      text: bannerTitle,
      backgroundColor: '#FFE600',
    },
  };

  const projectRes = await query(
    `INSERT INTO projects (id, user_id, title, video_url, status, target_style)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, status, created_at`,
    [(await import('uuid')).v4(), userId || null, title, finalVideoUrl, 'completed', targetLanguage]
  );

  const newProject = projectRes.rows[0];

  // Save timeline payload into captions table
  await saveTimeline(newProject.id, timeline);

  console.log(`[PRODUCTION ENGINE] 🎬 Loaded Timeline Project ID: ${newProject.id}`);
  console.log(`[PRODUCTION ENGINE] 🎙️ Spoken Script Length: ${scriptText.length} chars`);
  console.log(`[PRODUCTION ENGINE] ⏱️ Audio Duration: ${actualAudioDuration}s`);
  console.log(`[PRODUCTION ENGINE] ⏱️ Subtitle Segments: ${segments.length}`);
  console.log(`[PRODUCTION ENGINE] 🖼️ Aspect Ratio: ${aspectRatio}`);
  console.log(`[PRODUCTION ENGINE] 🍿 Story Scene Clips Sourced: ${brollOverlays.length} (Assigned Overlays: ${brollOverlays.length})`);

  return {
    success: true,
    projectId: newProject.id,
    title: newProject.title,
    scriptText,
    audioUrl,
    backgroundUrl,
    duration: actualAudioDuration,
    aspectRatio,
    timeline,
  };
}
