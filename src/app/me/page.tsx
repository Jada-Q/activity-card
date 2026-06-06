'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eyebrow, Letterpress, SeedAvatar } from '@/components/ornaments';
import type { Person } from '@/lib/github-store';

const MY_CARD_ID_KEY = 'ac:my-card-id';

type State =
  | { kind: 'loading' }
  | { kind: 'nocard' }
  | { kind: 'ready'; person: Person };

export default function MePage() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(MY_CARD_ID_KEY);
    } catch {
      /* localStorage blocked */
    }
    if (!id) {
      setState({ kind: 'nocard' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/people', { cache: 'no-store' });
        const json = await res.json();
        const people: Person[] = Array.isArray(json.data) ? json.data : [];
        const mine = people.find((p) => p.id === id);
        if (cancelled) return;
        setState(mine ? { kind: 'ready', person: mine } : { kind: 'nocard' });
      } catch {
        if (!cancelled) setState({ kind: 'nocard' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <span className="font-mono text-xs tracking-[0.3em] text-pink-soft">
          LOADING YOUR CARD…
        </span>
      </main>
    );
  }

  if (state.kind === 'nocard') {
    return (
      <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center gap-6 px-5 text-center">
        <div className="pink-frame w-full max-w-[360px] px-8 py-12">
          <Eyebrow>NO CARD YET</Eyebrow>
          <h2 className="font-display mt-3 text-[30px] leading-[1.05]">
            <Letterpress>Make your card first</Letterpress>
          </h2>
          <p className="font-mono mt-2 text-xs text-cream-dim">
            it becomes the name card you show people
          </p>
        </div>
        <Link
          href="/create"
          className="font-display block w-full max-w-[360px] border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
        >
          + Make my card
        </Link>
      </main>
    );
  }

  return <NameCard person={state.person} />;
}

function NameCard({ person }: { person: Person }) {
  return (
    <main className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 py-6">
      {/* Rotate hint — only shows in portrait */}
      <div className="font-mono pointer-events-none fixed left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[0.3em] text-pink-soft landscape:hidden">
        ↻ ROTATE PHONE TO LANDSCAPE
      </div>

      <div
        className="pink-frame flicker-in flex w-full max-w-[760px] flex-col gap-4 bg-ink-card px-6 py-7 sm:px-10 sm:py-9 landscape:flex-row landscape:items-center landscape:gap-8"
        style={{ boxShadow: '10px 10px 0 0 var(--color-pink-deep)' }}
      >
        {/* Left / top: identity */}
        <div className="flex shrink-0 items-center gap-4 landscape:flex-col landscape:items-start landscape:gap-5">
          <SeedAvatar seed={person.name} size={96} />
          <div className="min-w-0">
            <Eyebrow>AI MEETS HER · TOKYO</Eyebrow>
            <h1 className="text-pink-grain font-display m-0 mt-1.5 break-words text-[40px] leading-[0.95] sm:text-[52px]">
              {person.name || '—'}
            </h1>
            {person.social && (
              <p className="font-mono mt-2 text-sm font-medium text-pink-soft break-all">
                {person.social}
              </p>
            )}
          </div>
        </div>

        <div className="hairline landscape:hidden" />
        <div
          className="hidden self-stretch landscape:block"
          style={{ width: 1, background: 'var(--color-border-faint)' }}
        />

        {/* Right / bottom: what you bring + want */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {person.vibe && (
            <div>
              <Eyebrow>WHAT I BRING</Eyebrow>
              <p className="font-mono mt-1.5 text-[15px] leading-[1.5] text-cream">
                {person.vibe}
              </p>
            </div>
          )}
          {person.lookingFor && (
            <div className="border-l-2 border-pink pl-3">
              <Eyebrow color="var(--color-pink)">TEAMMATE I WANT</Eyebrow>
              <p className="font-mono mt-1.5 text-[15px] leading-[1.5] text-cream">
                {person.lookingFor}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions — hidden in landscape to keep the card clean for showing */}
      <div className="mt-6 flex w-full max-w-[760px] gap-2 landscape:hidden">
        <Link
          href="/people"
          className="font-display flex-1 border-2 border-pink bg-transparent py-2.5 text-center text-base uppercase tracking-[0.04em] text-pink transition-colors hover:bg-pink hover:text-ink"
        >
          The room →
        </Link>
        <Link
          href="/match"
          className="font-display flex-1 border-2 border-pink bg-pink py-2.5 text-center text-base uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
        >
          Find teammates →
        </Link>
      </div>
    </main>
  );
}
