import { compile, optimize } from '@tailwindcss/node';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFontFaces } from './fonts.ts';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version: string;
};
const banner = `/*! @mednet/css v${version} | дизайн-система ЦНИИОИЗ | Basecoat (MIT), Tailwind CSS (MIT), Montserrat (OFL-1.1) */`;

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
writeFileSync(join(dist, 'mednet.css'), css);
writeFileSync(join(dist, 'mednet.min.css'), optimize(css, { minify: true }).code);

// JS Basecoat для интерактивных компонентов (диалоги, выпадающие меню, табы).
copyFileSync(require.resolve('basecoat-css/all.min'), join(dist, 'mednet.js'));

console.log(
  `@mednet/css: ${Math.round(css.length / 1024)} КБ CSS, ${fonts.files.length} файлов шрифтов → dist/`,
);
