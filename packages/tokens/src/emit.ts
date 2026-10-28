import { FONT, FONT_WEIGHT, MOTION, RADIUS, SHADOW, TEXT, TEXT_WEIGHT } from './base.ts';
import type { Tokens } from './load.ts';

const BANNER = '/* @mednet/tokens — сгенерировано scripts/build.ts, не редактировать вручную */';

/** Имя примитива: `<оттенок>` или `<оттенок>-<шаг>`, шаг — цифры. */
const PRIMITIVE_NAME = /^([a-z]+)(?:-(\d+))?$/;

export function emitTokensCss(tokens: Tokens): string {
  const lines = [
    '  /* Примитивы бренда */',
    ...tokens.primitives.map((token) => `  --mn-${token.name}: ${token.hex};`),
    '',
    '  /* Семантика с префиксом — для существующих сайтов (спека §15) */',
    ...tokens.semantic.map((token) => `  --mn-${token.name}: var(--mn-${token.ref});`),
    '',
    '  /* Семантика в именах shadcn/ui — для shadcn и Basecoat */',
    ...tokens.semantic.map((token) => `  --${token.name}: var(--mn-${token.name});`),
    '',
    '  /* База */',
    `  --mn-radius: ${RADIUS};`,
    '  --radius: var(--mn-radius);',
    `  --mn-font-sans: ${FONT.sans};`,
    `  --mn-font-display: ${FONT.display};`,
    `  --mn-font-mono: ${FONT.mono};`,
    ...Object.entries(FONT_WEIGHT).map(([key, value]) => `  --mn-font-weight-${key}: ${value};`),
    ...Object.entries(TEXT).flatMap(([key, [size, lineHeight]]) => [
      `  --mn-text-${key}: ${size};`,
      `  --mn-text-${key}-line-height: ${lineHeight};`,
      ...(key in TEXT_WEIGHT
        ? [
            `  --mn-text-${key}-font-weight: var(--mn-font-weight-${TEXT_WEIGHT[key as keyof typeof TEXT_WEIGHT]});`,
          ]
        : []),
    ]),
    ...Object.entries(SHADOW).map(([key, value]) => `  --mn-shadow-${key}: ${value};`),
    `  --mn-ease: ${MOTION.ease};`,
    `  --mn-duration-fast: ${MOTION.fast};`,
    `  --mn-duration-base: ${MOTION.base};`,
  ];

  // В .dark оба слоя имён: `--x: var(--mn-x)` в :root уже вычислен на корне и наследуется готовым,
  // так что .dark на вложенном контейнере без переобъявления `--x` осталась бы светлой.
  const lightRef = new Map(tokens.semantic.map((token) => [token.name, token.ref]));
  const darkLines = [
    '  color-scheme: dark;',
    ...tokens.dark
      .filter((token) => token.ref !== lightRef.get(token.name))
      .flatMap((token) => [
        `  --mn-${token.name}: var(--mn-${token.ref});`,
        `  --${token.name}: var(--mn-${token.name});`,
      ]),
  ];

  return [
    BANNER,
    ':root {',
    ...lines,
    '}',
    '',
    '/* Тёмная тема: класс .dark на <html> или контейнере */',
    '.dark {',
    ...darkLines,
    '}',
    '',
    '@media (prefers-reduced-motion: reduce) {',
    '  :root {',
    '    --mn-duration-fast: 0ms;',
    '    --mn-duration-base: 0ms;',
    '  }',
    '}',
    '',
  ].join('\n');
}

