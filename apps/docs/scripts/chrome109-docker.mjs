// Запускает scripts/chrome109.mjs в Docker-образе Playwright 1.29.2 (Chromium 109) на собранном out/.
// Next в образе не собрать (там Node 16), поэтому сначала: pnpm turbo run build --filter=docs...
// apps/docs монтируется только для чтения; playwright-core ставится внутри контейнера.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const IMAGE = 'mcr.microsoft.com/playwright:v1.29.2-focal';
const docs = fileURLToPath(new URL('../', import.meta.url)).replace(/[\/]$/, '');

if (!existsSync(`${docs}/out/index.html`)) {
  console.error('Нет apps/docs/out — сначала pnpm turbo run build --filter=docs...');
  process.exit(1);
}

const script = [
  'set -euo pipefail',
  'mkdir -p /tmp/smoke && cd /tmp/smoke',
  'npm init -y >/dev/null',
  'npm install --no-audit --no-fund playwright-core@1.29.2 >/dev/null',
  'cp /docs/scripts/chrome109.mjs .',
  '(node /docs/scripts/serve-out.mjs &)',
  'sleep 1',
  'node chrome109.mjs',
].join('\n');

const result = spawnSync(
  'docker',
  ['run', '--rm', '--ipc=host', '-v', `${docs}:/docs:ro`, IMAGE, 'bash', '-c', script],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
