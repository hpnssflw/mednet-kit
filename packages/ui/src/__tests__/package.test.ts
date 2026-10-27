// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const llms = () => readFileSync(new URL('llms.md', root), 'utf8');

describe('пакет @mednet/ui', () => {
  it('src/index.ts соответствует генератору', () => {
    const script = fileURLToPath(new URL('scripts/gen-index.mjs', root));
    expect(() => execFileSync(process.execPath, [script, '--check'])).not.toThrow();
  });

  it.each(Object.entries(pkg.exports).filter(([key]) => !key.includes('*')))(
    'экспорт %s указывает на существующий файл',
    (_key, target) => {
      const files =
        typeof target === 'string' ? [target] : Object.values(target as Record<string, string>);
      for (const file of files) expect(existsSync(new URL(file, root))).toBe(true);
    },
  );

  it('llms.md: правило render вместо asChild и строка стилей', () => {
    expect(llms()).toContain('render={');
    expect(llms()).toContain("@import '@mednet/ui/styles.css';");
    expect(llms()).toContain("import '@mednet/ui/fonts.css';");
  });

  it('llms.md: раздел «Стек и где искать API» с основными библиотеками', () => {
    const text = llms();
    const start = text.indexOf('## Стек и где искать API');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = text.indexOf('\n## ', start + 1);
    const section = text.slice(start, end === -1 ? undefined : end);
    for (const name of ['Base UI', 'lucide-react', 'Recharts', 'Embla Carousel', 'shadcn/ui'])
      expect(section).toContain(name);
    expect(text.indexOf('## Стек и где искать API')).toBeLessThan(
      text.indexOf('## Модули фирменных блоков'),
    );
  });

  it.each([
    'logo',
    'site-header',
    'site-footer',
    'public-layout',
    'app-shell',
    'button',
    'sidebar',
    'toast',
  ])('llms.md: модуль %s описан', (name) => {
    expect(llms()).toContain(`### \`@mednet/ui/${name}\``);
  });

  it('llms.md: экспорты взяты из d.ts', () => {
    expect(llms()).toMatch(
      /### `@mednet\/ui\/button`\n\n- компоненты: `Button`\n- прочее: `buttonVariants`/,
    );
    expect(llms()).toContain('https://ui.shadcn.com/docs/components/base/button');
  });

  it('llms.md: у каждого фирменного компонента есть раздел с примером', () => {
    for (const name of ['Logo', 'SiteHeader', 'SiteFooter', 'PublicLayout', 'AppShell']) {
      expect(llms()).toContain(`#### \`${name}\``);
    }
  });
});
