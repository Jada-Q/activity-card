// Shared card-style data + resolver. Imported by /me (the picker) and by
// ThemeScope (which tints the whole app to the visitor's chosen color).

export const STYLE_KEY = 'ac:card-style';

export type ThemeVars = Record<string, string>;

export const THEME_VAR_KEYS = [
  '--color-pink',
  '--color-pink-bright',
  '--color-pink-soft',
  '--color-pink-dim',
  '--color-pink-deep',
] as const;

function t(pink: string, bright: string, soft: string, dim: string, deep: string): ThemeVars {
  return {
    '--color-pink': pink,
    '--color-pink-bright': bright,
    '--color-pink-soft': soft,
    '--color-pink-dim': dim,
    '--color-pink-deep': deep,
  };
}

// Setting these on an element cascades to everything resolving var(--color-pink*)
// — the grain name, frame border, divider, shadow, wall cards — so it re-themes.
export const THEMES: { key: string; label: string; vars: ThemeVars }[] = [
  { key: 'blush', label: 'Blush', vars: t('#e47ba8', '#ee8ab4', '#c46d8e', '#7a4258', '#4a2734') },
  { key: 'cyan', label: 'Cyan', vars: t('#5ec8c8', '#74d6d6', '#4ea3a3', '#2f5e5e', '#1c3838') },
  { key: 'amber', label: 'Amber', vars: t('#e0a44e', '#eeb968', '#c4894a', '#7a5a28', '#4a3618') },
  { key: 'violet', label: 'Violet', vars: t('#a98be4', '#b79cee', '#8e6dc4', '#523f7a', '#2f2447') },
  { key: 'lime', label: 'Lime', vars: t('#a8d65e', '#b9e074', '#8eba4e', '#5a7a2f', '#36481c') },
  { key: 'silver', label: 'Silver', vars: t('#c9c4cf', '#ddd9e1', '#9b96a3', '#5a5560', '#36333b') },
  // Vibrant set — high-saturation pops that read bright on the dark card.
  { key: 'coral', label: 'Coral', vars: t('#ff6b6b', '#ff8585', '#d65a5a', '#8a3a3a', '#4a1f1f') },
  { key: 'azure', label: 'Azure', vars: t('#4d8dff', '#6ba0ff', '#4674cc', '#2a4a85', '#172a4d') },
  { key: 'tangerine', label: 'Tangerine', vars: t('#ff9f43', '#ffb15f', '#d6853a', '#8a5526', '#4a2d14') },
  { key: 'fuchsia', label: 'Fuchsia', vars: t('#e85ad6', '#f070e0', '#c24bb0', '#7a3070', '#42193c') },
  { key: 'sunshine', label: 'Sunshine', vars: t('#ffd43b', '#ffe066', '#d6b234', '#8a721f', '#4a3d10') },
  { key: 'spring', label: 'Spring', vars: t('#4ade80', '#6ee79b', '#3eb869', '#277a45', '#144a28') },
];

// Each zodiac sign maps to one color theme, element-flavored (fire→warm,
// earth→green/silver, air→bright, water→cool). Dates = standard tropical
// Sun-sign ranges (Almanac/Britannica); cusps vary ±1 day by year.
export const ZODIAC: {
  key: string;
  label: string;
  glyph: string;
  dates: string;
  theme: string;
}[] = [
  { key: 'aries', label: 'Aries', glyph: '♈', dates: 'Mar 21 – Apr 19', theme: 'coral' },
  { key: 'taurus', label: 'Taurus', glyph: '♉', dates: 'Apr 20 – May 20', theme: 'spring' },
  { key: 'gemini', label: 'Gemini', glyph: '♊', dates: 'May 21 – Jun 20', theme: 'sunshine' },
  { key: 'cancer', label: 'Cancer', glyph: '♋', dates: 'Jun 21 – Jul 22', theme: 'cyan' },
  { key: 'leo', label: 'Leo', glyph: '♌', dates: 'Jul 23 – Aug 22', theme: 'tangerine' },
  { key: 'virgo', label: 'Virgo', glyph: '♍', dates: 'Aug 23 – Sep 22', theme: 'lime' },
  { key: 'libra', label: 'Libra', glyph: '♎', dates: 'Sep 23 – Oct 22', theme: 'blush' },
  { key: 'scorpio', label: 'Scorpio', glyph: '♏', dates: 'Oct 23 – Nov 21', theme: 'fuchsia' },
  { key: 'sagittarius', label: 'Sagittarius', glyph: '♐', dates: 'Nov 22 – Dec 21', theme: 'amber' },
  { key: 'capricorn', label: 'Capricorn', glyph: '♑', dates: 'Dec 22 – Jan 19', theme: 'silver' },
  { key: 'aquarius', label: 'Aquarius', glyph: '♒', dates: 'Jan 20 – Feb 18', theme: 'azure' },
  { key: 'pisces', label: 'Pisces', glyph: '♓', dates: 'Feb 19 – Mar 20', theme: 'violet' },
];

// MBTI is a text badge (not a color) so it stacks with the zodiac color/glyph.
// Pop-culture personality framework — fun, not science; we never assert traits.
export const MBTI = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];
export const MBTI_TEST_URL = 'https://www.16personalities.com/free-personality-test';

/** Parse the stored style and return the CSS var overrides, or null for default. */
export function resolveThemeVars(raw: string | null): ThemeVars | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as { sign?: string; theme?: string };
    let themeKey: string | undefined;
    if (s.sign) themeKey = ZODIAC.find((z) => z.key === s.sign)?.theme;
    if (!themeKey && s.theme) themeKey = s.theme;
    return THEMES.find((x) => x.key === themeKey)?.vars ?? null;
  } catch {
    return null;
  }
}
