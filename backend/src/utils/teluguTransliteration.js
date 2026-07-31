/**
 * Telglish / Telugu Roman Transliteration Utility
 */
export function transliterateTeluguToRoman(text) {
  if (!text || typeof text !== 'string') return text;
  if (!/[\u0C00-\u0C7F\u0900-\u097F]/.test(text)) return text;

  const wordMap = {
    'తమ్ముడు': 'tammudu',
    'ఒక్క': 'okka',
    'నిమిషం': 'nimisham',
    'నా': 'naa',
    'అనుభూతితో': 'anubhutito',
    'చెప్తున్నాను': 'cheptunnanu',
    'అమ్మాయిలతో': 'ammayilato',
    'తిరగరు': 'tiragaru',
    'ఒక్కసారి': 'okkasari',
    'ప్రేమలో': 'premaloo',
    'పడ్డామంటే': 'paddamante',
    'తువల': 'tuvala',
    'థియరీ': 'theory',
    'పోతుంది': 'potundi',
    'తర్వాత': 'tarvata',
    'ఎంత': 'enta',
    'పీకునో': 'peekuno',
    'ఉపయోగం': 'upayogam',
    'ఏం': 'em',
    'చేస్తున్నావ్': 'chestunnav',
    'రా': 'raa',
    'ఏంటి': 'enti',
    'కాదు': 'kaadu',
    'అవును': 'avunu',
  };

  let res = text;
  for (const [teWord, roWord] of Object.entries(wordMap)) {
    res = res.replace(new RegExp(teWord, 'g'), roWord);
  }

  const charMap = {
    'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo', 'ఋ': 'ru', 'ఎ': 'e', 'ఏ': 'ae', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au', 'అం': 'am', 'అః': 'aha',
    'క': 'ka', 'ఖ': 'kha', 'గ': 'ga', 'ఘ': 'gha', 'ఙ': 'nga',
    'చ': 'cha', 'ఛ': 'chha', 'జ': 'ja', 'ఝ': 'jha', 'ఞ': 'nya',
    'ట': 'ta', 'ఠ': 'tha', 'డ': 'da', 'ఢ': 'dha', 'ణ': 'na',
    'త': 'ta', 'థ': 'tha', 'ద': 'da', 'ధ': 'dha', 'న': 'na',
    'ప': 'pa', 'ఫ': 'pha', 'బ': 'ba', 'భ': 'bha', 'మ': 'ma',
    'య': 'ya', 'ర': 'ra', 'ల': 'la', 'వ': 'va', 'శ': 'sha', 'ష': 'sha', 'స': 'sa', 'హ': 'ha', 'ళ': 'la', 'క్ష': 'ksha', 'ఱ': 'ra',
    'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru', 'ె': 'e', 'ే': 'ae', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au', 'ం': 'm', 'ః': 'h', '్': '',
  };

  let out = '';
  for (let i = 0; i < res.length; i++) {
    const ch = res[i];
    out += charMap[ch] !== undefined ? charMap[ch] : ch;
  }
  return out;
}
