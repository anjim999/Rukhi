const apiKey = process.env.GCP_API_KEY || process.env.GEMINI_API_KEY;

async function testModels() {
  const models = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp',
    'nano-banana-pro-preview',
    'gemini-3.1-flash-image'
  ];

  for (const m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      });
      const data = await res.json();
      console.log(`[${m}] Status: ${res.status}`);
      if (data.error) {
        console.log(`[${m}] Error: ${data.error.code} - ${data.error.message}`);
      } else {
        console.log(`[${m}] Success! Text: ${data.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 50)}`);
      }
    } catch (e) {
      console.log(`[${m}] Exception:`, e.message);
    }
  }
}

testModels();
