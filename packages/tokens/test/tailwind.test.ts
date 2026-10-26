import { compile } from '@tailwindcss/node';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkg = fileURLToPath(new URL('../', import.meta.url));

/** Компилирует тему пакета (dist/theme.css) с заданными классами. */
async function build(candidates: string[]): Promise<string> {
  const compiler = await compile(
    '@import "tailwindcss" source(none);\n@import "./dist/theme.css";\n',
    { base: pkg, onDependency: () => {} },
  );
  return compiler.build(candidates);
}

describe('тема Tailwind', () => {
  it('не содержит стандартной палитры Tailwind', async () => {
    const css = await build(['bg-pink-500', 'text-slate-700']);
    expect(css).not.toMatch(/\.bg-pink-500/);
    expect(css).not.toMatch(/\.text-slate-700/);
  });

  it('даёт шкалы бренда через переменные', async () => {
    const css = await build(['bg-red-500', 'text-graphite-900']);
    expect(css).toMatch(/\.bg-red-500\s*\{[^}]*var\(--mn-red-500\)/);
    expect(css).toMatch(/\.text-graphite-900\s*\{[^}]*var\(--mn-graphite-900\)/);
  });

  it('даёт семантику shadcn', async () => {
    const css = await build(['bg-primary', 'text-primary-foreground', 'border-border']);
    expect(css).toMatch(/\.bg-primary\s*\{[^}]*var\(--primary\)/);
    expect(css).toMatch(/\.border-border\s*\{[^}]*var\(--border\)/);
  });

  it('ставит Montserrat шрифтом по умолчанию', async () => {
    const css = await build(['font-sans']);
    expect(css).toMatch(/--font-sans:\s*"Montserrat"/);
  });

  it('даёт резиновые размеры заголовков', async () => {
    const css = await build(['text-h1']);
    expect(css).toMatch(/\.text-h1\s*\{[^}]*var\(--mn-text-h1\)/);
  });

  it('утилита text-h* сама задаёт вес заголовка', async () => {
    const css = await build(['text-h1', 'text-h3', 'text-base']);
    // Tailwind оборачивает вес в var(--tw-font-weight, …): явный font-bold на элементе его перекроет
    expect(css).toMatch(
      /\.text-h1\s*\{[^}]*font-weight:\s*var\(--tw-font-weight,\s*var\(--mn-text-h1-font-weight\)\)/,
    );
    expect(css).toMatch(
      /\.text-h3\s*\{[^}]*font-weight:\s*var\(--tw-font-weight,\s*var\(--mn-text-h3-font-weight\)\)/,
    );
    expect(css).not.toMatch(/\.text-base\s*\{[^}]*font-weight/);
  });
});
