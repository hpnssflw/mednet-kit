import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONT_SUBSETS, FONT_WEIGHTS } from '../scripts/fonts.ts';

const require = createRequire(import.meta.url);

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

  it('JS Basecoat начинается с уведомления о лицензии Basecoat', () => {
    const basecoat = dirname(require.resolve('basecoat-css/package.json'));
    const { version } = JSON.parse(readFileSync(join(basecoat, 'package.json'), 'utf8')) as {
      version: string;
    };
    expect(readFileSync(join(basecoat, 'LICENSE.md'), 'utf8')).toContain(
      'Copyright (c) 2025 Ronan Berder',
    );
    const js = read('mednet.js');
    const header = `/*! Basecoat v${version} | MIT | (c) 2025 Ronan Berder | https://basecoatui.com */\n`;
    expect(js.startsWith(header)).toBe(true);
    expect(js.slice(header.length)).toBe(
      readFileSync(require.resolve('basecoat-css/all.min'), 'utf8'),
    );
  });

  it('минифицированная версия меньше обычной', () => {
    expect(statSync(distUrl('mednet.min.css')).size).toBeLessThan(
      statSync(distUrl('mednet.css')).size,
    );
  });
});

describe('лицензии в пакете', () => {
  const pkgUrl = (file: string) => new URL(`../${file}`, import.meta.url);

  it('кладёт MIT-лицензию пакета', () => {
    expect(readFileSync(pkgUrl('LICENSE'), 'utf8')).toMatch(
      /^MIT License\n\nCopyright \(c\) 2026 ФГБУ «ЦНИИОИЗ» Минздрава России\n/,
    );
  });

  it('публикует уведомления о сторонних компонентах', () => {
    const notices = readFileSync(pkgUrl('THIRD_PARTY_NOTICES.md'), 'utf8');
    expect(notices).toContain('Copyright (c) 2025 Ronan Berder');
    expect(notices).toContain('Copyright (c) Tailwind Labs, Inc.');
    expect(notices).toContain('dist/fonts/OFL.txt');
    const { files } = JSON.parse(readFileSync(pkgUrl('package.json'), 'utf8')) as {
      files: string[];
    };
    expect(files).toContain('THIRD_PARTY_NOTICES.md');
  });
});
