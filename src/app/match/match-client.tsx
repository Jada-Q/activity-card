'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eyebrow, SeedAvatar } from '@/components/ornaments';
import type { Person } from '@/lib/github-store';
import { SparkButton } from '@/app/spark-button';

const MY_CARD_ID_KEY = 'ac:my-card-id';
const TOP_N = 3;

type Mode = 'similar' | 'complement';

function cosine(a: number[], b: number[]): number {
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

type Scored = { person: Person; score: number };

/** Rank others by cosine of `query` against each candidate's skills embedding. */
function rank(query: number[], me: Person, people: Person[]): Scored[] {
  const scored = people
    .filter((p) => p.id !== me.id && p.embedding)
    .map((p) => ({
      person: p,
      score: cosine(query, p.embedding as number[]),
    }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_N);
}

export function MatchClient({
  people,
  totalCount,
}: {
  people: Person[];
  totalCount: number;
}) {
  const [myCardId, setMyCardId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<Mode>('similar');

  useEffect(() => {
    try {
      setMyCardId(localStorage.getItem(MY_CARD_ID_KEY));
    } catch {
      /* localStorage may be blocked */
    }
    setHydrated(true);
  }, []);

  const me = useMemo(
    () => (myCardId ? people.find((p) => p.id === myCardId) : null),
    [people, myCardId],
  );

  // Similar: my skills × their skills. Complementary: what I want × their skills.
  const similar = useMemo<Scored[]>(
    () => (me?.embedding ? rank(me.embedding, me, people) : []),
    [people, me],
  );
  const complement = useMemo<Scored[]>(
    () => (me?.wantEmbedding ? rank(me.wantEmbedding, me, people) : []),
    [people, me],
  );

  if (!hydrated) {
    return (
      <div className="pink-frame px-5 py-10 text-center">
        <p className="font-mono text-xs text-cream-dim">checking your card...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <>
        <div className="pink-frame px-5 py-10 text-center">
          <Eyebrow>NO CARD YET</Eyebrow>
          <p className="font-display mt-3 text-[26px] text-pink">
            Make your card first
          </p>
          <p className="font-mono mt-2 text-xs text-cream-dim">
            AI needs your skills to find teammates
          </p>
        </div>
        <div className="mt-7 flex flex-col gap-2.5">
          <Link
            href="/create"
            className="font-display block w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright active:bg-pink-soft"
          >
            Make my card →
          </Link>
          <Link
            href="/people"
            className="font-mono block w-full border border-border-faint py-3 text-center text-xs tracking-[0.1em] text-cream-dim transition-colors hover:border-pink hover:text-pink"
          >
            ← see the full wall ({totalCount})
          </Link>
        </div>
      </>
    );
  }

  if (!me.embedding) {
    return (
      <>
        <div className="pink-frame px-5 py-10 text-center">
          <Eyebrow>OFFLINE MATCHING</Eyebrow>
          <p className="font-display mt-3 text-[26px] text-pink">
            AI is unavailable
          </p>
          <p className="font-mono mt-2 text-xs leading-snug text-cream-dim">
            your card was created without an embedding —<br />
            the wall still works
          </p>
        </div>
        <div className="mt-7">
          <Link
            href="/people"
            className="font-display block w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
          >
            Open the wall →
          </Link>
        </div>
      </>
    );
  }

  const list = mode === 'similar' ? similar : complement;
  const myContext = mode === 'similar' ? me.vibe : me.lookingFor;

  return (
    <div className="flex flex-col gap-5">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2">
        <ModeTab active={mode === 'similar'} onClick={() => setMode('similar')}>
          Similar
        </ModeTab>
        <ModeTab
          active={mode === 'complement'}
          onClick={() => setMode('complement')}
        >
          Complementary
        </ModeTab>
      </div>

      {/* Context line */}
      <div className="border-l-2 border-pink-dim pl-3">
        <Eyebrow>
          {mode === 'similar' ? 'MATCHING YOUR SKILLS' : 'MATCHING WHAT YOU WANT'}
        </Eyebrow>
        <p className="font-mono mt-1.5 text-[13px] leading-snug text-cream">
          {myContext || '—'}
        </p>
      </div>

      <div className="hairline" />

      {/* Complementary needs a "teammate you want" sentence */}
      {mode === 'complement' && !me.wantEmbedding ? (
        <div className="pink-frame px-5 py-9 text-center">
          <Eyebrow>UNLOCK COMPLEMENTARY</Eyebrow>
          <p className="font-display mt-3 text-[24px] text-pink">
            Add who you&apos;re looking for
          </p>
          <p className="font-mono mt-2 text-xs leading-snug text-cream-dim">
            your card has no &ldquo;teammate you want&rdquo; yet —<br />
            make a new card with it to match by complement
          </p>
          <Link
            href="/create"
            className="font-display mt-5 inline-block border-2 border-pink bg-pink px-6 py-2.5 text-base uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
          >
            Update my card →
          </Link>
        </div>
      ) : list.length === 0 ? (
        <div className="pink-frame px-5 py-10 text-center">
          <Eyebrow>YOU&apos;RE EARLY</Eyebrow>
          <p className="font-display mt-3 text-[26px] text-pink">
            No one to match yet
          </p>
          <p className="font-mono mt-2 text-xs leading-snug text-cream-dim">
            refresh in a bit — others are dropping their cards
          </p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="font-display mt-5 inline-block border-2 border-pink bg-pink px-6 py-2.5 text-base uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
          >
            ↻ Refresh
          </button>
        </div>
      ) : (
        list.map(({ person, score }, i) => (
          <MatchCard
            key={person.id}
            person={person}
            score={score}
            rank={i + 1}
            mode={mode}
          />
        ))
      )}

      <Link
        href="/people"
        className="font-mono mt-2 block w-full border border-border-faint py-3 text-center text-xs tracking-[0.1em] text-cream-dim transition-colors hover:border-pink hover:text-pink"
      >
        ← see the full wall ({totalCount})
      </Link>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono border py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
        active
          ? 'border-pink bg-pink text-ink'
          : 'border-border-faint text-cream-dim hover:border-pink hover:text-pink'
      }`}
    >
      {children}
    </button>
  );
}

function MatchCard({
  person,
  score,
  rank,
  mode,
}: {
  person: Person;
  score: number;
  rank: number;
  mode: Mode;
}) {
  const pct = Math.round(score * 100);
  return (
    <article
      className="pink-frame fade-up flex flex-col gap-3 bg-ink-card px-4 py-4"
      style={{ animationDelay: `${rank * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <SeedAvatar seed={person.name} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-pink-grain font-display m-0 break-words text-[28px] leading-none">
              {person.name || '—'}
            </h2>
            <span className="font-mono shrink-0 text-[10px] text-cream-dim">
              #{String(rank).padStart(2, '0')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-pink-grain text-[18px] leading-none">
              {pct}%
            </span>
            <SimilarityBar percent={pct} />
          </div>
          <p className="font-mono mt-1 text-[9px] uppercase tracking-[0.15em] text-cream-dim">
            {mode === 'similar' ? 'shared vibe' : 'they bring what you want'}
          </p>
        </div>
      </div>

      {person.vibe && (
        <div className="border-l-2 border-pink-dim pl-3">
          <Eyebrow>WHAT THEY BRING</Eyebrow>
          <p className="font-mono mt-1.5 text-[13px] leading-snug text-cream">
            {person.vibe}
          </p>
        </div>
      )}

      {person.social && (
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="font-mono text-[12px] font-medium text-pink-soft break-all">
            {person.social}
          </span>
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard && person.social) {
                navigator.clipboard.writeText(person.social).catch(() => {});
              }
            }}
            className="font-mono shrink-0 border border-pink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-pink transition-colors hover:bg-pink hover:text-ink"
          >
            Copy handle
          </button>
        </div>
      )}

      <div className="mt-1 flex justify-end">
        <SparkButton targetId={person.id} />
      </div>
    </article>
  );
}

function SimilarityBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative h-1 flex-1 bg-pink-deep">
      <div
        className="absolute inset-y-0 left-0 bg-pink"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
