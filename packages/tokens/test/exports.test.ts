import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkg = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(`${pkg}package.json`, 'utf8')) as {
  exports: Record<string, string | Record<string, string>>;
};

/** Все строковые цели exports: `{ "./x": { types, default } }` разворачивается в значения. */
const targets = Object.entries(manifest.exports).flatMap(([key, value]) =>
  typeof value === 'string'
    ? [[key, value] as const]
    : Object.entries(value).map(
        ([condition, target]) => [`${key} (${condition})`, target] as const,
      ),
);

describe('exports пакета', () => {
  it.each(targets.filter(([, target]) => !target.includes('*')))(
    '%s → %s существует после сборки',
    (_, target) => {
      expect(existsSync(`${pkg}${target}`)).toBe(true);
    },
  );

  it('шаблон ./dist/* раскрывается в реальные файлы dist', () => {
    expect(manifest.exports['./dist/*']).toBe('./dist/*');
    const files = readdirSync(`${pkg}dist`);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files.slice(0, 3)) {
      expect(
        existsSync(`${pkg}${(manifest.exports['./dist/*'] as string).replace('*', file)}`),
      ).toBe(true);
    }
  });
});

describe('exports @mednet/tokens', () => {
  it('"types" стоит первым в корневой записи', () => {
    expect(Object.keys(manifest.exports['.'] as object)[0]).toBe('types');
  });
});
