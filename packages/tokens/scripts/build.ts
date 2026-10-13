import { mkdirSync, writeFileSync } from 'node:fs';
import { emitJs, emitJson, emitThemeCss, emitTokensCss } from '../src/emit.ts';
import { loadTokens } from '../src/load.ts';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const tokens = loadTokens(root);
const { js, dts } = emitJs(tokens);

mkdirSync(dist, { recursive: true });
const files: Record<string, string> = {
  'tokens.css': emitTokensCss(tokens),
  'theme.css': emitThemeCss(tokens),
  'tokens.json': emitJson(tokens),
  'index.js': js,
  'index.d.ts': dts,
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(new URL(name, dist), content);
}
console.log(
  `@mednet/tokens: ${tokens.primitives.length} примитивов, ${tokens.semantic.length} семантических → dist/`,
);
