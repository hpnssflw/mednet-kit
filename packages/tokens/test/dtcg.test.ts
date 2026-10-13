import { describe, expect, it } from 'vitest';
import { aliasTarget, flatten, resolveColors, toDtcgColor } from '../src/dtcg.ts';

describe('toDtcgColor', () => {
  it('описывает цвет в формате DTCG 2025.10', () => {
    expect(toDtcgColor('#B55C57')).toEqual({
      colorSpace: 'srgb',
      components: [0.7098, 0.3608, 0.3412],
      hex: '#b55c57',
    });
  });

  it('падает на не-цвете', () => {
    expect(() => toDtcgColor('banana')).toThrow(/не цвет/i);
  });
});

describe('flatten', () => {
  it('собирает пути до токенов и пропускает $-метаданные', () => {
    const tree = {
      color: {
        $type: 'color',
        white: { $value: toDtcgColor('#ffffff') },
        red: { '600': { $value: toDtcgColor('#b55c57') } },
      },
    };
    expect([...flatten(tree).keys()]).toEqual(['color.white', 'color.red.600']);
  });
});

describe('aliasTarget', () => {
  it('распознаёт алиас', () => {
    expect(aliasTarget('{color.red.600}')).toBe('color.red.600');
  });
  it('возвращает null для значения', () => {
    expect(aliasTarget(toDtcgColor('#ffffff'))).toBeNull();
    expect(aliasTarget('#ffffff')).toBeNull();
  });
});

describe('resolveColors', () => {
  it('разворачивает цепочки алиасов', () => {
    const tokens = new Map<string, unknown>([
      ['color.red.600', toDtcgColor('#b55c57')],
      ['semantic.primary', '{color.red.600}'],
      ['semantic.link', '{semantic.primary}'],
    ]);
    expect(resolveColors(tokens).get('semantic.link')).toBe('#b55c57');
  });

  it('падает на неизвестном алиасе с понятным сообщением', () => {
    const tokens = new Map<string, unknown>([['semantic.primary', '{color.red.601}']]);
    expect(() => resolveColors(tokens)).toThrow(/неизвестный токен: color\.red\.601/i);
  });

  it('падает на цикле', () => {
    const tokens = new Map<string, unknown>([
      ['a', '{b}'],
      ['b', '{a}'],
    ]);
    expect(() => resolveColors(tokens)).toThrow(/цикл/i);
  });
});
