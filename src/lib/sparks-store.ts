import 'server-only';

// Spark store lives in a PRIVATE repo so one-directional likes are never
// public. Only mutual sparks ever get revealed to the client. A spark is one
// Issue: title "from->to", body JSON, label "spark".

const token = process.env.GITHUB_TOKEN?.trim();
const repoFullName = process.env.GITHUB_SPARKS_REPO?.trim();

if (!token || !repoFullName) {
  throw new Error(
    '[sparks-store] GITHUB_TOKEN or GITHUB_SPARKS_REPO missing. See .env.example.',
  );
}

const [OWNER, REPO] = repoFullName.split('/');
const SPARK_LABEL = 'spark';
const API_BASE = 'https://api.github.com';

const baseHeaders: HeadersInit = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'activity-card-app',
};

export type Spark = { from: string; to: string };

type GhIssue = { title: string; body: string | null; pull_request?: unknown };

function isCardId(v: unknown): v is string {
  return typeof v === 'string' && /^\d+$/.test(v);
}

async function gh<T>(path: string, init?: RequestInit & { searchParams?: Record<string, string> }): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: { ...baseHeaders, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status} on ${path}: ${text.slice(0, 160)}`);
  }
  return (await res.json()) as T;
}

function parse(issue: GhIssue): Spark | null {
  if (issue.pull_request) return null;
  try {
    const b = JSON.parse(issue.body ?? '') as { from?: string; to?: string };
    if (isCardId(b.from) && isCardId(b.to)) return { from: b.from, to: b.to };
  } catch {
    /* fall through to title */
  }
  const m = (issue.title ?? '').match(/^(\d+)->(\d+)$/);
  if (m) return { from: m[1], to: m[2] };
  return null;
}

/** All spark edges. Paginated; event scale is small (cap ~1000). */
async function listSparks(): Promise<Spark[]> {
  const out: Spark[] = [];
  for (let page = 1; page <= 10; page++) {
    const issues = await gh<GhIssue[]>(`/repos/${OWNER}/${REPO}/issues`, {
      searchParams: {
        labels: SPARK_LABEL,
        state: 'open',
        per_page: '100',
        page: String(page),
      },
    });
    for (const i of issues) {
      const s = parse(i);
      if (s) out.push(s);
    }
    if (issues.length < 100) break;
  }
  return out;
}

/**
 * Record from→to. Returns whether it was newly created and whether it is now
 * mutual (i.e., the other person had already sparked you).
 */
export async function createSpark(from: string, to: string): Promise<{ created: boolean; mutual: boolean }> {
  if (!isCardId(from) || !isCardId(to) || from === to) {
    throw new Error('invalid spark');
  }
  const all = await listSparks();
  const exists = all.some((s) => s.from === from && s.to === to);
  const mutual = all.some((s) => s.from === to && s.to === from);
  if (!exists) {
    await gh<GhIssue>(`/repos/${OWNER}/${REPO}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: `${from}->${to}`,
        body: JSON.stringify({ from, to }),
        labels: [SPARK_LABEL],
      }),
    });
  }
  return { created: !exists, mutual };
}

/** Card ids that are MUTUAL with `me` (both directions exist). Reveal-safe. */
export async function listMutual(me: string): Promise<string[]> {
  if (!isCardId(me)) return [];
  const all = await listSparks();
  const outgoing = new Set<string>();
  const incoming = new Set<string>();
  for (const s of all) {
    if (s.from === me) outgoing.add(s.to);
    if (s.to === me) incoming.add(s.from);
  }
  return [...outgoing].filter((x) => incoming.has(x));
}
