import { describe, expect, it } from 'vitest';
import { toDtcgColor } from '../src/dtcg.ts';
import { emitJs, emitJson, emitThemeCss, emitTokensCss, tokensObject } from '../src/emit.ts';
import { toTokens } from '../src/load.ts';

const fixture = toTokens(
  {
    color: {
      $type: 'color',
      white: { $value: toDtcgColor('#ffffff') },
      red: { '600': { $value: toDtcgColor('#b55c57') } },
    },
  },
  {
    semantic: {
      $type: 'color',
      background: { $value: '{color.white}' },
      primary: { $value: '{color.red.600}' },
    },
  },
);

describe('emitTokensCss', () => {
  const css = emitTokensCss(fixture);

  it('объявляет примитивы', () => {
    expect(css).toContain('--mn-red-600: #b55c57;');
    expect(css).toContain('--mn-white: #ffffff;');
  });

  it('объявляет семантику с префиксом и в именах shadcn', () => {
    expect(css).toContain('--mn-primary: var(--mn-red-600);');
    expect(css).toContain('--primary: var(--mn-primary);');
  });

  it('объявляет базовые токены', () => {
    expect(css).toContain('--mn-radius: 1rem;');
    expect(css).toContain('--radius: var(--mn-radius);');
    expect(css).toContain('--mn-font-sans: "Montserrat"');
    expect(css).toContain('--mn-text-h1: clamp(1.75rem, 3.2vw, 2.875rem);');
    expect(css).toContain('--mn-shadow-md:');
  });

  it('отключает анимации при prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*--mn-duration-base: 0ms;/);
  });
});

describe('emitThemeCss', () => {
  const css = emitThemeCss(fixture);

  it('подключает tokens.css', () => {
    expect(css).toContain('@import "./tokens.css";');
  });

  it('сбрасывает палитру Tailwind до маппинга цветов', () => {
    expect(css.indexOf('--color-*: initial;')).toBeGreaterThan(-1);
    expect(css.indexOf('--color-*: initial;')).toBeLessThan(
      css.indexOf('--color-red-600: var(--mn-red-600);'),
    );
  });

  it('маппит семантику на переменные shadcn', () => {
    expect(css).toContain('--color-primary: var(--primary);');
  });

  it('задаёт шрифты литералом в обычном @theme (иначе Basecoat оставит Geist)', () => {
    expect(css).toMatch(/@theme \{[^}]*--font-sans: "Montserrat"/);
  });

  it('связывает анимации Tailwind с токенами движения (для prefers-reduced-motion)', () => {
    expect(css).toMatch(/@theme \{[^}]*--default-transition-duration: var\(--mn-duration-fast\);/);
    expect(css).toMatch(/@theme \{[^}]*--default-transition-timing-function: var\(--mn-ease\);/);
  });

  it('даёт утилиты размеров текста и теней', () => {
    expect(css).toContain('--text-h1: var(--mn-text-h1);');
    expect(css).toContain('--text-h1--line-height: var(--mn-text-h1-line-height);');
    expect(css).toContain('--shadow-md: var(--mn-shadow-md);');
  });
});

describe('tokensObject', () => {
  it('принимает имена <оттенок> и <оттенок>-<шаг>', () => {
    expect(() => tokensObject(fixture)).not.toThrow();
  });

  it.each(['red-600-hover', 'red-', 'red-abc', '-600'])(
    'бросает ошибку на примитив «%s» вместо молчаливой потери части имени',
    (name) => {
      const bad = { ...fixture, primitives: [{ name, hex: '#000000', ref: null }] };
      expect(() => tokensObject(bad)).toThrow(new RegExp('примитив.*' + name));
    },
  );
});

describe('emitJson / emitJs', () => {
  it('группирует шкалы по цвету', () => {
    const json = JSON.parse(emitJson(fixture)) as {
      color: { red: Record<string, string>; white: string };
      semantic: Record<string, string>;
    };
    expect(json.color.red['600']).toBe('#b55c57');
    expect(json.color.white).toBe('#ffffff');
    expect(json.semantic.primary).toBe('#b55c57');
  });

  it('выпускает ESM и точные типы', () => {
    const { js, dts } = emitJs(fixture);
    expect(js).toContain('export const color =');
    expect(js).toContain('export const semantic =');
    expect(js).toContain('export default {');
    expect(dts).toContain('export declare const semantic: {');
    expect(dts).toContain('"primary": "#b55c57"');
  });
});
