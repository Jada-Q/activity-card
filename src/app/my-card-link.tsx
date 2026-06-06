'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const MY_CARD_ID_KEY = 'ac:my-card-id';

/**
 * Client-only secondary CTA. Renders nothing until mounted (avoids hydration
 * mismatch), then shows a "show my card" shortcut if this device already made
 * one. Lets a returning attendee jump straight to their name card to show it.
 */
export function MyCardLink() {
  const [hasCard, setHasCard] = useState(false);

  useEffect(() => {
    try {
      setHasCard(Boolean(localStorage.getItem(MY_CARD_ID_KEY)));
    } catch {
      /* localStorage blocked */
    }
  }, []);

  if (!hasCard) return null;

  return (
    <Link
      href="/me"
      className="font-mono mb-3 -mt-1 block w-full border border-pink-dim py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-pink-soft transition-colors hover:border-pink hover:text-pink"
    >
      ◆ Show my card →
    </Link>
  );
}
