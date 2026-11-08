import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
export function write(root, name, value) {
  const target = path.join(root, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    typeof value === 'object' ? JSON.stringify(value, null, 2) + '\n' : value,
  );
  return target;
}
export function read(root, name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}
export function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mednet-cli-'));
  fs.mkdirSync(path.join(root, '.git'));
  write(root, 'package.json', { name: 'fixture', private: true });
  t.after(() => {
    const resolved = path.resolve(root);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith('mednet-cli-')
    )
      throw new Error('Unsafe fixture cleanup');
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  if (options.surface) addKit(root, options);
  return root;
}
export function addKit(
  project,
  { surface = 'react', version = '2.2.1', tokensVersion = version, isolated = false } = {},
) {
  const main = surface === 'react' ? 'ui' : surface === 'html' ? 'css' : 'tokens';
  const pkg = JSON.parse(read(project, 'package.json'));
  pkg.dependencies = { ...pkg.dependencies, ['@mednet/' + main]: '^' + version };
  write(project, 'package.json', pkg);
  function install(name, at, v, dependencies = {}) {
    const exports = { './package.json': './package.json' };
    if (name === 'ui')
      Object.assign(exports, {
        '.': './dist/index.js',
        './styles.css': './styles.css',
        './fonts.css': './fonts.css',
        './llms.md': './llms.md',
      });
    if (name === 'css')
      Object.assign(exports, {
        '.': './dist/mednet.css',
        './mednet.css': './dist/mednet.css',
        './fonts.css': './dist/fonts.css',
      });
    if (name === 'tokens')
      Object.assign(exports, {
        '.': './dist/index.js',
        './tokens.css': './dist/tokens.css',
        './tokens.json': './dist/tokens.json',
      });
    write(at, 'package.json', {
      name: '@mednet/' + name,
      version: v,
      type: 'module',
      exports,
      dependencies,
      files: ['dist', 'llms.md'],
    });
    write(at, 'llms.md', '# Installed @mednet/' + name + ' ' + v + '\n');
    for (const target of Object.values(exports))
      if (!fs.existsSync(path.join(at, target)))
        write(
          at,
          target,
          target.endsWith('.js')
            ? 'throw new Error("Package code must never run");\n'
            : '/* fixture */\n',
        );
  }
  const location = isolated
    ? path.join(project, 'node_modules/.pnpm/kit-' + version + '/node_modules/@mednet', main)
    : path.join(project, 'node_modules/@mednet', main);
  install(main, location, version, main === 'ui' ? { '@mednet/tokens': '^' + version } : {});
  if (isolated) {
    fs.mkdirSync(path.join(project, 'node_modules/@mednet'), { recursive: true });
    fs.symlinkSync(
      location,
      path.join(project, 'node_modules/@mednet', main),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  }
  if (main === 'ui') {
    const tokenPath = isolated
      ? path.join(path.dirname(location), 'tokens')
      : path.join(project, 'node_modules/@mednet/tokens');
    install('tokens', tokenPath, tokensVersion);
  }
  if (surface === 'react') {
    write(project, 'src/main.css', '@import "@mednet/ui/styles.css";\n');
    write(project, 'src/main.js', 'import "@mednet/ui/fonts.css";\n');
  }
  if (surface === 'html')
    write(
      project,
      'src/main.css',
      '@import "@mednet/css/mednet.css";\n@import "@mednet/css/fonts.css";\n',
    );
  return location;
}
export function run(cwd, args, entry = cli) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 15000,
  });
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    /* text output */
  }
  return { ...result, json };
}
export function tree(root) {
  const entries = {};
  function walk(dir) {
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name),
        rel = path.relative(root, full).split(path.sep).join('/');
      if (entry.isSymbolicLink()) entries[rel] = 'link:' + fs.readlinkSync(full);
      else if (entry.isDirectory()) {
        entries[rel] = 'directory';
        walk(full);
      } else entries[rel] = createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    }
  }
  walk(root);
  return entries;
}
