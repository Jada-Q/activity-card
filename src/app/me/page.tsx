'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Eyebrow, Letterpress, SeedAvatar } from '@/components/ornaments';
import type { Person } from '@/lib/github-store';
import {
  MBTI,
  MBTI_TEST_URL,
  STYLE_KEY,
  THEMES,
  ZODIAC,
} from '@/lib/card-style';

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

// One hand of the two-hands camera logo, recolored to the active theme via a
// CSS mask (the source PNGs are alpha silhouettes). The pair frames the
// screenshot reminder, with the lens ring removed so text sits in the gap.
function Hand({ src, width }: { src: string; width: number }) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0 bg-pink"
      style={{
        height: 52,
        width,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}

function NameCard({ person }: { person: Person }) {
  const [signKey, setSignKey] = useState('');
  const [mbtiKey, setMbtiKey] = useState('');
  const [themeKey, setThemeKey] = useState('blush');
  const [panelOpen, setPanelOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [saveState, setSaveState] = useState<
    'idle' | 'working' | 'shared' | 'downloaded' | 'error'
  >('idle');

  // Render the card to a PNG and hand it to the OS. On iOS the share sheet's
  // "Save Image" drops it straight into Photos; elsewhere we fall back to a
  // file download. Keeps the screenshot path as a backstop for old browsers.
  async function saveCard() {
    const node = exportRef.current;
    if (!node || saveState === 'working') return;
    setSaveState('working');
    try {
      const { toBlob } = await import('html-to-image');
      // Two passes: webfonts (Anton) often miss on the first capture before
      // they're embedded; the second pass renders them reliably.
      const opts = {
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
        // Drop the Letterpress grain overlay — its background-clip:text +
        // mix-blend-mode collapses to black in html-to-image, killing the
        // name. Excluding it leaves the solid theme-coloured base layer.
        filter: (node: HTMLElement) =>
          !node.classList?.contains?.('lp-grain'),
      };
      await toBlob(node, opts);
      const blob = await toBlob(node, opts);
      if (!blob) throw new Error('render returned no blob');
      const file = new File(
        [blob],
        `ai-meets-her-${(person.name || 'card').replace(/\s+/g, '-').toLowerCase()}.png`,
        { type: 'image/png' },
      );
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'AI MEETS HER' });
        setSaveState('shared');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setSaveState('downloaded');
      }
    } catch (err) {
      // User dismissing the share sheet throws AbortError — not a real failure.
      if ((err as Error)?.name === 'AbortError') {
        setSaveState('idle');
        return;
      }
      console.warn('[saveCard] failed', err);
      setSaveState('error');
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STYLE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as {
          sign?: string;
          mbti?: string;
          theme?: string;
        };
        const z = s.sign ? ZODIAC.find((x) => x.key === s.sign) : null;
        if (z) {
          setSignKey(z.key);
          setThemeKey(z.theme);
        } else if (s.theme && THEMES.some((x) => x.key === s.theme)) {
          // legacy cards saved a bare theme before zodiac existed
          setThemeKey(s.theme);
        }
        if (s.mbti && MBTI.includes(s.mbti)) setMbtiKey(s.mbti);
      } else {
        // First-timer (nothing customized yet) — surface the panel expanded so
        // they actually discover color / sign / MBTI.
        setPanelOpen(true);
      }
    } catch {
      /* storage blocked */
    }
  }, []);

  function persist(next: { sign?: string; mbti?: string }) {
    try {
      localStorage.setItem(
        STYLE_KEY,
        JSON.stringify({ sign: next.sign || undefined, mbti: next.mbti || undefined }),
      );
    } catch {
      /* non-blocking */
    }
  }

  function pickSign(z: { key: string; theme: string }) {
    setSignKey(z.key);
    setThemeKey(z.theme);
    persist({ sign: z.key, mbti: mbtiKey });
  }

  function pickMbti(code: string) {
    const next = code === mbtiKey ? '' : code; // tap again to clear
    setMbtiKey(next);
    persist({ sign: signKey, mbti: next });
  }

  const theme = THEMES.find((x) => x.key === themeKey) ?? THEMES[0];
  const sign = ZODIAC.find((x) => x.key === signKey) ?? null;

  return (
    <main
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 py-6"
      style={theme.vars as React.CSSProperties}
    >
      <div
        className="pink-frame flicker-in flex w-full max-w-[760px] flex-col gap-4 bg-ink-card px-6 py-7 sm:px-10 sm:py-9 landscape:flex-row landscape:items-center landscape:gap-8"
        style={{ boxShadow: '10px 10px 0 0 var(--color-pink-deep)' }}
      >
        {/* Identity — logo left, content right on one row (portrait);
            landscape keeps avatar-top + left text for the hand-over view */}
        <div className="flex shrink-0 flex-row items-center gap-4 landscape:flex-col landscape:items-start landscape:gap-5">
          <div className="shrink-0">
            <SeedAvatar seed={person.name} size={96} />
          </div>
          <div className="min-w-0 flex-1 text-center landscape:flex-none landscape:text-left">
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
            {(sign || mbtiKey) && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 landscape:justify-start">
                {sign && (
                  <span className="font-mono text-[13px] font-bold tracking-[0.25em] text-pink">
                    <span className="text-[16px]">{sign.glyph}</span>{' '}
                    {sign.label.toUpperCase()}
                  </span>
                )}
                {mbtiKey && (
                  <span className="font-mono text-[13px] font-bold tracking-[0.2em] text-pink">
                    {mbtiKey}
                  </span>
                )}
              </div>
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

      {/* Save to Photos — the two-hands camera logo IS the button. Tapping it
          renders the card to a horizontal PNG and hands it to the OS (iOS share
          sheet → Save Image → Photos, else download). Portrait only. */}
      <button
        type="button"
        onClick={saveCard}
        disabled={saveState === 'working'}
        aria-label="Save card to Photos"
        className="mt-4 flex w-full max-w-[760px] items-center justify-center gap-3 transition-opacity hover:opacity-90 disabled:opacity-60 landscape:hidden"
      >
        <Hand src="/hand-left.png" width={40} />
        <div className="flex flex-col items-center text-center">
          {/* inline letterSpacing — beats globals' `.font-display{letter-spacing:0.005em}` */}
          <span
            className="font-display whitespace-nowrap text-[15px] uppercase leading-[1.0] text-cream"
            style={{ letterSpacing: '0.1em' }}
          >
            Save card to Photos
          </span>
          <span
            aria-live="polite"
            className="font-mono mt-1 whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-pink-soft"
          >
            {saveState === 'idle' && '↓ one tap to your album'}
            {saveState === 'working' && 'saving…'}
            {saveState === 'shared' && 'tap “Save Image”'}
            {saveState === 'downloaded' && 'saved to downloads'}
            {saveState === 'error' && 'couldn’t save — try again'}
          </span>
        </div>
        <Hand src="/hand-right.png" width={43} />
      </button>

      {/* Customize — portrait only, hidden when you flip to show the card */}
      <div className="mt-5 w-full max-w-[760px] landscape:hidden">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          className="font-display flex w-full items-center justify-center gap-2.5 border-2 border-pink bg-pink py-3 text-lg uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
        >
          <span>✎ Customize · color · sign · MBTI</span>
          <span className={`transition-transform ${panelOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {panelOpen && (
          <div className="mt-3 flex flex-col gap-4 border border-border-faint bg-ink-soft px-4 py-3.5">
            {/* Your sign → picks the card color + shows your glyph */}
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-cream-dim">
                Your sign
              </span>
              <div className="grid w-full grid-cols-2 gap-2">
                {ZODIAC.map((z) => {
                  const on = z.key === signKey;
                  const c = THEMES.find((x) => x.key === z.theme) ?? THEMES[0];
                  return (
                    <button
                      key={z.key}
                      type="button"
                      aria-label={`${z.label} ${z.dates}`}
                      aria-pressed={on}
                      onClick={() => pickSign(z)}
                      className={`flex items-center gap-2 border px-2 py-1.5 text-left transition-colors ${on ? 'border-pink bg-pink/10' : 'border-border-faint hover:border-pink'}`}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] leading-none text-ink"
                        style={{ background: c.vars['--color-pink'] }}
                      >
                        {z.glyph}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-mono text-[12px] font-bold leading-tight text-cream">
                          {z.label}
                        </span>
                        <span className="font-mono text-[9px] leading-tight text-cream-dim">
                          {z.dates}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MBTI — a text badge; stacks with the zodiac */}
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-cream-dim">
                Personality (MBTI)
              </span>
              <div className="grid w-full grid-cols-4 gap-1.5">
                {MBTI.map((code) => {
                  const on = code === mbtiKey;
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickMbti(code)}
                      className={`font-mono border py-1.5 text-[11px] font-bold tracking-[0.05em] transition-colors ${
                        on
                          ? 'border-pink bg-pink text-ink'
                          : 'border-border-faint text-cream hover:border-pink'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
              <a
                href={MBTI_TEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono mt-0.5 text-[11px] tracking-[0.05em] text-pink-soft underline decoration-pink-dim underline-offset-2 transition-colors hover:text-pink"
              >
                Don&apos;t know yours? Take the 2-min test ↗
              </a>
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
      <Link
        href="/sparks"
        className="font-mono mt-2 block w-full max-w-[760px] border border-pink py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-pink transition-colors hover:bg-pink hover:text-ink landscape:hidden"
      >
        ✦ Your teams (mutual sparks)
      </Link>

      {/* Off-screen horizontal card — the artifact saveCard() captures. Always
          the clean landscape "business card" layout at a fixed width, so the
          downloaded PNG is consistent regardless of the phone's orientation.
          Mirrors the on-screen landscape layout but hard-coded to flex-row. */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-99999px', top: 0, pointerEvents: 'none' }}
      >
        <div
          ref={exportRef}
          style={{
            width: 860,
            padding: 28,
            background: 'var(--color-ink)',
            ...(theme.vars as React.CSSProperties),
          }}
        >
          <div
            className="pink-frame flex flex-row items-center gap-8 bg-ink-card"
            style={{ padding: '40px 48px', boxShadow: '12px 12px 0 0 var(--color-pink-deep)' }}
          >
            <div className="flex shrink-0 flex-col items-start gap-5">
              <SeedAvatar seed={person.name} size={108} />
              <div className="text-left">
                <Eyebrow>AI MEETS HER · TOKYO</Eyebrow>
                <h1 className="m-0 mt-1.5">
                  <Letterpress className="text-[56px] leading-[0.95]">
                    {person.name || '—'}
                  </Letterpress>
                </h1>
                {person.social && (
                  <p className="font-mono mt-2 text-[17px] font-medium text-pink-soft">
                    {person.social}
                  </p>
                )}
                {(sign || mbtiKey) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {sign && (
                      <span className="font-mono text-[15px] font-bold tracking-[0.25em] text-pink">
                        <span className="text-[18px]">{sign.glyph}</span>{' '}
                        {sign.label.toUpperCase()}
                      </span>
                    )}
                    {mbtiKey && (
                      <span className="font-mono text-[15px] font-bold tracking-[0.2em] text-pink">
                        {mbtiKey}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className="self-stretch"
              style={{ width: 1, background: 'var(--color-border-faint)' }}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-5">
              {person.vibe && (
                <div>
                  <Eyebrow>WHAT I BRING</Eyebrow>
                  <p className="font-mono mt-1.5 text-[17px] leading-[1.5] text-cream">
                    {person.vibe}
                  </p>
                </div>
              )}
              {person.lookingFor && (
                <div className="border-l-2 border-pink pl-3">
                  <Eyebrow color="var(--color-pink)">TEAMMATE I WANT</Eyebrow>
                  <p className="font-mono mt-1.5 text-[17px] leading-[1.5] text-cream">
                    {person.lookingFor}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
