// llms.md — справка для AI-агентов: правила, фирменные блоки, модули и их экспорты.
// Экспорты берутся из собранных dist/**/*.d.ts через TypeScript compiler API. Запускается в build после tsc.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const DOCS = 'https://ui.shadcn.com/docs/components/base/';
const BRAND = {
  logo: 'dist/brand/logo.d.ts',
  'site-header': 'dist/brand/site-header.d.ts',
  'site-footer': 'dist/brand/site-footer.d.ts',
  'public-layout': 'dist/layouts/public-layout.d.ts',
  'app-shell': 'dist/layouts/app-shell.d.ts',
};
const components = readdirSync(new URL('dist/components/', root))
  .filter((file) => file.endsWith('.d.ts'))
  .map((file) => file.slice(0, -'.d.ts'.length))
  .sort();
const modules = [
  ...Object.entries(BRAND).map(([name, file]) => ({ name, file, brand: true })),
  ...components.map((name) => ({ name, file: `dist/components/${name}.d.ts`, brand: false })),
];
const path = (file) => fileURLToPath(new URL(file, root));

const program = ts.createProgram(
  modules.map((module) => path(module.file)),
  {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    noEmit: true,
  },
);
const checker = program.getTypeChecker();

const GROUPS = { component: 'компоненты', hook: 'хуки', type: 'типы', value: 'прочее' };

function kind(symbol) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  if (target.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)) return 'type';
  if (/^use[A-Z]/.test(symbol.name)) return 'hook';
  // Компоненты бывают функциями и константами (ChartTooltip = RechartsPrimitive.Tooltip).
  if (/^[A-Z][a-z]/.test(symbol.name)) return 'component';
  return 'value';
}

function exportsOf(file) {
  const source = program.getSourceFile(path(file));
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) throw new Error(`llms: нет ${file} — сначала tsc`);
  const groups = {};
  for (const item of checker.getExportsOfModule(symbol))
    (groups[kind(item)] ??= []).push(item.name);
  return Object.entries(GROUPS)
    .filter(([key]) => groups[key])
    .map(
      ([key, label]) =>
        `- ${label}: ${groups[key]
          .sort()
          .map((name) => `\`${name}\``)
          .join(', ')}`,
    )
    .join('\n');
}

const section = ({ name, file, brand }) =>
  [
    `### \`@mednet/ui/${name}\``,
    '',
    exportsOf(file),
    ...(brand ? [] : [`- документация: ${DOCS}${name}`]),
    '',
  ].join('\n');
const read = (file) => readFileSync(new URL(file, root), 'utf8').trim();

const text = [
  `# @mednet/ui ${pkg.version} — справка для AI-агентов`,
  '',
  read('llms/intro.md'),
  '',
  read('llms/brand.md'),
  '',
  '## Модули фирменных блоков',
  '',
  ...modules.filter((module) => module.brand).map(section),
  '## Компоненты shadcn/ui (Base UI, стиль Maia)',
  '',
  'API и примеры — как в документации shadcn/ui для Base UI (ссылка у каждого модуля). Отличия кита: цвета из токенов бренда, подписи для экранного диктора по-русски.',
  '',
  ...modules.filter((module) => !module.brand).map(section),
].join('\n');

writeFileSync(new URL('llms.md', root), text);
console.log(`llms.md: ${modules.length} модулей`);
