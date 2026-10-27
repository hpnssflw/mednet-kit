import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../../../scripts/build-agent-guides.mjs', import.meta.url));
const read = (pkg: string) =>
  readFileSync(new URL(`../../${pkg}/llms.md`, import.meta.url), 'utf8');

describe('справка для агентов', () => {
  it('llms.md пакетов собраны из docs/agent-guide (pnpm build:agent-guides)', () => {
    expect(() => execFileSync(process.execPath, [script, '--check'])).not.toThrow();
  });

  it.each(['tokens', 'css', 'lint-config'])(
    '%s: в справке есть карта пакетов, линтеры и бренд',
    (pkg) => {
      const text = read(pkg);
      expect(text).toContain('## Карта пакетов');
      expect(text).toContain('## Линтеры');
      expect(text).toContain('## Бренд ЦНИИОИЗ');
    },
  );
});
