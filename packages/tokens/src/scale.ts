import { clampChroma, formatHex, interpolate, oklch, type Color, type Oklch } from 'culori';
import type { ShadeRow } from './brand.ts';

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Step = (typeof STEPS)[number];
export type Scale = Record<Step, string>;

function parse(color: Color | string): Oklch {
  const result = oklch(color);
  if (!result) throw new Error(`Не удалось разобрать цвет: ${JSON.stringify(color)}`);
  return result;
}

function toHex(color: Oklch): string {
  const hex = formatHex(clampChroma(color, 'oklch'));
  if (!hex) throw new Error(`Не удалось перевести в HEX: ${JSON.stringify(color)}`);
  return hex;
}

/**
 * Позиционная шкала (спека §5): оттенки брендбука сохраняются точно,
 * базовый цвет s3 всегда стоит на 500. Шаги 50, 400 и 800–950 генерируются в OKLCH.
 */
export function buildScale(shades: ShadeRow): Scale {
  const [s1, s2, s3, s4, s5, s6] = shades;
  const darkest = parse(s1);
  const lightest = parse(s6);
  const darker = (deltaL: number, chromaFactor: number) =>
    toHex({
      mode: 'oklch',
      l: darkest.l - deltaL,
      c: (darkest.c ?? 0) * chromaFactor,
      h: darkest.h,
    });

  return {
    50: toHex({
      mode: 'oklch',
      l: lightest.l + (1 - lightest.l) * 0.5,
      c: (lightest.c ?? 0) * 0.5,
      h: lightest.h,
    }),
    100: s6,
    200: s5,
    300: s4,
    400: toHex(parse(interpolate([s3, s4], 'oklch')(0.5))),
    500: s3,
    600: s2,
    700: s1,
    800: darker(0.08, 0.85),
    900: darker(0.15, 0.7),
    950: darker(0.24, 0.5),
  };
}
