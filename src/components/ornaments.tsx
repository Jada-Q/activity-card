/**
 * Ornaments — the few shared decorations used across screens.
 *
 * The poster does the loud, dense, ornamental work; the app is its quiet
 * functional counterpart that shares DNA (palette, grain atmosphere, type)
 * but with inverted proportions. So this file is intentionally lean —
 * removed: StampBurst, MinusPlusWaveBar, GridGlobe, Ribbon, sound wave.
 * Kept: Letterpress (one hero moment per screen), Eyebrow (small caps
 * labels), SeedAvatar (initials in pink-bordered square), CodeBrackets.
 */

import { type CSSProperties, type ReactNode } from 'react';

export function CodeBrackets({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono font-bold text-pink">
      <span className="mr-2 opacity-80">{'{'}</span>
      {children}
      <span className="ml-2 opacity-80">{'}'}</span>
    </span>
  );
}

/**
 * Eyebrow — small spaced caps label. Used above the hero on each screen.
 */
export function Eyebrow({
  children,
  color,
  className = '',
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  const style: CSSProperties = color ? { color } : {};
  return (
    <span
      className={`font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-pink-soft ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

/**
 * Letterpress — pink fill type with grain knocked out of the letters
 * themselves (via background-clip: text + SVG fractal noise). Reserve for
 * one hero moment per screen (title or success state).
 */
export function Letterpress({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`letterpress-wrap ${className}`}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <span className="font-display lp-base">{children}</span>
      <span className="font-display lp-grain" aria-hidden="true">
        {children}
      </span>
      <LetterpressStyles />
    </span>
  );
}

function LetterpressStyles() {
  return (
    <style>{`
      .letterpress-wrap { position: relative; display: inline-block; color: var(--color-pink); }
      .letterpress-wrap .lp-base { color: var(--color-pink); }
      .letterpress-wrap .lp-grain {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='3.2' numOctaves='2' stitchTiles='stitch' seed='9'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        background-size: 120px 120px;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        mix-blend-mode: multiply;
      }
    `}</style>
  );
}

/**
 * SeedAvatar — initials in a pink-bordered square. Deterministic background
 * variant by name hash so the same person always gets the same look.
 */
export function SeedAvatar({
  seed = '',
  size = 56,
}: {
  seed?: string;
  size?: number;
}) {
  const initials =
    (seed || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const variants = [
    { bg: 'transparent', fg: 'var(--color-pink)' },
    { bg: 'var(--color-pink)', fg: 'var(--color-ink)' },
    { bg: 'var(--color-pink-deep)', fg: 'var(--color-pink)' },
  ];
  const v = variants[h % variants.length];
  const fontSize = Math.round(size * 0.42);

  return (
    <div
      style={{
        width: size,
        height: size,
        border: '1.5px solid var(--color-pink)',
        background: v.bg,
        color: v.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display-stack)',
        fontSize,
        lineHeight: 1,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
