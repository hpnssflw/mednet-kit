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
//    Для смесей токена с transparent добавляем rgba через наследуемые RGB/alpha — переключение
//    .dark, палитры и локальное переопределение токена сохраняются. Chrome 109 берёт копию,
//    современные браузеры — исходный блок @supports, который идёт позже.
// 2. var(--x,) без пробела: если --x объявлено через @property без initial-value (--tw-ring-inset),
//    Chrome 109 отбрасывает всё значение — пропадают все кольца, включая фокус. Пишем var(--x, ).
// 3. oklch() внутри SVG data-URI (шеврон select, галочка checkbox в Basecoat) — до Chrome 111
//    иконка не рисуется. Переводим в hex (# в data-URI — %23).
// 4. var() в ::backdrop — до Chrome 122 ::backdrop не видит переменных :root, фон под <dialog>
//    не затемняется. Подставляем значения. Этот шаг действует во ВСЕХ браузерах и «замораживает»
//    значения темы в ::backdrop; подложки Basecoat и Maia чёрные с прозрачностью и от темы не зависят
//    (проверено для .dark), так что переключение темы без перезагрузки им не мешает.
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
const isDark = (rule) => /\.dark(?![\w-])/.test((rule && rule.selector) || '');

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

/** Цветовые токены получают наследуемые RGB/alpha рядом с исходным объявлением.
 * Их алиасы и scoped overrides следуют тому же CSS cascade, включая .dark и Солид. */
function legacyColorVariables(root) {
  const declarations = [];
  const names = new Set();
  const declared = new Set();
  const values = new Map();
  const parsed = new Map();
  // Отдельная тема может ссылаться на цвет базового CSS: его RGB/alpha наследуются.
  const colorAlias = (value) =>
    value?.alias && (names.has(value.alias) || !declared.has(value.alias));
  root.walkDecls((decl) => {
    if (!decl.prop.startsWith('--') || decl.prop.startsWith('--mn-legacy-')) return;
    declarations.push(decl);
    declared.add(decl.prop);
    const alias = decl.value.match(/^var\((--[\w-]+)\)$/);
    if (alias) {
      values.set(decl, { alias: alias[1] });
      return;
    }
    if (!/^(?:#|[a-z]+(?:\(|$))/i.test(decl.value)) return;
    if (!parsed.has(decl.value)) {
      let rgb = null;
      try {
        transform({
          code: Buffer.from(`a{color:${lower(decl.value, CHROME_60)}}`),
          visitor: {
            Color(color) {
              if (color.type === 'rgb') rgb = color;
            },
          },
        });
      } catch {
        /* Не цвет: числовые токены, функции и произвольные custom properties. */
      }
      parsed.set(decl.value, rgb);
    }
    const rgb = parsed.get(decl.value);
    if (rgb) {
      names.add(decl.prop);
      values.set(decl, { rgb });
    }
  });
  let added = true;
  while (added) {
    added = false;
    for (const decl of declarations) {
      const value = values.get(decl);
      if (colorAlias(value) && !names.has(decl.prop)) {
        names.add(decl.prop);
        added = true;
      }
    }
  }
  for (const decl of declarations) {
    const value = values.get(decl);
    if (!value?.rgb && !colorAlias(value)) continue;
    const suffix = decl.prop.slice(2);
    decl.cloneAfter({
      prop: `--mn-legacy-rgb-${suffix}`,
      value: value.rgb
        ? `${value.rgb.r}, ${value.rgb.g}, ${value.rgb.b}`
        : `var(--mn-legacy-rgb-${value.alias.slice(2)})`,
    });
    decl.cloneAfter({
      prop: `--mn-legacy-alpha-${suffix}`,
      value: value.rgb
        ? String(Number(value.rgb.alpha.toFixed(6)))
        : `var(--mn-legacy-alpha-${value.alias.slice(2)})`,
    });
  }
  return names;
}

/** Частый Tailwind alpha utility остаётся связанным с токеном вместо цвета light. */
function dynamicAlpha(value, names) {
  const match = value.match(
    /^color-mix\(in\s+[\w-]+,\s*var\((--[\w-]+)\)\s+([\d.]+)%,\s*transparent\)$/,
  );
  if (!match || !names.has(match[1])) return null;
  const alpha = Number(match[2]) / 100;
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
  const suffix = match[1].slice(2);
  return `rgba(var(--mn-legacy-rgb-${suffix}), calc(var(--mn-legacy-alpha-${suffix}) * ${alpha}))`;
}

function legacyFallbacks() {
  return {
    postcssPlugin: 'mednet-legacy-fallbacks',
    OnceExit(root, { result }) {
      const colorNames = legacyColorVariables(root);
      const { light, dark } = themes(root);
      const resolveLight = resolver(light);
      const resolveDark = resolver(dark);
      const resolveFor = (rule) => (isDark(rule) ? resolveDark : resolveLight);

      // 3. oklch() в SVG data-URI
      root.walkDecls((decl) => {
        if (!decl.value.includes('data:image/svg+xml') || !decl.value.includes('oklch(')) return;
        decl.value = decl.value.replace(/oklch\([^)]*\)/g, (color) => {
          try {
            const hex = lower(color, CHROME_60);
            // Lightning CSS не падает на нечитаемом цвете, а возвращает его как есть
            if (hex.includes('oklch(')) throw new Error('цвет не переведён');
            return hex.replace(/^#/, '%23');
          } catch {
            result.warn(
              `mednet-legacy-fallbacks: не удалось перевести ${color} в hex внутри SVG data-URI, значение оставлено как есть`,
              { node: decl },
            );
            return color;
          }
        });
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
          const dynamic = dynamicAlpha(decl.value, colorNames);
          const value = resolveFor(decl.parent)(decl.value);
          if (value == null || /currentcolor/i.test(value)) {
            if (dynamic) decl.value = dynamic;
            else decl.remove();
            return;
          }
          try {
            decl.value = lower(value, CHROME_109);
            if (dynamic) decl.cloneAfter({ value: dynamic });
          } catch {
            result.warn(
              `mednet-legacy-fallbacks: не удалось перевести «${value}» в статический цвет, объявление ${decl.prop} в копии для Chrome 109 удалено`,
              { node: decl },
            );
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
