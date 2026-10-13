import { describe, expect, it } from 'vitest';
import { extractFontFaces } from '../scripts/fonts.ts';

// Фрагмент @fontsource/montserrat/500.css (формат fontsource 5.x).
const SAMPLE = `/* montserrat-cyrillic-ext-500-normal */
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-display: swap;
  font-weight: 500;
  src: url(./files/montserrat-cyrillic-ext-500-normal.woff2) format('woff2'), url(./files/montserrat-cyrillic-ext-500-normal.woff) format('woff');
  unicode-range: U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F;
}

/* montserrat-cyrillic-500-normal */
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-display: swap;
  font-weight: 500;
  src: url(./files/montserrat-cyrillic-500-normal.woff2) format('woff2'), url(./files/montserrat-cyrillic-500-normal.woff) format('woff');
  unicode-range: U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;
}

/* montserrat-latin-500-normal */
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-display: swap;
  font-weight: 500;
  src: url(./files/montserrat-latin-500-normal.woff2) format('woff2'), url(./files/montserrat-latin-500-normal.woff) format('woff');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153;
}
`;

describe('extractFontFaces', () => {
  const result = extractFontFaces(SAMPLE, ['cyrillic', 'latin']);

  it('оставляет только нужные подмножества', () => {
    expect(result.files).toEqual([
      'montserrat-cyrillic-500-normal.woff2',
      'montserrat-latin-500-normal.woff2',
    ]);
    expect(result.css).not.toContain('cyrillic-ext');
  });

  it('переписывает путь на ./fonts/ и убирает woff-фолбэк', () => {
    expect(result.css).toContain(
      "src: url(./fonts/montserrat-cyrillic-500-normal.woff2) format('woff2');",
    );
    expect(result.css).not.toContain('.woff)');
    expect(result.css).not.toContain('./files/');
  });

  it('сохраняет unicode-range (без него подмножества перекрывают друг друга)', () => {
    expect(result.css).toContain('unicode-range: U+0301,U+0400-045F');
  });
});
