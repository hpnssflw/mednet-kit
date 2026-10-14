// Защита публикации: без собранного dist/ в npm уедет пустой пакет.
import { existsSync } from 'node:fs';

const required = ['dist/mednet.css', 'dist/mednet.min.css', 'dist/mednet.js'];
const missing = required.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  console.error(
    `@mednet/css: нельзя публиковать без сборки — нет ${missing.join(', ')}. Выполните «pnpm build».`,
  );
  process.exit(1);
}
