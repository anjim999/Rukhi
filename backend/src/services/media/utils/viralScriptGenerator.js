export async function generateViralScriptWithFallback({ genAI, prompt, targetLanguage, durationSec = 30 }) {
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

function getTemplateScriptFallback(prompt = '', targetLanguage, durationSec = 30) {
  const isTelugu = targetLanguage === 'te';
  const isHindi = targetLanguage === 'hi';
  const lowerP = prompt.toLowerCase();

  if (isTelugu && /[\u0C00-\u0C7F]/.test(prompt)) {
    return prompt.trim();
  }
  if (isHindi && /[\u0900-\u097F]/.test(prompt)) {
    return prompt.trim();
  }

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

  if (lowerP.includes('space') || lowerP.includes('universe') || lowerP.includes('star') || lowerP.includes('galaxy') || lowerP.includes('planet') || lowerP.includes('black hole') || lowerP.includes('moon')) {
    if (isTelugu) {
      return `విశ్వం ఒక అనంతమైన రసవత్తర అద్భుత ప్రపంచం. కోట్ల కొద్దీ నక్షత్రాలు, అనంతమైన గెలాక్సీలు మరియు గురుత్వాకర్షణ శక్తితో కూడిన రహస్యాలు మనల్ని ఎప్పుడూ ఆశ్చర్యపరుస్తాయి. అంతరిక్ష పరిశోధనలు మానవాళి ఆకాంక్షలకు సరిహద్దులు లేవని నిరూపిస్తున్నాయి. విశ్వంలో దాగి ఉన్న రహస్యాలను శోధిస్తూ ముందుకెళ్దాం.`;
    }
    return `The universe is an infinite world of breathtaking mysteries. Billions of stars, galaxies, and black holes continue to amaze science every single day. Outer space proves that human exploration has no limits. Let's explore the secrets hidden deep within the cosmos.`;
  }

  if (isTelugu) {
    return `ప్రతి కథలోనూ ఒక అందమైన అనుభూతి ఉంటుంది. "${prompt}" అనే ఈ విశేషమైన సందర్భం మన జీవితంలో మర్చిపోలేని జ్ఞాపకాలను అందిస్తుంది. ప్రతీ క్షణాన్ని ఆస్వాదిస్తూ ముందుకు సాగడమే నిజమైన ఆనందం.`;
  }

  return `Every story holds a beautiful memory. "${prompt}" brings unique experiences that last a lifetime. Enjoy every single moment.`;
}
