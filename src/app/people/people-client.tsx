'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eyebrow, SeedAvatar } from '@/components/ornaments';
import type { Person } from '@/lib/github-store';

const MY_CARD_ID_KEY = 'ac:my-card-id';

export function PeopleClient({ people }: { people: Person[] }) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [focused, setFocused] = useState<Person | null>(null);
  const [myCardId, setMyCardId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMyCardId(localStorage.getItem(MY_CARD_ID_KEY));
    } catch {
      /* localStorage may be blocked */
    }
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    people.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [people]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.vibe ?? '').toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.lookingFor.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [people, query, activeTag]);

  if (people.length === 0) {
    return (
      <>
        <div className="pink-frame px-5 py-10 text-center">
          <p className="font-display m-0 text-[26px] text-pink">no one yet</p>
          <p className="font-mono mt-2 text-xs text-cream-dim">
            be the first to drop your card
          </p>
        </div>
        <div className="mt-7">
          <Link
            href="/create"
            className="font-display block w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright active:bg-pink-soft"
          >
            + Drop your card
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-2 border border-border-faint bg-ink-soft px-3 py-2 focus-within:border-pink">
        <span className="font-mono font-bold text-pink-soft">/</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search name / skills / wants"
          className="font-mono w-full bg-transparent text-[13px] text-cream placeholder:text-grey focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="font-mono text-[11px] text-cream-dim hover:text-pink"
            aria-label="clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="-mx-0.5 flex flex-wrap gap-1.5 px-0.5">
          <Chip
            active={activeTag === null}
            onClick={() => setActiveTag(null)}
          >
            all
          </Chip>
          {allTags.map((t) => (
            <Chip
              key={t}
              active={activeTag === t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
            >
              {t}
            </Chip>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="font-mono text-[11px] text-cream-dim">
        {filtered.length} match{filtered.length === 1 ? '' : 'es'}
        {activeTag && (
          <>
            {' '}· filtering <span className="text-pink">#{activeTag}</span>
          </>
        )}
      </p>

      {/* Wall */}
      {filtered.length === 0 ? (
        <div className="pink-frame px-5 py-10 text-center">
          <p className="font-display m-0 text-[26px] text-pink">no match</p>
          <p className="font-mono mt-2 text-xs text-cream-dim">
            try a different tag — or drop your card
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {filtered.map((p, i) => (
            <PersonCard
              key={p.id}
              person={p}
              index={i}
              isYou={p.id === myCardId}
              onTagClick={setActiveTag}
              onOpen={() => setFocused(p)}
            />
          ))}
        </ul>
      )}

      {/* CTA strip */}
      <div className="mt-3">
        <Link
          href="/create"
          className="font-display block w-full border-2 border-pink bg-pink py-[14px] text-center text-2xl uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright active:bg-pink-soft"
        >
          + Drop your card
        </Link>
      </div>

      {focused && (
        <FocusModal
          person={focused}
          isYou={focused.id === myCardId}
          onClose={() => setFocused(null)}
          onTagClick={(t) => {
            setActiveTag(t);
            setFocused(null);
          }}
        />
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
        active
          ? 'border-pink bg-pink font-bold text-ink'
          : 'border-border-faint text-cream-dim hover:border-pink hover:text-pink'
      }`}
    >
      {children}
    </button>
  );
}

function PersonCard({
  person,
  index,
  isYou,
  onTagClick,
  onOpen,
}: {
  person: Person;
  index: number;
  isYou: boolean;
  onTagClick: (t: string) => void;
  onOpen: () => void;
}) {
  return (
    <li
      className="pink-frame fade-up flex cursor-pointer flex-col gap-2.5 bg-ink-card px-3.5 py-3.5"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
      onClick={onOpen}
    >
      {/* Header: avatar + name + index */}
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <SeedAvatar seed={person.name} size={52} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-1.5">
            <h2 className="text-pink-grain font-display m-0 break-words text-2xl leading-none">
              {person.name || '—'}
            </h2>
            <span className="font-mono shrink-0 text-[10px] text-cream-dim">
              #{String(index + 1).padStart(2, '0')}
            </span>
          </div>
          {person.social && (
            <p className="font-mono mt-1 text-[11px] font-medium text-pink-soft">
              {person.social}
            </p>
          )}
        </div>
      </div>

      {isYou && (
        <div className="font-mono self-start border border-pink bg-pink px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] text-ink">
          ◆ YOU
        </div>
      )}

      {/* What they bring (vibe), falling back to legacy bio */}
      {(person.vibe || person.bio) && (
        <p className="font-mono m-0 text-[13px] leading-snug text-cream">
          {person.vibe || person.bio}
        </p>
      )}

      {/* Teammate they want — shown for v5 cards regardless of vibe */}
      {person.lookingFor && (
        <div className="mt-0.5 border-l-2 border-pink-dim pl-3">
          <Eyebrow>WANTS</Eyebrow>
          <p className="font-mono mt-1 text-[13px] leading-snug text-cream">
            {person.lookingFor}
          </p>
        </div>
      )}

      {person.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {person.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(t);
              }}
              className="font-mono border border-border-faint px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] text-cream-dim hover:border-pink hover:text-pink"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

function FocusModal({
  person,
  isYou,
  onClose,
  onTagClick,
}: {
  person: Person;
  isYou: boolean;
  onClose: () => void;
  onTagClick: (t: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fade-up fixed inset-0 z-[200] flex items-center justify-center p-5"
      style={{
        background: 'rgba(10, 6, 8, 0.85)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pink-frame w-full max-w-[440px] bg-ink-card px-[22px] py-6"
        style={{ boxShadow: '8px 8px 0 0 var(--color-pink-deep)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <Eyebrow>A CARD FROM</Eyebrow>
          <button
            onClick={onClose}
            className="font-mono cursor-pointer border-none bg-transparent text-base text-cream-dim hover:text-pink"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <SeedAvatar seed={person.name} size={72} />
          <div className="min-w-0 flex-1">
            <h2 className="text-pink-grain font-display m-0 text-[32px] leading-none break-words">
              {person.name}
            </h2>
            {person.social && (
              <p className="font-mono mt-1.5 text-[13px] font-medium text-pink-soft">
                {person.social}
              </p>
            )}
            {isYou && (
              <div className="font-mono mt-2 inline-block border border-pink bg-pink px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] text-ink">
                ◆ YOU
              </div>
            )}
          </div>
        </div>

        <div className="hairline my-4" />

        {(person.vibe || person.bio) && (
          <div className="mb-4">
            <Eyebrow>WHAT THEY BRING</Eyebrow>
            <p className="font-mono mt-1.5 text-sm leading-[1.5] text-cream">
              {person.vibe || person.bio}
            </p>
          </div>
        )}
        {person.lookingFor && (
          <div className="mb-4 border-l-2 border-pink pl-3">
            <Eyebrow color="var(--color-pink)">TEAMMATE THEY WANT</Eyebrow>
            <p className="font-mono mt-1.5 text-sm leading-[1.5] text-cream">
              {person.lookingFor}
            </p>
          </div>
        )}

        {person.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {person.tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTagClick(t)}
                className="font-mono border border-border-faint px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-cream-dim hover:border-pink hover:text-pink"
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <div className="hairline my-3.5" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="font-display flex-1 border-2 border-pink bg-pink px-4 py-2.5 text-base uppercase tracking-[0.04em] text-ink transition-colors hover:bg-pink-bright"
          >
            Say hi →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-display flex-1 border-2 border-pink bg-transparent px-4 py-2.5 text-base uppercase tracking-[0.04em] text-pink transition-colors hover:bg-pink hover:text-ink"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
