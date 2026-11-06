#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { version } from './version.mjs';
import { planInstall } from './plan.mjs';
import { applyPlan } from './apply.mjs';
import { planSync } from './sync.mjs';
import { CliError, hash } from './paths.mjs';
import { discoverKit } from './discover.mjs';
import { diagnose, statusOf } from './doctor.mjs';
const help =
  'mednet — локальные инструкции и диагностика mednet-kit\n\n' +
  '  mednet doctor [--project path] [--surface react|html|tokens] [--json] [--chrome109]\n' +
  '  mednet agent install codex [--project path] [--scope repo|project]\n' +
  '         [--instructions snippet|managed-block] [--dry-run] [--json]\n' +
  '  mednet agent sync [--project path] [--dry-run] [--json]\n\n' +
  'Установка не меняет npm-зависимости. doctor читает файлы без исполнения конфигов.\n';

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
    if (!['doctor', 'agent install codex', 'agent sync'].includes(command))
      throw new CliError('Неизвестная команда. Используйте mednet --help.', 2);
    const allowed =
      command === 'doctor'
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
        command === 'agent sync'
          ? planSync({ project: values.project })
          : planInstall({
              discovery: discoverKit({ project: values.project, surface: values.surface }),
              scope: values.scope,
              instructionsMode: values.instructions,
            });
      if (!values['dry-run']) applyPlan(plan);
      report = {
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
          diff:
            c.path === 'AGENTS.md'
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
              ? 'Синхронизация выполнена'
              : 'Установка выполнена';
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
