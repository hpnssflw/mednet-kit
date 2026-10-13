// Копирует dist/ и demo/ пакета @mednet/css в public/, сохраняя их взаимное расположение:
// demo/index.html ссылается на ../dist/mednet.css.
import { cpSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const cssPackage = dirname(require.resolve('@mednet/css/package.json'));
const target = fileURLToPath(new URL('../public/static-demo/', import.meta.url));

rmSync(target, { recursive: true, force: true });
cpSync(join(cssPackage, 'dist'), join(target, 'dist'), { recursive: true });
cpSync(join(cssPackage, 'demo'), join(target, 'demo'), { recursive: true });
console.log(`Демо статики → ${target}`);
