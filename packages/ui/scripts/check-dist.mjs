// Защита публикации: без сборки в npm уедет пакет без dist/ и llms.md.
import { existsSync } from 'node:fs';

const required = [
  'dist/index.js',
  'dist/components/button.js',
  'dist/brand/logo.js',
  'dist/layouts/app-shell.js',
  'llms.md',
];
const missing = required.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  console.error(
    `@mednet/ui: нельзя публиковать без сборки — нет ${missing.join(', ')}. Выполните «pnpm build».`,
  );
  process.exit(1);
}
