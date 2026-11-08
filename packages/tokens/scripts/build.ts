import { mkdirSync, writeFileSync } from 'node:fs';
import { emitJs, emitJson, emitThemeCss, emitTokensCss } from '../src/emit.ts';
import { loadTokens } from '../src/load.ts';
import { buildSolidTheme } from '../src/solid.ts';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const tokens = loadTokens(root);
const { js, dts } = emitJs(tokens);

mkdirSync(dist, { recursive: true });
mkdirSync(new URL('themes/', dist), { recursive: true });
const solid = buildSolidTheme(root);
const files: Record<string, string> = {
  'tokens.css': emitTokensCss(tokens),
  'theme.css': emitThemeCss(tokens),
  'tokens.json': emitJson(tokens),
  'index.js': js,
  'index.d.ts': dts,
  'themes/solid.css': solid.css,
  'themes.json': JSON.stringify(solid.catalog, null, 2) + '\n',
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(new URL(name, dist), content);
}
console.log(
  `@mednet/tokens: ${tokens.primitives.length} примитивов, ${tokens.semantic.length} семантических → dist/`,
);
