import { wcagContrast } from 'culori';
import { describe, expect, it } from 'vitest';
import { toDtcgColor } from '../src/dtcg.ts';
import { loadTokens, toTokens } from '../src/load.ts';
import { CONTRAST_PAIRS, REQUIRED_BRAND, REQUIRED_SEMANTIC } from '../src/pairs.ts';

const tokens = loadTokens(new URL('../', import.meta.url));
const hex = new Map(tokens.semantic.map((token) => [token.name, token.hex]));

describe('семантика', () => {
  it.each(REQUIRED_SEMANTIC)('определяет %s (нужно shadcn и Basecoat)', (name) => {
    expect(hex.has(name)).toBe(true);
  });

  it.each(REQUIRED_BRAND)('определяет %s (расширение бренда, спека §5)', (name) => {
    expect(hex.has(name)).toBe(true);
  });

  it.each(CONTRAST_PAIRS)('%s на %s — не ниже %s:1', (fg, bg, min) => {
    const foreground = hex.get(fg);
    const background = hex.get(bg);
    expect(foreground, `нет токена ${fg}`).toBeDefined();
    expect(background, `нет токена ${bg}`).toBeDefined();
    expect(wcagContrast(foreground!, background!)).toBeGreaterThanOrEqual(min);
  });

  it('primary — красный бренда, ошибки — отдельный красный', () => {
    expect(hex.get('primary')).toBe('#b55c57');
    expect(hex.get('destructive')).toBe('#c62828');
  });

  it('хранит ссылку на примитив для CSS', () => {
    const primary = tokens.semantic.find((token) => token.name === 'primary');
    expect(primary?.ref).toBe('red-600');
  });
});

describe('toTokens', () => {
  it('запрещает семантике ссылаться не на примитивы', () => {
    const primitives = { color: { white: { $value: toDtcgColor('#ffffff') } } };
    const semantic = {
      semantic: {
        background: { $value: '{color.white}' },
        card: { $value: '{semantic.background}' },
      },
    };
    expect(() => toTokens(primitives, semantic)).toThrow(/semantic\.card.*примитив/);
  });
});
