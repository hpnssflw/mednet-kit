import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, addKit, run, write, read, tree } from './helpers.mjs';

const skill = '.agents/skills/mednet-kit/SKILL.md';
const lock = '.mednet/agent-lock.json';
const install = ['agent', 'install', 'codex', '--json'];

test('dry-run describes paths and provenance while leaving the complete tree unchanged', (t) => {
  const root = fixture(t, { surface: 'react' }),
    before = tree(root);
  const result = run(root, [...install, '--dry-run']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.dryRun, true);
  assert.ok(result.json.changes.some((c) => c.path === skill && c.action === 'create'));
  assert.equal(result.json.projects[0].surface, 'react');
  assert.deepEqual(tree(root), before);
});

test('default install owns only its files and emits a snippet without creating AGENTS', (t) => {
  const root = fixture(t, { surface: 'react' });
  const result = run(root, install);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(root, skill)));
  assert.equal(fs.existsSync(path.join(root, 'AGENTS.md')), false);
  assert.match(result.json.snippet, /mednet-kit/);
  const state = JSON.parse(read(root, lock));
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.projects[0].root, '.');
  assert.equal(state.projects[0].versions['@mednet/ui'], '2.2.1');
  assert.ok(state.files[skill].sha256);
  assert.equal(Object.values(tree(root)).includes('undefined'), false);
});

test('second identical install is a byte and mtime no-op', (t) => {
  const root = fixture(t, { surface: 'html' });
  assert.equal(run(root, install).status, 0);
  const before = tree(root),
    mtime = fs.statSync(path.join(root, lock)).mtimeMs;
  const result = run(root, install);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.json.changes, []);
  assert.deepEqual(tree(root), before);
  assert.equal(fs.statSync(path.join(root, lock)).mtimeMs, mtime);
});

test('managed block preserves CRLF, BOM, Unicode and bytes outside its own appended block', (t) => {
  const root = fixture(t, { surface: 'react' });
  const original = '\uFEFF# Рабочие правила\r\n\r\nНичего не удалять. €\r\n';
  write(root, 'AGENTS.md', original);
  const first = run(root, [...install, '--instructions', 'managed-block']);
  assert.equal(first.status, 0, first.stderr);
  const text = read(root, 'AGENTS.md');
  assert.ok(text.startsWith(original));
  assert.equal(text.replace(/\r\n/g, '').includes('\n'), false);
  assert.equal((text.match(/<!-- BEGIN:mednet-kit -->/g) ?? []).length, 1);
  assert.equal(run(root, [...install, '--instructions', 'managed-block']).status, 0);
  assert.equal(read(root, 'AGENTS.md'), text);
});

test('foreign skill without lock is never adopted, even when bytes happen to match another installation', (t) => {
  const source = fixture(t, { surface: 'react' }),
    root = fixture(t, { surface: 'react' });
  assert.equal(run(source, install).status, 0);
  write(root, skill, read(source, skill));
  const before = tree(root),
    result = run(root, install);
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(tree(root), before);
});

test('user edit to an owned skill blocks the whole plan before AGENTS or lock changes', (t) => {
  const root = fixture(t, { surface: 'react' });
  assert.equal(run(root, install).status, 0);
  write(root, skill, read(root, skill) + '\nМои инструкции\n');
  const before = tree(root);
  const result = run(root, [...install, '--instructions', 'managed-block']);
  assert.equal(result.status, 1);
  assert.deepEqual(tree(root), before);
});

test('edits outside managed block are preserved during another install', (t) => {
  const root = fixture(t, { surface: 'react' });
  assert.equal(run(root, [...install, '--instructions', 'managed-block']).status, 0);
  const edited = '# Новые правила проекта\n' + read(root, 'AGENTS.md') + '\nЛокальный запрет.\n';
  write(root, 'AGENTS.md', edited);
  assert.equal(run(root, [...install, '--instructions', 'managed-block']).status, 0);
  assert.equal(read(root, 'AGENTS.md'), edited);
});

test('manual kit guidance is recognized without adding another block', (t) => {
  const root = fixture(t, { surface: 'react' });
  const original = '# Правила\nЧитайте node_modules/@mednet/ui/llms.md.\n';
  write(root, 'AGENTS.md', original);
  const result = run(root, [...install, '--instructions', 'managed-block']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(root, 'AGENTS.md'), original);
});

test('symlink or junction .agents is rejected without writing through it', (t) => {
  const root = fixture(t, { surface: 'react' }),
    outside = fixture(t);
  fs.symlinkSync(
    outside,
    path.join(root, '.agents'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  const before = tree(root),
    external = tree(outside);
  assert.equal(run(root, install).status, 1);
  assert.deepEqual(tree(root), before);
  assert.deepEqual(tree(outside), external);
});

test('AGENTS override is reported and kept intact', (t) => {
  const root = fixture(t, { surface: 'react' });
  write(root, 'AGENTS.override.md', 'Мои правила.\n');
  const result = run(root, install);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    result.json.checks.some((c) => c.id === 'instructions.override' && c.status === 'warn'),
  );
  assert.equal(read(root, 'AGENTS.override.md'), 'Мои правила.\n');
});

test('project scope rejects a planned duplicate of an inherited mednet-kit skill', (t) => {
  const root = fixture(t);
  write(root, 'package.json', { workspaces: ['apps/*'] });
  write(root, 'apps/web/package.json', { name: 'web' });
  addKit(path.join(root, 'apps/web'));
  write(
    root,
    '.agents/skills/other/SKILL.md',
    '---\nname: mednet-kit\ndescription: Existing skill\n---\n',
  );
  const before = tree(root);
  assert.equal(run(root, [...install, '--project', 'apps/web', '--scope', 'project']).status, 1);
  assert.deepEqual(tree(root), before);
});

test('an interrupted transaction is diagnosed and blocks further writes', (t) => {
  const root = fixture(t, { surface: 'react' });
  write(root, '.mednet/.agent-transaction.json', { schemaVersion: 1, pending: true });
  const before = tree(root);
  assert.equal(run(root, install).status, 1);
  const doctor = run(root, ['doctor', '--json']);
  assert.equal(doctor.status, 1);
  assert.ok(doctor.json.checks.some((c) => c.id === 'agent.transaction' && c.status === 'fail'));
  assert.deepEqual(tree(root), before);
});

test('installed resolver works without any CLI dependency in the consumer', (t) => {
  const root = fixture(t, { surface: 'html' });
  assert.equal(run(root, install).status, 0);
  const helper = path.join(root, '.agents/skills/mednet-kit/scripts/resolve-kit.mjs');
  const result = run(root, [], helper);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.json.projects[0].surface, 'html');
  assert.equal(result.json.projects[0].packages[0].name, '@mednet/css');
});

test('install without a declared kit refuses to mutate the project', (t) => {
  const root = fixture(t),
    before = tree(root);
  assert.equal(run(root, install).status, 1);
  assert.deepEqual(tree(root), before);
});
