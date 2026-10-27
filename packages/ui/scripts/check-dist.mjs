// Защита публикации: без сборки в npm уедет пакет без dist/ и llms.md.
import { existsSync, readFileSync } from 'node:fs';

const required = [
  'dist/index.js',
  'dist/components/button.js',
  'dist/brand/logo.js',
  'dist/layouts/app-shell.js',
  'llms.md',
  'stack.json',
];
const missing = required.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  console.error(
    `@mednet/ui: нельзя публиковать без сборки — нет ${missing.join(', ')}. Выполните «pnpm build».`,
  );
  process.exit(1);
}

const llms = readFileSync(new URL('../llms.md', import.meta.url), 'utf8');
if (!llms.includes('## Стек и где искать API')) {
  console.error(
    '@mednet/ui: в llms.md нет раздела «Стек и где искать API». Выполните «pnpm build».',
  );
  process.exit(1);
}
