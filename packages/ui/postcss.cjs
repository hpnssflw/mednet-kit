// PostCSS-плагин для Chrome/Edge 109 — последних в Windows 7/8.1 (спека D18). Ставится ПОСЛЕ
// @tailwindcss/postcss: plugins: { '@tailwindcss/postcss': {}, '@mednet/ui/postcss': {} }.
// Им же собирается @mednet/css. Современные браузеры рендерят результат так же, как без плагина.
// CommonJS намеренно: next build --webpack не загружает ESM-плагины PostCSS.
//
// Что чинит (Tailwind v4, Next и Base UI рассчитаны на Chrome 111+):
// 1. Цвета с прозрачностью (bg-destructive/10, bg-input/30, bg-black/80). Tailwind пишет запасное
//    значение без прозрачности, а настоящее — в @supports (color: color-mix(in lab, red, red)).
//    Перед этим блоком вставляем копию со статическими цветами: переменные темы — из :root
//    (для селекторов с .dark — из .dark), color-mix и oklch Lightning CSS переводит в hex.
//    Chrome 109 берёт копию, современные браузеры — блок @supports, который идёт позже.
// 2. var(--x,) без пробела: если --x объявлено через @property без initial-value (--tw-ring-inset),
//    Chrome 109 отбрасывает всё значение — пропадают все кольца, включая фокус. Пишем var(--x, ).
// 3. oklch() внутри SVG data-URI (шеврон select, галочка checkbox в Basecoat) — до Chrome 111
//    иконка не рисуется. Переводим в hex (# в data-URI — %23).
// 4. var() в ::backdrop — до Chrome 122 ::backdrop не видит переменных :root, фон под <dialog>
//    не затемняется. Подставляем значения. Этот шаг действует во ВСЕХ браузерах и «замораживает»
//    значения темы в ::backdrop (пока в v1 нет переключения тем — спека D15 — это допустимо).
// Не чинит: относительные цвета (oklch(from …), Chrome 119+: bubble, shimmer), анимации на
// @starting-style, авторазмер textarea (field-sizing).
'use strict';

const { transform } = require('lightningcss');

const CHROME_109 = { chrome: 109 << 16 };
const CHROME_60 = { chrome: 60 << 16 }; // без 8-значного hex: безопасно внутри атрибутов SVG
const EMPTY_FALLBACK = /var\((--[\w-]+),\)/g;

/** Цвет → самая совместимая запись для targets (Lightning может дать «запасное; современное»). */
function lower(value, targets) {
  const { code } = transform({
    filename: 'value.css',
    code: Buffer.from(`a{color:${value}}`),
    targets,
    minify: true,
  });
  return code.toString().match(/^a\{color:([^;}]+)/)[1];
}

const isGuard = (atRule) =>
  atRule.params.replace(/\s/g, '').includes('(color:color-mix(inlab,red,red))');
const isDark = (rule) => /\.dark\b/.test((rule && rule.selector) || '');

/** Переменные темы: светлая — :root/:host/html, тёмная — светлая + .dark. */
function themes(root) {
  const light = new Map();
  const darkOnly = new Map();
  root.walkRules((rule) => {
    const selector = rule.selector.replace(/\s+/g, ' ').trim();
    const target = /^(:root|:root, ?:host|:host|html)$/.test(selector)
      ? light
      : selector === '.dark'
        ? darkOnly
        : null;
    if (!target) return;
    rule.each((node) => {
      if (node.type === 'decl' && node.prop.startsWith('--')) target.set(node.prop, node.value);
    });
  });
  return { light, dark: new Map([...light, ...darkOnly]) };
}

/** Подставляет var() из темы; null, если хоть одну переменную не найти. */
function resolver(vars) {
  const resolve = (value, depth = 0) => {
    if (depth > 20) return null;
    let failed = false;
    const out = value.replace(/var\((--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (match, name, fallback) => {
      const next = vars.has(name)
        ? vars.get(name)
        : fallback && fallback.trim()
          ? fallback.trim()
          : null;
      const resolved = next == null ? null : resolve(next, depth + 1);
      if (resolved == null) {
        failed = true;
        return match;
      }
      return resolved;
    });
    return failed ? null : out;
  };
  return resolve;
}

function legacyFallbacks() {
  return {
    postcssPlugin: 'mednet-legacy-fallbacks',
    OnceExit(root) {
      const { light, dark } = themes(root);
      const resolveLight = resolver(light);
      const resolveDark = resolver(dark);
      const resolveFor = (rule) => (isDark(rule) ? resolveDark : resolveLight);

      // 3. oklch() в SVG data-URI
      root.walkDecls((decl) => {
        if (!decl.value.includes('data:image/svg+xml') || !decl.value.includes('oklch(')) return;
        decl.value = decl.value.replace(/oklch\([^)]*\)/g, (color) =>
          lower(color, CHROME_60).replace(/^#/, '%23'),
        );
      });

      // 4. var() в ::backdrop
      root.walkRules((rule) => {
        if (!rule.selector.includes('::backdrop')) return;
        rule.walkDecls((decl) => {
          if (!decl.value.includes('var(--')) return;
          const value = resolveFor(rule)(decl.value);
          if (value != null) decl.value = value;
        });
      });

      // 1. Статические копии перед @supports (color: color-mix(…))
      const guards = [];
      root.walkAtRules('supports', (atRule) => {
        if (isGuard(atRule)) guards.push(atRule);
      });
      for (const atRule of guards) {
        const copy = atRule.clone();
        copy.walkDecls((decl) => {
          if (!decl.value.includes('color-mix(')) return;
          const value = resolveFor(decl.parent)(decl.value);
          if (value == null || /currentcolor/i.test(value)) {
            decl.remove();
            return;
          }
          try {
            decl.value = lower(value, CHROME_109);
          } catch {
            decl.remove();
          }
        });
        copy.walkRules((rule) => {
          if (rule.nodes.length === 0) rule.remove();
        });
        if (copy.nodes.length > 0) atRule.before(copy.nodes);
      }

      // 2. var(--x,) → var(--x, )
      root.walkDecls((decl) => {
        if (decl.value.includes(',)')) decl.value = decl.value.replace(EMPTY_FALLBACK, 'var($1, )');
      });
    },
  };
}

legacyFallbacks.postcss = true;
module.exports = legacyFallbacks;
