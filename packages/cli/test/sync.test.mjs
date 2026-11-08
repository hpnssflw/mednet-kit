import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, addKit, run, write, read, tree } from './helpers.mjs';

const install = ['agent', 'install', 'codex', '--json'];
const sync = ['agent', 'sync', '--json'];
const skill = '.agents/skills/mednet-kit/SKILL.md';
const lock = '.mednet/agent-lock.json';

test('sync after package update changes only installer state and preserves npm files', (t) => {
  const root = fixture(t, { surface: 'react' });
  assert.equal(run(root, install).status, 0);
  addKit(root, { version: '2.3.0' });
  write(root, 'package-lock.json', '{"lockfileVersion":3}\n');
  const packageBytes = read(root, 'package.json'),
    npmLock = read(root, 'package-lock.json'),
    skillBytes = read(root, skill);
  const result = run(root, sync);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(read(root, lock)).projects[0].versions['@mednet/ui'], '2.3.0');
  assert.equal(read(root, skill), skillBytes);
  assert.equal(read(root, 'package.json'), packageBytes);
  assert.equal(read(root, 'package-lock.json'), npmLock);
});

test('sync dry-run and a subsequent no-op never modify bytes or lock mtime', (t) => {
  const root = fixture(t, { surface: 'html' });
  assert.equal(run(root, install).status, 0);
  addKit(root, { surface: 'html', version: '2.3.0' });
  const before = tree(root);
  assert.equal(run(root, [...sync, '--dry-run']).status, 0);
  assert.deepEqual(tree(root), before);
  assert.equal(run(root, sync).status, 0);
  const after = tree(root),
    mtime = fs.statSync(path.join(root, lock)).mtimeMs;
  const noOp = run(root, sync);
  assert.equal(noOp.status, 0);
  assert.deepEqual(noOp.json.changes, []);
  assert.deepEqual(tree(root), after);
  assert.equal(fs.statSync(path.join(root, lock)).mtimeMs, mtime);
});

test('sync restores a missing owned file and reports the restoration', (t) => {
  const root = fixture(t, { surface: 'react' });
  assert.equal(run(root, install).status, 0);
  const original = read(root, skill);
  fs.unlinkSync(path.join(root, skill));
  const result = run(root, sync);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.json.changes.some((c) => c.path === skill && c.action === 'restore'));
  assert.equal(read(root, skill), original);
});

test('sync refuses user-edited skill and edited managed block without any partial update', (t) => {
  for (const target of [skill, 'AGENTS.md']) {
    const root = fixture(t, { surface: 'react' });
    assert.equal(run(root, [...install, '--instructions', 'managed-block']).status, 0);
    const original = read(root, target);
    write(
      root,
      target,
      target === skill ? original + '\nМой текст\n' : original.replace('справку', 'мою справку'),
    );
    addKit(root, { version: '2.3.0' });
    const before = tree(root);
    assert.equal(run(root, sync).status, 1);
    assert.deepEqual(tree(root), before);
  }
});

test('corrupt and unknown-major locks are refused before mutation', (t) => {
  for (const value of ['{broken', { schemaVersion: 99 }]) {
    const root = fixture(t, { surface: 'react' });
    write(root, lock, value);
    const before = tree(root);
    assert.equal(run(root, sync).status, 1);
    assert.deepEqual(tree(root), before);
  }
});

test('lock file paths cannot introduce traversal writes', (t) => {
  const root = fixture(t, { surface: 'react' });
  assert.equal(run(root, install).status, 0);
  const state = JSON.parse(read(root, lock));
  state.files['../../outside.md'] = { sha256: '0'.repeat(64) };
  write(root, lock, state);
  const before = tree(root);
  assert.equal(run(root, sync).status, 1);
  assert.deepEqual(tree(root), before);
});

test('root sync reconciles every registered application across independent releases', (t) => {
  const root = fixture(t);
  write(root, 'package.json', { private: true, workspaces: ['apps/*'] });
  for (const [name, version] of [
    ['web', '2.2.1'],
    ['old', '2.1.0'],
  ]) {
    write(root, 'apps/' + name + '/package.json', { name });
    addKit(path.join(root, 'apps', name), { version });
    assert.equal(run(root, [...install, '--project', 'apps/' + name]).status, 0);
  }
  addKit(path.join(root, 'apps/web'), { version: '2.3.0' });
  const result = run(root, sync);
  assert.equal(result.status, 0, result.stderr);
  const projects = JSON.parse(read(root, lock)).projects;
  assert.deepEqual(
    projects.map((p) => [p.root, p.versions['@mednet/ui']]),
    [
      ['apps/old', '2.1.0'],
      ['apps/web', '2.3.0'],
    ],
  );
});

test('one incompatible registered project blocks all writes in root sync', (t) => {
  const root = fixture(t);
  write(root, 'package.json', { workspaces: ['apps/*'] });
  for (const name of ['a', 'b']) {
    write(root, 'apps/' + name + '/package.json', { name });
    addKit(path.join(root, 'apps', name));
    assert.equal(run(root, [...install, '--project', 'apps/' + name]).status, 0);
  }
  addKit(path.join(root, 'apps/a'), { version: '2.3.0' });
  addKit(path.join(root, 'apps/b'), { tokensVersion: '3.0.0' });
  const before = tree(root);
  assert.equal(run(root, sync).status, 1);
  assert.deepEqual(tree(root), before);
});

test('project-scope sync from a deep directory finds its own lock', (t) => {
  const root = fixture(t);
  write(root, 'package.json', { workspaces: ['apps/*'] });
  write(root, 'apps/web/package.json', { name: 'web' });
  addKit(path.join(root, 'apps/web'));
  assert.equal(run(root, [...install, '--project', 'apps/web', '--scope', 'project']).status, 0);
  const result = run(path.join(root, 'apps/web/src'), sync);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(root, lock)), false);
});

test('sync without installation is read-only and reports the missing lock', (t) => {
  const root = fixture(t, { surface: 'react' }),
    before = tree(root);
  assert.equal(run(root, sync).status, 1);
  assert.deepEqual(tree(root), before);
});
