import { NextResponse } from 'next/server';
import { getPerson, type Person } from '@/lib/github-store';
import { listMutual } from '@/lib/sparks-store';

export const dynamic = 'force-dynamic';

// Returns only MUTUAL matches for `me` (both sparked each other) — never
// one-directional likes. Each is a full card so the page can reveal handle.
export async function GET(req: Request) {
  const me = new URL(req.url).searchParams.get('me');
  if (!me || !/^\d+$/.test(me)) {
    return NextResponse.json({ data: [], error: null });
  }
  try {
    const ids = await listMutual(me);
    const people = (await Promise.all(ids.map((id) => getPerson(id)))).filter(
      (p): p is Person => p !== null,
    );
    return NextResponse.json({ data: people, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
