import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, addKit, run, write, read, tree } from './helpers.mjs';

const install = ['agent', 'install', 'codex', '--json'];

test('older CLI cannot downgrade a newer loader lock even within the same major', (t) => {
  const root = fixture(t, { surface: 'react' });
  assert.equal(run(root, install).status, 0);
  const lock = JSON.parse(read(root, '.mednet/agent-lock.json'));
  lock.loaderVersion = '2.3.0';
  write(root, '.mednet/agent-lock.json', lock);
  const before = tree(root);
  assert.equal(run(root, ['agent', 'sync', '--json']).status, 1);
  assert.deepEqual(tree(root), before);
});

test('body text after frontmatter is never mistaken for a skill name', (t) => {
  const root = fixture(t, { surface: 'react' });
  write(
    root,
    '.agents/skills/other/SKILL.md',
    '---\nname: other\ndescription: Some skill\n---\nname: mednet-kit\n',
  );
  const result = run(root, install);
  assert.equal(result.status, 0, result.stderr);
});

test('missing frontmatter name followed by body name is not a duplicate skill', (t) => {
  const root = fixture(t, { surface: 'react' });
  write(
    root,
    '.agents/skills/other/SKILL.md',
    '---\ndescription: Invalid unrelated skill\n---\nname: mednet-kit\n',
  );
  const result = run(root, install);
  assert.equal(result.status, 0, result.stderr);
});

test('pnpm workspace list discovers projects with no root node_modules', (t) => {
  const root = fixture(t);
  write(
    root,
    'pnpm-workspace.yaml',
    "packages:\n  - 'apps/*'\nonlyBuiltDependencies:\n  - esbuild\n",
  );
  write(root, 'apps/web/package.json', { name: 'web' });
  addKit(path.join(root, 'apps/web'), { surface: 'html', isolated: true });
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.projects[0].relativeRoot, 'apps/web');
  assert.equal(fs.existsSync(path.join(root, 'node_modules')), false);
});

test('explicit tokens from another release cannot silently shadow ui token context', (t) => {
  const root = fixture(t, { surface: 'react', isolated: true });
  const ui = path.join(root, 'node_modules/.pnpm/kit-2.2.1/node_modules/@mednet/ui');
  const tokensRoot = path.join(root, 'node_modules/@mednet/tokens');
  fs.mkdirSync(tokensRoot, { recursive: true });
  fs.cpSync(path.join(path.dirname(ui), 'tokens'), tokensRoot, { recursive: true });
  const tokens = JSON.parse(read(tokensRoot, 'package.json'));
  tokens.version = '2.1.0';
  write(tokensRoot, 'package.json', tokens);
  const pkg = JSON.parse(read(root, 'package.json'));
  pkg.dependencies['@mednet/tokens'] = '^2.1.0';
  write(root, 'package.json', pkg);
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 1, result.stderr);
  assert.ok(result.json.checks.some((c) => c.id === 'versions' && c.status === 'fail'));
});

test('doctor checks installed ownership and drift without changing any files', (t) => {
  const root = fixture(t, { surface: 'react' });
  assert.equal(run(root, install).status, 0);
  let before = tree(root);
  const good = run(root, ['doctor', '--json']);
  assert.equal(good.status, 0);
  assert.ok(good.json.checks.some((c) => c.id === 'agent.ownership' && c.status === 'pass'));
  assert.deepEqual(tree(root), before);
  write(root, '.agents/skills/mednet-kit/SKILL.md', 'User changes\n');
  before = tree(root);
  const bad = run(root, ['doctor', '--json']);
  assert.equal(bad.status, 1);
  assert.ok(bad.json.checks.some((c) => c.id === 'agent.ownership' && c.status === 'fail'));
  assert.deepEqual(tree(root), before);
});
