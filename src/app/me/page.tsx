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
    let stashed: Person | null = null;
    try {
      id = localStorage.getItem(MY_CARD_ID_KEY);
      const raw = sessionStorage.getItem('ac:my-card');
      if (raw) {
        const parsed = JSON.parse(raw) as Person;
        if (parsed && (!id || parsed.id === id)) stashed = parsed;
      }
    } catch {
      /* storage blocked */
    }
    // Instant first paint from the card we stashed at create time.
    if (stashed) {
      setState({ kind: 'ready', person: stashed });
      if (!id) id = stashed.id;
    }
    if (!id) {
      if (!stashed) setState({ kind: 'nocard' });
      return;
    }

    let cancelled = false;
    const cardId = id;
    // Fetch the card by id (immediately consistent — no label-index lag) and
    // refresh. Retry a few times to cover any transient hiccup; only fall back
    // to "no card" if we never had a stashed card to show.
    (async () => {
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const res = await fetch(`/api/people/${cardId}`, {
            cache: 'no-store',
          });
          if (res.ok) {
            const json = await res.json();
            if (!cancelled && json.data) {
              setState({ kind: 'ready', person: json.data as Person });
              return;
            }
          }
        } catch {
          /* retry */
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (!cancelled && !stashed) setState({ kind: 'nocard' });
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

const STYLE_KEY = 'ac:card-style';

// Theme = a set of overrides for the pink accent CSS vars. Setting them on the
// card wrapper cascades to everything that resolves var(--color-pink*) — the
// grain name, frame border, divider, shadow — so the whole card re-themes.
const THEMES: { key: string; label: string; vars: Record<string, string> }[] = [
  { key: 'blush', label: 'Blush', vars: t('#e47ba8', '#ee8ab4', '#c46d8e', '#7a4258', '#4a2734') },
  { key: 'cyan', label: 'Cyan', vars: t('#5ec8c8', '#74d6d6', '#4ea3a3', '#2f5e5e', '#1c3838') },
  { key: 'amber', label: 'Amber', vars: t('#e0a44e', '#eeb968', '#c4894a', '#7a5a28', '#4a3618') },
  { key: 'violet', label: 'Violet', vars: t('#a98be4', '#b79cee', '#8e6dc4', '#523f7a', '#2f2447') },
  { key: 'lime', label: 'Lime', vars: t('#a8d65e', '#b9e074', '#8eba4e', '#5a7a2f', '#36481c') },
  { key: 'silver', label: 'Silver', vars: t('#c9c4cf', '#ddd9e1', '#9b96a3', '#5a5560', '#36333b') },
  // Vibrant set — high-saturation pops that read bright on the dark card.
  { key: 'coral', label: 'Coral', vars: t('#ff6b6b', '#ff8585', '#d65a5a', '#8a3a3a', '#4a1f1f') },
  { key: 'azure', label: 'Azure', vars: t('#4d8dff', '#6ba0ff', '#4674cc', '#2a4a85', '#172a4d') },
  { key: 'tangerine', label: 'Tangerine', vars: t('#ff9f43', '#ffb15f', '#d6853a', '#8a5526', '#4a2d14') },
  { key: 'fuchsia', label: 'Fuchsia', vars: t('#e85ad6', '#f070e0', '#c24bb0', '#7a3070', '#42193c') },
  { key: 'sunshine', label: 'Sunshine', vars: t('#ffd43b', '#ffe066', '#d6b234', '#8a721f', '#4a3d10') },
  { key: 'spring', label: 'Spring', vars: t('#4ade80', '#6ee79b', '#3eb869', '#277a45', '#144a28') },
];

function t(pink: string, bright: string, soft: string, dim: string, deep: string) {
  return {
    '--color-pink': pink,
    '--color-pink-bright': bright,
    '--color-pink-soft': soft,
    '--color-pink-dim': dim,
    '--color-pink-deep': deep,
  };
}

function NameCard({ person }: { person: Person }) {
  const [themeKey, setThemeKey] = useState('blush');
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STYLE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { theme?: string };
        if (s.theme && THEMES.some((x) => x.key === s.theme)) setThemeKey(s.theme);
      }
    } catch {
      /* storage blocked */
    }
  }, []);

  function persist(theme: string) {
    try {
      localStorage.setItem(STYLE_KEY, JSON.stringify({ theme }));
    } catch {
      /* non-blocking */
    }
  }

  const theme = THEMES.find((x) => x.key === themeKey) ?? THEMES[0];

  return (
    <main
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 py-6"
      style={theme.vars as React.CSSProperties}
    >
      {/* Rotate hint — only shows in portrait */}
      <div className="font-mono pointer-events-none fixed left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[0.3em] text-pink-soft landscape:hidden">
        ↻ ROTATE PHONE TO LANDSCAPE
      </div>

      <div
        className="pink-frame flicker-in flex w-full max-w-[760px] flex-col gap-4 bg-ink-card px-6 py-7 sm:px-10 sm:py-9 landscape:flex-row landscape:items-center landscape:gap-8"
        style={{ boxShadow: '10px 10px 0 0 var(--color-pink-deep)' }}
      >
        {/* Left / top: identity — centered stack in portrait, left-aligned in
            the landscape hand-over view */}
        <div className="flex shrink-0 flex-col items-center gap-3 text-center landscape:items-start landscape:gap-5 landscape:text-left">
          <SeedAvatar seed={person.name} size={96} />
          <div className="min-w-0">
            <Eyebrow>AI MEETS HER · TOKYO</Eyebrow>
            {/* Name echoes the poster hero: Anton + the same SVG grain
                knocked out of the letters (via Letterpress), tinted by the
                active theme's --color-pink. */}
            <h1 className="m-0 mt-1.5">
              <Letterpress className="break-words text-[40px] leading-[0.95] sm:text-[52px]">
                {person.name || '—'}
              </Letterpress>
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

      {/* Customize — portrait only, hidden when you flip to show the card */}
      <div className="mt-5 w-full max-w-[760px] landscape:hidden">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          className="font-mono flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-pink-soft transition-colors hover:text-pink"
        >
          <span>✎ Customize</span>
          <span className={`transition-transform ${panelOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {panelOpen && (
          <div className="mt-3 flex flex-col gap-4 border border-border-faint bg-ink-soft px-4 py-3.5">
            {/* Color */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-cream-dim">
                Color
              </span>
              <div className="grid w-max grid-cols-6 gap-2.5">
                {THEMES.map((th) => {
                  const on = th.key === themeKey;
                  return (
                    <button
                      key={th.key}
                      type="button"
                      title={th.label}
                      aria-label={th.label}
                      aria-pressed={on}
                      onClick={() => {
                        setThemeKey(th.key);
                        persist(th.key);
                      }}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${on ? 'scale-110 border-cream' : 'border-transparent hover:scale-105'}`}
                      style={{ background: th.vars['--color-pink'] }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions — hidden in landscape to keep the card clean for showing */}
      <div className="mt-4 flex w-full max-w-[760px] gap-2 landscape:hidden">
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
