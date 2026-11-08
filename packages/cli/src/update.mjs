import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { parseExpression } from '@babel/parser';
import semver from 'semver';
import { CliError, inside, jsonFile, slash, safeDestination, bytesAt } from './paths.mjs';
import { nearestPackage, repositoryRoot, workspaceProjects, check } from './discover.mjs';
import { assertNoTransaction } from './state.mjs';
import { version } from './version.mjs';

const names = ['@mednet/ui', '@mednet/css', '@mednet/tokens', '@mednet/lint-config', '@mednet/cli'];
const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const declarations = (pkg) =>
  sections.flatMap((section) =>
    Object.keys(pkg[section] ?? {}).filter((name) => names.includes(name)),
  );

function selectedProject(cwd, project) {
  const current = fs.realpathSync(cwd),
    repo = repositoryRoot(current);
  if (project !== undefined) {
    const selected = path.resolve(current, project);
    if (!inside(repo, selected)) throw new CliError('--project находится вне репозитория', 2);
    const rel = slash(path.relative(repo, selected));
    if (rel) {
      try {
        safeDestination(repo, rel + '/package.json');
      } catch {
        throw new CliError(
          '--project должен быть обычным каталогом внутри репозитория, без ссылок.',
          2,
        );
      }
    }
    if (!fs.existsSync(path.join(selected, 'package.json')))
      throw new CliError('В проекте нет package.json.', 2);
    return { repo, root: selected };
  }
  const nearest = nearestPackage(current);
  if (declarations(jsonFile(path.join(nearest, 'package.json'))).length)
    return { repo, root: nearest };
  const projects = workspaceProjects(repo).filter(
    (root) => declarations(jsonFile(path.join(root, 'package.json'))).length,
  );
  if (projects.length !== 1)
    throw new CliError(
      'Выберите потребителя кита через --project (найдено: ' + projects.length + ').',
      2,
    );
  return { repo, root: projects[0] };
}
function managerFor(root, repo, explicit) {
  if (explicit !== undefined && !['npm', 'pnpm'].includes(explicit))
    throw new CliError('--package-manager: npm|pnpm', 2);
  let cursor = root,
    installRoot = root;
  const evidence = new Set();
  while (true) {
    const file = path.join(cursor, 'package.json');
    const pkg = fs.existsSync(file) ? jsonFile(file) : {};
    if (cursor !== root) {
      const workspace =
        Boolean(pkg.workspaces) || fs.existsSync(path.join(cursor, 'pnpm-workspace.yaml'));
      if (!workspace || !workspaceProjects(cursor).includes(root)) {
        if (cursor === repo || path.dirname(cursor) === cursor) break;
        cursor = path.dirname(cursor);
        continue;
      }
    }
    if (pkg.packageManager) {
      const manager = pkg.packageManager.split('@')[0];
      if (!['npm', 'pnpm'].includes(manager) && !explicit)
        throw new CliError(
          'Этот менеджер пакетов пока не поддержан; выберите npm или pnpm явно.',
          2,
        );
      if (['npm', 'pnpm'].includes(manager)) evidence.add(manager);
    }
    let owner = Boolean(pkg.workspaces) || fs.existsSync(path.join(cursor, 'pnpm-workspace.yaml'));
    for (const [lock, name] of [
      ['package-lock.json', 'npm'],
      ['npm-shrinkwrap.json', 'npm'],
      ['pnpm-lock.yaml', 'pnpm'],
    ])
      if (fs.existsSync(path.join(cursor, lock))) {
        evidence.add(name);
        owner = true;
      }
    if (owner) installRoot = cursor;
    if (cursor === repo || path.dirname(cursor) === cursor) break;
    cursor = path.dirname(cursor);
  }
  if (evidence.size > 1 && !explicit)
    throw new CliError(
      'Противоречивые lock-файлы/ packageManager; укажите --package-manager npm|pnpm.',
      2,
    );
  const command = explicit ?? [...evidence][0] ?? 'npm';
  const installManifest = path.join(installRoot, 'package.json');
  const workspace =
    fs.existsSync(path.join(installRoot, 'pnpm-workspace.yaml')) ||
    (fs.existsSync(installManifest) && Boolean(jsonFile(installManifest).workspaces));
  return {
    command,
    args:
      command === 'pnpm'
        ? [
            'install',
            '--ignore-scripts',
            '--ignore-pnpmfile',
            ...(workspace ? [] : ['--ignore-workspace']),
          ]
        : ['install', '--ignore-scripts'],
    cwd: installRoot,
    status: 'planned',
  };
}
function rewriteManifest(text, target) {
  let ast;
  try {
    JSON.parse(text.replace(/^\uFEFF/, ''));
    ast = parseExpression(text);
  } catch {
    throw new CliError('Некорректный package.json.', 2);
  }
  if (ast.type !== 'ObjectExpression') throw new CliError('Ожидался JSON-объект package.json.', 2);
  const edits = [],
    dependencies = [],
    seenSections = new Set();
  for (const prop of ast.properties) {
    if (prop.type !== 'ObjectProperty' || prop.key.type !== 'StringLiteral') continue;
    const section = prop.key.value;
    if (!sections.includes(section)) continue;
    if (seenSections.has(section) || prop.value.type !== 'ObjectExpression')
      throw new CliError('Неоднозначная секция ' + section + '.', 2);
    seenSections.add(section);
    const seen = new Set();
    for (const dep of prop.value.properties) {
      if (dep.type !== 'ObjectProperty' || dep.key.type !== 'StringLiteral')
        throw new CliError('Некорректная зависимость.', 2);
      const name = dep.key.value;
      if (seen.has(name)) throw new CliError('Повторная зависимость ' + name + '.', 2);
      seen.add(name);
      if (!names.includes(name)) continue;
      if (dep.value.type !== 'StringLiteral')
        throw new CliError('Версия зависимости должна быть строкой.', 2);
      const from = dep.value.value;
      if (!semver.validRange(from))
        throw new CliError(
          'Нельзя автоматически заменить ' +
            name +
            ': ' +
            String(from) +
            '. Нужен обычный semver-диапазон.',
          2,
        );
      dependencies.push({ section, name, from, to: target });
      if (from !== target) edits.push({ start: dep.value.start, end: dep.value.end });
    }
  }
  if (!dependencies.length)
    throw new CliError('Нет явно объявленных пакетов @mednet/* для обновления.', 2);
  for (const edit of edits.sort((a, b) => b.start - a.start))
    text = text.slice(0, edit.start) + JSON.stringify(target) + text.slice(edit.end);
  return { text, dependencies };
}
/** @param {{cwd?:string,project?:string,to?:string,packageManager?:string}} options */
export function planUpdate({ cwd = process.cwd(), project, to = version, packageManager } = {}) {
  if (!semver.valid(to) || semver.valid(to) !== to)
    throw new CliError('--to должен быть точной версией X.Y.Z, без тега или диапазона.', 2);
  const { repo, root } = selectedProject(cwd, project);
  assertNoTransaction(root);
  const before = bytesAt(safeDestination(root, 'package.json'));
  if (!before) throw new CliError('Не найден package.json.', 2);
  const text = before.toString('utf8');
  if (!Buffer.from(text).equals(before)) throw new CliError('package.json должен быть UTF-8.', 2);
  const updated = rewriteManifest(text, to),
    content = Buffer.from(updated.text);
  return {
    root,
    allowedPaths: ['package.json'],
    operation: 'update',
    targetVersion: to,
    projects: [slash(path.relative(repo, root)) || '.'],
    dependencies: updated.dependencies,
    install: managerFor(root, repo, packageManager),
    changes: before.equals(content)
      ? []
      : [
          {
            path: 'package.json',
            before,
            content,
            action: 'update',
            summary: 'Точные версии пакетов кита → ' + to,
          },
        ],
    checks: [
      check('update.target', 'pass', 'Пакеты кита будут согласованы с точной версией', [to]),
    ],
  };
}
export function installUpdate(
  plan,
  { dryRun = false, noInstall = false, runner = spawnSync } = {},
) {
  if (dryRun) return { ...plan.install, status: 'planned' };
  if (noInstall) {
    plan.checks.push(
      check(
        'update.install',
        'warn',
        'package.json подготовлен; зависимости ещё нужно установить.',
        [plan.install.command + ' ' + plan.install.args.join(' ')],
      ),
    );
    return { ...plan.install, status: 'pending' };
  }
  const windows = process.platform === 'win32';
  const executable = windows ? (process.env.ComSpec ?? 'cmd.exe') : plan.install.command;
  const args = windows
    ? ['/d', '/s', '/c', plan.install.command + '.cmd ' + plan.install.args.join(' ')]
    : plan.install.args;
  const result = runner(executable, args, {
    cwd: plan.install.cwd,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 300000,
  });
  const managerOk = result.status === 0 && !result.error;
  const mismatches = [];
  if (managerOk) {
    const require = createRequire(path.join(plan.root, 'package.json'));
    for (const name of new Set(plan.dependencies.map((dep) => dep.name))) {
      try {
        const metadata = require.resolve(name + '/package.json');
        const installed = jsonFile(metadata);
        if (installed.name !== name || installed.version !== plan.targetVersion)
          mismatches.push(
            name + ': установлена ' + installed.version + ', ожидалась ' + plan.targetVersion,
          );
        if (name === '@mednet/ui') {
          try {
            const tokens = jsonFile(createRequire(metadata).resolve('@mednet/tokens/package.json'));
            if (tokens.name !== '@mednet/tokens' || tokens.version !== plan.targetVersion)
              mismatches.push(
                'ui → tokens: установлена ' + tokens.version + ', ожидалась ' + plan.targetVersion,
              );
          } catch {
            mismatches.push('ui → tokens: не удалось разрешить установленный package.json');
          }
        }
      } catch {
        mismatches.push(name + ': не удалось разрешить установленный package.json');
      }
    }
  }
  const ok = managerOk && !mismatches.length;
  plan.checks.push(
    check(
      'update.install',
      ok ? 'pass' : 'fail',
      ok
        ? 'Зависимости установлены без lifecycle scripts.'
        : mismatches.length
          ? 'Менеджер завершился, но версии пакетов не совпали. Проверьте overrides/resolutions и повторите mednet update.'
          : 'Установка не завершена. package.json уже обновлён; проверьте доступ к registry и повторите mednet update.',
      [
        plan.install.command + ' ' + plan.install.args.join(' '),
        ...mismatches,
        ...(ok ? [] : [String(result.stderr ?? result.error?.message ?? '').slice(-2000)]),
      ],
    ),
  );
  return { ...plan.install, status: ok ? 'complete' : 'failed', exitCode: result.status ?? 1 };
}
