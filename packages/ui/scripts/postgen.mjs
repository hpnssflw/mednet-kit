// Правки поверх сгенерированного shadcn. Запуск: pnpm generate (вместе с генерацией)
// или node scripts/postgen.mjs. Идемпотентен: повторный запуск ничего не меняет.
// Падает, если правку применить не к чему: значит, shadcn поменял исходник — правку пересмотреть.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const components = new URL('../src/components/', import.meta.url);
/** @type {[string, string, string][]} [файл, английский текст, русский текст] */
const labels = JSON.parse(readFileSync(new URL('./ru-labels.json', import.meta.url), 'utf8'));
const files = readdirSync(components).filter((file) => file.endsWith('.tsx'));
const problems = [];
let changed = 0;

for (const file of new Set(labels.map(([target]) => target))) {
  if (!files.includes(file)) problems.push(`${file}: файла нет`);
}

for (const file of files) {
  const url = new URL(file, components);
  const before = readFileSync(url, 'utf8');
  let text = before;

  // 1. cn — из своего lib/utils: там размеры шрифта бренда (text-h1…h4, text-lead).
  text = text.replaceAll('import { cn } from "cn"', 'import { cn } from "#lib/utils"');

  // 2. Подписи для экранного диктора и тексты по умолчанию — по-русски.
  for (const [target, en, ru] of labels) {
    if (target !== file) continue;
    if (text.includes(en)) text = text.replaceAll(en, ru);
    else if (!text.includes(ru)) problems.push(`${file}: не найдено ${en}`);
  }

  if (text !== before) {
    writeFileSync(url, text);
    changed += 1;
  }
}

console.log(`postgen: изменено файлов — ${changed} из ${files.length}`);
if (problems.length > 0) {
  console.error(`postgen: правки не применились:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
