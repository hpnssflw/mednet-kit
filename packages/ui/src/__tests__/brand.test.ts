// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';
import { beforeAll, describe, expect, it } from 'vitest';

const styles = new URL('../styles.css', import.meta.url);
let css = '';

beforeAll(async () => {
  const compiler = await compile(readFileSync(styles, 'utf8'), {
    base: fileURLToPath(new URL('../', import.meta.url)),
    onDependency: () => {},
  });
  // Классы, которые ставят сгенерированные компоненты, — как будто Tailwind нашёл их в dist.
  // Кавычки в селекторах приводим к одинарным — как в исходнике после Prettier.
  css = compiler
    .build([
      'bg-input/30',
      'hover:bg-input/50',
      'hover:bg-primary/80',
      '[a]:hover:bg-primary/80',
      'aria-expanded:bg-muted',
      'border-input',
      // Проверка палитры: стандартной шкалы slate нет, red — брендовая.
      'bg-slate-500',
      'bg-red-500',
    ])
    .replaceAll('"', "'");
});

/** Тело правила по началу селектора: [class~='border-input'] и т. п. */
const rule = (selectorStart: string) => {
  const start = css.indexOf(selectorStart);
  expect(start, selectorStart).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start) + 1);
};

describe('brand.css', () => {
  it('поля, контурные кнопка и бейдж заливаются --field, а не серым --input', () => {
    expect(rule(":is( [class~='border-input']")).toContain('background-color: var(--field)');
  });

  it('правило полей стоит в слое utilities до утилиты bg-input/30 и до вариантов', () => {
    const utilities = css.indexOf('@layer utilities');
    const brand = css.indexOf(":is( [class~='border-input']");
    const generated = css.indexOf('.bg-input\\/30');
    const variant = css.indexOf('.aria-expanded\\:bg-muted');
    expect(utilities).toBeGreaterThan(-1);
    expect(brand).toBeGreaterThan(utilities);
    expect(generated).toBeGreaterThan(brand);
    expect(variant).toBeGreaterThan(brand);
  });

  it('контурная кнопка при наведении — --muted', () => {
    expect(rule("[class~='group/button'][class~='hover:bg-input/50']:hover")).toContain(
      'background-color: var(--muted)',
    );
  });

  it('основная кнопка и бейдж-ссылка при наведении — --primary-hover', () => {
    expect(rule("[class~='group/button'][class~='hover:bg-primary/80']:hover")).toContain(
      'background-color: var(--primary-hover)',
    );
    expect(css).toContain("[class~='group/badge'][class~='[a]:hover:bg-primary/80']:is(a):hover");
  });

  it('палитры Tailwind в итоговом CSS нет — только токены', () => {
    expect(css).not.toContain('.bg-slate-500');
    expect(css).toMatch(/\.bg-red-500\s*\{\s*background-color:\s*var\(--mn-red-500\)/);
    expect(css).toContain('--primary: var(--mn-primary)');
  });
});
