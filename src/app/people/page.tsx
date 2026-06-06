import Link from 'next/link';
import { listPeople, type Person } from '@/lib/github-store';
import { Eyebrow, Letterpress } from '@/components/ornaments';
import { PeopleClient } from './people-client';

export const dynamic = 'force-dynamic';
export const revalidate = 10;

const EVENT_NAME = 'AI MEETS HER';

export default async function PeoplePage() {
  let people: Person[] = [];
  let error: string | null = null;
  try {
    people = await listPeople();
  } catch (e) {
    error = e instanceof Error ? e.message : 'unknown';
  }

  return (
    <main className="fade-up mx-auto max-w-[520px] px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-[22px] flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.1em] text-pink-soft hover:text-pink"
        >
          ← back
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/sparks"
            className="font-mono text-[11px] tracking-[0.1em] text-pink hover:text-pink-bright"
          >
            ✦ teams
          </Link>
          <Link
            href="/match"
            className="font-mono text-[11px] tracking-[0.1em] text-pink hover:text-pink-bright"
          >
            ai matches →
          </Link>
        </div>
      </header>

      <div className="mb-[22px]">
        <Eyebrow>THE ROOM · LIVE</Eyebrow>
        <h1 className="font-display mb-1 mt-2 text-[46px] leading-[0.95]">
          <Letterpress>Who&apos;s here</Letterpress>
        </h1>
        <p className="font-mono mt-1.5 text-xs text-cream-dim">
          ◆ {people.length} card{people.length === 1 ? '' : 's'} sealed at {EVENT_NAME}
        </p>
      </div>

      {error && (
        <div className="font-mono mb-4 border border-pink bg-pink/10 px-3 py-2 text-xs text-pink">
          ✕ Failed to load people: {error}
        </div>
      )}

      <PeopleClient people={people} />
    </main>
  );
}
