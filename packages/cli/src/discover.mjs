import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { CliError, jsonFile, inside, slash } from './paths.mjs';

/** @typedef {{id:string,status:string,message:string,evidence:string[],remediation:string,project?:string}} Check */
/** @typedef {{name:string,version:string,root:string,llms:string,exports:string[]}} KitPackage */
/** @typedef {{root:string,relativeRoot:string,surface:string,packages:KitPackage[],checks:Check[]}} Project */
export function check(id, status, message, evidence = [], remediation = '') {
  return { id, status, message, evidence, remediation };
}
function manifestAt(dir) {
  return path.join(dir, 'package.json');
}
function nearestPackage(cwd) {
  let cursor = cwd;
  while (true) {
    if (fs.existsSync(manifestAt(cursor))) return cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) return cwd;
    cursor = parent;
  }
}
export function repositoryRoot(cwd) {
  let cursor = cwd,
    workspace,
    nearest = nearestPackage(cwd);
  while (true) {
    if (fs.existsSync(path.join(cursor, '.git'))) return cursor;
    if (
      fs.existsSync(path.join(cursor, 'pnpm-workspace.yaml')) ||
      (fs.existsSync(manifestAt(cursor)) && jsonFile(manifestAt(cursor)).workspaces)
    )
      workspace = cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) return workspace ?? nearest;
    cursor = parent;
  }
}
function declared(pkg) {
  return Object.assign(
    {},
    pkg.peerDependencies,
    pkg.optionalDependencies,
    pkg.devDependencies,
    pkg.dependencies,
  );
}
function patterns(root) {
  const pkg = fs.existsSync(manifestAt(root)) ? jsonFile(manifestAt(root)) : {};
  const npm = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces?.packages;
  if (Array.isArray(npm)) return npm.filter((p) => typeof p === 'string');
  const yaml = path.join(root, 'pnpm-workspace.yaml');
  if (!fs.existsSync(yaml)) return [];
  const result = [];
  let inPackages = false;
  for (const line of fs.readFileSync(yaml, 'utf8').split(/\r?\n/)) {
    if (/^packages:\s*(?:#.*)?$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages && /^[^\s#]/.test(line)) break;
    const value = inPackages && line.match(/^\s+-\s+(['"]?)([^'"\r\n]+?)\1\s*(?:#.*)?$/);
    if (value) result.push(value[2].trim());
  }
  return result;
}
function patternMatches(value, pattern) {
  const source = pattern
    .replace(/[.+?^\${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp('^' + source + '$').test(value);
}
function workspaceProjects(root) {
  const globs = patterns(root);
  if (!globs.length) return [];
  const result = [];
  let visited = 0;
  function walk(dir, depth) {
    if (++visited > 2000 || depth > 8)
      throw new CliError('Слишком большое workspace-дерево; выберите --project', 2);
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (
        !entry.isDirectory() ||
        entry.name.startsWith('.') ||
        [
          'node_modules',
          'dist',
          'out',
          'build',
          'coverage',
          'artifacts',
          'test',
          'tests',
          '__tests__',
        ].includes(entry.name)
      )
        continue;
      const child = path.join(dir, entry.name),
        rel = slash(path.relative(root, child));
      if (
        globs.some((p) => !p.startsWith('!') && patternMatches(rel, p)) &&
        !globs.some((p) => p.startsWith('!') && patternMatches(rel, p.slice(1))) &&
        fs.existsSync(manifestAt(child))
      )
        result.push(child);
      walk(child, depth + 1);
    }
  }
  walk(root, 0);
  return result;
}
function exportTargets(value) {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(exportTargets);
  return [];
}
function resolvePackage(name, context, checks) {
  try {
    const packageFile = createRequire(manifestAt(context)).resolve(name + '/package.json');
    const root = path.dirname(fs.realpathSync(packageFile)),
      pkg = jsonFile(packageFile);
    if (
      pkg.name !== name ||
      typeof pkg.version !== 'string' ||
      !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(pkg.version)
    )
      throw new Error('Package identity/version');
    const exported = typeof pkg.exports === 'object' && pkg.exports ? Object.keys(pkg.exports) : [];
    const item = {
      name,
      version: pkg.version,
      root,
      llms: path.join(root, 'llms.md'),
      exports: exported,
    };
    const missing = exportTargets(pkg.exports).filter(
      (target) =>
        !target.includes('*') &&
        (!target.startsWith('./') ||
          !inside(root, path.resolve(root, target)) ||
          !fs.existsSync(path.resolve(root, target))),
    );
    checks.push(
      check(
        'package.exports',
        missing.length ? 'fail' : 'pass',
        missing.length
          ? 'В пакете отсутствуют файлы публичных exports'
          : 'Файлы конкретных exports присутствуют',
        [packageFile, ...missing],
      ),
    );
    if (exported.includes('./agent/manifest.json')) {
      checks.push(
        check(
          'knowledge.contract',
          'fail',
          'Эта версия CLI работает с legacy llms; новый metadata contract не поддержан',
          [name, pkg.version],
          'Используйте CLI с поддержкой contract; версии пакетов не менялись.',
        ),
      );
    } else if (!fs.existsSync(item.llms) || !fs.statSync(item.llms).isFile()) {
      checks.push(
        check(
          'knowledge',
          'fail',
          'В установленном пакете нет llms.md',
          [item.llms],
          'Проверьте состав установленного пакета.',
        ),
      );
    }
    return item;
  } catch {
    checks.push(
      check(
        'package.resolve',
        'fail',
        'Не удалось разрешить ' + name + ' из контекста проекта',
        [context, name],
        'Установите объявленные зависимости выбранного проекта его менеджером пакетов.',
      ),
    );
    return null;
  }
}
function inspectProject(root, projectRoot, surface) {
  const pkg = jsonFile(manifestAt(projectRoot)),
    dependencies = declared(pkg);
  const ui = Object.hasOwn(dependencies, '@mednet/ui'),
    css = Object.hasOwn(dependencies, '@mednet/css'),
    tokens = Object.hasOwn(dependencies, '@mednet/tokens');
  if (!ui && !css && !tokens) return null;
  /** @type {Project} */
  const project = {
    root: projectRoot,
    relativeRoot: slash(path.relative(root, projectRoot)) || '.',
    surface: surface ?? (ui && css ? 'ambiguous' : ui ? 'react' : css ? 'html' : 'tokens'),
    packages: [],
    checks: [],
  };
  if (
    project.surface === 'ambiguous' ||
    (project.surface === 'react' && !ui) ||
    (project.surface === 'html' && !css) ||
    (project.surface === 'tokens' && !tokens)
  ) {
    project.checks.push(
      check(
        'surface',
        'fail',
        'Укажите явно объявленную surface через --surface react|html|tokens',
        [projectRoot],
      ),
    );
    return project;
  }
  const main =
    project.surface === 'react'
      ? '@mednet/ui'
      : project.surface === 'html'
        ? '@mednet/css'
        : '@mednet/tokens';
  const mainPackage = resolvePackage(main, projectRoot, project.checks);
  if (mainPackage) project.packages.push(mainPackage);
  if (mainPackage && main === '@mednet/ui') {
    const tokenPackage = resolvePackage('@mednet/tokens', mainPackage.root, project.checks);
    if (tokenPackage) {
      project.packages.push(tokenPackage);
      if (mainPackage.version !== tokenPackage.version)
        project.checks.push(
          check(
            'versions',
            'fail',
            'Первая версия CLI поддерживает ui и его tokens одного релиза',
            [mainPackage.version, tokenPackage.version],
            'Выберите совместимый набор зависимостей вручную.',
          ),
        );
      if (tokens) {
        const directTokens = resolvePackage('@mednet/tokens', projectRoot, project.checks);
        if (directTokens && directTokens.version !== tokenPackage.version)
          project.checks.push(
            check(
              'versions',
              'fail',
              'Прямой @mednet/tokens отличается от tokens в контексте ui',
              [directTokens.root, directTokens.version, tokenPackage.root, tokenPackage.version],
              'Согласуйте объявленные зависимости вручную.',
            ),
          );
      }
    }
  }
  if (Object.hasOwn(dependencies, '@mednet/lint-config')) {
    const lint = resolvePackage('@mednet/lint-config', projectRoot, project.checks);
    if (lint) project.packages.push(lint);
  }
  project.checks.push(
    check(
      'knowledge',
      'warn',
      'Legacy режим: llms.md и exports установленной версии; structured metadata не проверялась',
      project.packages.map((p) => p.llms),
    ),
  );
  return project;
}
/** @param {{cwd?:string,project?:string,surface?:string,all?:boolean}} options */
export function discoverKit({ cwd = process.cwd(), project, surface, all = false } = {}) {
  const current = fs.realpathSync(cwd),
    root = repositoryRoot(current);
  let selected;
  if (project !== undefined) {
    const target = path.resolve(current, project);
    if (!inside(root, target)) throw new CliError('--project находится вне репозитория', 2);
    if (!fs.existsSync(target) || !fs.statSync(target).isDirectory())
      throw new CliError('--project должен указывать на каталог проекта', 2);
    selected = fs.realpathSync(target);
    if (!inside(root, selected))
      throw new CliError('--project через ссылку выходит из репозитория', 2);
    if (!fs.existsSync(manifestAt(selected))) throw new CliError('В --project нет package.json', 2);
  } else {
    selected = nearestPackage(current);
  }
  const targets =
    project !== undefined || selected !== root
      ? [selected]
      : [...new Set([root, ...workspaceProjects(root)])];
  const projects = targets
    .filter((t) => fs.existsSync(manifestAt(t)))
    .map((t) => inspectProject(root, t, surface))
    .filter(Boolean);
  if (!all && projects.length > 1)
    throw new CliError('Найдено несколько проектов кита; выберите --project', 2);
  /** @type {Check[]} */
  const checks = projects.flatMap((p) => p.checks.map((c) => ({ ...c, project: p.relativeRoot })));
  if (!projects.length)
    checks.push(
      check('kit', 'not-applicable', 'В выбранном проекте нет явно объявленных пакетов кита'),
    );
  return { root, projects, checks };
}
