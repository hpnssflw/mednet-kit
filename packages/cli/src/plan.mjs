import fs from 'node:fs';
import path from 'node:path';
import { CliError, bytesAt, hash, safeDestination, slash } from './paths.mjs';
import { instructionChecks } from './doctor.mjs';
import {
  readLock,
  managedBlock,
  assertNoTransaction,
  skillDirectory,
  ownedFiles,
  lockPath,
} from './state.mjs';
import { version, supportsLoader } from './version.mjs';

function templateFiles() {
  return [
    fs.readFileSync(new URL('../agents/codex/mednet-kit/SKILL.md', import.meta.url)),
    ...['resolve-kit.mjs', 'discover.mjs', 'paths.mjs'].map((name) =>
      fs.readFileSync(new URL(name, import.meta.url)),
    ),
  ];
}
/** @param {{discovery:any,scope?:string,instructionsMode?:string}} options */
export function planInstall({ discovery, scope, instructionsMode }) {
  if (discovery.projects.length !== 1 || discovery.checks.some((c) => c.status === 'fail'))
    throw new CliError('Установка требует одного проекта с разрешаемыми совместимыми пакетами');
  const project = discovery.projects[0],
    root = fs.realpathSync(scope === 'project' ? project.root : discovery.root);
  assertNoTransaction(root);
  const lock = readLock(root);
  if (lock && !supportsLoader(lock.loaderVersion))
    throw new CliError(
      'Loader новее CLI или имеет несовместимый major; используйте совместимую версию CLI',
    );
  if (lock && lock.scope !== (scope ?? 'repo'))
    throw new CliError('Область установленного loader отличается; используйте прежний --scope');
  const templates = templateFiles(),
    changes = [],
    checks = [...discovery.checks];
  const plannedSkill = path.join(root, skillDirectory, 'SKILL.md');
  const instructions = instructionChecks(discovery.root, project.root, plannedSkill);
  checks.push(...instructions);
  if (instructions.some((c) => c.status === 'fail'))
    throw new CliError(
      'Конфликт обнаружения mednet-kit skill; устраните дублирование перед установкой',
    );
  const directory = safeDestination(root, skillDirectory);
  if (!lock && fs.existsSync(directory) && fs.readdirSync(directory).length)
    throw new CliError(
      'Чужой mednet-kit skill без ownership lock; автоматическая перезапись запрещена',
    );
  function add(name, content, owned = false) {
    const before = bytesAt(safeDestination(root, name));
    if (before?.equals(content)) return;
    changes.push({
      path: name,
      action: before ? 'update' : owned ? 'restore' : 'create',
      before,
      content,
    });
  }
  const files = {};
  for (const [index, name] of ownedFiles.entries()) {
    const existing = bytesAt(safeDestination(root, name)),
      desired = templates[index];
    if (
      existing &&
      (!lock || (hash(existing) !== lock.files[name].sha256 && !existing.equals(desired)))
    )
      throw new CliError('Файл изменён пользователем или не принадлежит CLI: ' + name);
    files[name] = { sha256: hash(desired) };
    add(name, desired, Boolean(lock));
  }
  const agents = bytesAt(safeDestination(root, 'AGENTS.md'));
  const oldBlock = managedBlock(agents);
  if (oldBlock && !lock?.instructions.block)
    throw new CliError(
      'Найден непринадлежащий CLI managed block; автоматическое присвоение запрещено',
    );
  if (lock?.instructions.block && (!oldBlock || hash(oldBlock.bytes) !== lock.instructions.block))
    throw new CliError('Managed block AGENTS.md изменён или удалён пользователем');
  const mode = instructionsMode ?? lock?.instructions.mode ?? 'snippet';
  if (lock?.instructions.block && mode !== 'managed-block')
    throw new CliError('Смена managed-block на snippet требует ручного решения; блок сохранён');
  const newline = agents?.includes(Buffer.from('\r\n')) ? '\r\n' : '\n';
  const snippet =
    'Для интерфейсов на mednet-kit используйте .agents/skills/mednet-kit/SKILL.md и справку установленной версии из его resolver.';
  const block = Buffer.from(
    ['<!-- BEGIN:mednet-kit -->', snippet, '<!-- END:mednet-kit -->'].join(newline),
  );
  let blockHash = lock?.instructions.block ?? null;
  const manualReference =
    agents &&
    /(?:node_modules\/@mednet\/(?:ui|css|tokens)\/llms\.md|\.agents\/skills\/mednet-kit)/.test(
      agents.toString('utf8'),
    );
  if (mode === 'managed-block' && (oldBlock || !manualReference)) {
    if (
      agents &&
      (agents.subarray(0, 2).equals(Buffer.from([0xff, 0xfe])) ||
        agents.subarray(0, 2).equals(Buffer.from([0xfe, 0xff])))
    )
      throw new CliError(
        'AGENTS.md в UTF-16: автоматическая вставка UTF-8 блока запрещена; используйте snippet',
      );
    const updated = oldBlock
      ? Buffer.concat([agents.subarray(0, oldBlock.start), block, agents.subarray(oldBlock.end)])
      : Buffer.concat([
          agents ?? Buffer.alloc(0),
          Buffer.from(agents?.length ? newline + newline : ''),
          block,
          Buffer.from(newline),
        ]);
    add('AGENTS.md', updated);
    blockHash = hash(block);
  }
  const projectRecord = {
    root: slash(path.relative(root, project.root)) || '.',
    surface: project.surface,
    versions: Object.fromEntries(project.packages.map((p) => [p.name, p.version])),
  };
  const projects = [
    ...(lock?.projects ?? []).filter((p) => p.root !== projectRecord.root),
    projectRecord,
  ].sort((a, b) => a.root.localeCompare(b.root));
  const nextLock = {
    schemaVersion: 1,
    agent: 'codex',
    scope: scope ?? 'repo',
    loaderVersion: version,
    source: { package: '@mednet/cli', digest: hash(Buffer.concat(templates)) },
    projects,
    files,
    instructions: { mode, block: blockHash },
  };
  add(lockPath, Buffer.from(JSON.stringify(nextLock, null, 2) + '\n'));
  return {
    root,
    projects: discovery.projects,
    checks,
    changes,
    snippet: mode === 'snippet' ? snippet : null,
  };
}
