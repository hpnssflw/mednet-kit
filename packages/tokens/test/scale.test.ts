import { oklch } from 'culori';
import { describe, expect, it } from 'vitest';
import { BRAND_SHADES, GRAPHITE } from '../src/brand.ts';
import { buildScale, STEPS } from '../src/scale.ts';

const hues = Object.entries(BRAND_SHADES);

const lightness = (hex: string) => {
  const color = oklch(hex);
  if (!color) throw new Error(`Не цвет: ${hex}`);
  return color.l;
};

describe('buildScale', () => {
  it.each(hues)(
    '%s: оттенки брендбука стоят на 700/600/500/300/200/100 без изменений',
    (_, shades) => {
      const scale = buildScale(shades);
      expect([scale[700], scale[600], scale[500], scale[300], scale[200], scale[100]]).toEqual([
        ...shades,
      ]);
    },
  );

  it.each(hues)('%s: каждый следующий шаг темнее предыдущего', (_, shades) => {
    const scale = buildScale(shades);
    const values = STEPS.map((step) => lightness(scale[step]));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]!);
    }
  });

  it.each(hues)('%s: все шаги — 6-значный HEX в нижнем регистре', (_, shades) => {
    for (const hex of Object.values(buildScale(shades))) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('генерирует промежуточные и тёмные шаги детерминированно', () => {
    expect(buildScale(BRAND_SHADES.red)[400]).toBe('#db968f');
    expect(buildScale(BRAND_SHADES.orange)[800]).toBe('#8c5f3e');
    expect(buildScale(BRAND_SHADES.green)[50]).toBe('#f2f8f0');
    expect(buildScale(BRAND_SHADES.blue)[950]).toBe('#051015');
  });
});

describe('GRAPHITE', () => {
  it('держит опорные точки спеки', () => {
    expect(GRAPHITE[400]).toBe('#8a8a8a');
    expect(GRAPHITE[600]).toBe('#666666');
    expect(GRAPHITE[900]).toBe('#333333');
  });

  it('темнеет от 50 к 950', () => {
    const values = STEPS.map((step) => lightness(GRAPHITE[step]));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]!);
    }
  });
});
