import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Путь от файла теста. Не new URL('…', import.meta.url) с литералом: в окружении jsdom Vite
// переписывает такую запись в адрес ассета (http://localhost:3000/…), и node:fs его не читает.
const local = (path: string) => new URL(path, import.meta.url);
const src = local('../components/');
const dist = local('../../dist/components/');
const names = readdirSync(src)
  .filter((file) => file.endsWith('.tsx'))
  .map((file) => file.slice(0, -'.tsx'.length));

describe('сборка компонентов', () => {
  it.each(names)('%s: есть .js и .d.ts, "use client" сохранён', (name) => {
    const tsx = readFileSync(new URL(`${name}.tsx`, src), 'utf8');
    const js = readFileSync(new URL(`${name}.js`, dist), 'utf8');
    expect(existsSync(new URL(`${name}.d.ts`, dist))).toBe(true);
    expect(js.startsWith('"use client";')).toBe(tsx.startsWith('"use client"'));
  });

  // 30 с вместо 5: первый импорт chart (recharts) и calendar (react-day-picker) сразу после
  // pnpm install на Windows шёл 6–17 с; повторные — 1–2 с.
  it.each(names)(
    '%s: модуль выполняется',
    async (name) => {
      const module: Record<string, unknown> = await import(`#components/${name}`);
      expect(Object.keys(module).length).toBeGreaterThan(0);
    },
    30_000,
  );
});
