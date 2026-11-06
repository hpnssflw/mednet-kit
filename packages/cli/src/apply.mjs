import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { CliError, bytesAt, hash, safeDestination } from './paths.mjs';
import { ownedFiles, lockPath, journalPath, assertNoTransaction } from './state.mjs';

export function applyPlan(plan) {
  if (!plan.changes.length) return;
  assertNoTransaction(plan.root);
  for (const change of plan.changes) {
    if (![...ownedFiles, lockPath, 'AGENTS.md'].includes(change.path))
      throw new CliError('Неподдержанное назначение: ' + change.path);
    const current = bytesAt(safeDestination(plan.root, change.path));
    if (
      (current === null) !== (change.before === null) ||
      (current && !current.equals(change.before))
    )
      throw new CliError('Файл изменился после подготовки плана: ' + change.path);
  }
  const created = [],
    staged = [],
    applied = [];
  const stageName = '.mednet/.agent-stage-' + randomUUID();
  const stage = safeDestination(plan.root, stageName),
    journal = safeDestination(plan.root, journalPath);
  let journalCreated = false;
  function ensureDirectory(dir) {
    if (fs.existsSync(dir)) return;
    ensureDirectory(path.dirname(dir));
    fs.mkdirSync(dir);
    created.push(dir);
  }
  function cleanup() {
    for (const file of staged) if (fs.existsSync(file)) fs.unlinkSync(file);
    if (journalCreated) fs.unlinkSync(journal);
    for (const dir of created.reverse()) {
      try {
        fs.rmdirSync(dir);
      } catch (error) {
        if (!['ENOTEMPTY', 'ENOENT', 'EEXIST'].includes(error.code)) throw error;
      }
    }
  }
  try {
    ensureDirectory(stage);
    const entries = plan.changes.map((c) => ({
      path: c.path,
      before: c.before?.toString('base64') ?? null,
      afterSha256: hash(c.content),
    }));
    fs.writeFileSync(journal, JSON.stringify({ schemaVersion: 1, entries }, null, 2) + '\n', {
      flag: 'wx',
    });
    journalCreated = true;
    for (const [index, change] of plan.changes.entries()) {
      const file = path.join(stage, String(index));
      fs.writeFileSync(file, change.content, { flag: 'wx' });
      staged.push(file);
    }
    for (const [index, change] of plan.changes.entries()) {
      const target = safeDestination(plan.root, change.path);
      ensureDirectory(path.dirname(target));
      const current = bytesAt(target);
      if (
        (current === null) !== (change.before === null) ||
        (current && !current.equals(change.before))
      )
        throw new CliError('Файл изменился во время операции: ' + change.path);
      fs.renameSync(staged[index], target);
      applied.push(change);
    }
  } catch (error) {
    try {
      for (const change of applied.reverse()) {
        const target = safeDestination(plan.root, change.path),
          current = bytesAt(target);
        if (!current || hash(current) !== hash(change.content))
          throw new Error('Concurrent modification');
        if (change.before === null) fs.unlinkSync(target);
        else fs.writeFileSync(target, change.before);
      }
      cleanup();
    } catch {
      throw new CliError(
        'Операция прервана; journal сохранён в .mednet/.agent-transaction.json. Не повторяйте запись до проверки восстановления.',
      );
    }
    throw new CliError(
      'Запись не выполнена; применённые изменения восстановлены. ' +
        (error instanceof CliError ? error.message : 'Проверьте права и доступность файлов.'),
    );
  }
  cleanup();
}
