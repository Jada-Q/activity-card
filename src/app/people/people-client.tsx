'use client';

import { useMemo, useState } from 'react';
import type { Person } from '@/lib/github-store';

export function PeopleClient({ people }: { people: Person[] }) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

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
        p.bio.toLowerCase().includes(q) ||
        p.lookingFor.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [people, query, activeTag]);

  if (people.length === 0) {
    return (
      <div className="pink-frame px-5 py-10 text-center">
        <p className="font-display text-2xl text-pink">empty room</p>
        <p className="font-mono mt-2 text-xs text-cream-dim">
          be the first to drop your card
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex items-center gap-2 border border-border-faint bg-ink-soft px-3 py-2 focus-within:border-pink">
        <span className="font-mono text-pink-soft">/</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search name / vibe / tag"
          className="font-mono w-full bg-transparent text-sm text-cream placeholder:text-grey focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="font-mono text-xs text-cream-dim hover:text-pink"
            aria-label="clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="-mx-1 flex flex-wrap gap-2 px-1">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`font-mono border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
              activeTag === null
                ? 'border-pink bg-pink text-ink'
                : 'border-border-faint text-cream-dim hover:border-pink hover:text-pink'
            }`}
          >
            all
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`font-mono border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                activeTag === t
                  ? 'border-pink bg-pink text-ink'
                  : 'border-border-faint text-cream-dim hover:border-pink hover:text-pink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="font-mono text-[11px] text-cream-dim">
        {filtered.length} match{filtered.length === 1 ? '' : 'es'}
        {activeTag && (
          <>
            {' '}
            · filtering <span className="text-pink">#{activeTag}</span>
          </>
        )}
      </p>

      {/* Card grid */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((p) => (
          <PersonCard key={p.id} person={p} onTagClick={setActiveTag} />
        ))}
      </ul>
    </div>
  );
}

function PersonCard({
  person,
  onTagClick,
}: {
  person: Person;
  onTagClick: (t: string) => void;
}) {
  return (
    <li className="pink-frame relative flex flex-col gap-3 bg-ink-card px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-pink-grain text-2xl leading-none break-words">
          {person.name || '—'}
        </h2>
        {person.social && (
          <span className="font-mono shrink-0 text-[11px] text-pink-soft">
            {person.social}
          </span>
        )}
      </div>

      {person.bio && (
        <p className="font-mono text-sm leading-snug text-cream">
          {person.bio}
        </p>
      )}

      {person.lookingFor && (
        <div className="border-l-2 border-pink-dim pl-3">
          <span className="font-mono mb-1 block text-[10px] uppercase tracking-wider text-pink-soft">
            looking for
          </span>
          <p className="font-mono text-sm leading-snug text-cream">
            {person.lookingFor}
          </p>
        </div>
      )}

      {person.tags.length > 0 && (
        <div className="-mx-0.5 flex flex-wrap gap-1.5">
          {person.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTagClick(t)}
              className="font-mono border border-border-faint px-2 py-0.5 text-[10px] uppercase tracking-wide text-cream-dim hover:border-pink hover:text-pink"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
