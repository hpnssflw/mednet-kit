import fs from 'node:fs';
import path from 'node:path';
import { ancestors, CliError, bytesAt, safeDestination, inside } from './paths.mjs';
import { discoverKit, repositoryRoot } from './discover.mjs';
import { readLock, assertNoTransaction, lockPath, journalPath } from './state.mjs';
import { planInstall } from './plan.mjs';

/** @param {{cwd?:string,project?:string}} options */
export function planSync({ cwd = process.cwd(), project } = {}) {
  const current = fs.realpathSync(cwd),
    repo = repositoryRoot(current);
  const requested = project === undefined ? current : path.resolve(current, project);
  if (!inside(repo, requested) || !fs.existsSync(requested))
    throw new CliError('--project находится вне репозитория или отсутствует', 2);
  const target = fs.realpathSync(requested);
  if (!inside(repo, target)) throw new CliError('--project через ссылку выходит из репозитория', 2);
  const scope = ancestors(repo, target)
    .reverse()
    .find(
      (dir) =>
        fs.existsSync(path.join(dir, lockPath)) || fs.existsSync(path.join(dir, journalPath)),
    );
  if (!scope) throw new CliError('Ownership lock не найден; сначала выполните agent install codex');
  assertNoTransaction(scope);
  const lock = readLock(scope);
  if (!lock) throw new CliError('Ownership lock не найден');
  const records =
    project === undefined
      ? lock.projects
      : lock.projects.filter((p) => path.resolve(scope, p.root) === target);
  if (!records.length) throw new CliError('Выбранный проект не зарегистрирован в ownership lock');
  const discoveries = records.map((record) => {
    const discovered = discoverKit({ cwd: scope, project: record.root, surface: record.surface });
    if (discovered.projects.length !== 1 || discovered.checks.some((c) => c.status === 'fail'))
      throw new CliError(
        'Один из зарегистрированных проектов не разрешается или несовместим: ' + record.root,
      );
    return discovered;
  });
  const plans = discoveries.map((discovery) =>
    planInstall({ discovery, scope: lock.scope, instructionsMode: lock.instructions.mode }),
  );
  if (plans.some((plan) => plan.root !== scope))
    throw new CliError('Область lock не соответствует репозиторию; файлы сохранены');
  const first = plans[0];
  const candidate = first.changes.find((c) => c.path === lockPath);
  const next = candidate ? JSON.parse(candidate.content.toString('utf8')) : { ...lock };
  const updated = new Map(
    discoveries.map((discovery) => {
      const p = discovery.projects[0];
      const root = path.relative(scope, p.root).split(path.sep).join('/') || '.';
      return [
        root,
        {
          root,
          surface: p.surface,
          versions: Object.fromEntries(p.packages.map((item) => [item.name, item.version])),
        },
      ];
    }),
  );
  next.projects = lock.projects
    .map((p) => updated.get(p.root) ?? p)
    .sort((a, b) => a.root.localeCompare(b.root));
  const before = bytesAt(safeDestination(scope, lockPath));
  const content = Buffer.from(JSON.stringify(next, null, 2) + '\n');
  const changes = first.changes.filter((c) => c.path !== lockPath);
  if (!before.equals(content)) changes.push({ path: lockPath, before, content, action: 'update' });
  return {
    ...first,
    projects: discoveries.flatMap((d) => d.projects),
    checks: plans.flatMap((p) => p.checks),
    changes,
  };
}
