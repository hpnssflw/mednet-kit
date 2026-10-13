import { rgb } from 'culori';

/** Цвет в формате DTCG 2025.10. */
export interface DtcgColor {
  colorSpace: 'srgb';
  components: [number, number, number];
  hex: string;
}

export type DtcgTree = { [key: string]: unknown };

const ALIAS = /^\{([^{}]+)\}$/;
const round = (value: number) => Math.round(value * 10000) / 10000;

export function toDtcgColor(hex: string): DtcgColor {
  const color = rgb(hex);
  if (!color) throw new Error(`Не цвет: ${hex}`);
  return {
    colorSpace: 'srgb',
    components: [round(color.r), round(color.g), round(color.b)],
    hex: hex.toLowerCase(),
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Разворачивает дерево DTCG в «путь → $value». Ключи на `$` — метаданные. */
export function flatten(tree: DtcgTree, prefix = ''): Map<string, unknown> {
  const result = new Map<string, unknown>();
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$') || !isObject(node)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ('$value' in node) {
      result.set(path, node.$value);
    } else {
      for (const [childPath, value] of flatten(node, path)) result.set(childPath, value);
    }
  }
  return result;
}

export function aliasTarget(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return ALIAS.exec(value)?.[1] ?? null;
}

/** Превращает каждый токен в HEX, следуя алиасам. Падает на неизвестных и циклических алиасах. */
export function resolveColors(tokens: Map<string, unknown>): Map<string, string> {
  const resolved = new Map<string, string>();

  const visit = (path: string, stack: string[]): string => {
    const known = resolved.get(path);
    if (known) return known;
    if (stack.includes(path)) {
      throw new Error(`Циклический алиас: ${[...stack, path].join(' → ')}`);
    }
    if (!tokens.has(path)) {
      const from = stack.at(-1);
      throw new Error(`Неизвестный токен: ${path}${from ? ` (ссылка из ${from})` : ''}`);
    }
    const value = tokens.get(path);
    const target = aliasTarget(value);
    let hex: string;
    if (target) {
      hex = visit(target, [...stack, path]);
    } else if (isObject(value) && typeof value.hex === 'string') {
      hex = value.hex;
    } else {
      throw new Error(
        `Токен ${path}: ожидался цвет DTCG или алиас, получено ${JSON.stringify(value)}`,
      );
    }
    resolved.set(path, hex);
    return hex;
  };

  for (const path of tokens.keys()) visit(path, []);
  return resolved;
}
