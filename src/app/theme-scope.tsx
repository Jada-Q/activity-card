'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  resolveThemeVars,
  STYLE_KEY,
  THEME_VAR_KEYS,
} from '@/lib/card-style';

/**
 * Tints the whole app to the visitor's chosen card color. Reads the card style
 * from localStorage and writes the accent CSS vars onto :root, so /people,
 * /match, etc. all pick up "your color". Re-applies on every route change (so
 * the new color shows after you pick it on /me and navigate away) and on
 * focus/storage (cross-tab). Renders nothing.
 */
export function ThemeScope() {
  const pathname = usePathname();

  useEffect(() => {
    function apply() {
      let vars = null;
      try {
        vars = resolveThemeVars(localStorage.getItem(STYLE_KEY));
      } catch {
        /* storage blocked */
      }
      const root = document.documentElement;
      for (const k of THEME_VAR_KEYS) {
        if (vars) root.style.setProperty(k, vars[k]);
        else root.style.removeProperty(k);
      }
    }
    apply();
    window.addEventListener('focus', apply);
    window.addEventListener('storage', apply);
    return () => {
      window.removeEventListener('focus', apply);
      window.removeEventListener('storage', apply);
    };
  }, [pathname]);

  return null;
}
