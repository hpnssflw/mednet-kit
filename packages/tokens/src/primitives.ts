import { BRAND_SHADES, DANGER, GRAPHITE } from './brand.ts';
import { toDtcgColor, type DtcgTree } from './dtcg.ts';
import { buildScale } from './scale.ts';

const group = (scale: Record<number, string>): DtcgTree =>
  Object.fromEntries(
    Object.entries(scale).map(([step, hex]) => [step, { $value: toDtcgColor(hex) }]),
  );

/** Дерево примитивов DTCG. Источник для tokens/primitives.json. */
export function buildPrimitives(): DtcgTree {
  const color: DtcgTree = {
    $type: 'color',
    $description:
      'Примитивы бренда ЦНИИОИЗ. Сгенерировано scripts/generate-primitives.ts — не редактировать вручную.',
    white: { $value: toDtcgColor('#ffffff') },
    black: { $value: toDtcgColor('#000000') },
  };
  for (const [hue, shades] of Object.entries(BRAND_SHADES)) {
    color[hue] = group(buildScale(shades));
  }
  color.graphite = group(GRAPHITE);
  color.danger = group(DANGER);
  return { color };
}
