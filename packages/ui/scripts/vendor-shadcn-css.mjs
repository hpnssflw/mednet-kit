// Копирует shadcn/dist/tailwind.css в src/: компонентам нужны его варианты (data-open, data-checked…),
// анимации аккордеона и утилиты, а тянуть CLI shadcn (~300 пакетов) в зависимости проекта незачем.
import { readFileSync, writeFileSync } from 'node:fs';

const shadcn = new URL('../node_modules/shadcn/', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('package.json', shadcn), 'utf8'));
const css = readFileSync(new URL('dist/tailwind.css', shadcn), 'utf8');
const header = `/* Копия shadcn@${version}/dist/tailwind.css (MIT, см. THIRD_PARTY_NOTICES.md). Обновляется pnpm vendor-css, не редактировать. */\n`;

writeFileSync(new URL('../src/shadcn-tailwind.css', import.meta.url), header + css);
console.log(`src/shadcn-tailwind.css ← shadcn@${version}`);
