import { describe, expect, it } from 'vitest';
import { buildSolidTheme } from '../src/solid.ts';

const root = new URL('../', import.meta.url);
describe('официальный Солид', () => {
  it('даёт потребителю catalog всех утверждённых палитр и корректный stylesheet', () => {
    const result = buildSolidTheme(root);
    expect(result.catalog.schemaVersion).toBe(1);
    expect(result.catalog.themes.map((t) => t.id)).toEqual(['brand', 'solid']);
    expect(result.catalog.themes[1]?.palettes.map((p) => p.id)).toEqual([
      'terracotta',
      'indigo',
      'graphite',
      'bright',
    ]);
    expect(result.catalog.themes[1]?.stylesheet).toBe('@mednet/tokens/themes/solid.css');
    expect(result.css).toContain("html[data-kit-theme='solid'][data-solid-palette='graphite']");
    expect(result.css).toContain('--mn-primary: #30343b;');
    expect(result.css).toContain(
      "html.dark[data-kit-theme='solid'][data-solid-palette='graphite']",
    );
    expect(result.css).toContain('--mn-primary: #d9e0ea;');
  });
  it('ограничивает все правила темы явным opt-in, сохраняя исходный Бренд', () => {
    const { rules } = buildSolidTheme(root);
    expect(rules.length).toBeGreaterThan(8);
    expect(rules.every((r) => /^html(?:\.dark)?\[data-kit-theme='solid'\]/.test(r.selector))).toBe(
      true,
    );
  });
  it('не меняет сетку и типографику приложения при переключении темы', () => {
    const { rules } = buildSolidTheme(root);
    const names = rules.flatMap((rule) => Object.keys(rule.declarations));
    expect(names).not.toContain('--spacing');
    expect(names.filter((name) => name.startsWith('--mn-text-'))).toEqual([]);
  });
});
