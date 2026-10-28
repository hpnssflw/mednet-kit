// Защита публикации: без собранного dist/ в npm уедет пустой пакет.
import { existsSync, readFileSync } from 'node:fs';

const required = ['dist/index.js', 'dist/theme.css', 'dist/tokens.css'];
const missing = required.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  console.error(
    `@mednet/tokens: нельзя публиковать без сборки — нет ${missing.join(', ')}. Выполните «pnpm build».`,
  );
  process.exit(1);
}

// Тёмная тема: без блока .dark потребитель получит класс, который ничего не меняет.
if (!readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8').includes('.dark {')) {
  console.error('@mednet/tokens: в dist/tokens.css нет блока .dark. Выполните «pnpm build».');
  process.exit(1);
}
