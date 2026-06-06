import 'server-only';

const token = process.env.GITHUB_TOKEN?.trim();
const repoFullName = process.env.GITHUB_REPO?.trim();

if (!token || !repoFullName) {
  throw new Error(
    '[github-store] GITHUB_TOKEN or GITHUB_REPO missing. See .env.example.',
  );
}

const [OWNER, REPO] = repoFullName.split('/');
if (!OWNER || !REPO) {
  throw new Error(
    `[github-store] GITHUB_REPO must be "owner/repo", got: ${repoFullName}`,
  );
}

const CARD_LABEL = 'card';
const API_BASE = 'https://api.github.com';

const baseHeaders: HeadersInit = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'activity-card-app',
};

export type Person = {
  id: string;
  name: string;
  bio: string;
  lookingFor: string;
  social: string;
  tags: string[];
  /**
   * Single-sentence self-description used by the AI Vibe Match feature
   * (post-v3). Older cards predating the redesign won't have this field
   * (we display bio + lookingFor for those instead).
   */
  vibe?: string;
  /**
   * 256-dim Gemini embedding of `vibe` (= "what you bring" / skills+background).
   * Present only when GEMINI_API_KEY was configured at write time AND the API
   * call succeeded. Cards without this field are skipped on /match but still
   * show on /people.
   */
  embedding?: number[];
  /**
   * 256-dim Gemini embedding of `lookingFor` (= teammate skills wanted).
   * Powers the complementary-match tab (my-wanted × their-skills). Cards
   * predating v5 won't have this — they're skipped in complementary mode.
   */
  wantEmbedding?: number[];
  createdAt: string;
};

export type CreatePersonInput = {
  name: string;
  bio: string;
  lookingFor: string;
  social: string;
  tags: string[];
  vibe?: string;
  embedding?: number[];
  wantEmbedding?: number[];
};

type GhIssue = {
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  pull_request?: unknown;
};

type StoredCard = {
  name?: string;
  bio?: string;
  lookingFor?: string;
  social?: string;
  tags?: string[];
  vibe?: string;
  embedding?: number[];
  wantEmbedding?: number[];
};

function issueToPerson(issue: GhIssue): Person | null {
  if (!issue.body) return null;
  let parsed: StoredCard;
  try {
    parsed = JSON.parse(issue.body) as StoredCard;
  } catch {
    return null;
  }
  return {
    id: String(issue.number),
    name: parsed.name ?? issue.title ?? '',
    bio: parsed.bio ?? '',
    lookingFor: parsed.lookingFor ?? '',
    social: parsed.social ?? '',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    vibe: typeof parsed.vibe === 'string' ? parsed.vibe : undefined,
    embedding: Array.isArray(parsed.embedding) ? parsed.embedding : undefined,
    wantEmbedding: Array.isArray(parsed.wantEmbedding)
      ? parsed.wantEmbedding
      : undefined,
    createdAt: issue.created_at,
  };
}

async function gh<T>(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string> },
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: { ...baseHeaders, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status} ${res.statusText} on ${path}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// Short in-memory cache so a crowded room (120 people all viewing the wall /
// match / landing) doesn't hammer GitHub's 5,000-req/hr shared token budget.
// Per warm serverless instance; TTL keeps "X in the room" fresh enough.
let peopleCache: { at: number; data: Person[] } | null = null;
// 8s balances rate protection (120 concurrent → ~1 GitHub call / 8s) against
// new-card-on-wall latency (a cache populated during GitHub's index lag holds a
// stale list for up to one TTL). The creator's own /me uses by-id (instant).
const PEOPLE_TTL_MS = 8_000;

export function invalidatePeopleCache() {
  peopleCache = null;
}

export async function listPeople(): Promise<Person[]> {
  if (peopleCache && Date.now() - peopleCache.at < PEOPLE_TTL_MS) {
    return peopleCache.data;
  }
  const issues = await gh<GhIssue[]>(`/repos/${OWNER}/${REPO}/issues`, {
    searchParams: {
      labels: CARD_LABEL,
      state: 'open',
      per_page: '100',
      sort: 'created',
      direction: 'desc',
    },
  });
  const data = issues
    .filter((i) => !i.pull_request)
    .map(issueToPerson)
    .filter((p): p is Person => p !== null);
  peopleCache = { at: Date.now(), data };
  return data;
}

/**
 * Fetch a single card by its issue number. Unlike `listPeople` (which filters
 * by label and is subject to GitHub's 3-5s search-index eventual consistency),
 * GET issues/{number} is immediately consistent — so a freshly-created card is
 * readable here right away. This is what /me uses to render reliably.
 */
export async function getPerson(id: string): Promise<Person | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const issue = await gh<GhIssue>(`/repos/${OWNER}/${REPO}/issues/${id}`);
    if (issue.pull_request) return null;
    return issueToPerson(issue);
  } catch {
    return null;
  }
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const body = JSON.stringify({
    name: input.name,
    bio: input.bio,
    lookingFor: input.lookingFor,
    social: input.social,
    tags: input.tags,
    vibe: input.vibe,
    embedding: input.embedding,
    wantEmbedding: input.wantEmbedding,
  });
  const issue = await gh<GhIssue>(`/repos/${OWNER}/${REPO}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: input.name.slice(0, 80),
      body,
      labels: [CARD_LABEL],
    }),
  });
  const person = issueToPerson(issue);
  if (!person) throw new Error('Failed to parse created issue back into Person');
  invalidatePeopleCache(); // so the new card shows on the wall ASAP
  return person;
}
