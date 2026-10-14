import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '../brand/logo.js';

// Не new URL('…', import.meta.url) с литералом: в jsdom Vite переписывает такую запись
// в адрес ассета (http://localhost:3000/…), и node:fs его не читает.
const local = (path: string) => new URL(path, import.meta.url);

const VARIANTS = ['horizontal', 'vertical', 'mark'] as const;

describe('Logo', () => {
  it('по умолчанию декоративный', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('с title — изображение с доступным именем', () => {
    render(<Logo variant="mark" title="ЦНИИОИЗ" />);
    expect(screen.getByRole('img', { name: 'ЦНИИОИЗ' })).toBeInTheDocument();
  });

  it('id не повторяются, даже если логотип дважды на странице', () => {
    const { container } = render(
      <>
        <Logo variant="vertical" />
        <Logo variant="vertical" />
      </>,
    );
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(VARIANTS)('%s: размер задаётся классом, а не атрибутами', (variant) => {
    const { container } = render(<Logo variant={variant} className="h-8 w-auto" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-8', 'w-auto');
    expect(svg).not.toHaveAttribute('width');
    expect(svg).toHaveAttribute('viewBox');
  });

  it('файлы логотипа совпадают с выводом генератора', () => {
    const out = mkdtempSync(join(tmpdir(), 'mednet-logo-'));
    const script = fileURLToPath(local('../../scripts/gen-logos.mjs'));
    execFileSync(process.execPath, [script, out]);
    for (const variant of VARIANTS) {
      const file = `logo-${variant}.tsx`;
      const committed = readFileSync(local(`../brand/logo/${file}`), 'utf8');
      expect(readFileSync(join(out, file), 'utf8')).toBe(committed);
    }
  });
});
