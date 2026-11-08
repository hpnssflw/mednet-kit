import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const source = JSON.parse(readFileSync(require.resolve('@mednet/tokens/themes.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const catalog = {
  ...source,
  package: pkg.name,
  version: pkg.version,
  themes: source.themes.map((theme) => ({
    ...theme,
    stylesheet: theme.stylesheet ? pkg.name + '/themes/' + theme.id + '.css' : null,
  })),
};
writeFileSync(
  new URL('../dist/themes.json', import.meta.url),
  JSON.stringify(catalog, null, 2) + '\n',
);
