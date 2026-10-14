import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Путь от файла теста. Не new URL('…', import.meta.url) с литералом: в окружении jsdom Vite
// переписывает такую запись в адрес ассета (http://localhost:3000/…), и node:fs его не читает.
const local = (path: string) => new URL(path, import.meta.url);
const components = local('../components/');
const files = existsSync(components)
  ? readdirSync(components).filter((file) => file.endsWith('.tsx'))
  : [];
const source = (file: string) => readFileSync(new URL(file, components), 'utf8');
const labels: [string, string, string][] = JSON.parse(
  readFileSync(local('../../scripts/ru-labels.json'), 'utf8'),
);

describe('сгенерированные компоненты', () => {
  it('полный набор base-maia', () => {
    expect(files.length).toBeGreaterThanOrEqual(61);
    expect(files).toEqual(
      expect.arrayContaining([
        'button.tsx',
        'chart.tsx',
        'dialog.tsx',
        'field.tsx',
        'sidebar.tsx',
        'toast.tsx',
        'tooltip.tsx',
      ]),
    );
  });

  it.each(files)('%s: cn из своего lib/utils, импорты через #, без Radix', (file) => {
    const text = source(file);
    expect(text).not.toContain('from "cn"');
    expect(text).not.toMatch(/from "@\//);
    expect(text).not.toMatch(/from "(radix-ui|@radix-ui\/[^"]+|next-themes|vaul|sonner)"/);
  });

  it.each(labels)('%s: «%s» переведено', (file, en, ru) => {
    expect(source(file)).not.toContain(en);
    expect(source(file)).toContain(ru);
  });
});
