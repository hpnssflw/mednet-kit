// src/index.ts — корневой индекс: export * из всех публичных модулей.
// Запуск: pnpm gen:index; с --check только сверяет (тест package.test.ts).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../src/', import.meta.url);
const INTERNAL = new Set(['layouts/skip-link.tsx']);

const list = (dir) =>
  readdirSync(new URL(dir, src))
    .filter((file) => file.endsWith('.tsx') && !INTERNAL.has(dir + file))
    .sort()
    .map((file) => `./${dir}${file.replace(/\.tsx$/, '.js')}`);

const modules = [...list('components/'), ...list('brand/'), ...list('layouts/'), './lib/utils.js'];
const text = [
  '// Сгенерировано scripts/gen-index.mjs, не редактировать.',
  '// Рекомендуемый импорт — по подпутям (@mednet/ui/button): корневой индекс тянет все модули.',
  ...modules.map((module) => `export * from '${module}';`),
  '',
].join('\n');

const target = new URL('index.ts', src);
if (process.argv.includes('--check')) {
  if (!existsSync(target) || readFileSync(target, 'utf8') !== text) {
    console.error('src/index.ts устарел: выполните pnpm gen:index');
    process.exit(1);
  }
} else {
  writeFileSync(target, text);
  console.log(`src/index.ts: ${modules.length} модулей`);
}
