import fs from 'node:fs';
import path from 'node:path';
import { ancestors, bytesAt, slash } from './paths.mjs';
import { readLock, ownedDrift, journalPath, assertNoTransaction } from './state.mjs';
import { version, supportsLoader } from './version.mjs';
import { check } from './discover.mjs';

export function statusOf(checks) {
  return checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => ['warn', 'unknown'].includes(c.status))
      ? 'warn'
      : 'pass';
}
function sources(root) {
  const result = [];
  let visited = 0;
  function walk(dir, depth) {
    if (depth > 6 || ++visited > 1000) return;
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (
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
          'docs',
        ].includes(entry.name)
      )
        continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (
        entry.isFile() &&
        /\.(css|[cm]?[jt]sx?|html|astro)$/.test(entry.name) &&
        fs.statSync(full).size < 512 * 1024 &&
        result.length < 500
      )
        result.push({ path: full, text: fs.readFileSync(full, 'utf8') });
    }
  }
  walk(root, 0);
  return result;
}
export function instructionChecks(root, projectRoot, plannedSkill = undefined) {
  const checks = [],
    names = new Map();
  for (const dir of ancestors(root, projectRoot)) {
    const override = path.join(dir, 'AGENTS.override.md');
    if (fs.existsSync(override) && fs.statSync(override).isFile() && fs.statSync(override).size)
      checks.push(
        check(
          'instructions.override',
          'warn',
          'AGENTS.override.md имеет приоритет над AGENTS.md; применимость блока требует проверки',
          [override],
        ),
      );
    const skillRoot = path.join(dir, '.agents/skills');
    if (!fs.existsSync(skillRoot)) continue;
    for (const entry of fs.readdirSync(skillRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const skill = path.join(skillRoot, entry.name, 'SKILL.md');
      const bytes = bytesAt(skill);
      if (!bytes || bytes.length > 64 * 1024) continue;
      const frontmatter = bytes.toString('utf8').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      const match = frontmatter?.[1].match(/^name:\s*['"]?([^'"\r\n]+)['"]?\s*$/m);
      if (match) names.set(match[1].trim(), [...(names.get(match[1].trim()) ?? []), skill]);
    }
  }
  const duplicates = names.get('mednet-kit') ?? [];
  if (plannedSkill && !duplicates.includes(plannedSkill)) duplicates.push(plannedSkill);
  if (duplicates.length > 1)
    checks.push(
      check(
        'skill.duplicate',
        'fail',
        'Несколько обнаруживаемых skills с именем mednet-kit',
        duplicates,
        'Согласуйте область установки; skills с одинаковым именем не объединяются.',
      ),
    );
  return checks;
}
/** @param {any} discovery @param {{chrome109?:boolean}} options */
export function diagnose(discovery, { chrome109 = false } = {}) {
  const checks = [...discovery.checks];
  for (const project of discovery.projects) {
    const files = sources(project.root);
    const add = (id, pattern, message) => {
      const evidence = files.filter((f) => pattern.test(f.text)).map((f) => f.path);
      checks.push({
        ...check(
          id,
          evidence.length ? 'warn' : 'unknown',
          evidence.length
            ? message
            : 'Статическое подключение не установлено; динамическая конфигурация не исполнялась',
          evidence,
          'Проверьте фактическое подключение и сценарий в приложении.',
        ),
        project: project.relativeRoot,
      });
    };
    if (project.surface === 'react') {
      add(
        'styles',
        /['"]@mednet\/ui\/styles\.css['"]/,
        'Найдена ссылка на styles.css; включение в рабочую сборку требует проверки',
      );
      add(
        'fonts',
        /['"]@mednet\/ui\/fonts\.css['"]/,
        'Найдена отдельная ссылка на fonts.css; загрузка Montserrat требует браузера',
      );
      if (chrome109)
        add(
          'chrome109',
          /['"]@mednet\/ui\/postcss['"]/,
          'Найдена ссылка на legacy PostCSS plugin; совместимость Chrome109 требует целевого браузера',
        );
    } else if (project.surface === 'html') {
      add(
        'styles',
        /['"]@mednet\/css\/(?:mednet(?:\.min)?\.css|dist\/mednet(?:\.min)?\.css)['"]/,
        'Найдена ссылка на CSS кита; фактическое подключение требует проверки',
      );
      add(
        'fonts',
        /['"]@mednet\/css\/(?:dist\/)?fonts\.css['"]/,
        'Найдена ссылка на шрифты; фактическая загрузка требует браузера',
      );
    }
    add(
      'lint',
      /['"]@mednet\/lint-config\/(?:eslint|stylelint)['"]/,
      'Найдена ссылка на lint-config; effective rules не устанавливались',
    );
    checks.push(
      ...instructionChecks(discovery.root, project.root).map((c) => ({
        ...c,
        project: project.relativeRoot,
      })),
    );
    const scope = ancestors(discovery.root, project.root)
      .reverse()
      .find(
        (dir) =>
          fs.existsSync(path.join(dir, '.mednet/agent-lock.json')) ||
          fs.existsSync(path.join(dir, journalPath)),
      );
    if (!scope)
      checks.push({
        ...check(
          'agent.installation',
          'unknown',
          'Установленный mednet-kit loader не обнаружен',
          [],
          'Установите mednet agent install codex для выбранного проекта.',
        ),
        project: project.relativeRoot,
      });
    else {
      try {
        assertNoTransaction(scope);
      } catch (error) {
        checks.push(
          check('agent.transaction', 'fail', error.message, [path.join(scope, journalPath)]),
        );
      }
      try {
        const lock = readLock(scope);
        if (lock) {
          const drift = ownedDrift(scope, lock);
          checks.push(
            check(
              'agent.ownership',
              drift.length ? 'fail' : 'pass',
              drift.length
                ? 'Файлы loader изменены или отсутствуют; перезапись требует решения владельца'
                : 'Хэши принадлежащих CLI файлов совпадают',
              drift,
            ),
          );
          checks.push(
            check(
              'agent.loader',
              !supportsLoader(lock.loaderVersion)
                ? 'fail'
                : lock.loaderVersion !== version
                  ? 'warn'
                  : 'pass',
              'Версия установленного loader: ' + lock.loaderVersion,
              [version],
            ),
          );
          const record = lock.projects.find(
            (p) => p.root === (slash(path.relative(scope, project.root)) || '.'),
          );
          const versions = Object.fromEntries(project.packages.map((p) => [p.name, p.version]));
          const same =
            record &&
            JSON.stringify(record.versions) === JSON.stringify(versions) &&
            record.surface === project.surface;
          checks.push(
            check(
              'agent.packages',
              same ? 'pass' : 'warn',
              same
                ? 'Lock соответствует установленным пакетам'
                : 'Версии/контекст отличаются от lock; выполните agent sync',
              [project.root],
            ),
          );
        }
      } catch (error) {
        checks.push(check('agent.lock', 'fail', error.message, [scope]));
      }
    }
  }
  return { schemaVersion: 1, status: statusOf(checks), projects: discovery.projects, checks };
}
