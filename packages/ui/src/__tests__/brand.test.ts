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
      'dark:bg-input/30',
      'hover:bg-primary/80',
      '[a]:hover:bg-primary/80',
      'aria-expanded:bg-muted',
      'border-input',
      // Триггер вкладки: неактивный — text-foreground/60, наведение и активный — свои варианты.
      'text-foreground/60',
      'hover:text-foreground',
      'data-active:text-foreground',
      // Граница контурной кнопки: база и вариант без cn(), затем варианты фокуса и ошибки.
      'border-border',
      'border-transparent',
      'focus-visible:border-ring',
      'aria-invalid:border-destructive',
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

/** Обратная косая черта — экранирование «:» в классах Tailwind. */
const BS = String.fromCharCode(92);

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

  it('неактивная вкладка — --muted-foreground (5.16:1 вместо 3.58:1 у foreground/60)', () => {
    expect(rule("[class~='text-foreground/60']")).toContain('color: var(--muted-foreground)');
  });

  it('правило вкладки стоит в слое utilities до утилиты и вариантов hover: и data-active:', () => {
    const utilities = css.indexOf('@layer utilities');
    const brand = css.indexOf("[class~='text-foreground/60']");
    const generated = css.indexOf('.text-foreground\\/60');
    const hover = css.indexOf('.hover\\:text-foreground');
    const active = css.indexOf('.data-active\\:text-foreground');
    expect(utilities).toBeGreaterThan(-1);
    expect(brand).toBeGreaterThan(utilities);
    expect(generated).toBeGreaterThan(brand);
    expect(hover).toBeGreaterThan(brand);
    expect(active).toBeGreaterThan(brand);
  });

  it('активную вкладку правило не трогает: исключение через :where, как у data-active:', () => {
    // Вариант data-active: собран через :where(...) — (0,1,0); правило (0,2,0) перебило бы его без исключения.
    const variant = '.data-active' + BS + ':text-foreground:where(';
    expect(css).toContain(variant + "[data-state='active'])");
    expect(css).toContain(variant + "[data-active]:not([data-active='false']))");
    const tab = rule("[class~='text-foreground/60']")
      .split(/[ \n]+/)
      .join(' ');
    expect(tab).toContain(
      ":where( :not([data-state='active'], [data-active]:not([data-active='false']))",
    );
  });

  it('граница контурной кнопки и бейджа переживает сырой buttonVariants без cn()', () => {
    const start = ":is([class~='group/button'], [class~='group/badge'])[class~='border-border']";
    expect(rule(start)).toContain('border-color: var(--border)');
    const brand = css.indexOf(start);
    // Варианты фокуса и ошибки стоят позже при той же специфичности (0,2,0) — граница в них прежняя.
    for (const utility of [
      '.border-transparent',
      '.focus-visible' + BS + ':border-ring',
      '.aria-invalid' + BS + ':border-destructive',
    ]) {
      expect(css.indexOf(utility), utility).toBeGreaterThan(brand);
    }
  });

  it('палитры Tailwind в итоговом CSS нет — только токены', () => {
    expect(css).not.toContain('.bg-slate-500');
    expect(css).toMatch(/\.bg-red-500\s*\{\s*background-color:\s*var\(--mn-red-500\)/);
    expect(css).toContain('--primary: var(--mn-primary)');
  });

  it('в тёмной теме текст логотипа берёт --foreground, красный знак остаётся', () => {
    const body = rule(":is(.dark *) svg[data-mednet-logo] path:not([fill='#d6867f'])");
    expect(body).toContain('fill: var(--foreground)');
  });

  it('в тёмной теме нативный select заливается --field, а не --input 30 %', () => {
    const body = rule("[class~='border-input'][class~='bg-input/30'][class~='dark:bg-input/30']:is(.dark *)");
    expect(body).toContain('background-color: var(--field)');
  });
});
