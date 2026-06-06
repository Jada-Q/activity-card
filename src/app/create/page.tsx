'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Eyebrow, Letterpress } from '@/components/ornaments';
import attendees from '@/data/attendees.json';

const MAX_VIBE = 280;
const MAX_WANT = 280;
const MAX_NAME = 60;
const MAX_SOCIAL = 80;
const MY_CARD_ID_KEY = 'ac:my-card-id';

const SKILL_PROMPTS = [
  'frontend dev — three.js, live coding, design systems',
  'PM who ships — agentic workflows, 0→1, user research',
  'designer who codes — figma, react, brand identity',
  'ML engineer — RAG, fine-tuning, eval pipelines',
  'first-time founder — biz dev, fundraising, storytelling',
];

const WANT_PROMPTS = [
  'a technical cofounder who can build the MVP',
  'a designer to make it not look like a hackathon',
  'someone who knows Japanese market + GTM',
  'a data person to set up the eval loop',
  'anyone who has shipped to the App Store',
];

type Attendee = { name: string; social: string; background: string };

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [vibe, setVibe] = useState('');
  const [want, setWant] = useState('');
  const [social, setSocial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillIdx, setSkillIdx] = useState(0);
  const [wantIdx, setWantIdx] = useState(0);
  const [prefilled, setPrefilled] = useState(false);

  // Bundled Luma lookup (name → {social, background}). No emails — see
  // src/data/attendees.json. Used only to save attendees retyping at the venue.
  const lookup = useMemo(() => {
    const m = new Map<string, Attendee>();
    for (const a of attendees as Attendee[]) m.set(normalize(a.name), a);
    return m;
  }, []);

  function onNameChange(next: string) {
    setName(next);
    const hit = lookup.get(normalize(next));
    if (hit) {
      // Only fill fields the user hasn't touched, so we never clobber edits.
      let filled = false;
      if (hit.social && !social) {
        setSocial(hit.social);
        filled = true;
      }
      if (hit.background && !vibe) {
        setVibe(hit.background);
        filled = true;
      }
      if (filled) setPrefilled(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!vibe.trim()) {
      setError('Add what you bring so AI can match you');
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
          lookingFor: want.trim(),
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
      // GitHub Issues has ~3-5s eventual consistency on labels filter; hold the
      // success state, then send them to their card to show it off.
      setSuccess(true);
      setTimeout(() => router.push('/me'), 2800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[520px] items-center justify-center px-5 py-6">
        <div className="pink-frame flicker-in w-full max-w-[360px] px-8 py-12 text-center">
          <Eyebrow>CARD MINTED</Eyebrow>
          <p
            className="font-display m-0 mt-[14px] leading-none"
            style={{ color: 'var(--color-pink)', fontSize: 72 }}
          >
            <Letterpress>✓</Letterpress>
          </p>
          <h2 className="font-display mt-4 mb-1.5 text-[28px] leading-[1.05]">
            <Letterpress>Your card is live</Letterpress>
          </h2>
          <p className="font-mono mt-1.5 text-xs text-cream-dim">
            opening your name card to show…
          </p>
          <div className="hairline mx-auto mt-5 w-[100px]" />
          <div className="scan-flick mt-3.5">
            <span className="font-mono text-[10px] tracking-[0.3em] text-pink-soft">
              ROTATE TO LANDSCAPE
            </span>
          </div>
        </div>
      </main>
    );
  }

  const skillHint = SKILL_PROMPTS[skillIdx];
  const wantHint = WANT_PROMPTS[wantIdx];

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
          {'{ your_name_card }'}
        </span>
      </header>

      <h1 className="font-display m-0 mb-1 text-[46px] leading-[0.95]">
        <Letterpress>Your Card</Letterpress>
      </h1>
      <p className="font-mono mb-7 mt-1.5 text-xs text-cream-dim">
        ◆ Your digital name card. Show it. Get matched.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Name *"
          hint="how others should call you"
          value={name}
          onChange={onNameChange}
          maxLength={MAX_NAME}
          required
          autoFocus
        />

        {prefilled && (
          <div className="font-mono -mt-2 border border-pink-dim bg-pink/5 px-3 py-1.5 text-[11px] text-pink-soft">
            ◆ Prefilled from your event registration — edit anything below.
          </div>
        )}

        <TextArea
          label="What you bring *"
          hint="your skills + background — the more specific, the better the match"
          value={vibe}
          onChange={setVibe}
          maxLength={MAX_VIBE}
          required
          placeholder={`e.g. "${skillHint}"`}
          counter
          onRotate={() => setSkillIdx((i) => (i + 1) % SKILL_PROMPTS.length)}
        />

        <TextArea
          label="Teammate you want"
          hint="the skills you're looking for — powers complementary matching (optional)"
          value={want}
          onChange={setWant}
          maxLength={MAX_WANT}
          placeholder={`e.g. "${wantHint}"`}
          counter
          onRotate={() => setWantIdx((i) => (i + 1) % WANT_PROMPTS.length)}
        />

        <Field
          label="Social handle"
          hint="how matches reach you — @ig / @x / linkedin / whatever"
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
          {submitting ? '...minting' : 'Make my card →'}
        </button>

        <p className="font-mono mt-1 text-center text-[10px] tracking-[0.1em] text-cream-dim">
          ◆ No login. Your card shows instantly + joins the room.
        </p>
      </form>
    </main>
  );
}

function TextArea({
  label,
  hint,
  value,
  onChange,
  maxLength,
  required,
  placeholder,
  counter,
  onRotate,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
  counter?: boolean;
  onRotate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-pink">
          {label}
        </label>
        {counter && (
          <span className="font-mono text-[10px] text-cream-dim">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <p className="font-mono text-[11px] text-cream-dim">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        required={required}
        rows={3}
        placeholder={placeholder}
        className="font-mono w-full resize-none border border-border-faint bg-ink-soft px-3 py-2.5 text-[15px] leading-snug text-cream outline-none placeholder:text-grey focus:border-pink focus:bg-[#1a1418]"
      />
      {onRotate && (
        <button
          type="button"
          onClick={onRotate}
          className="font-mono self-end text-[10px] tracking-[0.1em] text-pink-soft hover:text-pink"
        >
          ↻ different example
        </button>
      )}
    </div>
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
