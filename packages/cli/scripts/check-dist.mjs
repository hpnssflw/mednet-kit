import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
for (const name of [
  'package.json',
  'LICENSE',
  'README.md',
  'llms.md',
  'agents/codex/mednet-kit/SKILL.md',
  'dist/cli.mjs',
  'dist/discover.mjs',
  'dist/paths.mjs',
  'dist/resolve-kit.mjs',
  'dist/plan.mjs',
  'dist/apply.mjs',
  'dist/sync.mjs',
  'dist/state.mjs',
  'dist/version.mjs',
  'dist/doctor.mjs',
  'dist/theme.mjs',
  'dist/update.mjs',
]) {
  if (!fs.statSync(new URL(name, root), { throwIfNoEntry: false })?.isFile())
    throw new Error('@mednet/cli: отсутствует ' + name + '; выполните build.');
}
if (!fs.readFileSync(new URL('dist/cli.mjs', root), 'utf8').startsWith('#!/usr/bin/env node\n'))
  throw new Error('@mednet/cli: отсутствует shebang.');
for (const name of fs.readdirSync(new URL('dist/', root))) {
  if (!name.endsWith('.mjs')) continue;
  const file = new URL('dist/' + name, root);
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    if (!fs.existsSync(new URL(match[1], file)))
      throw new Error('Отсутствует импорт ' + match[1] + ' из ' + fileURLToPath(file));
  }
}
process.stdout.write('@mednet/cli: состав dist и шаблонов проверен.\n');
