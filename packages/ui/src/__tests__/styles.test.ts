import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const styles = read('../styles.css');

describe('styles.css', () => {
  it('подключает Tailwind развёрнуто (бренд-правки до утилит), тему, анимации, shadcn', () => {
    const imports = [...styles.matchAll(/^@import '([^']+)'/gm)].map((match) => match[1]);
    expect(imports).toEqual([
      'tailwindcss/theme.css',
      'tailwindcss/preflight.css',
      './brand.css',
      'tailwindcss/utilities.css',
      '@mednet/tokens/theme.css',
      'tw-animate-css',
      './shadcn-tailwind.css',
    ]);
    expect(styles).toContain("@import './brand.css' layer(utilities);");
  });

  it('привязывает вариант dark к классу .dark, а не к prefers-color-scheme', () => {
    expect(styles).toContain('@custom-variant dark (&:is(.dark *));');
    expect(styles.indexOf('@custom-variant dark')).toBeGreaterThan(
      styles.indexOf("@import '@mednet/tokens/theme.css';"),
    );
  });

  it('шрифт не в styles.css: Tailwind встраивает @import без перебазирования url() и Vite теряет woff2', () => {
    expect(styles).not.toContain('fontsource');
  });

  it('fonts.css подключает Montserrat 500/600/700 из fontsource', () => {
    const imports = [...read('../fonts.css').matchAll(/^@import '([^']+)'/gm)].map(
      (match) => match[1],
    );
    expect(imports).toEqual([
      '@fontsource/montserrat/500.css',
      '@fontsource/montserrat/600.css',
      '@fontsource/montserrat/700.css',
    ]);
  });

  it('задаёт заголовкам вес бренда: Preflight Tailwind его сбрасывает', () => {
    expect(styles).toMatch(/h1\s*\{\s*font-weight: var\(--mn-text-h1-font-weight\);\s*\}/);
    expect(styles).toMatch(
      /h2,\s*h3,\s*h4\s*\{\s*font-weight: var\(--mn-text-h2-font-weight\);\s*\}/,
    );
  });

  it('сканирует dist пакета: Tailwind не смотрит в node_modules', () => {
    expect(styles).toContain("@source '../dist';");
  });

  it('копия shadcn/tailwind.css совпадает с установленным shadcn', () => {
    const vendored = read('../shadcn-tailwind.css');
    const original = read('../../node_modules/shadcn/dist/tailwind.css');
    expect(vendored.endsWith(original)).toBe(true);
  });
});
