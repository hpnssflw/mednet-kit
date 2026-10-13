/**
 * Нецветовые токены (спека §5). Хранятся в TS, а не в DTCG: clamp() и тени
 * с прозрачностью в DTCG без потерь не выражаются.
 */
export const FONT = {
  sans: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
  /** Bebas Neue без кириллицы в fontsource (спека Q6) — пока падает на Montserrat. */
  display: '"Bebas Neue", "Montserrat", ui-sans-serif, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

export const FONT_WEIGHT = {
  body: 500,
  heading: 600,
  bold: 700,
} as const;

/** [размер, межстрочный]. h1/h2 — резиновые. */
export const TEXT = {
  xs: ['0.8125rem', '1.5'],
  sm: ['0.875rem', '1.5'],
  base: ['1rem', '1.5'],
  lead: ['1.125rem', '1.5'],
  h4: ['1.125rem', '1.2'],
  h3: ['1.25rem', '1.2'],
  h2: ['clamp(1.75rem, 2.6vw, 2.375rem)', '1.2'],
  h1: ['clamp(1.75rem, 3.2vw, 2.875rem)', '1.2'],
} as const;

export const RADIUS = '1rem';

/** Тёплые мягкие тени в тоне beige-700 (#a6998a). */
export const SHADOW = {
  sm: '0 1px 2px 0 rgb(166 153 138 / 0.16)',
  md: '0 4px 12px -2px rgb(166 153 138 / 0.22)',
  lg: '0 12px 32px -8px rgb(166 153 138 / 0.28)',
} as const;

export const MOTION = {
  ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  fast: '150ms',
  base: '250ms',
} as const;
