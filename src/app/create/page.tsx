'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eyebrow, Letterpress } from '@/components/ornaments';
import attendees from '@/data/attendees.json';

const MAX_NAME = 60;
const MAX_SOCIAL = 80;
const MAX_OTHER = 120;
const MY_CARD_ID_KEY = 'ac:my-card-id';

// Skill chips, ordered by how common the role is among AI MEETS HER attendees
// (derived from the Luma registration occupations). Shared vocabulary for both
// "what you bring" and "teammate you want" so complementary matching lines up.
const SKILLS = [
  'Design (UI/UX)',
  'Research',
  'Business / Strategy',
  'Software Eng',
  'Product / PM',
  'AI / ML',
  'Data',
  'Frontend',
  'Backend',
  'Mobile',
  'Marketing / Growth',
  'Content / Writing',
  'Sales / BD',
  'Finance',
  'Community',
  'Game / Web3',
  'Founder',
];

type Attendee = { name: string; social: string; background: string };

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Join selected chips + free text into one sentence for display + embedding. */
function compose(selected: string[], other: string): string {
  const parts = [...selected];
  const o = other.trim();
  if (o) parts.push(o);
  return parts.join(', ');
}

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [bring, setBring] = useState<string[]>([]);
  const [bringOther, setBringOther] = useState('');
  const [want, setWant] = useState<string[]>([]);
  const [wantOther, setWantOther] = useState('');
  const [social, setSocial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      let filled = false;
      if (hit.social && !social) {
        setSocial(hit.social);
        filled = true;
      }
      // Drop their registered occupation into the "what you bring" free text so
      // they can keep, tweak, or replace it with chips.
      if (hit.background && !bringOther && bring.length === 0) {
        setBringOther(hit.background);
        filled = true;
      }
      if (filled) setPrefilled(true);
    }
  }

  const bringValue = compose(bring, bringOther);
  const wantValue = compose(want, wantOther);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!bringValue.trim()) {
      setError('Pick at least one skill you bring (or add your own)');
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
          vibe: bringValue.slice(0, 280),
          lookingFor: wantValue.slice(0, 280),
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
          <div className="font-mono -mt-3 border border-pink-dim bg-pink/5 px-3 py-1.5 text-[11px] text-pink-soft">
            ◆ Prefilled from your event registration — edit anything below.
          </div>
        )}

        <SkillDropdown
          label="What you bring *"
          hint="your skills + background — pick as many as fit"
          placeholder="Select skills…"
          selected={bring}
          onToggle={(s) =>
            setBring((cur) =>
              cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
            )
          }
          other={bringOther}
          onOther={setBringOther}
          otherPlaceholder="anything else you bring…"
        />

        <SkillDropdown
          label="Teammate you want"
          hint="the skills you're looking for — powers complementary matching (optional)"
          placeholder="Select skills…"
          selected={want}
          onToggle={(s) =>
            setWant((cur) =>
              cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
            )
          }
          other={wantOther}
          onOther={setWantOther}
          otherPlaceholder="anything else you want…"
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
          disabled={submitting || !name.trim() || !bringValue.trim()}
          className="font-display mt-1 w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright active:bg-pink-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '...minting' : 'Make my card →'}
        </button>

        <p className="font-mono -mt-2 text-center text-[10px] tracking-[0.1em] text-cream-dim">
          ◆ No login. Your card shows instantly + joins the room.
        </p>
      </form>
    </main>
  );
}

function SkillDropdown({
  label,
  hint,
  placeholder,
  selected,
  onToggle,
  other,
  onOther,
  otherPlaceholder,
}: {
  label: string;
  hint: string;
  placeholder: string;
  selected: string[];
  onToggle: (skill: string) => void;
  other: string;
  onOther: (v: string) => void;
  otherPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [otherOn, setOtherOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const otherActive = otherOn || other.trim().length > 0;
  const count = selected.length + (other.trim() ? 1 : 0);

  // Close the menu when tapping outside it.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-pink">
          {label}
        </label>
        {count > 0 && (
          <span className="font-mono text-[10px] text-cream-dim">
            {count} selected
          </span>
        )}
      </div>
      <p className="font-mono text-[11px] text-cream-dim">{hint}</p>

      <div ref={ref} className="relative">
        {/* Collapsed trigger */}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`font-mono flex w-full items-center justify-between gap-2 border bg-ink-soft px-3 py-2.5 text-left transition-colors ${
            open ? 'border-pink bg-[#1a1418]' : 'border-border-faint hover:border-pink'
          }`}
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {count === 0 ? (
              <span className="text-[14px] text-grey">{placeholder}</span>
            ) : (
              <>
                {selected.map((s) => (
                  <span
                    key={s}
                    className="border border-pink bg-pink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-ink"
                  >
                    {s}
                  </span>
                ))}
                {other.trim() && (
                  <span className="border border-pink px-1.5 py-0.5 text-[10px] uppercase tracking-[0.04em] text-pink">
                    {other.trim()}
                  </span>
                )}
              </>
            )}
          </span>
          <span
            className={`font-mono shrink-0 text-[11px] text-pink-soft transition-transform ${open ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 flex max-h-[280px] flex-col overflow-y-auto border border-pink bg-ink-card shadow-[6px_6px_0_0_var(--color-pink-deep)]">
            {SKILLS.map((s) => {
              const on = selected.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => onToggle(s)}
                  className={`font-mono flex items-center gap-2.5 border-b border-border-faint px-3 py-2.5 text-left text-[13px] transition-colors last:border-b-0 ${
                    on ? 'bg-pink/10 text-pink' : 'text-cream hover:bg-ink-soft'
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border text-[9px] ${
                      on ? 'border-pink bg-pink text-ink' : 'border-grey'
                    }`}
                  >
                    {on ? '✓' : ''}
                  </span>
                  {s}
                </button>
              );
            })}
            {/* Other row */}
            <button
              type="button"
              onClick={() => setOtherOn((v) => !v)}
              className={`font-mono flex items-center gap-2.5 border-b border-border-faint px-3 py-2.5 text-left text-[13px] transition-colors last:border-b-0 ${
                otherActive ? 'bg-pink/10 text-pink' : 'text-cream-dim hover:bg-ink-soft'
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border text-[9px] ${
                  otherActive ? 'border-pink bg-pink text-ink' : 'border-grey'
                }`}
              >
                {otherActive ? '✓' : ''}
              </span>
              + Other
            </button>

            {otherActive && (
              <div className="flex flex-col gap-1 border-t border-pink-dim bg-ink-soft px-3 py-2.5">
                <input
                  value={other}
                  onChange={(e) => onOther(e.target.value)}
                  maxLength={MAX_OTHER}
                  autoFocus={otherOn}
                  placeholder={otherPlaceholder}
                  className="font-mono w-full border border-border-faint bg-ink px-3 py-2 text-[14px] text-cream outline-none placeholder:text-grey focus:border-pink"
                />
                <span className="font-mono self-end text-[10px] text-cream-dim">
                  {other.length}/{MAX_OTHER}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
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
