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

/**
 * Веб-шкала шрифтов: [размер, межстрочный]. Заголовки и lead — резиновые (телефон → 1440 px).
 * Ступени не повторяются: вверху ×1,33, внизу ×1,08. Брендбук размеров для экрана не задаёт —
 * шкала утверждается отдельно (записка «Шкала шрифтов для сайтов»).
 *
 * | токен | телефон 390 | экран 1440 |
 * | h1    | 32          | 48         |
 * | h2    | 28          | 36         |
 * | h3    | 24          | 28         |
 * | h4    | 20          | 22         |
 * | lead  | 17          | 18         |
 */
export const TEXT = {
  xs: ['0.8125rem', '1.4'],
  sm: ['0.875rem', '1.5'],
  base: ['1rem', '1.5'],
  lead: ['clamp(1.0625rem, 1rem + 0.2vw, 1.125rem)', '1.5'],
  h4: ['clamp(1.25rem, 1.125rem + 0.3vw, 1.375rem)', '1.3'],
  h3: ['clamp(1.5rem, 1rem + 0.8vw, 1.75rem)', '1.25'],
  h2: ['clamp(1.75rem, 1rem + 1.4vw, 2.25rem)', '1.2'],
  h1: ['clamp(2rem, 1rem + 2.2vw, 3rem)', '1.15'],
} as const;

/** Вес заголовков (брендбук, стр. 14: SemiBold или Bold). Ключи — из FONT_WEIGHT. */
export const TEXT_WEIGHT = {
  h1: 'bold',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
} as const satisfies Partial<Record<keyof typeof TEXT, keyof typeof FONT_WEIGHT>>;

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
