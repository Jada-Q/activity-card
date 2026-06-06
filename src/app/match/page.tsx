import Link from 'next/link';
import { listPeople, type Person } from '@/lib/github-store';
import { Eyebrow, Letterpress } from '@/components/ornaments';
import { MatchClient } from './match-client';

export const dynamic = 'force-dynamic';
export const revalidate = 10;

export default async function MatchPage() {
  let people: Person[] = [];
  let error: string | null = null;
  try {
    people = await listPeople();
  } catch (e) {
    error = e instanceof Error ? e.message : 'unknown';
  }
  // Cards with an embedding are the candidate pool for AI matching.
  const matchable = people.filter((p) => Array.isArray(p.embedding) && p.embedding.length > 0);

  return (
    <main className="fade-up mx-auto max-w-[520px] px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-[22px] flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.1em] text-pink-soft hover:text-pink"
        >
          ← back
        </Link>
        <span className="font-mono text-[11px] text-cream-dim">
          {'{ vibe_match }'}
        </span>
      </header>

      <div className="mb-[22px]">
        <Eyebrow>AI · TUNED FOR YOU</Eyebrow>
        <h1 className="font-display mb-1 mt-2 text-[46px] leading-[0.95]">
          <Letterpress>Teammates</Letterpress>
        </h1>
        <p className="font-mono mt-1.5 text-xs text-cream-dim">
          ◆ {matchable.length} card{matchable.length === 1 ? '' : 's'} in the
          embedding pool
        </p>
      </div>

      {error && (
        <div className="font-mono mb-4 border border-pink bg-pink/10 px-3 py-2 text-xs text-pink">
          ✕ Failed to load: {error}
        </div>
      )}

      <MatchClient people={matchable} totalCount={people.length} />
    </main>
  );
}
