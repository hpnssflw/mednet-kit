import { readFileSync } from 'node:fs';

interface ThemeRule {
  selector: string;
  declarations: Record<string, string>;
}
interface SolidDefinition {
  schemaVersion: number;
  id: string;
  defaultPalette: string;
  palettes: { id: string; name: string; description: string }[];
  rules: ThemeRule[];
}
export function buildSolidTheme(root: URL) {
  const definition = JSON.parse(
    readFileSync(new URL('tokens/themes/solid.json', root), 'utf8'),
  ) as SolidDefinition;
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
    name: string;
    version: string;
  };
  if (definition.schemaVersion !== 1 || definition.id !== 'solid' || !definition.palettes.length)
    throw new Error('Некорректное определение темы solid');
  const ids = new Set(definition.palettes.map((p) => p.id));
  if (ids.size !== definition.palettes.length || !ids.has(definition.defaultPalette))
    throw new Error('Некорректные палитры solid');
  for (const rule of definition.rules) {
    const selector =
      /^html(?:\.dark)?\[data-kit-theme='solid'\](?:\[data-solid-palette='([a-z-]+)'\])?$/.exec(
        rule.selector,
      );
    if (!selector || (selector[1] && !ids.has(selector[1])))
      throw new Error('Тема не может менять правила вне своего opt-in: ' + rule.selector);
    for (const [name, value] of Object.entries(rule.declarations)) {
      if (!/^--(?:mn-|solid-)/.test(name) || typeof value !== 'string' || /[{};]/.test(value))
        throw new Error('Некорректный токен темы: ' + name);
    }
  }
  const css = [
    '/* @mednet/tokens — generated Solid theme; source: tokens/themes/solid.json */',
    ...definition.rules.map(
      (rule) =>
        rule.selector +
        ' {\n' +
        Object.entries(rule.declarations)
          .map(([name, value]) => '  ' + name + ': ' + value + ';')
          .join('\n') +
        '\n}',
    ),
    '',
  ].join('\n\n');
  const catalog = {
    schemaVersion: 1,
    package: pkg.name,
    version: pkg.version,
    attributes: { theme: 'data-kit-theme', palette: 'data-solid-palette' },
    themes: [
      {
        id: 'brand',
        name: 'Бренд',
        stylesheet: null,
        defaultPalette: null,
        palettes: [] as SolidDefinition['palettes'],
      },
      {
        id: 'solid',
        name: 'Солид',
        stylesheet: pkg.name + '/themes/solid.css',
        defaultPalette: definition.defaultPalette,
        palettes: definition.palettes,
      },
    ],
  };
  return { css, catalog, rules: definition.rules };
}
