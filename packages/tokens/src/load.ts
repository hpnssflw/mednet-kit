import { readFileSync } from 'node:fs';
import { aliasTarget, flatten, resolveColors, type DtcgTree } from './dtcg.ts';

export interface ColorToken {
  /** Имя в CSS-форме: `red-500`, `white`, `primary`. */
  name: string;
  hex: string;
  /** Для семантики — имя примитива, на который она ссылается (`red-600`). */
  ref: string | null;
}

export interface Tokens {
  primitives: ColorToken[];
  semantic: ColorToken[];
}

/** `color.red.500` → `red-500`, `semantic.primary` → `primary`. */
const cssName = (path: string) => path.split('.').slice(1).join('-');

export function toTokens(primitivesTree: DtcgTree, semanticTree: DtcgTree): Tokens {
  const primitives = flatten(primitivesTree);
  const semantic = flatten(semanticTree);
  const resolved = resolveColors(new Map([...primitives, ...semantic]));
  const hexOf = (path: string) => {
    const hex = resolved.get(path);
    if (!hex) throw new Error(`Не удалось вычислить ${path}`);
    return hex;
  };

  return {
    primitives: [...primitives.keys()].map((path) => ({
      name: cssName(path),
      hex: hexOf(path),
      ref: null,
    })),
    semantic: [...semantic.entries()].map(([path, value]) => {
      const target = aliasTarget(value);
      if (!target?.startsWith('color.')) {
        throw new Error(`${path}: семантический токен должен ссылаться на примитив color.*`);
      }
      return { name: cssName(path), hex: hexOf(path), ref: cssName(target) };
    }),
  };
}

/** Читает tokens/*.json пакета. `root` — URL корня пакета со слешем на конце. */
export function loadTokens(root: URL): Tokens {
  const read = (file: string) => JSON.parse(readFileSync(new URL(file, root), 'utf8')) as DtcgTree;
  return toTokens(read('tokens/primitives.json'), read('tokens/semantic.json'));
}
