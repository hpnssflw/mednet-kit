import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BRAND_SHADES } from '../src/brand.ts';
import { flatten } from '../src/dtcg.ts';
import { buildPrimitives } from '../src/primitives.ts';
import { STEPS } from '../src/scale.ts';

describe('buildPrimitives', () => {
  const paths = [...flatten(buildPrimitives()).keys()];

  it('содержит белый, чёрный и 11 шагов каждого цвета бренда', () => {
    expect(paths).toContain('color.white');
    expect(paths).toContain('color.black');
    for (const hue of Object.keys(BRAND_SHADES)) {
      for (const step of STEPS) expect(paths).toContain(`color.${hue}.${step}`);
    }
  });

  it('содержит graphite и danger', () => {
    expect(paths).toContain('color.graphite.900');
    expect(paths).toContain('color.danger.600');
  });
});

describe('tokens/primitives.json', () => {
  it('совпадает с генератором (после правок brand.ts/scale.ts запустите `pnpm --filter @mednet/tokens generate`)', () => {
    const committed = JSON.parse(
      readFileSync(new URL('../tokens/primitives.json', import.meta.url), 'utf8'),
    ) as unknown;
    expect(committed).toEqual(buildPrimitives());
  });
});
