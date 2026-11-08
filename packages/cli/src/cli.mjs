#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { version } from './version.mjs';
import { planInstall } from './plan.mjs';
import { applyPlan } from './apply.mjs';
import { planSync } from './sync.mjs';
import { planTheme } from './theme.mjs';
import { planUpdate, installUpdate } from './update.mjs';
import { CliError, hash } from './paths.mjs';
import { discoverKit } from './discover.mjs';
import { diagnose, statusOf } from './doctor.mjs';
const help =
  'mednet — обновление, темы, инструкции и диагностика mednet-kit\n\n' +
  '  mednet doctor [--project path] [--surface react|html|tokens] [--json] [--chrome109]\n' +
  '  mednet agent install codex [--project path] [--scope repo|project]\n' +
  '         [--instructions snippet|managed-block] [--dry-run] [--json]\n' +
  '  mednet agent sync [--project path] [--dry-run] [--json]\n' +
  '  mednet update [--to X.Y.Z] [--project path] [--package-manager npm|pnpm]\n' +
  '         [--no-install] [--dry-run] [--json]\n' +
  '  mednet theme set brand|solid [--palette graphite] [--project path]\n' +
  '         [--surface react|html|tokens] [--css path] [--html path] [--dry-run] [--json]\n\n' +
  'agent не меняет npm-зависимости. update запускает npm/pnpm без scripts.\n';

try {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
        json: { type: 'boolean' },
        'dry-run': { type: 'boolean' },
        chrome109: { type: 'boolean' },
        project: { type: 'string' },
        surface: { type: 'string' },
        scope: { type: 'string' },
        instructions: { type: 'string' },
        palette: { type: 'string' },
        css: { type: 'string' },
        html: { type: 'string' },
        to: { type: 'string' },
        'package-manager': { type: 'string' },
        'no-install': { type: 'boolean' },
      },
    });
  } catch {
    throw new CliError('Некорректные аргументы. Используйте mednet --help.', 2);
  }
  const { values, positionals } = parsed,
    command = positionals.join(' ');
  if (values.help || (!command && !values.version && !Object.keys(values).length))
    process.stdout.write(help);
  else if (values.version && !command) process.stdout.write(version + '\n');
  else {
    if (
      ![
        'doctor',
        'agent install codex',
        'agent sync',
        'theme set solid',
        'theme set brand',
        'update',
      ].includes(command)
    )
      throw new CliError('Неизвестная команда. Используйте mednet --help.', 2);
    const allowed =
      command === 'update'
        ? ['json', 'dry-run', 'project', 'to', 'package-manager', 'no-install']
        : command.startsWith('theme set ')
          ? ['json', 'dry-run', 'project', 'surface', 'palette', 'css', 'html']
          : command === 'doctor'
            ? ['json', 'chrome109', 'project', 'surface']
            : command === 'agent install codex'
              ? ['json', 'dry-run', 'project', 'surface', 'scope', 'instructions']
              : ['json', 'dry-run', 'project'];
    if (Object.keys(values).some((key) => !allowed.includes(key)))
      throw new CliError('Флаг не применим к выбранной команде.', 2);
    if (values.surface && !['react', 'html', 'tokens'].includes(values.surface))
      throw new CliError('surface: react|html|tokens', 2);
    if (values.scope && !['repo', 'project'].includes(values.scope))
      throw new CliError('scope: repo|project', 2);
    if (values.instructions && !['snippet', 'managed-block'].includes(values.instructions))
      throw new CliError('instructions: snippet|managed-block', 2);
    let report;
    if (command === 'doctor')
      report = diagnose(
        discoverKit({ project: values.project, surface: values.surface, all: true }),
        { chrome109: values.chrome109 },
      );
    else {
      const plan =
        command === 'update'
          ? planUpdate({
              project: values.project,
              to: values.to,
              packageManager: values['package-manager'],
            })
          : command.startsWith('theme set ')
            ? planTheme({
                project: values.project,
                surface: values.surface,
                theme: positionals[2],
                palette: values.palette,
                css: values.css,
                html: values.html,
              })
            : command === 'agent sync'
              ? planSync({ project: values.project })
              : planInstall({
                  discovery: discoverKit({ project: values.project, surface: values.surface }),
                  scope: values.scope,
                  instructionsMode: values.instructions,
                });
      if (!values['dry-run']) applyPlan(plan);
      const install =
        command === 'update'
          ? installUpdate(plan, {
              dryRun: Boolean(values['dry-run']),
              noInstall: Boolean(values['no-install']),
            })
          : undefined;
      report = {
        ...(install
          ? { install, targetVersion: plan.targetVersion, dependencies: plan.dependencies }
          : {}),
        schemaVersion: 1,
        status: statusOf(plan.checks),
        dryRun: Boolean(values['dry-run']),
        root: plan.root,
        projects: plan.projects,
        checks: plan.checks,
        snippet: plan.snippet,
        changes: plan.changes.map((c) => ({
          path: c.path,
          action: c.action,
          beforeSha256: c.before ? hash(c.before) : null,
          afterSha256: hash(c.content),
          bytes: c.content.length,
          diff: ['theme', 'update'].includes(plan.operation)
            ? c.summary
            : c.path === 'AGENTS.md'
              ? 'Обновление только блока mednet-kit; внешние bytes сохранены.'
              : c.content.toString('utf8'),
        })),
      };
    }
    if (values.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    else {
      const title =
        command === 'doctor'
          ? 'Диагностика'
          : values['dry-run']
            ? 'План изменений'
            : command === 'agent sync'
              ? 'Синхронизация'
              : command === 'update'
                ? 'Обновление пакетов'
                : command.startsWith('theme set ')
                  ? 'Выбор темы'
                  : 'Установка инструкций';
      process.stdout.write(title + ': ' + report.status + '\n');
      if ('changes' in report) {
        for (const c of report.changes) process.stdout.write('  ' + c.action + ' ' + c.path + '\n');
        if (!report.changes.length) process.stdout.write('  Изменения не требуются.\n');
        if (report.snippet)
          process.stdout.write(
            '\nAGENTS.md (добавьте при необходимости):\n' + report.snippet + '\n',
          );
      }
      for (const c of report.checks)
        process.stdout.write(
          '[' +
            c.status +
            '] ' +
            c.id +
            ': ' +
            c.message +
            '\n' +
            (c.evidence.length ? '  ' + c.evidence.join('\n  ') + '\n' : ''),
        );
    }
    process.exitCode = report.status === 'fail' ? 1 : 0;
  }
} catch (error) {
  const exitCode = error instanceof CliError ? error.exitCode : 1;
  const message =
    error instanceof CliError
      ? error.message
      : 'Не удалось выполнить команду; проверьте доступность файлов проекта.';
  if (process.argv.includes('--json'))
    process.stdout.write(
      JSON.stringify({ schemaVersion: 1, status: 'fail', error: { message, exitCode } }, null, 2) +
        '\n',
    );
  else process.stderr.write(message + '\n');
  process.exitCode = exitCode;
}
