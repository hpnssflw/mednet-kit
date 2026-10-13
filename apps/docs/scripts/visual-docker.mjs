// Запускает скриншот- и a11y-тесты в официальном Linux-образе Playwright (шрифты рендерятся
// одинаково на любой машине). Репозиторий монтируется только для чтения исходников:
// внутри контейнера свои node_modules (бинарники Windows там не работают).
// --update — перезаписать эталоны в apps/docs/tests/__screenshots__.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const IMAGE = 'mcr.microsoft.com/playwright:v1.64.0-noble';
const PNPM = '10.34.6';
const update = process.argv.includes('--update');
const repo = fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\/]$/, '');

const script = [
  'set -euo pipefail',
  'mkdir -p /work',
  'tar -C /src --exclude=node_modules --exclude=.turbo --exclude=dist --exclude=.next --exclude=out --exclude=.git --exclude=public/static-demo -cf - . | tar -C /work -xf -',
  'cd /work',
  `npm install -g pnpm@${PNPM} >/dev/null`,
  'pnpm install --frozen-lockfile',
  'pnpm turbo run build --filter=docs...',
  'cd apps/docs',
  `pnpm exec playwright test ${update ? '--update-snapshots' : ''} || { cp -r playwright-report test-results /src/apps/docs/ 2>/dev/null; exit 1; }`,
  ...(update
    ? [
        'rm -rf /src/apps/docs/tests/__screenshots__',
        'cp -r tests/__screenshots__ /src/apps/docs/tests/',
      ]
    : []),
].join('\n');

const result = spawnSync(
  'docker',
  ['run', '--rm', '--ipc=host', '-v', `${repo}:/src`, IMAGE, 'bash', '-c', script],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
