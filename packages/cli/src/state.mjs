import fs from 'node:fs';
import path from 'node:path';
import { CliError, bytesAt, hash, safeDestination } from './paths.mjs';

export const skillDirectory = '.agents/skills/mednet-kit';
export const ownedFiles = [
  'SKILL.md',
  'scripts/resolve-kit.mjs',
  'scripts/discover.mjs',
  'scripts/paths.mjs',
].map((name) => skillDirectory + '/' + name);
export const lockPath = '.mednet/agent-lock.json';
export const journalPath = '.mednet/.agent-transaction.json';
const begin = Buffer.from('<!-- BEGIN:mednet-kit -->');
const end = Buffer.from('<!-- END:mednet-kit -->');
export function managedBlock(bytes) {
  if (!bytes) return null;
  const start = bytes.indexOf(begin),
    finish = bytes.indexOf(end);
  if (start < 0 && finish < 0) return null;
  if (
    start < 0 ||
    finish < start ||
    bytes.indexOf(begin, start + begin.length) >= 0 ||
    bytes.indexOf(end, finish + end.length) >= 0
  )
    throw new CliError('Повреждён или продублирован managed block mednet-kit в AGENTS.md');
  return { start, end: finish + end.length, bytes: bytes.subarray(start, finish + end.length) };
}
export function readLock(root) {
  const file = safeDestination(root, lockPath),
    bytes = bytesAt(file);
  if (!bytes) return null;
  try {
    const lock = JSON.parse(bytes.toString('utf8'));
    if (
      lock.schemaVersion !== 1 ||
      lock.agent !== 'codex' ||
      typeof lock.loaderVersion !== 'string' ||
      !/^\d+\.\d+\.\d+$/.test(lock.loaderVersion) ||
      !['repo', 'project'].includes(lock.scope)
    )
      throw new Error('schema');
    if (
      !lock.files ||
      Object.keys(lock.files).length !== ownedFiles.length ||
      Object.keys(lock.files).some((key) => !ownedFiles.includes(key))
    )
      throw new Error('files');
    for (const name of ownedFiles)
      if (!/^[a-f0-9]{64}$/.test(lock.files[name]?.sha256)) throw new Error('digest');
    if (
      !lock.instructions ||
      !['snippet', 'managed-block'].includes(lock.instructions.mode) ||
      (lock.instructions.block && !/^[a-f0-9]{64}$/.test(lock.instructions.block))
    )
      throw new Error('instructions');
    if (!Array.isArray(lock.projects) || !lock.projects.length || lock.projects.length > 100)
      throw new Error('projects');
    const roots = new Set();
    for (const project of lock.projects) {
      if (
        typeof project.root !== 'string' ||
        roots.has(project.root) ||
        !['react', 'html', 'tokens'].includes(project.surface)
      )
        throw new Error('project');
      if (project.root !== '.') safeDestination(root, project.root + '/package.json');
      if (
        !project.versions ||
        !Object.keys(project.versions).length ||
        Object.entries(project.versions).some(
          ([key, value]) =>
            !['@mednet/ui', '@mednet/css', '@mednet/tokens', '@mednet/lint-config'].includes(key) ||
            typeof value !== 'string' ||
            !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(value),
        )
      )
        throw new Error('versions');
      roots.add(project.root);
    }
    return lock;
  } catch {
    throw new CliError('Повреждён или несовместим .mednet/agent-lock.json; файлы сохранены');
  }
}
export function assertNoTransaction(root) {
  if (fs.existsSync(safeDestination(root, journalPath)))
    throw new CliError(
      'Обнаружена незавершённая операция .mednet/.agent-transaction.json; проверьте сохранённый journal и восстановите файлы перед повторной установкой',
    );
}
export function ownedDrift(root, lock) {
  const problems = [];
  for (const name of ownedFiles) {
    const bytes = bytesAt(safeDestination(root, name));
    if (!bytes || hash(bytes) !== lock.files[name].sha256) problems.push(name);
  }
  if (lock.instructions.block) {
    const block = managedBlock(bytesAt(safeDestination(root, 'AGENTS.md')));
    if (!block || hash(block.bytes) !== lock.instructions.block) problems.push('AGENTS.md');
  }
  return problems;
}
