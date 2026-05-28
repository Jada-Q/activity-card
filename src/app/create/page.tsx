'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SUGGESTED_TAGS = [
  'AI',
  'design',
  'frontend',
  'backend',
  'product',
  'no-code',
  'data',
  'art',
  'writing',
  'community',
  'business',
  'research',
];

const MAX_TAGS = 3;

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [social, setSocial] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(t: string) {
    setTags((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, t];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
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
          bio: bio.trim(),
          lookingFor: lookingFor.trim(),
          social: social.trim(),
          tags,
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
      // GitHub Issues has ~3-5s eventual consistency on labels filter;
      // hold success state then redirect so user lands on a populated /people.
      setSuccess(true);
      setTimeout(() => router.push('/people'), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-6">
        <div className="pink-frame w-full px-6 py-10 text-center">
          <p className="font-display text-pink-grain text-5xl leading-none">
            ✓
          </p>
          <h2 className="font-display text-pink-grain mt-4 text-3xl leading-tight">
            Card Live
          </h2>
          <p className="font-mono mt-4 text-xs text-cream-dim">
            joining the room...
          </p>
          <div className="hairline mx-auto mt-6 w-24" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-6 sm:max-w-lg sm:px-8 sm:py-10">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs text-pink-soft hover:text-pink"
        >
          ← back
        </Link>
        <span className="font-mono text-xs text-cream-dim">
          {'{ create_card }'}
        </span>
      </header>

      <h1 className="font-display text-pink-grain mb-1 text-4xl leading-none">
        Your Card
      </h1>
      <p className="font-mono mb-7 text-xs text-cream-dim">
        Fill it once. Find your match.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Name *"
          hint="how others should call you"
          value={name}
          onChange={setName}
          maxLength={60}
          required
          autoFocus
        />
        <Field
          label="One-line bio"
          hint="who you are in 1 sentence"
          value={bio}
          onChange={setBio}
          maxLength={200}
          multiline
        />
        <Field
          label="Looking for"
          hint="what you want to build / find today"
          value={lookingFor}
          onChange={setLookingFor}
          maxLength={200}
          multiline
        />
        <Field
          label="Social handle"
          hint="@you on IG / X / wherever you wanna be found"
          value={social}
          onChange={setSocial}
          maxLength={80}
          placeholder="@yourhandle"
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label className="font-mono text-sm uppercase tracking-wide text-pink">
              Tags (max {MAX_TAGS})
            </label>
            <span className="font-mono text-xs text-cream-dim">
              {tags.length}/{MAX_TAGS}
            </span>
          </div>
          <p className="font-mono text-[11px] text-cream-dim">
            pick what describes your vibe
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((t) => {
              const active = tags.includes(t);
              const disabled = !active && tags.length >= MAX_TAGS;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  disabled={disabled}
                  className={`font-mono border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                    active
                      ? 'border-pink bg-pink text-ink'
                      : 'border-border-faint text-cream-dim hover:border-pink hover:text-pink'
                  } ${disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="font-mono border border-pink bg-pink/10 px-3 py-2 text-xs text-pink">
            ✕ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="font-display mt-3 border-2 border-pink bg-pink py-4 text-2xl tracking-wide text-ink transition-colors hover:bg-pink-soft active:bg-pink-dim disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '...sending' : 'Submit →'}
        </button>
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
  multiline,
  required,
  autoFocus,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  multiline?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const InputTag = multiline ? 'textarea' : 'input';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-sm uppercase tracking-wide text-pink">
          {label}
        </label>
        {maxLength && (
          <span className="font-mono text-[10px] text-cream-dim">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <p className="font-mono text-[11px] text-cream-dim">{hint}</p>
      <InputTag
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        maxLength={maxLength}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        className="font-mono w-full resize-none border border-border-faint bg-ink-soft px-3 py-2 text-base text-cream placeholder:text-grey focus:border-pink focus:outline-none"
      />
    </div>
  );
}
