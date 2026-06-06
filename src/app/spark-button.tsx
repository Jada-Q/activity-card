'use client';

import { useEffect, useState } from 'react';

const MY_CARD_ID_KEY = 'ac:my-card-id';
const SPARKED_KEY = 'ac:sparked';

function readSparked(): Set<string> {
  try {
    const raw = localStorage.getItem(SPARKED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function writeSparked(set: Set<string>) {
  try {
    localStorage.setItem(SPARKED_KEY, JSON.stringify([...set]));
  } catch {
    /* non-blocking */
  }
}

type Status = 'idle' | 'loading' | 'sparked' | 'team' | 'nocard';

/**
 * "Spark" = a private, one-directional like. Nothing is revealed until the
 * other person sparks back (mutual → "It's a team!"). Identity is the device's
 * card id; you can't spark from a card you haven't made.
 */
export function SparkButton({
  targetId,
  large = false,
}: {
  targetId: string;
  large?: boolean;
}) {
  const [myId, setMyId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(MY_CARD_ID_KEY);
    } catch {
      /* blocked */
    }
    setMyId(id);
    if (readSparked().has(targetId)) setStatus('sparked');
    setHydrated(true);
  }, [targetId]);

  // Don't show on your own card, and avoid hydration mismatch.
  if (!hydrated || (myId && myId === targetId)) return null;

  async function spark() {
    if (!myId) {
      setStatus('nocard');
      return;
    }
    if (status === 'loading' || status === 'sparked' || status === 'team') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/spark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: myId, to: targetId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setStatus('idle');
        return;
      }
      const next = readSparked();
      next.add(targetId);
      writeSparked(next);
      setStatus(json.data?.mutual ? 'team' : 'sparked');
    } catch {
      setStatus('idle');
    }
  }

  if (status === 'nocard') {
    return (
      <a
        href="/create"
        className={`font-mono border border-pink font-bold uppercase tracking-[0.12em] text-pink ${large ? 'flex-1 px-4 py-2.5 text-center text-sm' : 'px-2.5 py-1 text-[10px]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        make your card first →
      </a>
    );
  }

  const label =
    status === 'team'
      ? "✦ It's a team!"
      : status === 'sparked'
        ? '✦ Sparked'
        : status === 'loading'
          ? '✦ …'
          : '✦ Spark';

  const active = status === 'team' || status === 'sparked';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        spark();
      }}
      disabled={status === 'loading'}
      className={`font-mono border font-bold uppercase tracking-[0.12em] transition-colors ${
        large ? 'flex-1 px-4 py-2.5 text-sm' : 'px-2.5 py-1 text-[10px]'
      } ${
        active
          ? 'border-pink bg-pink text-ink'
          : 'border-pink text-pink hover:bg-pink hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}