export function emitThemeCss(tokens: Tokens): string {
  return [
    BANNER,
    '@import "./tokens.css";',
    '',
    '/* Стандартная палитра Tailwind удалена: доступны только бренд и семантика (спека §5). */',
    '/* Шрифты — литералом в обычном @theme: так они перекрывают шрифты Basecoat. */',
    '@theme {',
    '  --color-*: initial;',
    `  --font-sans: ${FONT.sans};`,
    `  --font-display: ${FONT.display};`,
    `  --font-mono: ${FONT.mono};`,
    '  /* Переходы Tailwind идут через токены движения: prefers-reduced-motion обнуляет их в tokens.css */',
    '  --default-transition-duration: var(--mn-duration-fast);',
    '  --default-transition-timing-function: var(--mn-ease);',
    '}',
    '',
    '@theme inline {',
    ...tokens.primitives.map((token) => `  --color-${token.name}: var(--mn-${token.name});`),
    ...tokens.semantic.map((token) => `  --color-${token.name}: var(--${token.name});`),
    '  --radius-sm: calc(var(--radius) - 4px);',
    '  --radius-md: calc(var(--radius) - 2px);',
    '  --radius-lg: var(--radius);',
    '  --radius-xl: calc(var(--radius) + 4px);',
    ...Object.keys(TEXT).flatMap((key) => [
      `  --text-${key}: var(--mn-text-${key});`,
      `  --text-${key}--line-height: var(--mn-text-${key}-line-height);`,
      ...(key in TEXT_WEIGHT
        ? [`  --text-${key}--font-weight: var(--mn-text-${key}-font-weight);`]
        : []),
    ]),
    ...Object.keys(SHADOW).map((key) => `  --shadow-${key}: var(--mn-shadow-${key});`),
    '  --ease-brand: var(--mn-ease);',
    '}',
    '',
  ].join('\n');
}

/** Итоговые значения без алиасов: для tokens.json и JS-экспорта. */
export function tokensObject(tokens: Tokens) {
  const color: Record<string, string | Record<string, string>> = {};
  for (const token of tokens.primitives) {
    const match = PRIMITIVE_NAME.exec(token.name);
    if (!match) {
      throw new Error(
        `Некорректное имя примитива «${token.name}»: ожидается <оттенок> или <оттенок>-<шаг> (шаг — цифры)`,
      );
    }
    const [, hue, step] = match as unknown as [string, string, string | undefined];
    if (step === undefined) {
      color[hue] = token.hex;
    } else {
      const scale = (color[hue] ??= {}) as Record<string, string>;
      scale[step] = token.hex;
    }
  }
  return {
    color,
    semantic: Object.fromEntries(tokens.semantic.map((token) => [token.name, token.hex])),
    semanticDark: Object.fromEntries(tokens.dark.map((token) => [token.name, token.hex])),
    font: FONT,
    fontWeight: FONT_WEIGHT,
    text: Object.fromEntries(
      Object.entries(TEXT).map(([key, [size, lineHeight]]) => {
        const weight = TEXT_WEIGHT[key as keyof typeof TEXT_WEIGHT];
        return [key, { size, lineHeight, ...(weight ? { fontWeight: FONT_WEIGHT[weight] } : {}) }];
      }),
    ),
    radius: RADIUS,
    shadow: SHADOW,
    motion: MOTION,
  };
}

export function emitJson(tokens: Tokens): string {
  return `${JSON.stringify(tokensObject(tokens), null, 2)}\n`;
}

export function emitJs(tokens: Tokens): { js: string; dts: string } {
  const entries = Object.entries(tokensObject(tokens));
  const names = entries.map(([name]) => name);
  const banner = BANNER.replace('/*', '//').replace(' */', '');
  const js = [
    banner,
    ...entries.map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 2)};`),
    `export default { ${names.join(', ')} };`,
    '',
  ].join('\n');
  // JSON-литерал — валидный тип TS: значения становятся строковыми/числовыми литералами.
  const dts = [
    banner,
    ...entries.map(
      ([name, value]) => `export declare const ${name}: ${JSON.stringify(value, null, 2)};`,
    ),
    `declare const tokens: { ${names.map((name) => `${name}: typeof ${name}`).join('; ')} };`,
    'export default tokens;',
    '',
  ].join('\n');
  return { js, dts };
}
