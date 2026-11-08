import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, write, read, run, tree, addKit } from './helpers.mjs';
import { version } from '../src/version.mjs';

test('standalone pnpm install explicitly ignores an unrelated ancestor workspace', (t) => {
  const root = fixture(t, { surface: 'html' });
  const result = run(root, ['update', '--package-manager', 'pnpm', '--dry-run', '--json']);
  assert.equal(result.status, 0, result.stdout);
  assert.ok(result.json.install.args.includes('--ignore-workspace'));
});

test('an explicitly selected package outside workspace globs keeps its own install root', (t) => {
  const root = fixture(t);
  write(root, 'package.json', {
    private: true,
    packageManager: 'pnpm@10.34.6',
    workspaces: ['apps/*'],
  });
  write(root, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  const independent = path.join(root, 'tools', 'consumer');
  write(independent, 'package.json', { name: 'independent', packageManager: 'npm@11.13.0' });
  addKit(independent);
  const before = tree(root),
    result = run(root, ['update', '--project', 'tools/consumer', '--dry-run', '--json']);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.json.install.cwd, independent);
  assert.equal(result.json.install.command, 'npm');
  assert.deepEqual(tree(root), before);
});

test('update verifies UI tokens in the UI package context even without a direct declaration', async (t) => {
  const { planUpdate, installUpdate } = await import('../src/update.mjs');
  const root = fixture(t, { surface: 'react', tokensVersion: '2.2.0' });
  const plan = planUpdate({ cwd: root, to: '2.2.1' });
  assert.equal(installUpdate(plan, { runner: () => ({ status: 0 }) }).status, 'failed');
  addKit(root, { surface: 'react', version: '2.2.1' });
  const repaired = planUpdate({ cwd: root, to: '2.2.1' });
  assert.equal(installUpdate(repaired, { runner: () => ({ status: 0 }) }).status, 'complete');
});

test('successful manager exit is insufficient when overrides keep an old kit installed', async (t) => {
  const { planUpdate, installUpdate } = await import('../src/update.mjs');
  const root = fixture(t, { surface: 'html' });
  const plan = planUpdate({ cwd: root, to: '3.0.0' });
  const result = installUpdate(plan, { runner: () => ({ status: 0 }) });
  assert.equal(result.status, 'failed');
  assert.equal(plan.checks.at(-1).status, 'fail');
});

test('a successful installation confirms the exact declared release', async (t) => {
  const { planUpdate, installUpdate } = await import('../src/update.mjs');
  const root = fixture(t, { surface: 'html' });
  const plan = planUpdate({ cwd: root, to: '2.2.1' });
  const result = installUpdate(plan, { runner: () => ({ status: 0 }) });
  assert.equal(result.status, 'complete');
  assert.equal(plan.checks.at(-1).status, 'pass');
});

test('install failure reports the already prepared manifest and a retry command', async (t) => {
  const { planUpdate, installUpdate } = await import('../src/update.mjs');
  const root = fixture(t, { surface: 'html' });
  const plan = planUpdate({ cwd: root, to: '3.0.0' });
  let invoked;
  const install = installUpdate(plan, {
    runner(command, args, options) {
      invoked = { command, args, options };
      return { status: 1, stderr: 'registry unavailable' };
    },
  });
  assert.equal(install.status, 'failed');
  assert.equal(invoked.options.cwd, root);
  assert.ok(invoked.args.join(' ').includes('--ignore-scripts'));
  assert.equal(invoked.options.shell, false);
  assert.equal(plan.checks.at(-1).status, 'fail');
  assert.match(plan.checks.at(-1).message, /повторите mednet update/);
});

