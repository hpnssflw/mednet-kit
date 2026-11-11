// Browser regression: use an installed Playwright via PLAYWRIGHT_FROM (directory).
// Example: $env:PLAYWRIGHT_FROM='C:/A/mednet-playground/react'; node scripts/verify-touch.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ui = createRequire(resolve(root, 'packages/ui/package.json'));
const css = createRequire(resolve(root, 'packages/css/package.json'));
const { chromium } = createRequire(
  resolve(process.env.PLAYWRIGHT_FROM ?? resolve(root, 'packages/ui'), 'package.json'),
)('@playwright/test');
const { compile, optimize } = css('@tailwindcss/node');
const postcss = css('postcss');
const legacy = ui('./postcss.cjs');
const { createElement: h } = ui('react');
const { renderToStaticMarkup } = ui('react-dom/server');
const load = (name) =>
  import(pathToFileURL(resolve(root, `packages/ui/dist/components/${name}.js`)));
const { Button } = await load('button');
const { Input } = await load('input');
const { Textarea } = await load('textarea');
const { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } =
  await load('input-group');
const { NativeSelect, NativeSelectOption } = await load('native-select');
const { Select, SelectTrigger, SelectValue } = await load('select');
const { Switch } = await load('switch');
const icon = h(
  'svg',
  { viewBox: '0 0 24 24', 'aria-hidden': true },
  h('path', { d: 'M5 12h14', stroke: 'currentColor' }),
);
const react = renderToStaticMarkup(
  h(
    'main',
    { className: 'flex flex-col gap-4 p-4' },
    h('h1', null, 'Touch: Brand / Solid'),
    ...['default', 'lg', 'sm', 'xs', 'icon', 'icon-sm'].map((size) =>
      h(
        Button,
        { id: size, size, key: size, 'aria-label': size },
        icon,
        ...(!size.startsWith('icon') ? [size] : []),
      ),
    ),
    h(Button, { id: 'custom', className: 'h-12' }, 'Custom height'),
    h('label', null, 'Input', h(Input, { id: 'input', defaultValue: 'Тест' })),
    h('label', null, 'Textarea', h(Textarea, { id: 'textarea', defaultValue: 'Текст' })),
    ...['default', 'sm'].map((size) =>
      h(
        NativeSelect,
        { id: `native-${size}`, size, key: `native-${size}`, 'aria-label': size },
        h(NativeSelectOption, { value: '1' }, 'Регион'),
      ),
    ),
    ...['default', 'sm'].map((size) =>
      h(
        Select,
        { key: `select-${size}` },
        h(
          SelectTrigger,
          { id: `select-${size}`, size, 'aria-label': size },
          h(SelectValue, { placeholder: 'Регион' }),
        ),
      ),
    ),
    h(
      InputGroup,
      { id: 'group' },
      h(InputGroupInput, { id: 'nested-input', 'aria-label': 'Поиск' }),
      h(
        InputGroupAddon,
        { align: 'inline-end' },
        h(InputGroupButton, { id: 'nested', size: 'icon-sm', 'aria-label': 'Найти' }, icon),
      ),
    ),
    h('label', null, h(Switch, { id: 'switch', defaultChecked: true }), 'Switch'),
    h('button', { id: 'foreign', style: { height: 30 } }, 'Application button'),
  ),
);
const html = `<main style="display:flex;flex-direction:column;gap:16px;padding:16px"><h1>HTML touch</h1>${['default', 'lg', 'sm', 'xs', 'icon', 'icon-sm'].map((size) => `<button id="${size}" class="btn" data-size="${size}" aria-label="${size}"><svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor"/></svg>${size.startsWith('icon') ? '' : size}</button>`).join('')}<label>Input<input id="input" class="input" value="Тест"></label><label>Textarea<textarea id="textarea" class="textarea">Текст</textarea></label><select id="native-default" class="select" aria-label="Регион"><option>Регион</option></select><div class="select"><button id="select-default" aria-haspopup="listbox">Регион</button></div><div id="group" class="input-group"><input id="nested-input" aria-label="Поиск"><button id="nested" class="btn" data-size="icon-sm" aria-label="Найти">+</button></div><input id="switch" class="input" type="checkbox" role="switch" aria-label="Switch"><button id="foreign" style="height:30px">Application button</button></main>`;
const compiler = await compile(readFileSync(resolve(root, 'packages/ui/src/styles.css'), 'utf8'), {
  base: resolve(root, 'packages/ui/src'),
  onDependency() {},
});
const candidates = [...react.matchAll(/class="([^"]*)"/g)].flatMap((m) =>
  m[1]
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .split(' '),
);
const reactCss = postcss([legacy()]).process(
  optimize(compiler.build(candidates), { minify: false }).code,
  { from: undefined },
).css;
const theme = readFileSync(resolve(root, 'packages/tokens/dist/themes/solid.css'), 'utf8');
const output = resolve(root, 'artifacts/touch');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? 'chrome',
  headless: true,
});
const results = [];
try {
  for (const [surface, markup, styles] of [
    ['react', react, reactCss],
    ['html', html, readFileSync(resolve(root, 'packages/css/dist/mednet.css'), 'utf8')],
  ]) {
    let desktop;
    for (const touch of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: touch ? 390 : 1280, height: 950 },
        isMobile: touch,
        hasTouch: touch,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.setContent(
        `<html lang="ru"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}\n${theme}</style></head><body>${markup}</body></html>`,
      );
      const measure = () =>
        page.evaluate(() =>
          Object.fromEntries(
            [...document.querySelectorAll('[id]')].map((e) => {
              const s = getComputedStyle(e),
                r = e.getBoundingClientRect();
              return [
                e.id,
                {
                  height: r.height,
                  width: r.width,
                  font: s.fontSize,
                  icon: e.querySelector('svg')?.getBoundingClientRect().height,
                },
              ];
            }),
          ),
        );
      let brand;
      for (const kitTheme of ['brand', 'solid']) {
        await page.evaluate((value) => {
          document.documentElement.dataset.kitTheme = value;
          document.documentElement.dataset.solidPalette = 'graphite';
        }, kitTheme);
        const metrics = await measure();
        if (kitTheme === 'brand') brand = metrics;
        else assert.deepEqual(metrics, brand, 'Theme must not change geometry');
        if (!touch) desktop = metrics;
        else {
          for (const id of [
            'default',
            'lg',
            'icon',
            'input',
            'textarea',
            'native-default',
            'select-default',
            'group',
          ])
            assert.ok(
              metrics[id].height >= 44,
              `${surface}/${kitTheme}/${id}: ${metrics[id].height}`,
            );
          assert.ok(metrics.icon.width >= 44);
          for (const id of ['sm', 'xs', 'icon-sm', 'nested', 'switch', 'foreign'])
            assert.equal(
              metrics[id].height,
              desktop[id].height,
              `${surface}/${id} must stay compact`,
            );
          for (const id of ['native-sm', 'select-sm', 'custom'])
            if (metrics[id]) assert.equal(metrics[id].height, desktop[id].height, id);
          for (const id of ['default', 'lg', 'icon', 'sm'])
            assert.equal(metrics[id].icon, desktop[id].icon, `${surface}/${id} icon size`);
        }
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page.screenshot({
          path: resolve(output, `${surface}-${touch ? 'touch' : 'desktop'}-${kitTheme}.png`),
          fullPage: true,
        });
        results.push({ surface, touch, kitTheme, metrics });
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(results, null, 2));
}
console.log(
  'PASS: React/HTML, Brand/Solid, desktop/touch; 44px standard controls, compact exceptions, unchanged icons.',
);
