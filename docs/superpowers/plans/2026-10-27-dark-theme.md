# Тёмная тема `@mednet/*` — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Проект-потребитель включает тёмную тему классом `dark` на `<html>`; бренд узнаваем, все контрастные пары проходят WCAG AA (текст 4.5:1, границы и фокус 3:1) в обоих режимах. Меняются только цвета, формы и вёрстка остаются прежними.

**Architecture:** Светлая тема остаётся как есть. Тёмная — второй набор семантических токенов (`tokens/semantic.dark.json`, только отличия от светлой), который `@mednet/tokens` выпускает блоком `.dark { … }` в `tokens.css`. Компоненты уже читают `var(--background)`, `var(--primary)` и т. д., поэтому `@mednet/css` (Basecoat) и `@mednet/ui` получают тёмную тему почти бесплатно; работа — в палитре, в словаре `dark:*` shadcn (его надо привязать к классу, а не к `prefers-color-scheme`), в местах с жёсткими цветами и в тестах. Переключатель темы в киты не входит (кроме docs-сайта как демонстрации): проект сам ставит класс.

**Tech Stack:** TypeScript + culori + vitest (`@mednet/tokens`), Tailwind v4 `@custom-variant`, Basecoat, Playwright (visual, axe, parity), PostCSS-плагин `@mednet/ui/postcss`.

## Global Constraints

- Пакеты: `@mednet/tokens`, `@mednet/css`, `@mednet/ui`, единая версия (fixed). Changeset на каждое видимое потребителю изменение (`.changeset/*.md`); не запускать `pnpm version-packages`, не публиковать (`AGENTS.md`, `docs/releasing.md`).
- Тёмная тема включается **только** классом `.dark` на `<html>` (или на любом предке). Автоматического `prefers-color-scheme` в китах нет; выбор темы — дело проекта.
- Контраст: текст 4.5:1, границы полей (`input`) и `ring` — 3:1 (список — `CONTRAST_PAIRS` в `packages/tokens/src/pairs.ts`). Для тёмной темы проверяется тот же список.
- Любое изменение вида компонента — на обеих сторонах: `packages/ui/src/brand.css` и `packages/css/src/overrides.css` (тест паритета `apps/docs/tests/parity.spec.ts`). Эталон — shadcn Maia.
- Сгенерированные файлы `packages/ui/src/components/**`, `hooks/**`, `brand/logo/**`, `index.ts`, `shadcn-tailwind.css` руками не править: через `scripts/postgen.mjs`, `scripts/gen-logos.mjs`, `brand.css`.
- Chrome/Edge 109 поддерживается: `@mednet/ui/postcss` не убирать, job `chrome109` не отключать.
- Семантические токены ссылаются только на примитивы `color.*` (алиас), не на другую семантику.
- Тёмная палитра — только бренд-цвета брендбука и нейтральный графит; тон тёмных поверхностей (`graphite.950/900`) **требует согласования с владельцем бренда** (в брендбуке тёмной темы нет). Эталоны скриншотов обновляются только в Docker (`pnpm test:visual:update`).
- Комментарии и коммиты — по-русски, как в соседнем коде; сообщения коммитов — conventional commits.

## Палитра тёмной темы (проверена расчётом контраста)

