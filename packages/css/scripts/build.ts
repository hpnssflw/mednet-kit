import { compile, optimize } from '@tailwindcss/node';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFontFaces } from './fonts.ts';
import postcss from 'postcss';

const require = createRequire(import.meta.url);

// Chrome/Edge 109 (Windows 7/8.1, спека D18): статические копии цветов перед @supports, var(--x, ),
// hex вместо oklch() в иконках, значения в ::backdrop. Тот же плагин подключают Next-проекты.
const legacyFallbacks = postcss([require('@mednet/ui/postcss')()]);
const withLegacyFallbacks = (code: string) =>
  legacyFallbacks.process(code, { from: undefined }).css;
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version: string;
};
const banner = `/*! @mednet/css v${version} | дизайн-система ЦНИИОИЗ | Basecoat (MIT), Tailwind CSS (MIT), Montserrat (OFL-1.1) | см. THIRD_PARTY_NOTICES.md */`;

mkdirSync(join(dist, 'fonts'), { recursive: true });

// Шрифты: @font-face + файлы woff2 + лицензия OFL (обязательна при распространении).
const fontsourceDir = dirname(require.resolve('@fontsource/montserrat/package.json'));
const fonts = loadFontFaces(fontsourceDir);
for (const file of fonts.files) {
  copyFileSync(join(fontsourceDir, 'files', file), join(dist, 'fonts', file));
}
copyFileSync(require.resolve('@fontsource/montserrat/LICENSE'), join(dist, 'fonts', 'OFL.txt'));
writeFileSync(join(dist, 'fonts.css'), `${banner}\n${fonts.css}\n`);

// Компоненты Basecoat + тема бренда.
const entry = join(root, 'src', 'mednet.css');
const compiler = await compile(readFileSync(entry, 'utf8'), {
  base: dirname(entry),
  onDependency: () => {},
});
const css = `${banner}\n${fonts.css}\n\n${compiler.build([])}`;
// Обе версии проходят Lightning CSS: вложенные правила Basecoat (`&`) разворачиваются,
// поэтому mednet.css работает и в браузерах без CSS nesting — так же, как mednet.min.css.
// Плагин — после optimize: минификатор Tailwind сам пишет var(--x,) без пробела.
writeFileSync(join(dist, 'mednet.css'), withLegacyFallbacks(optimize(css, { minify: false }).code));
writeFileSync(
  join(dist, 'mednet.min.css'),
  withLegacyFallbacks(optimize(css, { minify: true }).code),
);

// JS Basecoat для интерактивных компонентов (диалоги, выпадающие меню, табы).
// Лицензия MIT требует сохранять уведомление об авторских правах в каждой копии.
const basecoatDir = dirname(require.resolve('basecoat-css/package.json'));
const basecoatVersion = (
  JSON.parse(readFileSync(join(basecoatDir, 'package.json'), 'utf8')) as { version: string }
).version;
const basecoatCopyright = /^Copyright \(c\) (.+)$/m.exec(
  readFileSync(join(basecoatDir, 'LICENSE.md'), 'utf8'),
)?.[1];
if (!basecoatCopyright) {
  throw new Error('basecoat-css/LICENSE.md: не найдена строка Copyright (c) …');
}
const basecoatNotice = `/*! Basecoat v${basecoatVersion} | MIT | (c) ${basecoatCopyright} | https://basecoatui.com */`;
const basecoatJs = readFileSync(require.resolve('basecoat-css/all.min'), 'utf8');
writeFileSync(join(dist, 'mednet.js'), `${basecoatNotice}\n${basecoatJs}`);

console.log(
  `@mednet/css: ${Math.round(css.length / 1024)} КБ CSS, ${fonts.files.length} файлов шрифтов → dist/`,
);
