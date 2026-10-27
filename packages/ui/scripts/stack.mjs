// Карта «на чём строится кит»: stack.json + версии из package.json → записи и markdown-раздел llms.md.
import { readFileSync } from 'node:fs';

export const GROUPS = {
  base: 'Основа',
  lib: 'Функциональные библиотеки',
  kit: 'Экосистема кита',
};
const USAGE = {
  inside: 'внутри кита, напрямую не импортируйте',
  peer: 'peer-зависимость, импортируйте напрямую',
  project: 'ставится в проект отдельно',
};

/** Версия пакета по package.json кита: свои пакеты — версия кита (одна на все), чужие — диапазон. */
export function versionOf(pkg, name) {
  if (name === null) return null;
  if (name.startsWith('@mednet/')) return pkg.version;
  for (const key of ['dependencies', 'peerDependencies', 'devDependencies'])
    if (pkg[key]?.[name]) return pkg[key][name];
  return undefined;
}

export function readStack(root) {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const entries = JSON.parse(readFileSync(new URL('stack.json', root), 'utf8'));
  return entries.map((entry) => ({ ...entry, version: versionOf(pkg, entry.package) ?? null }));
}

const cell = (text) => text.replaceAll('|', '\\|');
const links = (entry) =>
  [`[документация](${entry.docs})`, entry.llms ? `[llms.txt](${entry.llms})` : null]
    .filter(Boolean)
    .join(', ');

export function renderStackSection(entries) {
  const parts = [
    '## Стек и где искать API',
    '',
    'На чём построен кит и куда смотреть, когда нужного пропса или примера нет в этой справке. **Нет в справке кита — ищите в документации основы (Base UI / shadcn/ui), затем в библиотеке из таблицы; не выдумывайте пропсы и не тащите чужие библиотеки.** Если у библиотеки есть `llms.txt` — читайте его: это самый быстрый путь к её API.',
    '',
  ];
  for (const [group, title] of Object.entries(GROUPS)) {
    const rows = entries.filter((entry) => entry.group === group);
    parts.push(
      `### ${title}`,
      '',
      '| Что | За что отвечает | Куда смотреть | Когда |',
      '| --- | --- | --- | --- |',
      ...rows.map((entry) => {
        const name = `${entry.name}${entry.version ? ` \`${entry.version}\`` : ''} — ${USAGE[entry.usage]}`;
        return `| ${cell(name)} | ${cell(entry.role)} | ${links(entry)} | ${cell(entry.when)} |`;
      }),
      '',
    );
  }
  return parts.join('\n').trim();
}
