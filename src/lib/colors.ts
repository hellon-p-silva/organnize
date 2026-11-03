export const COLOR_KEYS = ['ember', 'sun', 'mint', 'sky', 'violet', 'rose'] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export const COLOR_LABEL: Record<ColorKey, string> = {
  ember: 'Brasa',
  sun: 'Sol',
  mint: 'Menta',
  sky: 'Céu',
  violet: 'Violeta',
  rose: 'Rosa',
};

/** Sempre via variáveis CSS (tokens) — nenhuma cor fixa nos componentes. */
export const colorVar = (c: ColorKey) => `var(--color-${c})`;

export const tint = (c: ColorKey, pct = 16) =>
  `color-mix(in oklab, var(--color-${c}) ${pct}%, var(--color-surface))`;

export const nextColor = (c: ColorKey): ColorKey =>
  COLOR_KEYS[(COLOR_KEYS.indexOf(c) + 1) % COLOR_KEYS.length];

export const isColorKey = (v: unknown): v is ColorKey =>
  typeof v === 'string' && (COLOR_KEYS as readonly string[]).includes(v);
