import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FONT_SUBSETS, FONT_WEIGHTS } from '../scripts/fonts.ts';

const distUrl = (file: string) => new URL(`../dist/${file}`, import.meta.url);
const read = (file: string) => readFileSync(distUrl(file), 'utf8');

describe('dist/mednet.css', () => {
  const css = read('mednet.css');

  it('перекрывает нейтральную тему Basecoat темой бренда', () => {
    const basecoat = css.lastIndexOf('--primary: oklch(');
    const brand = css.lastIndexOf('--primary: var(--mn-primary)');
    expect(basecoat).toBeGreaterThan(-1);
    expect(brand).toBeGreaterThan(basecoat);
  });

  it('содержит компоненты Basecoat', () => {
    expect(css).toMatch(/\.btn\b/);
    expect(css).toMatch(/\.card\b/);
    expect(css).toMatch(/\.badge\b/);
  });

  it('не содержит Tailwind-утилит и стандартной палитры', () => {
    expect(css).not.toMatch(/\.flex\s*\{/);
    expect(css).not.toMatch(/--color-pink-500/);
  });

  it('использует Montserrat вместо Geist', () => {
    expect(css).not.toContain('Geist');
    expect(css).toMatch(/--font-sans:\s*"Montserrat"/);
  });

  it('подключает кириллицу и латиницу Montserrat из ./fonts/', () => {
    for (const weight of FONT_WEIGHTS) {
      for (const subset of FONT_SUBSETS) {
        const file = `montserrat-${subset}-${weight}-normal.woff2`;
        expect(css).toContain(`url(./fonts/${file})`);
        expect(existsSync(distUrl(`fonts/${file}`)), file).toBe(true);
      }
    }
  });
});

describe('остальные файлы dist', () => {
  it('fonts.css — только @font-face', () => {
    const fonts = read('fonts.css');
    expect(fonts).toContain('@font-face');
    expect(fonts).not.toContain('.btn');
  });

  it('кладёт лицензию шрифта', () => {
    expect(read('fonts/OFL.txt')).toMatch(/SIL OPEN FONT LICENSE/i);
  });

  it('кладёт JS Basecoat', () => {
    expect(statSync(distUrl('mednet.js')).size).toBeGreaterThan(1000);
  });

  it('минифицированная версия меньше обычной', () => {
    expect(statSync(distUrl('mednet.min.css')).size).toBeLessThan(
      statSync(distUrl('mednet.css')).size,
    );
  });
});
