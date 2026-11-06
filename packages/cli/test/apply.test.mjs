import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fixture, write, tree } from './helpers.mjs';
import { discoverKit } from '../src/discover.mjs';
import { planInstall } from '../src/plan.mjs';
import { applyPlan } from '../src/apply.mjs';

test('failure on second filesystem replacement rolls back first replacement and removes scratch', (t) => {
  const root = fixture(t, { surface: 'react' }),
    before = tree(root);
  const plan = planInstall({ discovery: discoverKit({ cwd: root }) });
  const rename = fs.renameSync;
  let attempts = 0;
  const mock = t.mock.method(fs, 'renameSync', (...args) => {
    if (++attempts === 2) throw Object.assign(new Error('Disk failure'), { code: 'EIO' });
    return Reflect.apply(rename, fs, args);
  });
  assert.throws(() => applyPlan(plan), /восстановлены/);
  mock.mock.restore();
  assert.deepEqual(tree(root), before);
});

test('a file changed between planning and apply is preserved and prevents all writes', (t) => {
  const root = fixture(t, { surface: 'react' });
  const plan = planInstall({
    discovery: discoverKit({ cwd: root }),
    instructionsMode: 'managed-block',
  });
  write(root, 'AGENTS.md', 'Конкурентная правка.\n');
  const before = tree(root);
  assert.throws(() => applyPlan(plan), /изменился/);
  assert.deepEqual(tree(root), before);
});
