// @vitest-environment node
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

describe('Solid сохраняет геометрию потребителя', () => {
  for (const file of ['../brand.css', '../../../css/src/overrides.css']) {
    it(`${file}: оформление не задаёт размеры и плотность`, () => {
      const root = postcss.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
      const declarations: string[] = [];
      root.walkRules((rule) => {
        if (!rule.selector.includes("data-kit-theme='solid'")) return;
        rule.walkDecls((declaration) => {
          declarations.push(declaration.prop);
        });
      });
      expect(declarations.length).toBeGreaterThan(0);
      expect(
        declarations.filter((property) =>
          /^(--spacing|(?:min-|max-)?(?:width|height|inline-size|block-size)|padding(?:-.+)?|margin(?:-.+)?|gap|font(?:-.+)?|line-height)$/.test(
            property,
          ),
        ),
      ).toEqual([]);
    });
  }
});
