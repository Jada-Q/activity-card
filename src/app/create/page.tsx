'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eyebrow, Letterpress } from '@/components/ornaments';

const MAX_VIBE = 280;
const MAX_NAME = 60;
const MAX_SOCIAL = 80;
const MY_CARD_ID_KEY = 'ac:my-card-id';

const VIBE_PROMPTS = [
  'frontend dev obsessed with three.js and live coding',
  'first-time founder, looking for a technical cofounder',
  'designer who codes, here to meet women in AI',
  'product manager curious about agentic workflows',
  'researcher building AI tools for elderly care',
];

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [vibe, setVibe] = useState('');
  const [social, setSocial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);

  function rotatePrompt() {
    setPromptIdx((i) => (i + 1) % VIBE_PROMPTS.length);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!vibe.trim()) {
      setError('Drop a vibe sentence so AI can match you');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          vibe: vibe.trim(),
          social: social.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(
          typeof json.error === 'string' ? json.error : 'Submission failed',
        );
        setSubmitting(false);
        return;
      }
      try {
        if (json.data?.id) {
          localStorage.setItem(MY_CARD_ID_KEY, String(json.data.id));
        }
      } catch {
        /* localStorage may be blocked — non-blocking */
      }
      // GitHub Issues has ~3-5s eventual consistency on labels filter;
      // hold success state then redirect so user lands on a populated /match.
      setSuccess(true);
      setTimeout(() => router.push('/match'), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[520px] items-center justify-center px-5 py-6">
        <div className="pink-frame flicker-in w-full max-w-[360px] px-8 py-12 text-center">
          <Eyebrow>VIBE SEALED · MATCHING</Eyebrow>
          <p
            className="font-display m-0 mt-[14px] leading-none"
            style={{ color: 'var(--color-pink)', fontSize: 72 }}
          >
            <Letterpress>✓</Letterpress>
          </p>
          <h2 className="font-display mt-4 mb-1.5 text-[28px] leading-[1.05]">
            <Letterpress>AI is reading the room</Letterpress>
          </h2>
          <p className="font-mono mt-1.5 text-xs text-cream-dim">
            finding your 3 vibe twins...
          </p>
          <div className="hairline mx-auto mt-5 w-[100px]" />
          <div className="scan-flick mt-3.5">
            <span className="font-mono text-[10px] tracking-[0.3em] text-pink-soft">
              EMBEDDING · CALIBRATING
            </span>
          </div>
        </div>
      </main>
    );
  }

  const promptHint = VIBE_PROMPTS[promptIdx];

  return (
    <main className="fade-up mx-auto max-w-[520px] px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-[22px] flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.1em] text-pink-soft hover:text-pink"
        >
          ← back
        </Link>
        <span className="font-mono text-[11px] text-cream-dim">
          {'{ drop_a_vibe }'}
        </span>
      </header>

      <h1 className="font-display m-0 mb-1 text-[46px] leading-[0.95]">
        <Letterpress>Your Vibe</Letterpress>
      </h1>
      <p className="font-mono mb-7 mt-1.5 text-xs text-cream-dim">
        ◆ One sentence. AI does the matching.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Name *"
          hint="how others should call you"
          value={name}
          onChange={setName}
          maxLength={MAX_NAME}
          required
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-pink">
              Your vibe *
            </label>
            <span className="font-mono text-[10px] text-cream-dim">
              {vibe.length}/{MAX_VIBE}
            </span>
          </div>
          <p className="font-mono text-[11px] text-cream-dim">
            who you are, what you&apos;re here for — the more specific the better
            the match
          </p>
          <textarea
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            maxLength={MAX_VIBE}
            required
            rows={4}
            placeholder={`e.g. "${promptHint}"`}
            className="font-mono w-full resize-none border border-border-faint bg-ink-soft px-3 py-2.5 text-[15px] leading-snug text-cream outline-none placeholder:text-grey focus:border-pink focus:bg-[#1a1418]"
          />
          <button
            type="button"
            onClick={rotatePrompt}
            className="font-mono self-end text-[10px] tracking-[0.1em] text-pink-soft hover:text-pink"
          >
            ↻ different example
          </button>
        </div>

        <Field
          label="Social handle"
          hint="how matches reach you — @ig / @x / discord / whatever"
          value={social}
          onChange={setSocial}
          maxLength={MAX_SOCIAL}
          placeholder="@yourhandle"
        />

        {error && (
          <div className="font-mono border border-pink bg-pink/10 px-3 py-2 text-xs text-pink">
            ✕ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim() || !vibe.trim()}
          className="font-display mt-2 w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright active:bg-pink-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '...embedding' : 'Match me →'}
        </button>

        <p className="font-mono mt-1 text-center text-[10px] tracking-[0.1em] text-cream-dim">
          ◆ AI matches you with 3 closest vibes in the room
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  maxLength,
  required,
  autoFocus,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-pink">
          {label}
        </label>
        {maxLength && (
          <span className="font-mono text-[10px] text-cream-dim">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <p className="font-mono text-[11px] text-cream-dim">{hint}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="font-mono w-full border border-border-faint bg-ink-soft px-3 py-2.5 text-[15px] text-cream outline-none placeholder:text-grey focus:border-pink focus:bg-[#1a1418]"
      />
    </div>
  );
}
