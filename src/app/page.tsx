import Link from 'next/link';
import {
  CodeBrackets,
  GridGlobe,
  MinusPlusWaveBar,
  StampBurst,
} from '@/components/ornaments';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8 sm:max-w-lg sm:px-8 sm:py-12">
      {/* Hero block — mirrors the poster framing */}
      <div className="pink-frame relative flex flex-col items-center gap-5 px-5 py-8 sm:gap-7 sm:px-8 sm:py-10">
        <h1 className="text-pink-grain font-display text-center text-[44px] leading-[0.92] tracking-tight sm:text-6xl">
          AI
          <br />
          MEETS
          <br />
          HER
        </h1>

        <p className="font-mono text-center text-base font-bold leading-tight tracking-tight text-cream sm:text-lg">
          Vibe Coding Day To
          <br />
          Visualize Your Dream
        </p>

        <StampBurst className="my-1 h-16 w-full max-w-[280px]">
          Female
          <br />
          Targeted
        </StampBurst>

        <MinusPlusWaveBar className="w-full" />

        {/* Lower mini-frame: sponsors / signature */}
        <div className="flex w-full gap-3">
          <div className="pink-frame flex aspect-square w-[34%] items-center justify-center p-2">
            <GridGlobe className="h-full w-full text-pink" />
          </div>
          <div className="pink-frame flex flex-1 flex-col justify-center gap-2 px-3 py-2">
            <CodeBrackets>
              <span className="text-sm">femcode collective</span>
            </CodeBrackets>
            <div className="hairline" />
            <p className="font-mono text-[10px] leading-snug text-cream-dim sm:text-xs">
              Tokyo Design · Lovable
              <br />
              STARTUP LADY · And 10+ Partners
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-center text-pink-soft">
          <span className="font-mono text-xs tracking-[0.3em]">❀</span>
          <span className="font-mono text-xs tracking-[0.25em]">
            TOKYO · 東京に掲載
          </span>
          <span className="font-mono text-xs tracking-[0.3em]">❀</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/create"
          className="font-display block border-2 border-pink bg-pink py-4 text-center text-2xl tracking-wide text-ink transition-colors hover:bg-pink-soft active:bg-pink-dim"
        >
          Create my card →
        </Link>
        <Link
          href="/people"
          className="font-display block border-2 border-pink py-4 text-center text-2xl tracking-wide text-pink transition-colors hover:bg-pink hover:text-ink"
        >
          ← Meet others
        </Link>
      </div>

      <footer className="mt-10 text-center font-mono text-[10px] text-cream-dim">
        <p>
          made with{' '}
          <CodeBrackets>
            <span>vibe</span>
          </CodeBrackets>{' '}
          for AI MEETS HER · 2026
        </p>
      </footer>
    </main>
  );
}
