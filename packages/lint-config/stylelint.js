// @mednet/lint-config/stylelint — только встроенные правила stylelint.
// Не подключайте вместе с ним stylelint-config-standard: на Tailwind v4 он даёт ложные ошибки
// (@apply, --spacing(), блочный @custom-variant) и отвергает currentColor.

/** Литеральные цветовые функции. color-mix() не входит: color-mix(in oklab, var(--a) 30%, transparent) разрешён. */
export const colorFunctions = [
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
];

const HINT =
  'берите токен — var(--primary), var(--muted-foreground), var(--border) — или @apply с семантическим классом (bg-primary, text-muted-foreground, border-border); полупрозрачность — color-mix(in oklab, var(--primary) 30%, transparent)';

/** @type {import('stylelint').Config} */
const config = {
  rules: {
    'color-no-hex': [
      true,
      { message: (/** @type {string} */ hex) => `Цвет литералом (${hex}) запрещён: ${HINT}.` },
    ],
    'color-named': [
      'never',
      { message: (/** @type {string} */ name) => `Именованный цвет (${name}) запрещён: ${HINT}.` },
    ],
    'function-disallowed-list': [
      colorFunctions,
      {
        message: (/** @type {string} */ fn) =>
          `Цветовая функция ${fn}() с литералом запрещена: ${HINT}.`,
      },
    ],
  },
};

export default config;
