import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, write, read, run, tree } from './helpers.mjs';

function themed(t, options = {}) {
  const root = fixture(t, { surface: options.surface ?? 'react' });
  const name = options.surface === 'html' ? 'css' : 'ui';
  const pkgRoot = path.join(root, 'node_modules/@mednet', name);
  const pkg = JSON.parse(read(pkgRoot, 'package.json'));
  pkg.exports['./themes.json'] = './themes.json';
  pkg.exports['./themes/solid.css'] = './themes/solid.css';
  write(pkgRoot, 'package.json', pkg);
  write(pkgRoot, 'themes/solid.css', "html[data-kit-theme='solid'] { --mn-primary: #30343b; }\n");
  write(pkgRoot, 'themes.json', {
    schemaVersion: 1,
    package: pkg.name,
    version: pkg.version,
    attributes: { theme: 'data-kit-theme', palette: 'data-solid-palette' },
    themes: [
      { id: 'brand', stylesheet: null, palettes: [] },
      {
        id: 'solid',
        stylesheet: pkg.name + '/themes/solid.css',
        defaultPalette: 'terracotta',
        palettes: [{ id: 'terracotta' }, { id: 'graphite' }],
      },
    ],
  });
  if (options.next) {
    fs.unlinkSync(path.join(root, 'src/main.css'));
    write(
      root,
      'app/globals.css',
      '@import "@mednet/ui/styles.css";\n/* Правила проекта. */\n.custom { color: var(--primary); }\n',
    );
    write(
      root,
      'app/layout.tsx',
      'import "./globals.css";\nconst project = "Мой проект";\nexport default function Layout({children}: {children: React.ReactNode}) { return <html lang="ru" className={getClass()}><body>{children}</body></html>; }\n',
    );
  } else {
    write(
      root,
      'index.html',
      '\uFEFF<!doctype html>\r\n<html lang="ru" class="dark">\r\n<head><title>Проект</title></head><body>Мои данные €</body></html>\r\n',
    );
  }
  return root;
}
const apply = ['theme', 'set', 'solid', '--palette', 'graphite', '--json'];

test('theme dry-run leaves every file and directory unchanged', (t) => {
  const root = themed(t),
    before = tree(root);
  const result = run(root, [...apply, '--dry-run']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.json.changes.some((c) => c.path === 'index.html'));
  assert.ok(result.json.changes.some((c) => c.path === 'src/main.css'));
  assert.deepEqual(tree(root), before);
});
test('Vite selection preserves BOM, CRLF, unrelated html and CSS bytes', (t) => {
  const root = themed(t);
  const css =
    '\uFEFF@charset "UTF-8";\r\n/* Не менять > и @import в комментарии. */\r\n@import "@mednet/ui/styles.css";\r\n.custom::before { content: "€ данные"; }\r\n';
  write(root, 'src/main.css', css);
  const html = read(root, 'index.html');
  const result = run(root, apply);
  assert.equal(result.status, 0, result.stderr);
  assert.match(read(root, 'index.html'), /data-kit-theme="solid"/);
  assert.match(read(root, 'index.html'), /data-solid-palette="graphite"/);
  assert.ok(read(root, 'index.html').startsWith('\uFEFF<!doctype html>\r\n'));
  assert.ok(read(root, 'index.html').includes('class="dark"'));
  assert.ok(read(root, 'index.html').endsWith(html.slice(html.indexOf('<head>'))));
  assert.ok(read(root, 'src/main.css').endsWith('.custom::before { content: "€ данные"; }\r\n'));
  const reset = run(root, ['theme', 'set', 'brand', '--json']);
  assert.equal(reset.status, 0, reset.stderr);
  assert.equal(read(root, 'src/main.css'), css);
  assert.match(read(root, 'index.html'), /data-kit-theme="brand"/);
  assert.doesNotMatch(read(root, 'index.html'), /data-solid-palette/);
});
test('repeated selection is a byte and mtime no-op', (t) => {
  const root = themed(t);
  assert.equal(run(root, apply).status, 0);
  const before = tree(root),
    mtime = fs.statSync(path.join(root, 'src/main.css')).mtimeMs;
  const again = run(root, apply);
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(again.json.changes, []);
  assert.deepEqual(tree(root), before);
  assert.equal(fs.statSync(path.join(root, 'src/main.css')).mtimeMs, mtime);
});
test('Next layout receives literal data attributes without rewriting user JSX or className', (t) => {
  const root = themed(t, { next: true }),
    before = read(root, 'app/layout.tsx');
  assert.equal(run(root, apply).status, 0);
  const after = read(root, 'app/layout.tsx');
  assert.ok(after.startsWith(before.slice(0, before.indexOf('<html'))));
  assert.ok(after.endsWith(before.slice(before.indexOf('<body>'))));
  assert.ok(after.includes('className={getClass()}'));
  assert.match(after, /data-solid-palette="graphite"/);
});
test('dynamic root theme or JSX spread stops the entire plan', (t) => {
  for (const attrs of ['data-kit-theme={theme}', '{...rootProps}']) {
    const root = themed(t, { next: true });
    write(
      root,
      'app/layout.tsx',
      'export default function Layout() { return <html ' + attrs + '><body /></html>; }\n',
    );
    const before = tree(root);
    assert.equal(run(root, apply).status, 1);
    assert.deepEqual(tree(root), before);
  }
});
test('CSS-only theme uses its own export without requiring React or tokens', (t) => {
  const root = themed(t, { surface: 'html' });
  const result = run(root, apply);
  assert.equal(result.status, 0, result.stderr);
  assert.match(read(root, 'src/main.css'), /@mednet\/css\/themes\/solid\.css/);
  assert.equal(fs.existsSync(path.join(root, 'node_modules/@mednet/tokens')), false);
});
test('an edited owned import block is never discarded', (t) => {
  const root = themed(t);
  assert.equal(run(root, apply).status, 0);
  write(
    root,
    'src/main.css',
    read(root, 'src/main.css').replace('@mednet/ui/themes/solid.css', './my-theme.css'),
  );
  const before = tree(root);
  assert.equal(run(root, ['theme', 'set', 'brand', '--json']).status, 1);
  assert.deepEqual(tree(root), before);
});
test('old or unknown theme catalogs fail before project writes', (t) => {
  for (const invalid of [null, { schemaVersion: 99 }]) {
    const root = themed(t);
    if (invalid) write(root, 'node_modules/@mednet/ui/themes.json', invalid);
    else fs.unlinkSync(path.join(root, 'node_modules/@mednet/ui/themes.json'));
    const before = tree(root);
    assert.equal(run(root, apply).status, 1);
    assert.deepEqual(tree(root), before);
  }
});
test('unknown palette and paths escaping project are rejected', (t) => {
  const root = themed(t),
    before = tree(root);
  assert.equal(run(root, ['theme', 'set', 'solid', '--palette', 'missing', '--json']).status, 2);
  assert.equal(run(root, [...apply, '--css', '../outside.css']).status, 2);
  assert.deepEqual(tree(root), before);
});
test('a symlinked HTML target is never written through', (t) => {
  const root = themed(t),
    outside = fixture(t);
  write(outside, 'page.html', '<html><body>Outside</body></html>');
  fs.symlinkSync(
    outside,
    path.join(root, 'templates'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  const before = tree(root),
    external = tree(outside);
  assert.equal(run(root, [...apply, '--html', 'templates/page.html']).status, 1);
  assert.deepEqual(tree(root), before);
  assert.deepEqual(tree(outside), external);
});
