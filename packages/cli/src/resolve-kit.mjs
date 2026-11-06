import { parseArgs } from 'node:util';
import { discoverKit } from './discover.mjs';
import { CliError } from './paths.mjs';
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { project: { type: 'string' }, surface: { type: 'string' } },
  });
  if (
    positionals.length ||
    (values.surface && !['react', 'html', 'tokens'].includes(values.surface))
  )
    throw new CliError('Используйте --project path и --surface react|html|tokens', 2);
  const result = discoverKit({ project: values.project, surface: values.surface, all: true });
  const status = result.checks.some((c) => c.status === 'fail') ? 'fail' : 'warn';
  process.stdout.write(JSON.stringify({ schemaVersion: 1, status, ...result }, null, 2) + '\n');
  process.exitCode = status === 'fail' ? 1 : 0;
} catch (error) {
  const exitCode = error instanceof CliError ? error.exitCode : 2;
  process.stdout.write(
    JSON.stringify({
      schemaVersion: 1,
      status: 'fail',
      error: {
        message:
          error instanceof CliError ? error.message : 'Не удалось обнаружить установленные пакеты',
        exitCode,
      },
    }) + '\n',
  );
  process.exitCode = exitCode;
}
