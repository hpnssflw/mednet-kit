import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { version } from '../src/version.mjs';
import { fixture, addKit, run, write, tree } from './helpers.mjs';

test('help describes executable commands', (t) => {
  const result = run(fixture(t), ['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /agent install codex/);
  assert.match(result.stdout, /agent sync/);
  assert.match(result.stdout, /doctor/);
});

test('version is the package version', (t) => {
  const result = run(fixture(t), ['--version']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), version);
});

test('bad flags and missing flag values are usage failures', (t) => {
  const root = fixture(t);
  for (const args of [
    ['doctor', '--wat', '--json'],
    ['doctor', '--project'],
    ['agent', 'install', 'unknown'],
    ['doctor', '--dry-run'],
    ['agent', 'sync', '--scope', 'repo'],
  ]) {
    const result = run(root, args);
    assert.equal(result.status, 2, result.stderr);
  }
});

test('doctor in a project without kit is not applicable and never installs anything', (t) => {
  const root = fixture(t),
    before = tree(root);
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.json.projects, []);
  assert.ok(result.json.checks.some((c) => c.id === 'kit' && c.status === 'not-applicable'));
  assert.deepEqual(tree(root), before);
});

test('doctor resolves declared ui and its tokens without executing either package', (t) => {
  const root = fixture(t, { surface: 'react' }),
    before = tree(root);
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.schemaVersion, 1);
  assert.equal(result.json.projects[0].surface, 'react');
  assert.deepEqual(
    result.json.projects[0].packages.map((p) => [p.name, p.version]),
    [
      ['@mednet/ui', '2.2.1'],
      ['@mednet/tokens', '2.2.1'],
    ],
  );
  assert.ok(result.json.checks.some((c) => c.id === 'knowledge' && c.status === 'warn'));
  assert.deepEqual(tree(root), before);
});

test('pnpm isolated symlinks resolve tokens in ui context', (t) => {
  const root = fixture(t, { surface: 'react', isolated: true });
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.projects[0].packages[1].version, '2.2.1');
  assert.match(result.json.projects[0].packages[1].root, /kit-2.2.1/);
});

test('css-only ignores incidental hoisted ui and requires no react or tokens', (t) => {
  const root = fixture(t, { surface: 'html' });
  write(root, 'node_modules/@mednet/ui/package.json', { name: '@mednet/ui', version: '99.0.0' });
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.projects[0].surface, 'html');
  assert.deepEqual(
    result.json.projects[0].packages.map((p) => p.name),
    ['@mednet/css'],
  );
});

test('tokens-only projects are supported', (t) => {
  const result = run(fixture(t, { surface: 'tokens' }), ['doctor', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.projects[0].surface, 'tokens');
});

test('missing declared package is a blocking diagnosis', (t) => {
  const root = fixture(t);
  write(root, 'package.json', { dependencies: { '@mednet/ui': '^2.2.1' } });
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.json.status, 'fail');
  assert.ok(result.json.checks.some((c) => c.id === 'package.resolve' && c.status === 'fail'));
});

test('different ui and ui-dependent tokens releases are explicitly unsupported', (t) => {
  const root = fixture(t, { surface: 'react', tokensVersion: '3.0.0' });
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 1, result.stderr);
  assert.ok(result.json.checks.some((c) => c.id === 'versions' && c.status === 'fail'));
});

test('monorepo root diagnoses both versions while leaf and --project select the same application', (t) => {
  const root = fixture(t);
  write(root, 'package.json', { private: true, workspaces: ['apps/*'] });
  for (const [name, version] of [
    ['web', '2.2.1'],
    ['legacy', '2.1.0'],
  ]) {
    write(root, 'apps/' + name + '/package.json', { name });
    addKit(path.join(root, 'apps', name), { version, isolated: true });
  }
  const all = run(root, ['doctor', '--json']);
  assert.equal(all.status, 0, all.stderr);
  assert.equal(all.json.projects.length, 2);
  const leaf = run(path.join(root, 'apps/web/src'), ['doctor', '--json']);
  const selected = run(root, ['doctor', '--project', 'apps/web', '--json']);
  assert.deepEqual(leaf.json.projects, selected.json.projects);
  assert.deepEqual(
    selected.json.projects[0].packages.map((p) => p.version),
    ['2.2.1', '2.2.1'],
  );
});

test('two explicit surfaces require an explicit surface selection', (t) => {
  const root = fixture(t, { surface: 'react' });
  addKit(root, { surface: 'html' });
  assert.equal(run(root, ['doctor', '--json']).status, 1);
  const selected = run(root, ['doctor', '--surface', 'html', '--json']);
  assert.equal(selected.status, 0, selected.stderr);
  assert.equal(selected.json.projects[0].surface, 'html');
});

test('new metadata contracts are not silently treated as legacy', (t) => {
  const root = fixture(t, { surface: 'react' });
  write(root, 'node_modules/@mednet/ui/package.json', {
    name: '@mednet/ui',
    version: '2.2.1',
    exports: {
      './package.json': './package.json',
      './agent/manifest.json': './agent/manifest.json',
    },
  });
  write(root, 'node_modules/@mednet/ui/agent/manifest.json', {
    schemaVersion: 99,
    contractVersion: '99.0.0',
  });
  const result = run(root, ['doctor', '--json']);
  assert.equal(result.status, 1);
  assert.ok(result.json.checks.some((c) => c.id === 'knowledge.contract' && c.status === 'fail'));
});

test('dynamic styles and lint configuration remain unknown, never claimed effective', (t) => {
  const root = fixture(t, { surface: 'react' });
  fs.unlinkSync(path.join(root, 'src/main.css'));
  fs.unlinkSync(path.join(root, 'src/main.js'));
  write(root, 'vite.config.js', 'throw new Error("do not execute config")');
  const result = run(root, ['doctor', '--json', '--chrome109']);
  assert.equal(result.status, 0, result.stderr);
  for (const id of ['styles', 'fonts', 'lint', 'chrome109'])
    assert.ok(
      result.json.checks.some((c) => c.id === id && c.status === 'unknown'),
      id,
    );
});

test('explicit project outside repository is rejected without inspecting it', (t) => {
  const root = fixture(t, { surface: 'react' }),
    outside = fixture(t, { surface: 'html' });
  const before = tree(outside);
  const result = run(root, ['doctor', '--project', outside, '--json']);
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(tree(outside), before);
});
