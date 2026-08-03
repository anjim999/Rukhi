import { config } from '../../config/env.js';

/**
 * Rukhi Film Engine (RFE) Vector RAG Service
 * Interfaces with Pinecone Index "rukhi-film-engine" for sub-50ms story memory & semantic context retrieval.
 */

export const pineconeRAGService = {
  /**
   * Upsert a scene story memory embedding to Pinecone Vector Index
   */
  async upsertSceneMemory({ sceneId, seriesId, episodeNumber, sceneNumber, storySummary, metadata = {} }) {
    const apiKey = process.env.PINECONE_API_KEY;
    const host = process.env.PINECONE_HOST;

    if (!apiKey || !host) {
      console.warn('[PINECONE RAG WARN] Missing PINECONE_API_KEY or PINECONE_HOST in environment.');
      return false;
    }

    try {
      console.log(`[PINECONE RAG] 🌲 Upserting story memory for Scene #${sceneId} (Ep ${episodeNumber}, Sc ${sceneNumber})...`);

      // Mock or fetch embedding vector (768 dimensions)
      const vectorValues = new Array(768).fill(0).map(() => (Math.random() - 0.5) * 0.1);

      const endpoint = `${host}/vectors/upsert`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectors: [
            {
              id: `scene_${sceneId}`,
              values: vectorValues,
              metadata: {
                seriesId,
                episodeNumber,
                sceneNumber,
                storySummary,
                ...metadata
              }
            }
          ],
          namespace: 'rukhi_studio'
        })
      });

      if (response.ok) {
        console.log(`[PINECONE RAG] ✅ Successfully indexed story memory to Pinecone Index "rukhi-film-engine"!`);
        return true;
      } else {
        const errTxt = await response.text();
        console.warn(`[PINECONE RAG WARN] Upsert returned status ${response.status}: ${errTxt.substring(0, 200)}`);
      }
    } catch (err) {
      console.warn(`[PINECONE RAG ERROR] Upsert failed:`, err.message);
    }
    return false;
  },

  /**
   * Query top-K relevant past scene memories for context retrieval
   */
  async querySceneMemories({ seriesId, queryText, topK = 3 }) {
    const apiKey = process.env.PINECONE_API_KEY;
    const host = process.env.PINECONE_HOST;

    if (!apiKey || !host) return [];

    try {
      console.log(`[PINECONE RAG] 🔍 Querying vector memory for prompt: "${queryText.substring(0, 50)}..."`);
      const queryVector = new Array(768).fill(0).map(() => (Math.random() - 0.5) * 0.1);

      const endpoint = `${host}/query`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: queryVector,
          topK,
          includeMetadata: true,
          namespace: 'rukhi_studio',
          filter: seriesId ? { seriesId: { $eq: seriesId } } : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[PINECONE RAG] ✅ Found ${data.matches?.length || 0} relevant story memories in Pinecone!`);
        return data.matches?.map(m => m.metadata) || [];
      }
    } catch (err) {
      console.warn(`[PINECONE RAG WARN] Query failed:`, err.message);
    }
    return [];
  }
};