test('update dry-run selects CLI release and never writes or runs project scripts', (t) => {
  const root = fixture(t, { surface: 'react' }),
    before = tree(root);
  const result = run(root, ['update', '--dry-run', '--json']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.json.targetVersion, version);
  assert.equal(result.json.install.command, 'npm');
  assert.deepEqual(result.json.install.args, ['install', '--ignore-scripts']);
  assert.deepEqual(tree(root), before);
});
test('update preserves manifest bytes outside declared kit version strings', (t) => {
  const root = fixture(t);
  const original =
    '\uFEFF{\r\n  "name": "consumer",\r\n  "dependencies": { "@mednet/ui": "^2.1.0", "react": "^19.0.0" },\r\n  "devDependencies": { "@mednet/lint-config": "~2.0.0" },\r\n  "scripts": { "postinstall": "throw do-not-run" }\r\n}\r\n';
  write(root, 'package.json', original);
  const result = run(root, ['update', '--to', '3.0.0', '--no-install', '--json']);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(
    read(root, 'package.json'),
    original.replace('^2.1.0', '3.0.0').replace('~2.0.0', '3.0.0'),
  );
  assert.equal(result.json.install.status, 'pending');
  assert.ok(result.json.checks.some((c) => c.status === 'warn'));
});
test('update can repair declarations even when installed packages are absent', (t) => {
  const root = fixture(t);
  write(root, 'package.json', { name: 'broken', dependencies: { '@mednet/css': '^1.0.0' } });
  assert.equal(run(root, ['update', '--to', '2.2.1', '--no-install']).status, 0);
  assert.equal(JSON.parse(read(root, 'package.json')).dependencies['@mednet/css'], '2.2.1');
});
test('workspace/file references, invalid target and unknown flags leave project unchanged', (t) => {
  const root = fixture(t);
  for (const value of ['workspace:*', 'file:../ui', 'npm:other@1', 'latest']) {
    write(root, 'package.json', { dependencies: { '@mednet/ui': value } });
    const before = tree(root);
    assert.equal(run(root, ['update', '--to', '3.0.0', '--no-install']).status, 2);
    assert.deepEqual(tree(root), before);
  }
  assert.equal(run(root, ['update', '--to', 'latest', '--no-install']).status, 2);
  assert.equal(run(root, ['update', '--palette', 'graphite']).status, 2);
});
test('a workspace update requires a project and uses its package manager at workspace root', (t) => {
  const root = fixture(t);
  write(root, 'package.json', {
    private: true,
    packageManager: 'pnpm@10.34.6',
    workspaces: ['apps/*'],
  });
  write(root, 'pnpm-workspace.yaml', 'packages:\n  - apps/*\n');
  write(root, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  for (const name of ['a', 'b']) {
    const dir = path.join(root, 'apps', name);
    write(dir, 'package.json', { name });
    addKit(dir);
  }
  assert.equal(run(root, ['update', '--dry-run']).status, 2);
  const before = tree(root),
    selected = run(root, ['update', '--project', 'apps/a', '--dry-run', '--json']);
  assert.equal(selected.status, 0, selected.stdout);
  assert.equal(selected.json.install.command, 'pnpm');
  assert.equal(selected.json.install.cwd, root);
  assert.deepEqual(selected.json.install.args, [
    'install',
    '--ignore-scripts',
    '--ignore-pnpmfile',
  ]);
  assert.deepEqual(tree(root), before);
});
test('conflicting package manager evidence requires an explicit choice', (t) => {
  const root = fixture(t, { surface: 'html' });
  write(root, 'package-lock.json', '{}\n');
  write(root, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  const before = tree(root);
  assert.equal(run(root, ['update', '--dry-run']).status, 2);
  assert.equal(run(root, ['update', '--package-manager', 'pnpm', '--dry-run']).status, 0);
  assert.deepEqual(tree(root), before);
});
test('a junction manifest target is rejected before writing', (t) => {
  const root = fixture(t),
    outside = fixture(t, { surface: 'html' });
  fs.symlinkSync(
    outside,
    path.join(root, 'linked'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  const before = tree(outside);
  assert.equal(run(root, ['update', '--project', 'linked', '--no-install']).status, 2);
  assert.deepEqual(tree(outside), before);
});