Поверхности: `background` — `graphite.950` (#1f1f1f), `card`/`popover`/`muted`/`field`/`sidebar` — `graphite.900` (#333333, графит бренда). Текст — `graphite.100` (#f5f5f5, 15.1:1 на фоне). Акцент — `red.400` (#db968f): 6.9:1 на фоне, тёмный текст на нём (`graphite.950`) 6.9:1. Подтверждённые значения контраста: `muted-foreground` = `graphite.300` на `graphite.900` 8.5:1; `input` = `graphite.400` (#8a8a8a) на фоне 4.8:1, на `graphite.900` 3.7:1; `info` = `blue.400` на `blue.900` 6.0:1; `success` = `green.400` на `green.950` 7.6:1; `warning` = `orange.400` на `orange.950` 5.2:1; ошибка — два новых примитива `danger.300` (#ff8a80, 7.2:1 на фоне) и `danger.900` (#3b1414, 7.1:1).

---

## Файлы

| Файл | Ответственность |
|---|---|
| `packages/tokens/src/brand.ts` | + `danger.300`, `danger.900` |
| `packages/tokens/tokens/primitives.json` | регенерируется |
| `packages/tokens/tokens/semantic.dark.json` (новый) | отличия тёмной темы от светлой |
| `packages/tokens/src/load.ts` | `Tokens.dark` — полный список токенов тёмной темы |
| `packages/tokens/src/emit.ts` | блок `.dark`, `semanticDark` в json/js |
| `packages/tokens/src/pairs.ts` | без изменений: пары применяются к обоим режимам |
| `packages/tokens/scripts/build.ts`, `check-dist.mjs` | передают/проверяют тёмный режим |
| `packages/ui/src/styles.css` | `@custom-variant dark` |
| `packages/ui/scripts/gen-logos.mjs` | цвет текста вертикального логотипа |
| `packages/ui/src/brand.css`, `packages/css/src/overrides.css` | тёмные правки обеих сторон |
| `apps/docs/**` | переключатель темы, тестовые прогоны в обоих режимах |

---

### Task 1: `dark:*` в `@mednet/ui` привязать к классу `.dark`

Сейчас в `@mednet/ui` нет `@custom-variant dark`, а у Tailwind v4 вариант `dark` по умолчанию — `@media (prefers-color-scheme: dark)`. Поэтому ~25 компонентов с `dark:*` уже сегодня срабатывают на пользователях с тёмной ОС при светлых токенах. Исправляем независимо от остальной работы: это самостоятельный баг.

**Files:**
- Modify: `packages/ui/src/styles.css` (после `@import '@mednet/tokens/theme.css';`)
- Test: `packages/ui/src/__tests__/styles.test.ts`
- Create: `.changeset/ui-dark-variant-class.md`

**Interfaces:**
- Produces: утилиты `dark:*` в CSS проекта собираются как `&:is(.dark *)`.

- [ ] **Step 1: Написать падающий тест** — в `describe('styles.css', …)` добавить:

```ts
  it('привязывает вариант dark к классу .dark, а не к prefers-color-scheme', () => {
    expect(styles).toContain('@custom-variant dark (&:is(.dark *));');
    expect(styles.indexOf('@custom-variant dark')).toBeGreaterThan(
      styles.indexOf("@import '@mednet/tokens/theme.css';"),
    );
  });
```

- [ ] **Step 2: Запустить** `pnpm --filter @mednet/ui exec vitest run src/__tests__/styles.test.ts` → FAIL.
- [ ] **Step 3: Реализация** — в `styles.css` после строки `@import '@mednet/tokens/theme.css';` (до `@import 'tw-animate-css'`) добавить:

```css
/* Тёмная тема — класс .dark на <html> (как у Basecoat в @mednet/css), а не prefers-color-scheme. */
@custom-variant dark (&:is(.dark *));
```

Заметка: `@import` обязаны идти до остальных правил, а `@custom-variant` — не @import; поэтому ставить строго после всех `@import`-строк блока. Если Tailwind ругается на порядок, переместить `@custom-variant` под последний `@import` файла (перед `@source`/`@layer base`) и поправить `indexOf`-проверку теста не нужно — она проверяет только «после theme.css».

- [ ] **Step 4: Запустить** тот же тест → PASS; `pnpm --filter @mednet/ui test` целиком → PASS.
- [ ] **Step 5: Changeset и коммит** — `.changeset/ui-dark-variant-class.md`:

```md
---
'@mednet/ui': minor
---

`dark:*` в компонентах теперь включается классом `.dark`, а не системной темой ОС: раньше на устройствах с тёмной системной темой часть компонентов получала тёмные оттенки поверх светлой палитры.
```

Уровень `minor` вместо `major` согласовать с владельцем (видимое изменение для пользователей с тёмной ОС, см. `docs/releasing.md` п. 2).

```bash
git add packages/ui/src/styles.css packages/ui/src/__tests__/styles.test.ts .changeset/ui-dark-variant-class.md
git commit -m "fix(ui): вариант dark привязан к классу .dark, а не к prefers-color-scheme"
```

---

### Task 2: примитивы `danger.300` и `danger.900`

**Files:**
- Modify: `packages/tokens/src/brand.ts` (`DANGER`)
- Modify (регенерация): `packages/tokens/tokens/primitives.json`
- Test: `packages/tokens/test/primitives.test.ts`

**Interfaces:**
- Produces: примитивы `color.danger.300` = `#ff8a80`, `color.danger.900` = `#3b1414` (CSS: `--mn-danger-300`, `--mn-danger-900`).

- [ ] **Step 1: Тест** — в `describe('buildPrimitives')` изменить тест «содержит graphite и danger»:

```ts
  it('содержит graphite и danger (светлые и тёмные шаги)', () => {
    expect(paths).toContain('color.graphite.900');
    for (const step of [100, 300, 600, 900]) expect(paths).toContain(`color.danger.${step}`);
  });
```

- [ ] **Step 2: Запустить** `pnpm --filter @mednet/tokens exec vitest run test/primitives.test.ts` → FAIL.
- [ ] **Step 3: Реализация** — `brand.ts`:

```ts
/** Красный для ошибок — намеренно вне палитры бренда, чтобы не путаться с primary. 300/900 — для тёмной темы. */
export const DANGER = {
  100: '#fdecea',
  300: '#ff8a80',
  600: '#c62828',
  900: '#3b1414',
} as const;
```

Затем `pnpm --filter @mednet/tokens generate` (обновит `primitives.json`).

- [ ] **Step 4: Запустить** `pnpm --filter @mednet/tokens test` → PASS (включая «совпадает с генератором»).
- [ ] **Step 5: Коммит**

```bash
git add packages/tokens/src/brand.ts packages/tokens/tokens/primitives.json packages/tokens/test/primitives.test.ts
git commit -m "feat(tokens): danger.300 и danger.900 для тёмной темы"
```

---

### Task 3: `semantic.dark.json` и загрузка второго режима

**Files:**
- Create: `packages/tokens/tokens/semantic.dark.json`
- Modify: `packages/tokens/src/load.ts`
- Test: `packages/tokens/test/semantic.test.ts`, `packages/tokens/test/emit.test.ts` (фикстура)

**Interfaces:**
- Consumes: `toTokens(primitivesTree, semanticTree)` из `load.ts` (меняется, см. ниже).
- Produces: `Tokens.dark: ColorToken[]` — **полный** набор семантики тёмной темы (светлая с наложенными отличиями), тот же порядок и те же имена, что в `Tokens.semantic`; `toTokens(primitivesTree, semanticTree, darkTree?)` — третий аргумент необязателен, без него `dark` равен `semantic` (старые вызовы в тестах не ломаются).

- [ ] **Step 1: Создать `tokens/semantic.dark.json`** (только отличия; недостающие токены наследуются от светлой темы):

```json
{
  "semantic": {
    "$type": "color",
    "$description": "Тёмная тема: отличия от semantic.json, включается классом .dark. Недостающие токены наследуются от светлой. Только алиасы на примитивы color.*.",
    "background": { "$value": "{color.graphite.950}" },
    "foreground": { "$value": "{color.graphite.100}" },
    "card": { "$value": "{color.graphite.900}" },
    "card-foreground": { "$value": "{color.graphite.100}" },
    "popover": { "$value": "{color.graphite.900}" },
    "popover-foreground": { "$value": "{color.graphite.100}" },
    "primary": { "$value": "{color.red.400}" },
    "primary-hover": { "$value": "{color.red.300}" },
    "primary-foreground": { "$value": "{color.graphite.950}" },
    "secondary": { "$value": "{color.graphite.800}" },
    "secondary-foreground": { "$value": "{color.graphite.100}" },
    "muted": { "$value": "{color.graphite.900}" },
    "muted-foreground": { "$value": "{color.graphite.300}" },
    "accent": { "$value": "{color.red.900}" },
    "accent-foreground": { "$value": "{color.graphite.100}" },
    "destructive": { "$value": "{color.danger.300}" },
    "destructive-foreground": { "$value": "{color.graphite.950}" },
    "destructive-muted": { "$value": "{color.danger.900}" },
    "success": { "$value": "{color.green.400}" },
    "success-foreground": { "$value": "{color.graphite.950}" },
    "success-muted": { "$value": "{color.green.950}" },
    "info": { "$value": "{color.blue.400}" },
    "info-foreground": { "$value": "{color.graphite.950}" },
    "info-muted": { "$value": "{color.blue.900}" },
    "warning": { "$value": "{color.orange.400}" },
    "warning-foreground": { "$value": "{color.graphite.950}" },
    "warning-muted": { "$value": "{color.orange.950}" },
    "border": { "$value": "{color.graphite.700}" },
    "input": { "$value": "{color.graphite.400}" },
    "field": { "$value": "{color.graphite.900}" },
    "ring": { "$value": "{color.blue.400}" },
    "sidebar": { "$value": "{color.graphite.900}" },
    "sidebar-foreground": { "$value": "{color.graphite.100}" },
    "sidebar-primary": { "$value": "{color.red.400}" },
    "sidebar-primary-foreground": { "$value": "{color.graphite.950}" },
    "sidebar-accent": { "$value": "{color.red.900}" },
    "sidebar-accent-foreground": { "$value": "{color.graphite.100}" },
    "sidebar-border": { "$value": "{color.graphite.700}" },
    "sidebar-ring": { "$value": "{color.blue.400}" }
  }
}
```

`chart-1…8` в тёмной теме не переопределяются: все 500-е оттенки уже светлые. Проверяется тестом ниже (контраст 3:1 к фону).

- [ ] **Step 2: Тесты (падающие)** — в `semantic.test.ts`:

```ts
const darkHex = new Map(tokens.dark.map((token) => [token.name, token.hex]));

describe('тёмная тема', () => {
  it('содержит тот же набор токенов, что светлая, в том же порядке', () => {
    expect(tokens.dark.map((token) => token.name)).toEqual(
      tokens.semantic.map((token) => token.name),
    );
  });

  it.each(CONTRAST_PAIRS)('%s на %s — не ниже %s:1', (fg, bg, min) => {
    const foreground = darkHex.get(fg);
    const background = darkHex.get(bg);
    expect(foreground, `нет токена ${fg}`).toBeDefined();
    expect(background, `нет токена ${bg}`).toBeDefined();
    expect(wcagContrast(foreground!, background!)).toBeGreaterThanOrEqual(min);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('chart-%i заметен на фоне (3:1)', (n) => {
    expect(wcagContrast(darkHex.get(`chart-${n}`)!, darkHex.get('background')!)).toBeGreaterThanOrEqual(3);
  });

  it('не оставляет в тёмной теме токенов, которых нет в светлой', () => {
    const light = new Set(tokens.semantic.map((token) => token.name));
    const stray = tokens.dark.filter((token) => !light.has(token.name));
    expect(stray).toEqual([]);
  });

  it('primary остаётся красным бренда (оттенок red)', () => {
    expect(tokens.dark.find((token) => token.name === 'primary')?.ref).toBe('red-400');
  });
});
```

В `toTokens` describe — тест на лишний токен в тёмной теме:

```ts
  it('запрещает тёмной теме токены, которых нет в светлой', () => {
    const primitives = { color: { white: { $value: toDtcgColor('#ffffff') } } };
    const light = { semantic: { background: { $value: '{color.white}' } } };
    const dark = { semantic: { unknown: { $value: '{color.white}' } } };
    expect(() => toTokens(primitives, light, dark)).toThrow(/unknown.*светлой/);
  });
```

- [ ] **Step 3: Запустить** `pnpm --filter @mednet/tokens exec vitest run test/semantic.test.ts` → FAIL (нет `tokens.dark`).
- [ ] **Step 4: Реализация `load.ts`** — расширить интерфейс и функции:

```ts
export interface Tokens {
  primitives: ColorToken[];
  semantic: ColorToken[];
  /** Полный набор семантики тёмной темы (светлая + отличия из semantic.dark.json). */
  dark: ColorToken[];
}

export function toTokens(
  primitivesTree: DtcgTree,
  semanticTree: DtcgTree,
  darkTree: DtcgTree = {},
): Tokens {
  const primitives = flatten(primitivesTree);
  const semantic = flatten(semanticTree);
  const darkOverrides = flatten(darkTree);
  const resolved = resolveColors(new Map([...primitives, ...semantic]));
  const hexOf = (path: string) => {
    const hex = resolved.get(path);
    if (!hex) throw new Error(`Не удалось вычислить ${path}`);
    return hex;
  };
  const toColorToken = (path: string, value: unknown): ColorToken => {
    const target = aliasTarget(value);
    if (!target?.startsWith('color.')) {
      throw new Error(`${path}: семантический токен должен ссылаться на примитив color.*`);
    }
    return { name: cssName(path), hex: hexOf(target), ref: cssName(target) };
  };

  for (const path of darkOverrides.keys()) {
    if (!semantic.has(path)) {
      throw new Error(`${path}: есть в тёмной теме, но нет в светлой`);
    }
  }

  const semanticTokens = [...semantic.entries()].map(([path, value]) => {
    const token = toColorToken(path, value);
    return { ...token, hex: hexOf(path) };
  });

  return {
    primitives: [...primitives.keys()].map((path) => ({
      name: cssName(path),
      hex: hexOf(path),
      ref: null,
    })),
    semantic: semanticTokens,
    dark: [...semantic.entries()].map(([path, value]) =>
      toColorToken(path, darkOverrides.get(path) ?? value),
    ),
  };
}
```

Для `semantic` hex считается как раньше (`hexOf(path)`, а не `hexOf(target)` — результат тот же, но сохраняем прежнее поведение и сообщение ошибки). `loadTokens` читает и третий файл:

```ts
export function loadTokens(root: URL): Tokens {
  const read = (file: string) => JSON.parse(readFileSync(new URL(file, root), 'utf8')) as DtcgTree;
  return toTokens(
    read('tokens/primitives.json'),
    read('tokens/semantic.json'),
    read('tokens/semantic.dark.json'),
  );
}
```

Если `emit.test.ts`/`tailwind.test.ts` строят фикстуру через `toTokens(a, b)` — поле `dark` появится само (по умолчанию = светлой), правок не нужно.

- [ ] **Step 5: Запустить** `pnpm --filter @mednet/tokens test`. Любая пара тёмной темы ниже порога → поправить алиас в `semantic.dark.json` (допустимые замены: на соседний шаг той же шкалы), не ослабляя порог. Затем `pnpm --filter @mednet/tokens typecheck`.
- [ ] **Step 6: Коммит**

```bash
git add packages/tokens/tokens/semantic.dark.json packages/tokens/src/load.ts packages/tokens/test
git commit -m "feat(tokens): семантика тёмной темы и проверка её контраста"
```

---

### Task 4: `.dark` в `tokens.css`, json/js и сборка

**Files:**
- Modify: `packages/tokens/src/emit.ts` (`emitTokensCss`, `tokensObject`)
- Modify: `packages/tokens/scripts/check-dist.mjs`
- Test: `packages/tokens/test/emit.test.ts`, `packages/tokens/test/exports.test.ts`
- Create: `.changeset/tokens-dark-theme.md`

**Interfaces:**
- Consumes: `Tokens.dark` (Task 3).
- Produces: в `tokens.css` после блока `:root` — блок `.dark { color-scheme: dark; --mn-<имя>: var(--mn-<ref>); --<имя>: var(--mn-<имя>); … }` для **тех токенов, чей ref отличается от светлого**; в `tokens.json` и `index.js` — поле `semanticDark` (имя → hex, полный набор).

Блок `.dark` повторяет оба слоя переменных (`--mn-x` и `--x`), а не одну: `--x: var(--mn-x)` в `:root` вычисляется на корне и наследуется уже готовым значением, поэтому `.dark` на вложенном контейнере (не на `<html>`) без переобъявления `--x` осталась бы светлой.

- [ ] **Step 1: Тесты (падающие)** — в `emit.test.ts` фикстуру `fixture` дополнить третьим аргументом и проверками:

```ts
const fixtureDark = toTokens(
  {
    color: {
      $type: 'color',
      white: { $value: toDtcgColor('#ffffff') },
      graphite: { '950': { $value: toDtcgColor('#1f1f1f') } },
      red: { '600': { $value: toDtcgColor('#b55c57') }, '400': { $value: toDtcgColor('#db968f') } },
    },
  },
  {
    semantic: {
      $type: 'color',
      background: { $value: '{color.white}' },
      primary: { $value: '{color.red.600}' },
    },
  },
  { semantic: { background: { $value: '{color.graphite.950}' } } },
);

describe('emitTokensCss — тёмная тема', () => {
  const css = emitTokensCss(fixtureDark);
  const dark = css.slice(css.indexOf('.dark {'));

  it('переопределяет только отличающиеся токены, оба слоя имён', () => {
    expect(dark).toContain('--mn-background: var(--mn-graphite-950);');
    expect(dark).toContain('--background: var(--mn-background);');
    expect(dark).not.toContain('--mn-primary');
  });

  it('объявляет color-scheme: dark', () => {
    expect(dark).toContain('color-scheme: dark;');
  });

  it('идёт после :root', () => {
    expect(css.indexOf('.dark {')).toBeGreaterThan(css.indexOf(':root {'));
  });
});

describe('tokensObject — тёмная тема', () => {
  it('отдаёт semanticDark: имя → hex, полный набор', () => {
    expect(tokensObject(fixtureDark).semanticDark).toEqual({
      background: '#1f1f1f',
      primary: '#b55c57',
    });
  });
});
```

Если `fixture` в файле объявлен иначе — использовать его форму; важна только третья `dark`-аргумент.

- [ ] **Step 2: Запустить** `pnpm --filter @mednet/tokens exec vitest run test/emit.test.ts` → FAIL.
- [ ] **Step 3: Реализация `emit.ts`** — в `emitTokensCss` перед `return`:

```ts
  const lightRef = new Map(tokens.semantic.map((token) => [token.name, token.ref]));
  const changed = tokens.dark.filter((token) => token.ref !== lightRef.get(token.name));
  const darkLines = [
    '  color-scheme: dark;',
    ...changed.flatMap((token) => [
      `  --mn-${token.name}: var(--mn-${token.ref});`,
      `  --${token.name}: var(--mn-${token.name});`,
    ]),
  ];
```

и в итоговый массив после блока `:root` (перед `@media (prefers-reduced-motion…)`): `'', '/* Тёмная тема: класс .dark на <html> или контейнере */', '.dark {', ...darkLines, '}'`. В `tokensObject` добавить `semanticDark: Object.fromEntries(tokens.dark.map((token) => [token.name, token.hex])),` после `semantic`.

- [ ] **Step 4: `exports.test.ts` и `check-dist.mjs`** — прочитать оба файла, добавить по аналогии с проверками `semantic`: `tokens.json` содержит `semanticDark`; `index.js` экспортирует `semanticDark`; `dist/tokens.css` содержит `.dark {`. (В `check-dist.mjs` — только новые обязательные подстроки, существующие проверки не трогать.) Тест `exports.test.ts` — assert, что `semanticDark.background === '#1f1f1f'`.
- [ ] **Step 5: Сборка и тесты** `pnpm --filter @mednet/tokens build && pnpm --filter @mednet/tokens test && pnpm --filter @mednet/tokens typecheck` → PASS. Просмотреть `packages/tokens/dist/tokens.css`: блок `.dark` присутствует, ~35 пар строк.
- [ ] **Step 6: Changeset** `.changeset/tokens-dark-theme.md`:

```md
---
'@mednet/tokens': minor
---

Тёмная тема: блок `.dark` в `tokens.css`, `semanticDark` в `tokens.json` и JS-экспорте, примитивы `danger.300` и `danger.900`. Светлая тема не изменилась.
```

- [ ] **Step 7: Коммит**

```bash
git add packages/tokens .changeset/tokens-dark-theme.md
git commit -m "feat(tokens): блок .dark в tokens.css и semanticDark в экспортах"
```

---

### Task 5: Basecoat (`@mednet/css`) в тёмной теме

`mednet.css` подключает `@mednet/tokens/theme.css`, который `@import`'ит `tokens.css` — блок `.dark` попадает в `dist/mednet.css` сам. Задача — убедиться и закрыть места, где Basecoat использует прозрачность поверх `--input`/`--field` и жёсткие цвета.

**Files:**
- Modify: `packages/css/src/overrides.css` (по результатам аудита)
- Modify: `packages/ui/src/brand.css` (зеркало)
- Test: `packages/css/test/build.test.ts`

- [ ] **Step 1: Тест, что `.dark` попал в сборку** — в `build.test.ts` добавить:

```ts
describe('тёмная тема', () => {
  const css = read('mednet.css');

  it('содержит блок .dark с переменными тем', () => {
    expect(css).toMatch(/\.dark\s*\{[^}]*color-scheme:\s*dark/);
    expect(css).toMatch(/\.dark\s*\{[^}]*--background:\s*var\(--mn-background\)/);
  });
});
```

- [ ] **Step 2: Собрать и прогнать** `pnpm --filter @mednet/css build && pnpm --filter @mednet/css exec vitest run test/build.test.ts`. Должно пройти без правок кода (если нет — выяснить порядок `@import` в `src/mednet.css`).
- [ ] **Step 3: Аудит Basecoat в тёмной теме.** Открыть демо статики (`packages/css/demo`) в браузере, добавить `class="dark"` на `<html>`, пройти все блоки. Искать: (а) заливка полей — правило `overrides.css` ставит `--field`, а Basecoat в `html.dark` может переопределять через `html.dark .input` (grep по `dist/mednet.css`: `grep -n "html.dark" packages/css/dist/mednet.css`); (б) белый текст или светлый фон в литералах (`#fff`, `white`, `bg-white`); (в) дорожка переключателя и разделитель группы кнопок (`bg-input`). Для каждой найденной проблемы — правило в `overrides.css` (слой `components`, после Basecoat, с селектором `:is(html.dark *)`) с комментарием «почему», и такое же в `brand.css` (по сгенерированным классам). Результат аудита (список «что нашли → что поправили») записать в описание коммита.
- [ ] **Step 4: Проверка Chrome 109** — выполнить `pnpm test:chrome109` (Docker); плагин `@mednet/ui/postcss` уже обрабатывает `.dark`-селекторы, тест должен пройти.
- [ ] **Step 5: Коммит**

```bash
git add packages/css packages/ui/src/brand.css
git commit -m "feat(css): тёмная тема Basecoat — аудит и бренд-правки"
```

(`@mednet/css` и `@mednet/ui` покрыты общим changeset из Task 8.)

---

### Task 6: `@mednet/ui` в тёмной теме — `dark:*`, логотип, жёсткие цвета

**Files:**
- Modify: `packages/ui/src/brand.css`
- Modify: `packages/ui/scripts/gen-logos.mjs` + регенерация `packages/ui/src/brand/logo/*.tsx` (`pnpm --filter @mednet/ui logos`)
- Test: `packages/ui/src/__tests__/logo.test.tsx`, `packages/ui/src/__tests__/brand.test.ts`

- [ ] **Step 1: Логотип.** Вертикальный логотип содержит `fill="#333"` (текст) — в тёмной теме не виден; марка и горизонтальный используют только `#d6867f` (работает на тёмном). Падающий тест в `logo.test.tsx`:

```tsx
it('вертикальный логотип красит текст токеном --foreground, а не жёстким #333', () => {
  const { container } = render(<LogoVertical />);
  const fills = [...container.querySelectorAll('path')].map((path) => path.getAttribute('fill'));
  expect(fills).not.toContain('#333');
  expect(container.innerHTML).toContain('var(--foreground, #333)');
});
```

В `gen-logos.mjs` найти место, где формируется JSX атрибутов `fill`, и заменить для значения `#333` вывод `fill="#333"` на `style={{ fill: "var(--foreground, #333)" }}` (SVG-атрибут `fill` не принимает `var()`, поэтому через `style`). Запустить `pnpm --filter @mednet/ui logos`, затем тесты логотипа (`generated.test.ts` проверяет, что коммитнутые файлы равны генератору).
- [ ] **Step 2: Аудит `dark:*` компонентов.** Выписать: `grep -n "dark:" packages/ui/src/components/*.tsx | cut -c1-200`. Для каждого — решение: shadcn пишет `dark:bg-input/30` как «поле чуть светлее фона»; у нас `--input` — графитовая граница, а заливка полей — `--field` (rule в `brand.css` ставит `--field` по классам `border-input`, `group/button`, `group/badge` + `bg-input/30`). Проверить в браузере (docs `/ui/` с `class="dark"`), что: поля, outline-кнопка, outline-бейдж, select, textarea, input-group, switch/checkbox/radio, tabs, calendar, input-otp, kbd, destructive-варианты (`dark:bg-destructive/20`) читаются и не сливаются. Дополнить `brand.css` правилами для случаев, где `dark:`-класс перебивает наше правило (селектор вида `[class~='dark:bg-input/30']` в паре с `:is(.dark *)`). Каждое правило — комментарий в стиле соседних; зеркало в `overrides.css`. Тест на структуру правил — в `brand.test.ts` по образцу уже существующих проверок (прочитать файл, добавить `expect(css).toContain(…)` для каждого нового правила).
- [ ] **Step 3: Жёсткие цвета.** Оверлеи (`bg-black/80` в dialog, alert-dialog, drawer, sheet) — тёмный на тёмном; затемнение остаётся видимым; оставить. Бегунок слайдера (`bg-white`, `slider.tsx`) белый на графитовой дорожке — оставить, но убедиться визуально. Chart (`[stroke='#ccc']`, `[stroke='#fff']`) — сброшены классами на токены; оставить.
- [ ] **Step 4: Прогон** `pnpm --filter @mednet/ui test && pnpm --filter @mednet/ui typecheck` → PASS. (Если `check-dist` ломается из-за логотипа — `pnpm --filter @mednet/ui build`.)
- [ ] **Step 5: Коммит**

```bash
git add packages/ui
git commit -m "feat(ui): тёмная тема — логотип, словарь dark:* и бренд-правки"
```

---

### Task 7: docs-сайт — переключатель, снимки и axe в обоих режимах

**Files:**
- Create: `apps/docs/app/theme-toggle.tsx` (клиентский компонент)
- Modify: `apps/docs/app/layout.tsx`
- Modify: `apps/docs/tests/pages.ts`, `visual.spec.ts`, `a11y.spec.ts`, `parity.spec.ts`
- Modify (обновление эталонов): `apps/docs/tests/__screenshots__/*`

**Interfaces:**
- Produces: `<ThemeToggle />` — кнопка в шапке; хранит `light|dark` в `localStorage['mn-theme']`, по умолчанию — `prefers-color-scheme`; ставит/снимает класс `dark` на `document.documentElement`.

- [ ] **Step 1: Скрипт без мигания + компонент.** В `layout.tsx` в `<head>` вставить inline-скрипт (`dangerouslySetInnerHTML`):

```js
try{var t=localStorage.getItem('mn-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}
```

и `suppressHydrationWarning` на `<html>`. Компонент `ThemeToggle` — кнопка `@mednet/ui/button` (`variant="outline"`, `size="icon"`, иконка `lucide-react` `Sun`/`Moon`, `aria-label="Переключить тему"`, состояние читает из `document.documentElement.classList` в `useEffect`, при клике переключает класс и пишет в `localStorage`).
- [ ] **Step 2: Тесты в обоих режимах.** В `pages.ts` экспортировать `THEMES = ['light', 'dark'] as const`. В `visual.spec.ts` и `a11y.spec.ts` обернуть цикл по `PAGES` внешним циклом по `THEMES`; тема включается до перехода: `await page.addInitScript((t) => localStorage.setItem('mn-theme', t), theme)`; имя снимка — для `light` прежнее (`${name}.png`), для `dark` — `${name}-dark.png`; имя теста — `внешний вид: ${name} (${theme})`. В `parity.spec.ts` добавить один дополнительный прогон пар в тёмной теме: цвета на обеих сторонах (React и статика) сравниваются при `localStorage['mn-theme']='dark'`; известные расхождения — в `parity-known.json` с причиной.
- [ ] **Step 3: Запустить** `pnpm --filter docs build && pnpm --filter docs test:visual` — в светлой теме все прежние снимки совпадают; в тёмной — нет эталонов; сначала посмотреть вживую (`pnpm --filter docs dev`, `class=dark`), поправить найденное (возвращаясь в Task 5/6), и только затем `pnpm test:visual:update` (Docker) и просмотреть каждый новый `*-dark.png` глазами. axe в тёмной теме: падающие `color-contrast` исправлять токенами (Task 3), а не исключениями.
- [ ] **Step 4: Коммит**

```bash
git add apps/docs
git commit -m "feat(docs): переключатель темы, снимки и axe в светлой и тёмной теме"
```

---

### Task 8: документация, changeset, спека

**Files:**
- Modify: `docs/superpowers/specs/2026-10-13-mednet-design-system-design.md` (D15, §5)
- Modify: `packages/ui/llms/*.md`, `packages/tokens/README.md`, `packages/css/README.md`, `packages/ui/README.md`
- Modify: комментарии «тёмной темы в v1 нет, D15» в `packages/ui/src/brand.css` (шапка) и `packages/css/src/overrides.css`, `packages/css/test/build.test.ts:155`, `packages/ui/postcss.cjs` (шаг 4)
- Create: `.changeset/dark-theme.md`

- [ ] **Step 1: Спека.** D15: «Без тёмной темы и без a11y-темы в v1» → «Тёмная тема добавлена в 1.x (класс `.dark`, `semantic.dark.json`); a11y-темы нет». Дополнить §5 таблицей тёмных значений токенов (или ссылкой на `semantic.dark.json`).
- [ ] **Step 2: README и llms.** В каждый README и в `llms/*.md` — раздел «Тёмная тема»: как включить (`<html class="dark">`), пример скрипта без мигания (тот же, что в docs-сайте), что `prefers-color-scheme` не подхватывается автоматически, как переопределить токен в `.dark`. Затем `pnpm --filter @mednet/ui build` (пересобирает llms).
- [ ] **Step 3: Комментарии.** Строки «тёмной темы в v1 нет, D15» заменить актуальными («тёмная тема — `.dark`, правила для неё — ниже/выше»). В `postcss.cjs` шаг 4 (значения в `::backdrop` «замораживаются») — проверить вручную, что оверлеи `<dialog>` Basecoat корректны при переключении темы без перезагрузки; если нет — зафиксировать ограничение в комментарии и в README.
- [ ] **Step 4: Общий changeset** `.changeset/dark-theme.md`:

```md
---
'@mednet/tokens': minor
'@mednet/css': minor
'@mednet/ui': minor
---

Тёмная тема: класс `.dark` на `<html>`. Светлая тема не изменилась.
```

(Если Task 1/4 уже добавили отдельные changeset-файлы — этот объединяет `css`; оставить только записи, которых нет в предыдущих.)

- [ ] **Step 5: Полная проверка** `pnpm install --frozen-lockfile && pnpm build && pnpm test && pnpm --filter docs test:visual && pnpm test:chrome109` → всё зелёное; `pnpm format:check` (или как называется скрипт в `package.json`) → без замечаний.
- [ ] **Step 6: Коммит**

```bash
git add -A docs packages apps .changeset
git commit -m "docs: тёмная тема — спека, README, llms, changeset"
```

---

## Самопроверка

- **Покрытие:** бренд сохранён (палитра только из примитивов брендбука + графит); контраст — Task 3 (CI-пары для обоих режимов), Task 7 (axe в тёмной); только цвета — ни один шаг не меняет размеры/формы; Chrome 109 — Task 5 step 4; паритет — Task 7 step 2; фикс `dark:*` — Task 1.
- **Открытые вопросы владельцу (до Task 3):** (1) тон тёмных поверхностей `graphite.950/900`; (2) `minor` или `major` для Task 1; (3) нужен ли автоматический `prefers-color-scheme` в китах (сейчас нет).
- **Не входит:** миграция сайтов-потребителей (mednet.ru, олимпиада, pmsp-*), компонент `ThemeProvider` в `@mednet/ui`.
- **Оценка:** Task 1 — 0,25 д; 2 — 0,25 д; 3 — 1 д; 4 — 0,75 д; 5 — 1 д; 6 — 1,5 д; 7 — 1,5 д; 8 — 0,75 д. Итого ≈ 7 дней, минимально жизнеспособный вариант (Tasks 1–6) ≈ 4,5 дня.
