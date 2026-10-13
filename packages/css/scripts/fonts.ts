import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FONT_WEIGHTS = [500, 600, 700] as const;
export const FONT_SUBSETS = ['cyrillic', 'latin'] as const;

export interface FontFaces {
  css: string;
  files: string[];
}

/**
 * Берёт @font-face из общего CSS fontsource (`500.css`): только там есть unicode-range,
 * без него кириллица и латиница перекрывают друг друга. Оставляет нужные подмножества,
 * переписывает путь на ./fonts/ и убирает woff-фолбэк.
 */
export function extractFontFaces(fontsourceCss: string, subsets: readonly string[]): FontFaces {
  const css: string[] = [];
  const files: string[] = [];
  for (const block of fontsourceCss.split(/(?=\/\* montserrat-)/)) {
    const subset = /\/\* montserrat-(.+)-\d{3}-normal \*\//.exec(block)?.[1];
    if (!subset || !subsets.includes(subset)) continue;
    const file = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(block)?.[1];
    if (!file) throw new Error(`В блоке Montserrat ${subset} нет woff2`);
    files.push(file);
    css.push(block.replace(/src:[^;]+;/, `src: url(./fonts/${file}) format('woff2');`).trim());
  }
  return { css: css.join('\n\n'), files };
}

/** @font-face для всех нужных начертаний из каталога пакета @fontsource/montserrat. */
export function loadFontFaces(fontsourceDir: string): FontFaces {
  const parts = FONT_WEIGHTS.map((weight) =>
    extractFontFaces(readFileSync(join(fontsourceDir, `${weight}.css`), 'utf8'), FONT_SUBSETS),
  );
  return {
    css: parts.map((part) => part.css).join('\n\n'),
    files: parts.flatMap((part) => part.files),
  };
}
