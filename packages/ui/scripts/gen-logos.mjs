// Логотип: SVG из assets/brand/logo → TSX в src/brand/logo (результат коммитится).
// Запуск: pnpm logos (или node scripts/gen-logos.mjs [папка-вывода] — так его вызывает тест).
// Id внутри SVG (clipPath, use) получают префикс из useId(): логотипы на одной странице не конфликтуют.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const SOURCE = new URL('../../../assets/brand/logo/', import.meta.url);
const OUT = process.argv[2] ?? fileURLToPath(new URL('../src/brand/logo/', import.meta.url));
// Варианты спеки §7; logo-horizontal-minzdrav.svg в набор не входит.
const FILES = ['logo-horizontal.svg', 'logo-vertical.svg', 'logo-mark.svg'];
const UID = '__uid__'; // временный префикс id, в TSX заменяется на useId()
const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'defs',
  'clipPath',
  'use',
  'circle',
  'rect',
  'polygon',
  'ellipse',
]);

const pascal = (name) => name.replace(/(^|-)(\w)/g, (_, __, char) => char.toUpperCase());
// Атрибуты SVG → пропсы React; aria-* и data-* остаются как есть.
const prop = (name) =>
  name === 'class'
    ? 'className'
    : /^(aria|data)-/.test(name)
      ? name
      : name.replace(/[-:]([a-z])/g, (_, char) => char.toUpperCase());

function toJsx(svg) {
  if (/<style|style=/.test(svg)) throw new Error('style не поддерживается: доработайте генератор');
  for (const [, tag] of svg.matchAll(/<([a-zA-Z]+)/g)) {
    if (!ALLOWED_TAGS.has(tag)) throw new Error(`неожиданный тег <${tag}>`);
  }
  const viewBox = svg.match(/<svg[^>]*\sviewBox="([^"]+)"/)[1];
  const body = svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .replace(/\s([a-zA-Z:-]+)="([^"]*)"/g, (_, name, value) => {
      const jsx = value.includes(UID) ? `{\`${value.replaceAll(UID, '${uid}')}\`}` : `"${value}"`;
      return ` ${prop(name)}=${jsx}`;
    })
    .replace(/<(\w+)([^>]*)><\/\1>/g, '<$1$2 />');
  return { viewBox, body };
}

for (const file of FILES) {
  const name = file.replace(/\.svg$/, '');
  const svg = await readFile(new URL(file, SOURCE), 'utf8');
  const { data } = optimize(svg, {
    multipass: true,
    plugins: [
      'preset-default', // svgo 4 больше не удаляет viewBox и title
      'removeXlink', // xlink:href → href
      'removeDimensions', // без width/height: размер задаёт CSS
      { name: 'removeAttrs', params: { attrs: ['data-text'] } }, // мусор извлечения из PDF
      { name: 'prefixIds', params: { prefix: UID, delim: '' } },
    ],
  });
  const { viewBox, body } = toJsx(data);
  const component = pascal(name);
  const tsx = `// Сгенерировано scripts/gen-logos.mjs из assets/brand/logo/${file}, не редактировать.
import { useId, type SVGProps } from "react";

export interface ${component}Props extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Доступное имя. Без него логотип декоративный (aria-hidden). */
  title?: string;
}

export function ${component}({ title, ...props }: ${component}Props) {
  const uid = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${viewBox}"
      role={title ? "img" : undefined}
      aria-labelledby={title ? \`\${uid}title\` : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title id={\`\${uid}title\`}>{title}</title> : null}
      ${body}
    </svg>
  );
}
`;
  await writeFile(join(OUT, `${name}.tsx`), tsx);
  console.log(`${file}: ${svg.length} Б svg → ${tsx.length} Б tsx`);
}
