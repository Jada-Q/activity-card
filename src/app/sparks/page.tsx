'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eyebrow, Letterpress, SeedAvatar } from '@/components/ornaments';
import type { Person } from '@/lib/github-store';

const MY_CARD_ID_KEY = 'ac:my-card-id';

type State =
  | { kind: 'loading' }
  | { kind: 'nocard' }
  | { kind: 'ready'; teams: Person[] };

export default function SparksPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(MY_CARD_ID_KEY);
    } catch {
      /* blocked */
    }
    if (!id) {
      setState({ kind: 'nocard' });
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/sparks?me=${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        const teams: Person[] = Array.isArray(json.data) ? json.data : [];
        setState({ kind: 'ready', teams });
      } catch {
        if (!cancelled) setState((s) => (s.kind === 'loading' ? { kind: 'ready', teams: [] } : s));
      }
    };
    load();
    // Poll for new mutual matches — but only while the tab is visible, and at a
    // gentle interval, to protect the shared GitHub rate budget at event scale.
    const tick = () => {
      if (document.visibilityState === 'visible') load();
    };
    const timer = setInterval(tick, 30000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load(); // refresh on return
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <main className="fade-up mx-auto max-w-[520px] px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-[22px] flex items-center justify-between">
        <Link href="/people" className="font-mono text-xs tracking-[0.1em] text-pink-soft hover:text-pink">
          ← the room
        </Link>
        <span className="font-mono text-[11px] text-cream-dim">{'{ your_teams }'}</span>
      </header>

      <div className="mb-[22px]">
        <Eyebrow>MUTUAL SPARKS ONLY</Eyebrow>
        <h1 className="font-display mb-1 mt-2 text-[46px] leading-[0.95]">
          <Letterpress>Your Teams</Letterpress>
        </h1>
        <p className="font-mono mt-1.5 text-xs leading-snug text-cream-dim">
          ◆ When you and someone both spark each other, you appear here — with
          their handle. One-way sparks stay private.
        </p>
      </div>

      {state.kind === 'loading' && (
        <p className="font-mono text-xs text-cream-dim">checking…</p>
      )}

      {state.kind === 'nocard' && (
        <div className="flex flex-col gap-5">
          <div className="pink-frame px-5 py-9 text-center">
            <p className="font-display m-0 text-[26px] text-pink">make your card first</p>
            <p className="font-mono mt-2 text-xs text-cream-dim">
              you spark people from your own card
            </p>
          </div>
          <Link
            href="/create"
            className="font-display block w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
          >
            Make my card →
          </Link>
        </div>
      )}

      {state.kind === 'ready' && state.teams.length === 0 && (
        <div className="flex flex-col gap-5">
          <div className="pink-frame px-5 py-9 text-center">
            <p className="font-display m-0 text-[26px] text-pink">no teams yet</p>
            <p className="font-mono mt-2 text-xs leading-snug text-cream-dim">
              spark people in the room — when they spark back,
              <br />
              it&apos;s a team and they show up here
            </p>
          </div>
          <Link
            href="/people"
            className="font-display block w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
          >
            Browse the room →
          </Link>
        </div>
      )}

      {state.kind === 'ready' && state.teams.length > 0 && (
        <div className="flex flex-col gap-3.5">
          <p className="font-mono text-[11px] text-cream-dim">
            {state.teams.length} team{state.teams.length === 1 ? '' : 's'} ✦
          </p>
          {state.teams.map((p, i) => (
            <article
              key={p.id}
              className="pink-frame fade-up flex flex-col gap-3 bg-ink-card px-4 py-4"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <SeedAvatar seed={p.name} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-pink">
                    ✦ It&apos;s a team!
                  </div>
                  <h2 className="text-pink-grain font-display m-0 break-words text-2xl leading-none">
                    {p.name || '—'}
                  </h2>
                </div>
              </div>
              {p.vibe && (
                <p className="font-mono text-[13px] leading-snug text-cream">{p.vibe}</p>
              )}
              {p.social ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[12px] font-medium text-pink-soft break-all">
                    {p.social}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard && p.social) {
                        navigator.clipboard.writeText(p.social).catch(() => {});
                      }
                    }}
                    className="font-mono shrink-0 border border-pink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-pink transition-colors hover:bg-pink hover:text-ink"
                  >
                    Copy handle
                  </button>
                </div>
              ) : (
                <p className="font-mono text-[11px] text-cream-dim">
                  go find them in the room →
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
