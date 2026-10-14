// @vitest-environment node
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const legacyFallbacks = createRequire(import.meta.url)('../../postcss.cjs');
const run = (css: string) => postcss([legacyFallbacks()]).process(css, { from: undefined }).css;

const THEME =
  ':root { --destructive: #c62828; --mn-black: #000; }\n.dark { --destructive: #ef5350; }\n';
const GUARDED = (
  selector: string,
  percent: number,
) => `${selector} { background-color: var(--destructive); }
@supports (color: color-mix(in lab, red, red)) {
  ${selector} { background-color: color-mix(in oklab, var(--destructive) ${percent}%, transparent); }
}
`;

describe('@mednet/ui/postcss (Chrome/Edge 109)', () => {
  it('перед @supports — копия со статическим цветом, сам блок @supports не тронут', () => {
    const out = run(THEME + GUARDED('.bg-destructive\/10', 10));
    const copy = out.indexOf('#c628281a');
    const supports = out.indexOf('@supports');
    expect(copy).toBeGreaterThan(-1);
    expect(copy).toBeLessThan(supports);
    expect(out).toContain('color-mix(in oklab, var(--destructive) 10%, transparent)');
  });

  it('селекторы .dark берут цвета тёмной темы', () => {
    const out = run(THEME + GUARDED('.dark .x', 10));
    expect(out).toContain('#ef53501a');
  });

  it('смесь с currentcolor не копируется — её не посчитать заранее', () => {
    const css = `.x { color: currentcolor; }
@supports (color: color-mix(in lab, red, red)) { .x { color: color-mix(in oklab, currentcolor 50%, transparent); } }`;
    expect(run(css).match(/\.x \{/g)).toHaveLength(2);
  });

  it('var(--x,) → var(--x, ): иначе Chrome 109 теряет кольца фокуса', () => {
    const out = run('.ring { box-shadow: var(--tw-ring-inset,) 0 0 0 3px red; }');
    expect(out).toContain('var(--tw-ring-inset, ) 0 0 0 3px red');
  });

  it('oklch() в SVG data-URI → hex с %23', () => {
    const out = run(
      `:root { --check-icon: url("data:image/svg+xml,%3Csvg stroke='oklch(0.556 0 0)'%3E%3C/svg%3E"); }`,
    );
    expect(out).not.toContain('oklch(');
    expect(out).toContain("stroke='%23737373'");
  });

  it('var() в ::backdrop заменяется значением из :root', () => {
    const out = run(THEME + 'dialog::backdrop { background-color: var(--mn-black); }');
    expect(out).toContain('dialog::backdrop { background-color: #000; }');
  });
});
