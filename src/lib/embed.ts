import 'server-only';

/**
 * Gemini text embedding for AI Vibe Match.
 *
 * Model: gemini-embedding-001 (stable, free tier ~1500 req/day).
 * Dimensions truncated to 256 — keeps mobile payload sane (50 people × 256
 * dims × 4 bytes ≈ 51 KB shipped to client).
 * Task type: SEMANTIC_SIMILARITY (Gemini-specific tuning for this use case).
 *
 * Returns null on failure so the caller can still write the Issue with a
 * null embedding (graceful degradation — card shows on /people but is
 * skipped on /match).
 */
const ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

const apiKey = process.env.GEMINI_API_KEY?.trim();

export const EMBED_DIM = 256;

export async function embedText(text: string): Promise<number[] | null> {
  if (!apiKey) {
    console.warn('[embed] GEMINI_API_KEY not set, returning null');
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: trimmed }] },
        outputDimensionality: EMBED_DIM,
        taskType: 'SEMANTIC_SIMILARITY',
      }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[embed] ${res.status} ${body.slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as { embedding?: { values?: number[] } };
    const values = json.embedding?.values;
    if (!values || values.length !== EMBED_DIM) {
      console.error('[embed] unexpected response shape');
      return null;
    }
    return values;
  } catch (e) {
    console.error('[embed] fetch failed:', e);
    return null;
  }
}

/**
 * Cosine similarity. Embeddings should be roughly L2-normalized by Gemini,
 * but we don't assume that — explicit normalization makes ranking robust.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
