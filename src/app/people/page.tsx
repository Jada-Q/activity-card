import Link from 'next/link';
import { listPeople, type Person } from '@/lib/github-store';
import { PeopleClient } from './people-client';

export const dynamic = 'force-dynamic';
export const revalidate = 10;

export default async function PeoplePage() {
  let people: Person[] = [];
  let error: string | null = null;
  try {
    people = await listPeople();
  } catch (e) {
    error = e instanceof Error ? e.message : 'unknown';
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-6 sm:max-w-2xl sm:px-8 sm:py-10">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs text-pink-soft hover:text-pink"
        >
          ← back
        </Link>
        <span className="font-mono text-xs text-cream-dim">
          {'{ people }'}
        </span>
      </header>

      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="font-display text-pink-grain text-5xl leading-none">
            ROOM
          </h1>
          <p className="font-mono mt-2 text-xs text-cream-dim">
            {people.length} {people.length === 1 ? 'person' : 'people'} in the
            room
          </p>
        </div>
        <Link
          href="/create"
          className="font-display border-2 border-pink px-4 py-2 text-base text-pink transition-colors hover:bg-pink hover:text-ink"
        >
          + me
        </Link>
      </div>

      {error && (
        <div className="font-mono mb-5 border border-pink bg-pink/10 px-3 py-2 text-xs text-pink">
          ✕ Failed to load people: {error}
        </div>
      )}

      <PeopleClient people={people} />
    </main>
  );
}
