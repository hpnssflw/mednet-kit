import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { parse as parseHtml } from 'parse5';
import { parse as parseJs } from '@babel/parser';
import { CliError, jsonFile, inside, slash, safeDestination, bytesAt } from './paths.mjs';
import { discoverKit, check } from './discover.mjs';
import { assertNoTransaction } from './state.mjs';

const start = '/* mednet:theme:start */',
  end = '/* mednet:theme:end */';
const cssCandidates = [
  'src/index.css',
  'src/main.css',
  'src/globals.css',
  'src/app.css',
  'app/globals.css',
  'src/app/globals.css',
  'styles/globals.css',
];
const htmlCandidates = [
  'index.html',
  'app/layout.tsx',
  'app/layout.jsx',
  'app/layout.js',
  'src/app/layout.tsx',
  'src/app/layout.jsx',
  'src/app/layout.js',
];
const baseImports = ['@mednet/ui/styles.css', '@mednet/css/mednet.css', '@mednet/tokens/theme.css'];
const themeImport = /^@mednet\/(ui|css|tokens)\/themes\/[a-z][a-z0-9-]*\.css$/;

function fileName(root, value) {
  const absolute = path.resolve(root, value);
  if (!inside(root, absolute)) throw new CliError('Путь находится вне проекта: ' + value, 2);
  const name = slash(path.relative(root, absolute));
  safeDestination(root, name);
  return name;
}
function textAt(root, name) {
  const bytes = bytesAt(safeDestination(root, name));
  if (!bytes) throw new CliError('Файл не найден: ' + name, 2);
  if (bytes.length > 2 * 1024 * 1024)
    throw new CliError('Слишком большой исходный файл: ' + name, 2);
  const text = bytes.toString('utf8');
  if (!Buffer.from(text).equals(bytes)) throw new CliError('Ожидался UTF-8: ' + name);
  return text;
}
function imported(node) {
  if (node.type !== 'atrule' || node.name.toLowerCase() !== 'import') return null;
  return (
    node.params
      .match(/^(?:["']([^"']+)["']|url\(\s*["']?([^"'\s)]+)["']?\s*\))/)
      ?.slice(1)
      .find(Boolean) ?? null
  );
}
function parseCss(text) {
  try {
    return postcss.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new CliError('Не удалось разобрать CSS; исходный файл сохранён.');
  }
}
function selectFile(root, explicit, candidates, kind) {
  if (explicit !== undefined) return fileName(root, explicit);
  const found = candidates
    .filter((name) => fs.existsSync(path.join(root, name)))
    .filter(
      (name) =>
        kind !== 'css' ||
        parseCss(textAt(root, name)).nodes.some((node) => baseImports.includes(imported(node))),
    );
  if (found.length !== 1)
    throw new CliError(
      'Не удалось однозначно выбрать ' +
        kind +
        '; укажите --' +
        kind +
        ' (найдено: ' +
        found.join(', ') +
        ').',
      2,
    );
  return fileName(root, found[0]);
}
function edits(text, changes) {
  for (const edit of changes.sort((a, b) => b.start - a.start || b.end - a.end))
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  return text;
}
function cssWithTheme(text, stylesheet) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  let clean = text;
  const a = text.indexOf(start),
    b = text.indexOf(end);
  if (a !== -1 || b !== -1) {
    if (
      a < 0 ||
      b < a ||
      text.indexOf(start, a + start.length) !== -1 ||
      text.indexOf(end, b + end.length) !== -1
    )
      throw new CliError('Повреждён блок mednet:theme; исправьте его перед повторной записью.');
    const block = text.slice(a, b + end.length);
    const match = block.match(
      /^\/\* mednet:theme:start \*\/\r?\n@import "([^"]+)";\r?\n\/\* mednet:theme:end \*\/$/,
    );
    if (!match || !themeImport.test(match[1]) || text.slice(a - eol.length, a) !== eol)
      throw new CliError('Блок mednet:theme изменён вручную; запись остановлена.');
    clean = text.slice(0, a - eol.length) + text.slice(b + end.length);
  }
  const ast = parseCss(clean),
    imports = ast.nodes.filter((node) => imported(node));
  if (!imports.some((node) => baseImports.includes(imported(node))))
    throw new CliError('В CSS отсутствует базовый @import mednet-kit.');
  if (!stylesheet || imports.some((node) => imported(node) === stylesheet)) return clean;
  const last = imports.at(-1),
    bom = clean.startsWith('\uFEFF') ? 1 : 0;
  const at = last.source.end.offset + bom;
  const block = eol + start + eol + '@import "' + stylesheet + '";' + eol + end;
  return clean.slice(0, at) + block + clean.slice(at);
}
function rootAttributes(text, filename, theme, palette) {
  const desired = new Map([
    ['data-kit-theme', theme],
    ['data-solid-palette', palette],
    ['data-solid-style', null],
  ]);
  let attrs, insertion;
  if (filename.endsWith('.html')) {
    const roots = [];
    const bom = text.startsWith('\uFEFF') ? 1 : 0;
    const errors = [];
    const ast = parseHtml(text.slice(bom), {
      sourceCodeLocationInfo: true,
      onParseError: (error) => errors.push(error.code),
    });
    if (errors.includes('duplicate-attribute') || errors.includes('end-tag-with-attributes'))
      throw new CliError('Неоднозначная HTML-разметка; файл сохранён.');
    function visit(node) {
      if (node.tagName === 'html' && node.sourceCodeLocation?.startTag) roots.push(node);
      for (const child of node.childNodes ?? []) visit(child);
    }
    visit(ast);
    if (roots.length !== 1) throw new CliError('Нужен один явный корневой тег <html>: ' + filename);
    const root = roots[0],
      loc = root.sourceCodeLocation.startTag;
    attrs = root.attrs.map((attr) => ({
      name: attr.name,
      value: attr.value,
      ...loc.attrs[attr.name],
    }));
    insertion = loc.endOffset - 1 + bom;
    attrs = attrs.map((attr) => ({
      ...attr,
      start: attr.startOffset + bom,
      end: attr.endOffset + bom,
    }));
  } else {
    let ast;
    try {
      ast = parseJs(text, { sourceType: 'unambiguous', plugins: ['jsx', 'typescript'] });
    } catch {
      throw new CliError('Не удалось разобрать JSX/TSX: ' + filename);
    }
    const roots = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (
        node.type === 'JSXOpeningElement' &&
        node.name.type === 'JSXIdentifier' &&
        node.name.name === 'html'
      )
        roots.push(node);
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value);
      }
    }
    visit(ast);
    if (roots.length !== 1) throw new CliError('Нужен один корневой JSX <html>: ' + filename);
    const root = roots[0];
    if (root.attributes.some((attr) => attr.type === 'JSXSpreadAttribute'))
      throw new CliError('Корневой <html> содержит spread; задайте атрибуты темы вручную.');
    attrs = root.attributes.map((attr) => ({
      name: attr.name.name,
      value: attr.value?.type === 'StringLiteral' ? attr.value.value : null,
      start: attr.start,
      end: attr.end,
    }));
    insertion = root.end - (root.selfClosing ? 2 : 1);
  }
  const changes = [],
    additions = [];
  for (const [name, value] of desired) {
    const existing = attrs.filter((attr) => attr.name === name);
    if (existing.length > 1 || (existing[0] && existing[0].value === null))
      throw new CliError('Динамический или повторный атрибут ' + name + '; файл сохранён.');
    const attr = existing[0];
    if (attr && value === null) {
      let from = attr.start;
      while (from > 0 && /[ \t]/.test(text[from - 1])) from--;
      changes.push({ start: from, end: attr.end, text: '' });
    } else if (attr && attr.value !== value)
      changes.push({ start: attr.start, end: attr.end, text: name + '="' + value + '"' });
    else if (!attr && value !== null) additions.push(name + '="' + value + '"');
  }
  if (additions.length)
    changes.push({ start: insertion, end: insertion, text: ' ' + additions.join(' ') });
  return edits(text, changes);
}
function catalogFor(provider) {
  const require = createRequire(path.join(provider.root, 'package.json'));
  let catalog;
  try {
    catalog = jsonFile(require.resolve(provider.name + '/themes.json'));
  } catch {
    throw new CliError(
      'В установленном ' + provider.name + ' нет каталога тем. Сначала выполните mednet update.',
    );
  }
  if (
    catalog.schemaVersion !== 1 ||
    catalog.package !== provider.name ||
    catalog.version !== provider.version ||
    catalog.attributes?.theme !== 'data-kit-theme' ||
    catalog.attributes?.palette !== 'data-solid-palette' ||
    !Array.isArray(catalog.themes)
  )
    throw new CliError('Неизвестный или несовместимый каталог тем ' + provider.name + '.');
  const ids = new Set();
  for (const theme of catalog.themes) {
    if (
      !theme ||
      typeof theme.id !== 'string' ||
      !/^[a-z][a-z0-9-]*$/.test(theme.id) ||
      ids.has(theme.id) ||
      !Array.isArray(theme.palettes)
    )
      throw new CliError('Некорректный каталог тем.');
    ids.add(theme.id);
    if (theme.id === 'brand') {
      if (theme.stylesheet !== null || theme.palettes.length)
        throw new CliError('Некорректная тема brand.');
    } else {
      if (theme.stylesheet !== provider.name + '/themes/' + theme.id + '.css')
        throw new CliError('Небезопасный путь темы в каталоге.');
      const palettes = theme.palettes.map((p) => p?.id);
      if (
        palettes.some((id) => typeof id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(id)) ||
        new Set(palettes).size !== palettes.length ||
        !palettes.includes(theme.defaultPalette)
      )
        throw new CliError('Некорректные палитры темы.');
    }
  }
  return { catalog, require };
}
export function planTheme({ cwd = process.cwd(), project, surface, theme, palette, css, html }) {
  if (!['brand', 'solid'].includes(theme)) throw new CliError('Тема: brand|solid', 2);
  if (theme === 'brand' && palette !== undefined)
    throw new CliError('--palette применяется к solid.', 2);
  const discovery = discoverKit({ cwd, project, surface });
  if (discovery.projects.length !== 1 || discovery.checks.some((c) => c.status === 'fail'))
    throw new CliError(
      'Не удалось выбрать совместимый установленный комплект mednet-kit. Проверьте mednet doctor и --project/--surface.',
    );
  const selected = discovery.projects[0],
    provider = selected.packages[0];
  const root = selected.root;
  assertNoTransaction(root);
  const { catalog, require } = catalogFor(provider),
    entry = catalog.themes.find((item) => item.id === theme);
  if (!entry) throw new CliError('Тема отсутствует в установленном каталоге: ' + theme, 2);
  const chosenPalette = theme === 'solid' ? (palette ?? entry.defaultPalette) : null;
  if (chosenPalette && !entry.palettes.some((p) => p.id === chosenPalette))
    throw new CliError('Неизвестная палитра: ' + chosenPalette, 2);
  if (entry.stylesheet) {
    try {
      if (!fs.statSync(require.resolve(entry.stylesheet)).isFile()) throw new Error();
    } catch {
      throw new CliError('Публичный stylesheet темы отсутствует; переустановите пакет.');
    }
  }
  const cssName = selectFile(root, css, cssCandidates, 'css'),
    htmlName = selectFile(root, html, htmlCandidates, 'html');
  if (cssName === htmlName) throw new CliError('CSS и HTML должны быть разными файлами.', 2);
  const changes = [];
  for (const [name, transform] of [
    [cssName, (text) => cssWithTheme(text, entry.stylesheet)],
    [htmlName, (text) => rootAttributes(text, htmlName, theme, chosenPalette)],
  ]) {
    const before = bytesAt(safeDestination(root, name)),
      content = Buffer.from(transform(textAt(root, name)));
    if (!before.equals(content))
      changes.push({
        path: name,
        before,
        content,
        action: 'update',
        summary:
          name === cssName
            ? 'Управляемый импорт ' + (entry.stylesheet ?? 'удалён')
            : 'Корневая тема ' + theme + (chosenPalette ? '/' + chosenPalette : ''),
      });
  }
  return {
    root,
    allowedPaths: [cssName, htmlName],
    projects: [selected.relativeRoot],
    checks: [
      check(
        'theme.catalog',
        'pass',
        'Тема выбрана из установленного публичного каталога',
        [provider.name + '@' + provider.version, theme, chosenPalette].filter(Boolean),
      ),
    ],
    changes,
    operation: 'theme',
  };
}
