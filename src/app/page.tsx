import Link from 'next/link';
import { listPeople } from '@/lib/github-store';
import {
  CodeBrackets,
  Eyebrow,
  Letterpress,
  SeedAvatar,
} from '@/components/ornaments';
import { MyCardLink } from './my-card-link';

export const dynamic = 'force-dynamic';
export const revalidate = 10;

const EVENT_NAME = 'AI MEETS HER';
const TAGLINE = ['Vibe Coding Day', 'To', 'Visualize Your Dream'];

export default async function LandingPage() {
  let people: Awaited<ReturnType<typeof listPeople>> = [];
  try {
    people = await listPeople();
  } catch {
    // graceful: show 0 in the room
  }
  const preview = people.slice(0, 5);
  const count = people.length;

  return (
    <main className="fade-up mx-auto max-w-[520px] px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
      {/* Top meta — minimal */}
      <div className="mb-9 flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.28em] text-pink-soft">
          ◆ TOKYO · 2026
        </span>
        <span className="font-mono text-[10px] tracking-[0.22em] text-cream-dim">
          {'{ activity_card }'}
        </span>
      </div>

      {/* Hero — title (letterpress) + tagline, no frame */}
      <div className="mb-8 text-center">
        <h1
          className="m-0 font-display"
          style={{
            fontSize: 'clamp(48px, 13vw, 88px)',
            lineHeight: 0.9,
            letterSpacing: '0.005em',
          }}
        >
          <Letterpress>{EVENT_NAME}</Letterpress>
        </h1>
        <p className="mx-auto mt-[22px] max-w-[380px] font-mono text-[16px] font-medium leading-snug text-cream">
          {TAGLINE.map((line, i) => (
            <span key={i}>
              {line}
              {i < TAGLINE.length - 1 && <br />}
            </span>
          ))}
        </p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-pink-soft">
          Drop your digital name card
          <span className="hidden sm:inline"> &middot; </span>
          <br className="sm:hidden" />
          See who&apos;s in the room
        </p>
      </div>

      {/* Returning attendees: jump to their card (client-only) */}
      <MyCardLink />

      {/* Single primary CTA */}
      <Link
        href="/create"
        className="font-display mb-3 block w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright active:bg-pink-soft"
      >
        Drop my card →
      </Link>

      {/* Live room preview — info at a glance */}
      <Link
        href="/people"
        className="pink-frame flex w-full items-center gap-[14px] bg-ink-card px-[18px] py-4 transition-colors hover:bg-ink-soft"
      >
        {/* Stacked mini-avatars */}
        <div className="flex shrink-0">
          {preview.length === 0 ? (
            <div
              style={{
                width: 32,
                height: 32,
                border: '1.5px dashed var(--color-pink-dim)',
                color: 'var(--color-pink-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display-stack)',
                fontSize: 14,
              }}
            >
              ?
            </div>
          ) : (
            preview.map((p, i) => (
              <div
                key={p.id}
                style={{
                  marginLeft: i === 0 ? 0 : -10,
                  border: '1.5px solid var(--color-ink-card)',
                  background: 'var(--color-ink-card)',
                  position: 'relative',
                  zIndex: preview.length - i,
                  lineHeight: 0,
                }}
              >
                <SeedAvatar seed={p.name} size={32} />
              </div>
            ))
          )}
          {count > preview.length && (
            <span className="ml-1.5 self-center font-mono text-[11px] font-bold tracking-[0.02em] text-pink-soft">
              +{count - preview.length}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-pink-grain text-[22px] leading-none">
            {count} in the room
          </div>
          <div className="mt-1 font-mono text-[11px] tracking-[0.04em] text-cream-dim">
            see who&apos;s here →
          </div>
        </div>
        <span className="scan-flick font-mono shrink-0 text-[9px] font-bold tracking-[0.2em] text-pink">
          ● LIVE
        </span>
      </Link>

      {/* Bottom footer line — one small line of poster footer DNA */}
      <div className="mt-12 flex items-center justify-between gap-3">
        <CodeBrackets>
          <span className="text-xs">femcode collective</span>
        </CodeBrackets>
        <span className="font-jp text-[10px] tracking-[0.18em] text-cream-dim">
          東京に掲載
        </span>
      </div>
    </main>
  );
}
