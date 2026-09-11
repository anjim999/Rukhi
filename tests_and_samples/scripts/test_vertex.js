const apiKey = process.env.GCP_API_KEY || process.env.GEMINI_API_KEY;
const projectId = 'ai-quiz-generator-479518';
const location = 'us-central1';

async function testVertex() {
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  console.log('Testing Vertex AI endpoint:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello, respond with pong.' }] }]
      })
    });
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testVertex();
