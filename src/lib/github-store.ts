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
  createdAt: string;
};

export type CreatePersonInput = {
  name: string;
  bio: string;
  lookingFor: string;
  social: string;
  tags: string[];
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

export async function listPeople(): Promise<Person[]> {
  const issues = await gh<GhIssue[]>(`/repos/${OWNER}/${REPO}/issues`, {
    searchParams: {
      labels: CARD_LABEL,
      state: 'open',
      per_page: '100',
      sort: 'created',
      direction: 'desc',
    },
  });
  return issues
    .filter((i) => !i.pull_request)
    .map(issueToPerson)
    .filter((p): p is Person => p !== null);
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const body = JSON.stringify({
    name: input.name,
    bio: input.bio,
    lookingFor: input.lookingFor,
    social: input.social,
    tags: input.tags,
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
  return person;
}
