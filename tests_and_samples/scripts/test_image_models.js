const apiKey = process.env.GCP_API_KEY || process.env.GEMINI_API_KEY;

async function testImageModels() {
  const models = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ];

  for (const m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
    try {
      const isImg = m.includes('image');
      const payload = {
        contents: [{ parts: [{ text: isImg ? 'a yellow banana on a wooden table' : 'Hello' }] }]
      };
      if (isImg) {
        payload.generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`[${m}] Status: ${res.status}`);
      if (data.error) {
        console.log(`[${m}] Error: ${data.error.code} - ${data.error.message}`);
      } else {
        console.log(`[${m}] Success! Candidates:`, data.candidates?.length);
        if (isImg) {
          const parts = data.candidates?.[0]?.content?.parts || [];
          const imgPart = parts.find(p => p.inlineData);
          if (imgPart) {
            console.log(`[${m}] GENERATED IMAGE! Mime: ${imgPart.inlineData.mimeType}, bytes: ${imgPart.inlineData.data.length}`);
            const fs = require('fs');
            fs.writeFileSync(`./uploads/banana_${m}.png`, Buffer.from(imgPart.inlineData.data, 'base64'));
          }
        }
      }
    } catch (e) {
      console.log(`[${m}] Exception:`, e.message);
    }
  }
}

testImageModels();
