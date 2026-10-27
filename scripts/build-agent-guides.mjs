// llms.md пакетов tokens, css, lint-config: вводная часть пакета (packages/<имя>/llms/intro.md)
// + общие разделы для агентов из docs/agent-guide/ (карта пакетов, линтеры, бренд).
// Результат лежит в git и едет в npm; `--check` падает, если файл не пересобран.
// llms.md пакета ui собирает его собственный build (там же читаются общие разделы).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8').trim();

export const PACKAGES = ['tokens', 'css', 'lint-config'];
export const SHARED = ['map', 'lint', 'brand'].map((name) => `docs/agent-guide/${name}.md`);

export function compose(name) {
  const pkg = JSON.parse(read(`packages/${name}/package.json`));
  return `${[
    `# @mednet/${name} ${pkg.version} — справка для AI-агентов`,
    read(`packages/${name}/llms/intro.md`),
    ...SHARED.map(read),
  ].join('\n\n')}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let stale = false;
  for (const name of PACKAGES) {
    const file = new URL(`packages/${name}/llms.md`, root);
    const text = compose(name);
    let current = '';
    try {
      current = readFileSync(file, 'utf8');
    } catch {}
    if (check) {
      if (current !== text) {
        stale = true;
        console.error(`packages/${name}/llms.md устарел: pnpm build:agent-guides`);
      }
    } else {
      writeFileSync(file, text);
      console.log(`packages/${name}/llms.md`);
    }
  }
  if (stale) process.exit(1);
}
