import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONT_SUBSETS, FONT_WEIGHTS } from '../scripts/fonts.ts';

const require = createRequire(import.meta.url);

const distUrl = (file: string) => new URL(`../dist/${file}`, import.meta.url);
const read = (file: string) => readFileSync(distUrl(file), 'utf8');

interface CssRule {
  /** Обёртки правила (@layer, @media) без @supports: в современных браузерах он не меняет каскад. */
  context: string;
  selectors: string[];
  declarations: Array<[string, string]>;
}

/** Делит текст по разделителю верхнего уровня — вне скобок и строк. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let current = '';
  for (const char of text) {
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(' || char === '[') {
      depth++;
    } else if (char === ')' || char === ']') {
      depth--;
    } else if (char === separator && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Правила CSS без вложенности (выход Lightning CSS) в порядке исходника. */
function parseRules(source: string): CssRule[] {
  const rules: CssRule[] = [];
  const stack: string[] = [];
  let buffer = '';
  let quote = '';
  for (const char of source.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (quote) {
      if (char === quote) quote = '';
      buffer += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
    } else if (char === '{') {
      // Отбрасываем at-правила-инструкции перед блоком (`@layer utilities;`).
      stack.push(buffer.slice(buffer.lastIndexOf(';') + 1).trim());
      buffer = '';
    } else if (char === '}') {
      const prelude = stack.pop() ?? '';
      if (!prelude.startsWith('@')) {
        rules.push({
          context: stack.filter((wrapper) => !wrapper.startsWith('@supports')).join(' '),
          selectors: splitTopLevel(prelude, ','),
          declarations: splitTopLevel(buffer, ';').map((declaration) => {
            const colon = declaration.indexOf(':');
            return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
          }),
        });
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

describe('dist/mednet.css', () => {
  const css = read('mednet.css');

  it('перекрывает нейтральную тему Basecoat темой бренда', () => {
    const basecoat = css.lastIndexOf('--primary: oklch(');
    const brand = css.lastIndexOf('--primary: var(--mn-primary)');
    expect(basecoat).toBeGreaterThan(-1);
    expect(brand).toBeGreaterThan(basecoat);
  });

  it('содержит компоненты Basecoat', () => {
    expect(css).toMatch(/\.btn\b/);
    expect(css).toMatch(/\.card\b/);
    expect(css).toMatch(/\.badge\b/);
  });

  it('не содержит Tailwind-утилит и стандартной палитры', () => {
    expect(css).not.toMatch(/\.flex\s*\{/);
    expect(css).not.toMatch(/--color-pink-500/);
  });

  it('использует Montserrat вместо Geist', () => {
    expect(css).not.toContain('Geist');
    expect(css).toMatch(/--font-sans:\s*"Montserrat"/);
  });

  it('подключает кириллицу и латиницу Montserrat из ./fonts/', () => {
    for (const weight of FONT_WEIGHTS) {
      for (const subset of FONT_SUBSETS) {
        const file = `montserrat-${subset}-${weight}-normal.woff2`;
        // Lightning CSS берёт адрес в кавычки: url("./fonts/…").
        expect(css).toMatch(
          new RegExp(`url\\(["']?\\./fonts/${file.replaceAll('.', '\\.')}["']?\\)`),
        );
        expect(existsSync(distUrl(`fonts/${file}`)), file).toBe(true);
      }
    }
  });

  it('не использует CSS nesting (как и mednet.min.css)', () => {
    const code = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""')
      .replace(/url\([^)]*\)/g, 'url()');
    expect(code).not.toContain('&');
  });
});

describe('бренд-правки Basecoat (src/overrides.css)', () => {
  const rules = parseRules(read('mednet.css'));
  const COMPONENTS = '@layer components';
  const HOVER = '@layer components @media (hover: hover)';

  /**
   * Значение, которое победит в каскаде: последнее объявление для того же селектора
   * (та же специфичность) в тех же обёртках.
   */
  const winning = (selector: string, context: string, property: string) =>
    rules
      .filter((rule) => rule.context === context && rule.selectors.includes(selector))
      .flatMap((rule) => rule.declarations)
      .filter(
        ([name]) => name === property || (property === 'background-color' && name === 'background'),
      )
      .at(-1)?.[1];

  /** Селекторы Basecoat с заданной заливкой, кроме тёмной темы (её в v1 нет, спека D15). */
  const filledWith = (fill: string, context: string) =>
    rules
      .filter(
        (rule) =>
          rule.context === context &&
          rule.declarations.some(([name, value]) => name === 'background-color' && value === fill),
      )
      .flatMap((rule) => rule.selectors)
      .filter((selector) => !selector.includes('html.dark'));

  it.each(['.alert > :is(h2, h3, h4, h5, h6)', '.toaster .toast .toast-content section h2'])(
    'возвращает заголовку %s размер текста компонента',
    (selector) => {
      expect(winning(selector, COMPONENTS, 'font-size')).toBe('inherit');
      expect(winning(selector, COMPONENTS, 'line-height')).toBe('inherit');
    },
  );

  it('заливает поля, контурные кнопку и бейдж белым --field вместо серого --input', () => {
    // Поиск без рамки внутри popover и command: белое на белом исчезнет — остаётся заливка Basecoat.
    const kept = ['.command > header', '.combobox [data-popover] > .input-group'];
    const selectors = filledWith('color-mix(in oklab, var(--input) 30%, transparent)', COMPONENTS);
    expect(selectors).toEqual(
      expect.arrayContaining([
        ...kept,
        '.btn[data-variant="outline"]',
        '.badge[data-variant="outline"]',
        '.field > textarea',
        '.input[type="email"]',
        '.input:not([type])',
        '.field > select',
        '.select:not(select) > button',
        '.combobox > input[role="combobox"]',
        '.input-group',
      ]),
    );
    for (const selector of selectors.filter((selector) => !kept.includes(selector))) {
      expect(winning(selector, COMPONENTS, 'background-color'), selector).toBe('var(--field)');
    }
  });

  it('подсвечивает контурную кнопку при наведении --muted вместо серого --input', () => {
    const selectors = filledWith('color-mix(in oklab, var(--input) 50%, transparent)', HOVER);
    expect(selectors).toEqual(['.btn[data-variant="outline"]:hover']);
    expect(winning('.btn[data-variant="outline"]:hover', HOVER, 'background-color')).toBe(
      'var(--muted)',
    );
  });

  const FOCUS = COMPONENTS;
  const HOVER_PRIMARY = ':is(.btn:not([data-variant]), .btn[data-variant="primary"]):hover';

  it('контурная кнопка: в фокусе синяя граница (D7), с ошибкой — красная', () => {
    expect(winning('.btn[data-variant="outline"]:focus-visible', FOCUS, 'border-color')).toBe(
      'var(--ring)',
    );
    expect(
      winning('.btn[data-variant="outline"][aria-invalid="true"]', FOCUS, 'border-color'),
    ).toBe('var(--destructive)');
  });

  it('триггер select — насыщенность текста 500, как у всего текста (спека §5)', () => {
    expect(winning('.select:not(select) > button', COMPONENTS, 'font-weight')).toBe('inherit');
  });

  it('заголовок карточки — межстрочный 1.5, как в shadcn Maia', () => {
    expect(
      winning('.card > header > :is(h2, h3, [data-title], .card-title)', COMPONENTS, 'line-height'),
    ).toBe('var(--mn-text-base-line-height)');
  });

  it('вкладки как в shadcn Maia: высота, без тени у активной, контур в фокусе', () => {
    expect(winning('.tabs > [role="tablist"] > [role="tab"]', COMPONENTS, 'height')).toBe(
      'calc(100% - 1px)',
    );
    expect(
      winning(
        '.tabs > [role="tablist"]:not([data-variant="line"]) > [role="tab"][aria-selected="true"]',
        COMPONENTS,
        '--tw-shadow',
      ),
    ).toBe('0 0 #0000');
    expect(
      winning('.tabs > [role="tablist"] > [role="tab"]:focus-visible', COMPONENTS, 'outline'),
    ).toBe('1px solid var(--ring)');
  });

  it('неактивная вкладка — --muted-foreground, наведение и активная — --foreground', () => {
    const TAB = '.tabs > [role="tablist"] > [role="tab"]';
    // winning берёт последнее объявление; @supports-блок Basecoat (foreground 60 %) идёт раньше правки.
    expect(winning(TAB, COMPONENTS, 'color')).toBe('var(--muted-foreground)');
    expect(winning(`${TAB}:hover`, HOVER, 'color')).toBe('var(--foreground)');
    expect(
      winning(
        '.tabs > [role="tablist"]:not([data-variant="line"]) > [role="tab"][aria-selected="true"]',
        COMPONENTS,
        'color',
      ),
    ).toBe('var(--foreground)');
  });

  it('основная кнопка и бейдж-ссылка при наведении — --primary-hover (белый текст 5.23:1)', () => {
    expect(winning(HOVER_PRIMARY, HOVER, 'background-color')).toBe('var(--primary-hover)');
    expect(
      winning(
        ':is(.badge:not([data-variant]), .badge[data-variant="primary"]):is(a):hover',
        HOVER,
        'background-color',
      ),
    ).toBe('var(--primary-hover)');
  });

  it('гасит анимации и переходы компонентов при prefers-reduced-motion', () => {
    for (const file of ['mednet.css', 'mednet.min.css']) {
      const css = read(file).replace(/\s+/g, '');
      const block = [...css.matchAll(/@media\(prefers-reduced-motion:reduce\)\{([^@]*?\})\}/g)]
        .map((match) => match[1])
        .join('');
      expect(block, file).toContain('animation-duration:.01ms!important');
      expect(block, file).toContain('animation-iteration-count:1!important');
      expect(block, file).toContain('transition-duration:.01ms!important');
      expect(block, file).toContain('scroll-behavior:auto!important');
    }
  });
});

describe('остальные файлы dist', () => {
  it('fonts.css — только @font-face', () => {
    const fonts = read('fonts.css');
    expect(fonts).toContain('@font-face');
    expect(fonts).not.toContain('.btn');
  });

  it('баннеры CSS отсылают к THIRD_PARTY_NOTICES.md', () => {
    for (const file of ['mednet.css', 'mednet.min.css', 'fonts.css']) {
      expect(read(file).split('\n')[0], file).toContain('| см. THIRD_PARTY_NOTICES.md');
    }
  });

  it('кладёт лицензию шрифта', () => {
    expect(read('fonts/OFL.txt')).toMatch(/SIL OPEN FONT LICENSE/i);
  });

  it('кладёт JS Basecoat', () => {
    expect(statSync(distUrl('mednet.js')).size).toBeGreaterThan(1000);
  });

  it('JS Basecoat начинается с уведомления о лицензии Basecoat', () => {
    const basecoat = dirname(require.resolve('basecoat-css/package.json'));
    const { version } = JSON.parse(readFileSync(join(basecoat, 'package.json'), 'utf8')) as {
      version: string;
    };
    expect(readFileSync(join(basecoat, 'LICENSE.md'), 'utf8')).toContain(
      'Copyright (c) 2025 Ronan Berder',
    );
    const js = read('mednet.js');
    const header = `/*! Basecoat v${version} | MIT | (c) 2025 Ronan Berder | https://basecoatui.com */\n`;
    expect(js.startsWith(header)).toBe(true);
    expect(js.slice(header.length)).toBe(
      readFileSync(require.resolve('basecoat-css/all.min'), 'utf8'),
    );
  });

  it('минифицированная версия меньше обычной', () => {
    expect(statSync(distUrl('mednet.min.css')).size).toBeLessThan(
      statSync(distUrl('mednet.css')).size,
    );
  });
});

describe('лицензии в пакете', () => {
  const pkgUrl = (file: string) => new URL(`../${file}`, import.meta.url);

  it('кладёт MIT-лицензию пакета', () => {
    expect(readFileSync(pkgUrl('LICENSE'), 'utf8')).toMatch(
      /^MIT License\n\nCopyright \(c\) 2026 ФГБУ «ЦНИИОИЗ» Минздрава России\n/,
    );
  });

  it('публикует уведомления о сторонних компонентах', () => {
    const notices = readFileSync(pkgUrl('THIRD_PARTY_NOTICES.md'), 'utf8');
    expect(notices).toContain('Copyright (c) 2025 Ronan Berder');
    expect(notices).toContain('Copyright (c) Tailwind Labs, Inc.');
    expect(notices).toContain('dist/fonts/OFL.txt');
    const { files } = JSON.parse(readFileSync(pkgUrl('package.json'), 'utf8')) as {
      files: string[];
    };
    expect(files).toContain('THIRD_PARTY_NOTICES.md');
  });
});
