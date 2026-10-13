# Фундамент, `@mednet/tokens` и `@mednet/css` — план реализации (этапы 1–2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Монорепозиторий с CI и релизным конвейером, пакет токенов бренда ЦНИИОИЗ (DTCG → CSS / Tailwind v4 / JS / JSON) с проверкой контраста и пакет `@mednet/css` (Basecoat в теме бренда + шрифты) для статики, плюс каркас docs-сайта со скриншот- и a11y-тестами.

**Architecture:** pnpm workspaces + Turborepo. `@mednet/tokens` хранит цвета в DTCG JSON (примитивы генерируются из оттенков брендбука в OKLCH и коммитятся, семантика — алиасы), скрипт сборки выпускает `tokens.css`, `theme.css` (Tailwind v4: сброс палитры + маппинг), `tokens.json`, `index.js`/`index.d.ts`. `@mednet/css` компилирует Basecoat (стиль Maia) + тему через `@tailwindcss/node` в самодостаточный `dist/` (CSS, шрифты, JS). `apps/docs` — Next.js со static export, использует собранные пакеты и служит стендом для Playwright-тестов в Docker.

**Tech Stack:** Node 24 LTS, pnpm 10, Turborepo 2, TypeScript 6.0, Vitest 5, tsx, culori 4, Tailwind CSS 4.3 (`@tailwindcss/node`, `@tailwindcss/postcss`), basecoat-css 1.0.2, @fontsource/montserrat 5, Next.js 16, React 19, Playwright 1.64 + @axe-core/playwright, Changesets 3, GitHub Actions.

**Спецификация:** `docs/superpowers/specs/2026-10-13-mednet-design-system-design.md` (дальше — «спека»). Этот план покрывает этапы 1–2 из §17.

## Global Constraints

- Node `>=22.12` (в `.nvmrc` — `24`); локально сейчас стоит Node 20.18 — его нужно обновить (Task 1).
- pnpm `10.34.6` через поле `packageManager`; не pnpm 11/12.
- TypeScript `~6.0.3`. **Не 7.x** (нативный компилятор, совместимость с Next не проверена).
- Tailwind CSS `4.3.x`; `basecoat-css` — **ровно `1.0.2`** (спека §6: версия пиннится точно).
- `@playwright/test` — **ровно `1.64.0`**, Docker-образ — `mcr.microsoft.com/playwright:v1.64.0-noble`. Версии обязаны совпадать.
- Все пакеты — ESM (`"type": "module"`). Относительные импорты в TS — с расширением `.ts` (`allowImportingTsExtensions` + `noEmit`).
- Скоуп пакетов — `@mednet` (запасной `@cniioiz`, решается в Task 14 до первой публикации).
- Лицензия пакетов — `MIT` (подтвердить у владельца до первой публикации, Task 14). Логотипы в пакеты этого плана не входят.
- Цвета бренда — **только** из спеки §2/§5. Подписанные в PDF брендбука HEX (`#d68780`) ошибочны — не использовать никогда.
- Стиль компонентов Basecoat — `maia` (спека D16). Стандартная палитра Tailwind удаляется (`--color-*: initial`).
- Семантика выпускается дважды: `--mn-<имя>` (для чужих сайтов, спека §15) и `--<имя>` в именах shadcn.
- Пороги контраста (WCAG 2.1 AA): текст ≥ 4.5:1, границы полей и фокус ≥ 3:1. Проверка валит сборку.
- Шрифты — только self-hosted (@fontsource), Montserrat 500/600/700, подмножества `cyrillic` + `latin`. Bebas Neue не поставляется (спека Q6).
- Перевод строк — LF. Комментарии и тексты для людей — по-русски, идентификаторы — по-английски.
- Репозиторий: `https://github.com/hpnssflw/mednet-kit` (публичный, ветка `main`).

---

## Карта файлов

```
.
├─ .changeset/config.json, README.md            Task 14
├─ .github/workflows/ci.yml                      Task 13
├─ .github/workflows/release.yml                 Task 14
├─ .editorconfig .gitattributes .nvmrc .prettierrc.json .prettierignore   Task 1
├─ .gitignore (дополняется)                      Task 1, 10
├─ package.json pnpm-workspace.yaml turbo.json tsconfig.base.json README.md   Task 1
├─ packages/tokens/
│  ├─ package.json tsconfig.json README.md       Task 2 (+5, 6)
│  ├─ src/brand.ts      оттенки брендбука, graphite, danger           Task 2
│  ├─ src/scale.ts      позиционная шкала 50–950 в OKLCH              Task 2
│  ├─ src/dtcg.ts       формат DTCG: цвет, flatten, алиасы            Task 3
│  ├─ src/primitives.ts дерево примитивов DTCG                        Task 3
│  ├─ scripts/generate-primitives.ts → tokens/primitives.json         Task 3
│  ├─ tokens/semantic.json   семантика (алиасы на примитивы)          Task 4
│  ├─ src/load.ts       DTCG → плоский список токенов                 Task 4
│  ├─ src/pairs.ts      пары контраста и обязательные имена           Task 4
│  ├─ src/base.ts       шрифты, размеры текста, радиус, тени, движение Task 5
│  ├─ src/emit.ts       генерация tokens.css / theme.css / json / js  Task 5
│  ├─ scripts/build.ts  → dist/                                       Task 5
│  └─ test/*.test.ts                                                  Tasks 2–6
├─ packages/css/
│  ├─ package.json tsconfig.json README.md       Task 7 (+8, 9)
│  ├─ scripts/fonts.ts  @font-face из fontsource                      Task 7
│  ├─ src/mednet.css src/base.css                                     Task 8
│  ├─ scripts/build.ts  → dist/                                       Task 8
│  ├─ demo/index.html   демо компонентов без React                    Task 9
│  └─ test/*.test.ts                                                  Tasks 7–8
└─ apps/docs/
   ├─ package.json tsconfig.json next.config.ts postcss.config.mjs    Task 10
   ├─ app/globals.css app/layout.tsx app/page.tsx app/tokens/page.tsx Task 10
   ├─ app/css/page.tsx app/recipes/page.tsx                           Task 11
   ├─ scripts/copy-static-demo.mjs                                    Task 10
   ├─ scripts/serve-out.mjs scripts/visual-docker.mjs                 Task 12
   ├─ playwright.config.ts tests/pages.ts tests/visual.spec.ts tests/a11y.spec.ts  Task 12
   └─ tests/__screenshots__/*.png                                     Task 12
```

---

### Task 1: Фундамент монорепозитория

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.nvmrc`, `.editorconfig`, `.gitattributes`, `.prettierrc.json`, `.prettierignore`, `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: ничего.
- Produces: корневые скрипты `pnpm build | test | typecheck | format | format:check` (через turbo); `tsconfig.base.json`, от которого наследуются `packages/*`; turbo-задачи `build` (outputs `dist/**`, `out/**`, `.next/**`), `test`, `typecheck` (обе зависят от `build`).

- [ ] **Step 1: Проверить окружение**

Run: `node --version; pnpm --version; docker --version; git --version`
Expected: Node `v22.12+` (лучше `v24.x`), pnpm `10.x`, Docker `28.x`, git.
Если Node ниже 22.12 (на машине автора было `v20.18.0`): `winget install -e --id OpenJS.NodeJS.LTS`, перезапустить терминал, проверить снова. Если pnpm не 10.x: `npm install -g pnpm@10.34.6`.

- [ ] **Step 2: Создать корневые конфиги**

`package.json`:

```json
{
  "name": "mednet-kit",
  "private": true,
  "description": "Дизайн-система ЦНИИОИЗ: токены, CSS для статики, React-компоненты, шаблоны",
  "license": "MIT",
  "type": "module",
  "packageManager": "pnpm@10.34.6",
  "engines": {
    "node": ">=22.12"
  },
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - apps/*

# pnpm 10 по умолчанию не запускает install-скрипты зависимостей.
# Если pnpm напишет «Ignored build scripts: …», добавьте сюда пакеты из списка
# esbuild, sharp, @tailwindcss/oxide, unrs-resolver — и только их.
onlyBuiltDependencies:
  - esbuild
```

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "out/**", ".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

`.nvmrc`:

```
24
```

`.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

`.gitattributes`:

```
* text=auto eol=lf
*.png binary
*.woff2 binary
*.pdf binary
```

`.prettierrc.json`:

```json
{
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

`.prettierignore`:

```
pnpm-lock.yaml
**/dist
**/out
**/.next
**/CHANGELOG.md
**/public/static-demo
**/tests/__screenshots__
**/playwright-report
**/test-results
packages/tokens/tokens/primitives.json
docs/superpowers
assets
.changeset/*.md
```

Дописать в конец `.gitignore`:

```
*.tsbuildinfo
next-env.d.ts
apps/docs/public/static-demo/
```

`README.md`:

````markdown
# mednet-kit

Дизайн-система ЦНИИОИЗ (mednet.ru): токены бренда, CSS для статических сайтов, React-компоненты и шаблоны проектов.

Спецификация: [docs/superpowers/specs/2026-10-13-mednet-design-system-design.md](docs/superpowers/specs/2026-10-13-mednet-design-system-design.md).

| Пакет | Что это |
|---|---|
| [`@mednet/tokens`](packages/tokens) | Цвета, шрифты, размеры — CSS-переменные, тема Tailwind v4, JS, JSON |
| [`@mednet/css`](packages/css) | Готовый CSS для сайтов без React: компоненты Basecoat в теме бренда + шрифты |

## Разработка

Нужны Node 22.12+ (рекомендуется 24 LTS), pnpm 10, Docker (для скриншот-тестов).

```bash
pnpm install
pnpm build        # собрать все пакеты и docs-сайт
pnpm test         # тесты
pnpm typecheck
pnpm format       # Prettier
```
````

- [ ] **Step 3: Поставить корневые инструменты и нормализовать переводы строк**

Run:

```bash
pnpm add -Dw turbo prettier typescript@~6.0.3 @types/node
git add --renormalize .
```

Expected: появились `node_modules/` и `pnpm-lock.yaml`; ошибок нет.

- [ ] **Step 4: Проверить, что всё запускается**

Run: `pnpm format && pnpm format:check && pnpm build`
Expected: `format:check` — «All matched files use Prettier code style!»; `pnpm build` — turbo отрабатывает без задач («No tasks were executed» или 0 tasks), код выхода 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: monorepo foundation (pnpm, turbo, typescript, prettier)"
```

---

### Task 2: `@mednet/tokens` — каркас пакета и шкалы бренда

**Files:**
- Create: `packages/tokens/package.json`, `packages/tokens/tsconfig.json`, `packages/tokens/src/brand.ts`, `packages/tokens/src/scale.ts`
- Test: `packages/tokens/test/scale.test.ts`

**Interfaces:**
- Consumes: `tsconfig.base.json` (Task 1).
- Produces:
  - `BRAND_SHADES: { red, blue, green, yellow, orange, violet, beige, peach }` — у каждого кортеж из 6 HEX, от тёмного к светлому (s1…s6); тип `ShadeRow = readonly [string, string, string, string, string, string]`; `BrandHue`.
  - `GRAPHITE: Record<50|100|…|950, string>` (900 `#333333`, 600 `#666666`, 400 `#8a8a8a`).
  - `DANGER: { 100: '#fdecea', 600: '#c62828' }`.
  - `STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const`, `type Step`, `type Scale = Record<Step, string>`.
  - `buildScale(shades: ShadeRow): Scale`.

- [ ] **Step 1: Создать пакет**

`packages/tokens/package.json`:

```json
{
  "name": "@mednet/tokens",
  "version": "0.0.0",
  "description": "Дизайн-токены ЦНИИОИЗ: палитра брендбука, семантика shadcn, тема Tailwind v4",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/tokens"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  }
}
```

`packages/tokens/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "scripts", "test"]
}
```

Run: `pnpm --filter @mednet/tokens add -D culori @types/culori vitest tsx typescript@~6.0.3 @types/node`
Expected: зависимости в `devDependencies` пакета.

- [ ] **Step 2: Записать оттенки брендбука**

`packages/tokens/src/brand.ts`:

```ts
/**
 * Оттенки брендбука ЦНИИОИЗ v8, от тёмного к светлому (s1…s6).
 * Взяты из векторных заливок PDF (стр. 12–13). Подписанные в брендбуке HEX —
 * ошибка копипаста (везде #d68780), их не использовать.
 */
export const BRAND_SHADES = {
  red: ['#a55551', '#b55c57', '#d6867f', '#e0a5a0', '#ebc3c0', '#f5e1df'],
  blue: ['#324d5b', '#4a7388', '#6399b5', '#8ab3c8', '#b1ccda', '#d8e6ed'],
  green: ['#58754a', '#63914a', '#98c185', '#b2d1a4', '#cce0c2', '#e5f0e1'],
  yellow: ['#bba174', '#dbc194', '#f9d79b', '#fbe1b4', '#fcebcd', '#fef5e6'],
  orange: ['#aa744b', '#ca946b', '#e29a64', '#e9b38b', '#f1cdb2', '#f8e6d8'],
  violet: ['#83708e', '#9980aa', '#ae95bd', '#c2b0ce', '#d7cade', '#ebe5ef'],
  beige: ['#a6998a', '#c6b9aa', '#ddccb8', '#e6d9ca', '#eee6dc', '#f7f2ed'],
  peach: ['#b68e7a', '#d6ae9a', '#f3bda3', '#f6ceba', '#f9ded1', '#fcefe8'],
} as const;

export type BrandHue = keyof typeof BRAND_SHADES;
export type ShadeRow = readonly [string, string, string, string, string, string];

/**
 * Нейтральная шкала. 900 (графит из брендбука), 600 и 400 зафиксированы спекой §5,
 * остальные шаги — обычные нейтральные серые.
 */
export const GRAPHITE = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#8a8a8a',
  500: '#737373',
  600: '#666666',
  700: '#525252',
  800: '#404040',
  900: '#333333',
  950: '#1f1f1f',
} as const;

/** Красный для ошибок — намеренно вне палитры бренда, чтобы не путаться с primary. */
export const DANGER = {
  100: '#fdecea',
  600: '#c62828',
} as const;
```

- [ ] **Step 3: Написать падающий тест шкалы**

`packages/tokens/test/scale.test.ts`:

```ts
import { oklch } from 'culori';
import { describe, expect, it } from 'vitest';
import { BRAND_SHADES, GRAPHITE } from '../src/brand.ts';
import { buildScale, STEPS } from '../src/scale.ts';

const hues = Object.entries(BRAND_SHADES);

const lightness = (hex: string) => {
  const color = oklch(hex);
  if (!color) throw new Error(`Не цвет: ${hex}`);
  return color.l;
};

describe('buildScale', () => {
  it.each(hues)('%s: оттенки брендбука стоят на 700/600/500/300/200/100 без изменений', (_, shades) => {
    const scale = buildScale(shades);
    expect([scale[700], scale[600], scale[500], scale[300], scale[200], scale[100]]).toEqual([
      ...shades,
    ]);
  });

  it.each(hues)('%s: каждый следующий шаг темнее предыдущего', (_, shades) => {
    const scale = buildScale(shades);
    const values = STEPS.map((step) => lightness(scale[step]));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]!);
    }
  });

  it.each(hues)('%s: все шаги — 6-значный HEX в нижнем регистре', (_, shades) => {
    for (const hex of Object.values(buildScale(shades))) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('генерирует промежуточные и тёмные шаги детерминированно', () => {
    expect(buildScale(BRAND_SHADES.red)[400]).toBe('#db968f');
    expect(buildScale(BRAND_SHADES.orange)[800]).toBe('#8c5f3e');
    expect(buildScale(BRAND_SHADES.green)[50]).toBe('#f2f8f0');
    expect(buildScale(BRAND_SHADES.blue)[950]).toBe('#051015');
  });
});

describe('GRAPHITE', () => {
  it('темнеет от 50 к 950', () => {
    const values = STEPS.map((step) => lightness(GRAPHITE[step]));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]!);
    }
  });
});
```

- [ ] **Step 4: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/tokens exec vitest run test/scale.test.ts`
Expected: FAIL — `Failed to resolve import "../src/scale.ts"`.

- [ ] **Step 5: Реализовать шкалу**

`packages/tokens/src/scale.ts`:

```ts
import { clampChroma, formatHex, interpolate, oklch, type Color, type Oklch } from 'culori';
import type { ShadeRow } from './brand.ts';

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Step = (typeof STEPS)[number];
export type Scale = Record<Step, string>;

function parse(color: Color | string): Oklch {
  const result = oklch(color);
  if (!result) throw new Error(`Не удалось разобрать цвет: ${JSON.stringify(color)}`);
  return result;
}

function toHex(color: Oklch): string {
  const hex = formatHex(clampChroma(color, 'oklch'));
  if (!hex) throw new Error(`Не удалось перевести в HEX: ${JSON.stringify(color)}`);
  return hex;
}

/**
 * Позиционная шкала (спека §5): оттенки брендбука сохраняются точно,
 * базовый цвет s3 всегда стоит на 500. Шаги 50, 400 и 800–950 генерируются в OKLCH.
 */
export function buildScale(shades: ShadeRow): Scale {
  const [s1, s2, s3, s4, s5, s6] = shades;
  const darkest = parse(s1);
  const lightest = parse(s6);
  const darker = (deltaL: number, chromaFactor: number) =>
    toHex({ mode: 'oklch', l: darkest.l - deltaL, c: (darkest.c ?? 0) * chromaFactor, h: darkest.h });

  return {
    50: toHex({
      mode: 'oklch',
      l: lightest.l + (1 - lightest.l) * 0.5,
      c: (lightest.c ?? 0) * 0.5,
      h: lightest.h,
    }),
    100: s6,
    200: s5,
    300: s4,
    400: toHex(parse(interpolate([s3, s4], 'oklch')(0.5))),
    500: s3,
    600: s2,
    700: s1,
    800: darker(0.08, 0.85),
    900: darker(0.15, 0.7),
    950: darker(0.24, 0.5),
  };
}
```

- [ ] **Step 6: Убедиться, что тест проходит, и проверить типы**

Run: `pnpm --filter @mednet/tokens exec vitest run test/scale.test.ts && pnpm --filter @mednet/tokens typecheck`
Expected: все тесты PASS; `tsc` без ошибок.
Если не совпали четыре значения в «детерминированно» — проверьте, что стоит culori 4.x, и что формулы совпадают с кодом выше; значения получены именно ими.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(tokens): brand shades and positional OKLCH scale"
```

---

### Task 3: DTCG — формат, алиасы и примитивы

**Files:**
- Create: `packages/tokens/src/dtcg.ts`, `packages/tokens/src/primitives.ts`, `packages/tokens/scripts/generate-primitives.ts`, `packages/tokens/tokens/primitives.json` (генерируется)
- Modify: `packages/tokens/package.json` (скрипт `generate`)
- Test: `packages/tokens/test/dtcg.test.ts`, `packages/tokens/test/primitives.test.ts`

**Interfaces:**
- Consumes: `BRAND_SHADES`, `GRAPHITE`, `DANGER` (Task 2), `buildScale` (Task 2).
- Produces:
  - `interface DtcgColor { colorSpace: 'srgb'; components: [number, number, number]; hex: string }`
  - `type DtcgTree = { [key: string]: unknown }`
  - `toDtcgColor(hex: string): DtcgColor`
  - `flatten(tree: DtcgTree, prefix?: string): Map<string, unknown>` — путь `color.red.500` → `$value`
  - `aliasTarget(value: unknown): string | null` — `'{color.red.600}'` → `'color.red.600'`
  - `resolveColors(tokens: Map<string, unknown>): Map<string, string>` — путь → HEX
  - `buildPrimitives(): DtcgTree` — `{ color: { $type, $description, white, black, red: {50…950}, …, graphite, danger } }`
  - файл `tokens/primitives.json` (коммитится).

- [ ] **Step 1: Написать падающие тесты DTCG**

`packages/tokens/test/dtcg.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { aliasTarget, flatten, resolveColors, toDtcgColor } from '../src/dtcg.ts';

describe('toDtcgColor', () => {
  it('описывает цвет в формате DTCG 2025.10', () => {
    expect(toDtcgColor('#B55C57')).toEqual({
      colorSpace: 'srgb',
      components: [0.7098, 0.3608, 0.3412],
      hex: '#b55c57',
    });
  });

  it('падает на не-цвете', () => {
    expect(() => toDtcgColor('banana')).toThrow(/не цвет/i);
  });
});

describe('flatten', () => {
  it('собирает пути до токенов и пропускает $-метаданные', () => {
    const tree = {
      color: {
        $type: 'color',
        white: { $value: toDtcgColor('#ffffff') },
        red: { '600': { $value: toDtcgColor('#b55c57') } },
      },
    };
    expect([...flatten(tree).keys()]).toEqual(['color.white', 'color.red.600']);
  });
});

describe('aliasTarget', () => {
  it('распознаёт алиас', () => {
    expect(aliasTarget('{color.red.600}')).toBe('color.red.600');
  });
  it('возвращает null для значения', () => {
    expect(aliasTarget(toDtcgColor('#ffffff'))).toBeNull();
    expect(aliasTarget('#ffffff')).toBeNull();
  });
});

describe('resolveColors', () => {
  it('разворачивает цепочки алиасов', () => {
    const tokens = new Map<string, unknown>([
      ['color.red.600', toDtcgColor('#b55c57')],
      ['semantic.primary', '{color.red.600}'],
      ['semantic.link', '{semantic.primary}'],
    ]);
    expect(resolveColors(tokens).get('semantic.link')).toBe('#b55c57');
  });

  it('падает на неизвестном алиасе с понятным сообщением', () => {
    const tokens = new Map<string, unknown>([['semantic.primary', '{color.red.601}']]);
    expect(() => resolveColors(tokens)).toThrow(/неизвестный токен: color\.red\.601/i);
  });

  it('падает на цикле', () => {
    const tokens = new Map<string, unknown>([
      ['a', '{b}'],
      ['b', '{a}'],
    ]);
    expect(() => resolveColors(tokens)).toThrow(/цикл/i);
  });
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm --filter @mednet/tokens exec vitest run test/dtcg.test.ts`
Expected: FAIL — `Failed to resolve import "../src/dtcg.ts"`.

- [ ] **Step 3: Реализовать DTCG**

`packages/tokens/src/dtcg.ts`:

```ts
import { rgb } from 'culori';

/** Цвет в формате DTCG 2025.10. */
export interface DtcgColor {
  colorSpace: 'srgb';
  components: [number, number, number];
  hex: string;
}

export type DtcgTree = { [key: string]: unknown };

const ALIAS = /^\{([^{}]+)\}$/;
const round = (value: number) => Math.round(value * 10000) / 10000;

export function toDtcgColor(hex: string): DtcgColor {
  const color = rgb(hex);
  if (!color) throw new Error(`Не цвет: ${hex}`);
  return {
    colorSpace: 'srgb',
    components: [round(color.r), round(color.g), round(color.b)],
    hex: hex.toLowerCase(),
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Разворачивает дерево DTCG в «путь → $value». Ключи на `$` — метаданные. */
export function flatten(tree: DtcgTree, prefix = ''): Map<string, unknown> {
  const result = new Map<string, unknown>();
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$') || !isObject(node)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ('$value' in node) {
      result.set(path, node.$value);
    } else {
      for (const [childPath, value] of flatten(node, path)) result.set(childPath, value);
    }
  }
  return result;
}

export function aliasTarget(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return ALIAS.exec(value)?.[1] ?? null;
}

/** Превращает каждый токен в HEX, следуя алиасам. Падает на неизвестных и циклических алиасах. */
export function resolveColors(tokens: Map<string, unknown>): Map<string, string> {
  const resolved = new Map<string, string>();

  const visit = (path: string, stack: string[]): string => {
    const known = resolved.get(path);
    if (known) return known;
    if (stack.includes(path)) {
      throw new Error(`Циклический алиас: ${[...stack, path].join(' → ')}`);
    }
    if (!tokens.has(path)) {
      const from = stack.at(-1);
      throw new Error(`Неизвестный токен: ${path}${from ? ` (ссылка из ${from})` : ''}`);
    }
    const value = tokens.get(path);
    const target = aliasTarget(value);
    let hex: string;
    if (target) {
      hex = visit(target, [...stack, path]);
    } else if (isObject(value) && typeof value.hex === 'string') {
      hex = value.hex;
    } else {
      throw new Error(`Токен ${path}: ожидался цвет DTCG или алиас, получено ${JSON.stringify(value)}`);
    }
    resolved.set(path, hex);
    return hex;
  };

  for (const path of tokens.keys()) visit(path, []);
  return resolved;
}
```

- [ ] **Step 4: Убедиться, что тесты DTCG проходят**

Run: `pnpm --filter @mednet/tokens exec vitest run test/dtcg.test.ts`
Expected: PASS.

- [ ] **Step 5: Написать падающий тест примитивов**

`packages/tokens/test/primitives.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BRAND_SHADES } from '../src/brand.ts';
import { flatten } from '../src/dtcg.ts';
import { buildPrimitives } from '../src/primitives.ts';
import { STEPS } from '../src/scale.ts';

describe('buildPrimitives', () => {
  const paths = [...flatten(buildPrimitives()).keys()];

  it('содержит белый, чёрный и 11 шагов каждого цвета бренда', () => {
    expect(paths).toContain('color.white');
    expect(paths).toContain('color.black');
    for (const hue of Object.keys(BRAND_SHADES)) {
      for (const step of STEPS) expect(paths).toContain(`color.${hue}.${step}`);
    }
  });

  it('содержит graphite и danger', () => {
    expect(paths).toContain('color.graphite.900');
    expect(paths).toContain('color.danger.600');
  });
});

describe('tokens/primitives.json', () => {
  it('совпадает с генератором (после правок brand.ts/scale.ts запустите `pnpm --filter @mednet/tokens generate`)', () => {
    const committed = JSON.parse(
      readFileSync(new URL('../tokens/primitives.json', import.meta.url), 'utf8'),
    ) as unknown;
    expect(committed).toEqual(buildPrimitives());
  });
});
```

- [ ] **Step 6: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/tokens exec vitest run test/primitives.test.ts`
Expected: FAIL — `Failed to resolve import "../src/primitives.ts"`.

- [ ] **Step 7: Реализовать примитивы и генератор**

`packages/tokens/src/primitives.ts`:

```ts
import { BRAND_SHADES, DANGER, GRAPHITE } from './brand.ts';
import { toDtcgColor, type DtcgTree } from './dtcg.ts';
import { buildScale } from './scale.ts';

const group = (scale: Record<number, string>): DtcgTree =>
  Object.fromEntries(
    Object.entries(scale).map(([step, hex]) => [step, { $value: toDtcgColor(hex) }]),
  );

/** Дерево примитивов DTCG. Источник для tokens/primitives.json. */
export function buildPrimitives(): DtcgTree {
  const color: DtcgTree = {
    $type: 'color',
    $description:
      'Примитивы бренда ЦНИИОИЗ. Сгенерировано scripts/generate-primitives.ts — не редактировать вручную.',
    white: { $value: toDtcgColor('#ffffff') },
    black: { $value: toDtcgColor('#000000') },
  };
  for (const [hue, shades] of Object.entries(BRAND_SHADES)) {
    color[hue] = group(buildScale(shades));
  }
  color.graphite = group(GRAPHITE);
  color.danger = group(DANGER);
  return { color };
}
```

`packages/tokens/scripts/generate-primitives.ts`:

```ts
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPrimitives } from '../src/primitives.ts';

const file = new URL('../tokens/primitives.json', import.meta.url);
writeFileSync(file, `${JSON.stringify(buildPrimitives(), null, 2)}\n`);
console.log(`Записано: ${fileURLToPath(file)}`);
```

В `packages/tokens/package.json` в `scripts` добавить:

```json
"generate": "tsx scripts/generate-primitives.ts",
```

- [ ] **Step 8: Сгенерировать JSON и прогнать тесты**

Run:

```bash
mkdir -p packages/tokens/tokens
pnpm --filter @mednet/tokens generate
pnpm --filter @mednet/tokens exec vitest run
pnpm --filter @mednet/tokens typecheck
```

Expected: `Записано: …\tokens\primitives.json`; все тесты PASS; `tsc` без ошибок. В файле есть, например, `"hex": "#db968f"` у `red.400`.

- [ ] **Step 9: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(tokens): DTCG format, alias resolution and generated primitives"
```

---

### Task 4: Семантика и проверка контраста

**Files:**
- Create: `packages/tokens/tokens/semantic.json`, `packages/tokens/src/load.ts`, `packages/tokens/src/pairs.ts`
- Test: `packages/tokens/test/semantic.test.ts`

**Interfaces:**
- Consumes: `flatten`, `resolveColors`, `aliasTarget`, `DtcgTree` (Task 3); `tokens/primitives.json` (Task 3).
- Produces:
  - `interface ColorToken { name: string; hex: string; ref: string | null }` — `name` в CSS-форме (`red-500`, `primary`); `ref` — имя примитива для семантики (`red-600`), `null` у примитивов.
  - `interface Tokens { primitives: ColorToken[]; semantic: ColorToken[] }`
  - `toTokens(primitivesTree: DtcgTree, semanticTree: DtcgTree): Tokens` — падает, если семантика ссылается не на `color.*`.
  - `loadTokens(root: URL): Tokens` — читает `tokens/primitives.json` и `tokens/semantic.json` относительно `root` (URL пакета со слешем на конце).
  - `CONTRAST_PAIRS: ReadonlyArray<readonly [fg: string, bg: string, min: number]>`, `REQUIRED_SEMANTIC: readonly string[]`.

- [ ] **Step 1: Написать семантику**

`packages/tokens/tokens/semantic.json`:

```json
{
  "semantic": {
    "$type": "color",
    "$description": "Семантика по контракту shadcn/ui + расширения (спека §5). Только алиасы на примитивы color.*.",
    "background": { "$value": "{color.white}" },
    "foreground": { "$value": "{color.graphite.900}" },
    "card": { "$value": "{color.white}" },
    "card-foreground": { "$value": "{color.graphite.900}" },
    "popover": { "$value": "{color.white}" },
    "popover-foreground": { "$value": "{color.graphite.900}" },
    "primary": { "$value": "{color.red.600}" },
    "primary-hover": { "$value": "{color.red.700}" },
    "primary-foreground": { "$value": "{color.white}" },
    "secondary": { "$value": "{color.beige.100}" },
    "secondary-foreground": { "$value": "{color.graphite.900}" },
    "muted": { "$value": "{color.beige.100}" },
    "muted-foreground": { "$value": "{color.graphite.600}" },
    "accent": { "$value": "{color.red.100}" },
    "accent-foreground": { "$value": "{color.graphite.900}" },
    "destructive": { "$value": "{color.danger.600}" },
    "destructive-foreground": { "$value": "{color.white}" },
    "destructive-muted": { "$value": "{color.danger.100}" },
    "success": { "$value": "{color.green.700}" },
    "success-foreground": { "$value": "{color.white}" },
    "success-muted": { "$value": "{color.green.50}" },
    "info": { "$value": "{color.blue.600}" },
    "info-foreground": { "$value": "{color.white}" },
    "info-muted": { "$value": "{color.blue.50}" },
    "warning": { "$value": "{color.orange.800}" },
    "warning-foreground": { "$value": "{color.white}" },
    "warning-muted": { "$value": "{color.orange.50}" },
    "border": { "$value": "{color.beige.300}" },
    "input": { "$value": "{color.graphite.400}" },
    "ring": { "$value": "{color.blue.600}" },
    "chart-1": { "$value": "{color.blue.500}" },
    "chart-2": { "$value": "{color.red.500}" },
    "chart-3": { "$value": "{color.green.500}" },
    "chart-4": { "$value": "{color.orange.500}" },
    "chart-5": { "$value": "{color.violet.500}" },
    "chart-6": { "$value": "{color.yellow.500}" },
    "chart-7": { "$value": "{color.peach.500}" },
    "chart-8": { "$value": "{color.beige.500}" },
    "sidebar": { "$value": "{color.beige.100}" },
    "sidebar-foreground": { "$value": "{color.graphite.900}" },
    "sidebar-primary": { "$value": "{color.red.600}" },
    "sidebar-primary-foreground": { "$value": "{color.white}" },
    "sidebar-accent": { "$value": "{color.red.100}" },
    "sidebar-accent-foreground": { "$value": "{color.graphite.900}" },
    "sidebar-border": { "$value": "{color.beige.300}" },
    "sidebar-ring": { "$value": "{color.blue.600}" }
  }
}
```

- [ ] **Step 2: Написать падающий тест семантики**

`packages/tokens/test/semantic.test.ts`:

```ts
import { wcagContrast } from 'culori';
import { describe, expect, it } from 'vitest';
import { toDtcgColor } from '../src/dtcg.ts';
import { loadTokens, toTokens } from '../src/load.ts';
import { CONTRAST_PAIRS, REQUIRED_SEMANTIC } from '../src/pairs.ts';

const tokens = loadTokens(new URL('../', import.meta.url));
const hex = new Map(tokens.semantic.map((token) => [token.name, token.hex]));

describe('семантика', () => {
  it.each(REQUIRED_SEMANTIC)('определяет %s (нужно shadcn и Basecoat)', (name) => {
    expect(hex.has(name)).toBe(true);
  });

  it.each(CONTRAST_PAIRS)('%s на %s — не ниже %s:1', (fg, bg, min) => {
    const foreground = hex.get(fg);
    const background = hex.get(bg);
    expect(foreground, `нет токена ${fg}`).toBeDefined();
    expect(background, `нет токена ${bg}`).toBeDefined();
    expect(wcagContrast(foreground!, background!)).toBeGreaterThanOrEqual(min);
  });

  it('primary — красный бренда, ошибки — отдельный красный', () => {
    expect(hex.get('primary')).toBe('#b55c57');
    expect(hex.get('destructive')).toBe('#c62828');
  });

  it('хранит ссылку на примитив для CSS', () => {
    const primary = tokens.semantic.find((token) => token.name === 'primary');
    expect(primary?.ref).toBe('red-600');
  });
});

describe('toTokens', () => {
  it('запрещает семантике ссылаться не на примитивы', () => {
    const primitives = { color: { white: { $value: toDtcgColor('#ffffff') } } };
    const semantic = {
      semantic: {
        background: { $value: '{color.white}' },
        card: { $value: '{semantic.background}' },
      },
    };
    expect(() => toTokens(primitives, semantic)).toThrow(/semantic\.card.*примитив/);
  });
});
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/tokens exec vitest run test/semantic.test.ts`
Expected: FAIL — `Failed to resolve import "../src/load.ts"`.

- [ ] **Step 4: Реализовать загрузку и пары**

`packages/tokens/src/load.ts`:

```ts
import { readFileSync } from 'node:fs';
import { aliasTarget, flatten, resolveColors, type DtcgTree } from './dtcg.ts';

export interface ColorToken {
  /** Имя в CSS-форме: `red-500`, `white`, `primary`. */
  name: string;
  hex: string;
  /** Для семантики — имя примитива, на который она ссылается (`red-600`). */
  ref: string | null;
}

export interface Tokens {
  primitives: ColorToken[];
  semantic: ColorToken[];
}

/** `color.red.500` → `red-500`, `semantic.primary` → `primary`. */
const cssName = (path: string) => path.split('.').slice(1).join('-');

export function toTokens(primitivesTree: DtcgTree, semanticTree: DtcgTree): Tokens {
  const primitives = flatten(primitivesTree);
  const semantic = flatten(semanticTree);
  const resolved = resolveColors(new Map([...primitives, ...semantic]));
  const hexOf = (path: string) => {
    const hex = resolved.get(path);
    if (!hex) throw new Error(`Не удалось вычислить ${path}`);
    return hex;
  };

  return {
    primitives: [...primitives.keys()].map((path) => ({
      name: cssName(path),
      hex: hexOf(path),
      ref: null,
    })),
    semantic: [...semantic.entries()].map(([path, value]) => {
      const target = aliasTarget(value);
      if (!target?.startsWith('color.')) {
        throw new Error(`${path}: семантический токен должен ссылаться на примитив color.*`);
      }
      return { name: cssName(path), hex: hexOf(path), ref: cssName(target) };
    }),
  };
}

/** Читает tokens/*.json пакета. `root` — URL корня пакета со слешем на конце. */
export function loadTokens(root: URL): Tokens {
  const read = (file: string) =>
    JSON.parse(readFileSync(new URL(file, root), 'utf8')) as DtcgTree;
  return toTokens(read('tokens/primitives.json'), read('tokens/semantic.json'));
}
```

`packages/tokens/src/pairs.ts`:

```ts
/** Пары, контраст которых проверяет CI (спека §5): [текст/элемент, фон, минимум]. */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ['foreground', 'background', 4.5],
  ['card-foreground', 'card', 4.5],
  ['popover-foreground', 'popover', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['primary-foreground', 'primary-hover', 4.5],
  ['primary', 'background', 4.5],
  ['secondary-foreground', 'secondary', 4.5],
  ['muted-foreground', 'muted', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['accent-foreground', 'accent', 4.5],
  ['destructive-foreground', 'destructive', 4.5],
  ['destructive', 'destructive-muted', 4.5],
  ['destructive', 'background', 4.5],
  ['success-foreground', 'success', 4.5],
  ['success', 'success-muted', 4.5],
  ['success', 'background', 4.5],
  ['info-foreground', 'info', 4.5],
  ['info', 'info-muted', 4.5],
  ['info', 'background', 4.5],
  ['warning-foreground', 'warning', 4.5],
  ['warning', 'warning-muted', 4.5],
  ['warning', 'background', 4.5],
  ['sidebar-foreground', 'sidebar', 4.5],
  ['sidebar-primary-foreground', 'sidebar-primary', 4.5],
  ['sidebar-accent-foreground', 'sidebar-accent', 4.5],
  ['input', 'background', 3],
  ['input', 'muted', 3],
  ['ring', 'background', 3],
  ['ring', 'muted', 3],
];

/**
 * Имена, которые читают shadcn и Basecoat. После сброса палитры Tailwind
 * отсутствие любого из них ломает сборку CSS (`Cannot apply unknown utility class`).
 */
export const REQUIRED_SEMANTIC: readonly string[] = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
];
```

- [ ] **Step 5: Прогнать тесты**

Run: `pnpm --filter @mednet/tokens exec vitest run && pnpm --filter @mednet/tokens typecheck`
Expected: всё PASS (в том числе все 29 пар контраста). Значения заранее проверены: минимальный запас — `primary-foreground` на `primary` (4.53) и `info` на `info-muted` (4.53).
Если какая-то пара падает — **не понижать порог**, а менять ступень в `semantic.json` и сверяться со спекой §5.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(tokens): semantic tokens with WCAG AA contrast gate"
```

---

### Task 5: Генерация CSS, темы Tailwind, JS и JSON; сборка пакета

**Files:**
- Create: `packages/tokens/src/base.ts`, `packages/tokens/src/emit.ts`, `packages/tokens/scripts/build.ts`
- Modify: `packages/tokens/package.json` (`build`, `exports`, `files`, `publishConfig`)
- Test: `packages/tokens/test/emit.test.ts`

**Interfaces:**
- Consumes: `Tokens`, `toTokens`, `loadTokens` (Task 4); `toDtcgColor` (Task 3).
- Produces:
  - `FONT { sans, display, mono }`, `FONT_WEIGHT { body: 500, heading: 600, bold: 700 }`, `TEXT: Record<'xs'|'sm'|'base'|'lead'|'h4'|'h3'|'h2'|'h1', readonly [size, lineHeight]>`, `RADIUS = '1rem'`, `SHADOW { sm, md, lg }`, `MOTION { ease, fast, base }`.
  - `emitTokensCss(t: Tokens): string`, `emitThemeCss(t: Tokens): string`, `tokensObject(t: Tokens)`, `emitJson(t: Tokens): string`, `emitJs(t: Tokens): { js: string; dts: string }`.
  - CSS-переменные: `--mn-<примитив>` (`--mn-red-600`), `--mn-<семантика>` (`--mn-primary`), `--<семантика>` (`--primary`), `--radius`, `--mn-font-sans|display|mono`, `--mn-font-weight-body|heading|bold`, `--mn-text-<k>` и `--mn-text-<k>-line-height`, `--mn-shadow-sm|md|lg`, `--mn-ease`, `--mn-duration-fast|base`.
  - Tailwind-утилиты: `bg-red-500`…, `bg-primary`…, `font-sans|display|mono`, `text-xs|sm|base|lead|h4|h3|h2|h1`, `rounded-sm…xl`, `shadow-sm|md|lg`, `ease-brand`.
  - Пакет: `@mednet/tokens` (JS), `@mednet/tokens/tokens.css`, `@mednet/tokens/theme.css`, `@mednet/tokens/tokens.json`.
  - JS-экспорт: `color` (`color.red['500']`, `color.white`), `semantic` (`semantic.primary`, `semantic['muted-foreground']`), `font`, `fontWeight`, `text` (`{ size, lineHeight }`), `radius`, `shadow`, `motion`; default — всё вместе.

- [ ] **Step 1: Записать базовые токены**

`packages/tokens/src/base.ts`:

```ts
/**
 * Нецветовые токены (спека §5). Хранятся в TS, а не в DTCG: clamp() и тени
 * с прозрачностью в DTCG без потерь не выражаются.
 */
export const FONT = {
  sans: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
  /** Bebas Neue без кириллицы в fontsource (спека Q6) — пока падает на Montserrat. */
  display: '"Bebas Neue", "Montserrat", ui-sans-serif, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

export const FONT_WEIGHT = {
  body: 500,
  heading: 600,
  bold: 700,
} as const;

/** [размер, межстрочный]. h1/h2 — резиновые. */
export const TEXT = {
  xs: ['0.8125rem', '1.5'],
  sm: ['0.875rem', '1.5'],
  base: ['1rem', '1.5'],
  lead: ['1.125rem', '1.5'],
  h4: ['1.125rem', '1.2'],
  h3: ['1.25rem', '1.2'],
  h2: ['clamp(1.75rem, 2.6vw, 2.375rem)', '1.2'],
  h1: ['clamp(1.75rem, 3.2vw, 2.875rem)', '1.2'],
} as const;

export const RADIUS = '1rem';

/** Тёплые мягкие тени в тоне beige-700 (#a6998a). */
export const SHADOW = {
  sm: '0 1px 2px 0 rgb(166 153 138 / 0.16)',
  md: '0 4px 12px -2px rgb(166 153 138 / 0.22)',
  lg: '0 12px 32px -8px rgb(166 153 138 / 0.28)',
} as const;

export const MOTION = {
  ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  fast: '150ms',
  base: '250ms',
} as const;
```

- [ ] **Step 2: Написать падающий тест генераторов**

`packages/tokens/test/emit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toDtcgColor } from '../src/dtcg.ts';
import { emitJs, emitJson, emitThemeCss, emitTokensCss } from '../src/emit.ts';
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
    expect(css).toContain('--radius: 1rem;');
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

  it('даёт утилиты размеров текста и теней', () => {
    expect(css).toContain('--text-h1: var(--mn-text-h1);');
    expect(css).toContain('--text-h1--line-height: var(--mn-text-h1-line-height);');
    expect(css).toContain('--shadow-md: var(--mn-shadow-md);');
  });
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
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/tokens exec vitest run test/emit.test.ts`
Expected: FAIL — `Failed to resolve import "../src/emit.ts"`.

- [ ] **Step 4: Реализовать генераторы**

`packages/tokens/src/emit.ts`:

```ts
import { FONT, FONT_WEIGHT, MOTION, RADIUS, SHADOW, TEXT } from './base.ts';
import type { Tokens } from './load.ts';

const BANNER = '/* @mednet/tokens — сгенерировано scripts/build.ts, не редактировать вручную */';

export function emitTokensCss(tokens: Tokens): string {
  const lines = [
    '  /* Примитивы бренда */',
    ...tokens.primitives.map((token) => `  --mn-${token.name}: ${token.hex};`),
    '',
    '  /* Семантика с префиксом — для существующих сайтов (спека §15) */',
    ...tokens.semantic.map((token) => `  --mn-${token.name}: var(--mn-${token.ref});`),
    '',
    '  /* Семантика в именах shadcn/ui — для shadcn и Basecoat */',
    ...tokens.semantic.map((token) => `  --${token.name}: var(--mn-${token.name});`),
    '',
    '  /* База */',
    `  --radius: ${RADIUS};`,
    `  --mn-font-sans: ${FONT.sans};`,
    `  --mn-font-display: ${FONT.display};`,
    `  --mn-font-mono: ${FONT.mono};`,
    ...Object.entries(FONT_WEIGHT).map(([key, value]) => `  --mn-font-weight-${key}: ${value};`),
    ...Object.entries(TEXT).flatMap(([key, [size, lineHeight]]) => [
      `  --mn-text-${key}: ${size};`,
      `  --mn-text-${key}-line-height: ${lineHeight};`,
    ]),
    ...Object.entries(SHADOW).map(([key, value]) => `  --mn-shadow-${key}: ${value};`),
    `  --mn-ease: ${MOTION.ease};`,
    `  --mn-duration-fast: ${MOTION.fast};`,
    `  --mn-duration-base: ${MOTION.base};`,
  ];

  return [
    BANNER,
    ':root {',
    ...lines,
    '}',
    '',
    '@media (prefers-reduced-motion: reduce) {',
    '  :root {',
    '    --mn-duration-fast: 0ms;',
    '    --mn-duration-base: 0ms;',
    '  }',
    '}',
    '',
  ].join('\n');
}

export function emitThemeCss(tokens: Tokens): string {
  return [
    BANNER,
    '@import "./tokens.css";',
    '',
    '/* Стандартная палитра Tailwind удалена: доступны только бренд и семантика (спека §5). */',
    '/* Шрифты — литералом в обычном @theme: так они перекрывают шрифты Basecoat. */',
    '@theme {',
    '  --color-*: initial;',
    `  --font-sans: ${FONT.sans};`,
    `  --font-display: ${FONT.display};`,
    `  --font-mono: ${FONT.mono};`,
    '}',
    '',
    '@theme inline {',
    ...tokens.primitives.map((token) => `  --color-${token.name}: var(--mn-${token.name});`),
    ...tokens.semantic.map((token) => `  --color-${token.name}: var(--${token.name});`),
    '  --radius-sm: calc(var(--radius) - 4px);',
    '  --radius-md: calc(var(--radius) - 2px);',
    '  --radius-lg: var(--radius);',
    '  --radius-xl: calc(var(--radius) + 4px);',
    ...Object.keys(TEXT).flatMap((key) => [
      `  --text-${key}: var(--mn-text-${key});`,
      `  --text-${key}--line-height: var(--mn-text-${key}-line-height);`,
    ]),
    ...Object.keys(SHADOW).map((key) => `  --shadow-${key}: var(--mn-shadow-${key});`),
    '  --ease-brand: var(--mn-ease);',
    '}',
    '',
  ].join('\n');
}

/** Итоговые значения без алиасов: для tokens.json и JS-экспорта. */
export function tokensObject(tokens: Tokens) {
  const color: Record<string, string | Record<string, string>> = {};
  for (const token of tokens.primitives) {
    const [hue, step] = token.name.split('-') as [string, string | undefined];
    if (step === undefined) {
      color[hue] = token.hex;
    } else {
      const scale = (color[hue] ??= {}) as Record<string, string>;
      scale[step] = token.hex;
    }
  }
  return {
    color,
    semantic: Object.fromEntries(tokens.semantic.map((token) => [token.name, token.hex])),
    font: FONT,
    fontWeight: FONT_WEIGHT,
    text: Object.fromEntries(
      Object.entries(TEXT).map(([key, [size, lineHeight]]) => [key, { size, lineHeight }]),
    ),
    radius: RADIUS,
    shadow: SHADOW,
    motion: MOTION,
  };
}

export function emitJson(tokens: Tokens): string {
  return `${JSON.stringify(tokensObject(tokens), null, 2)}\n`;
}

export function emitJs(tokens: Tokens): { js: string; dts: string } {
  const entries = Object.entries(tokensObject(tokens));
  const names = entries.map(([name]) => name);
  const banner = BANNER.replace('/*', '//').replace(' */', '');
  const js = [
    banner,
    ...entries.map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 2)};`),
    `export default { ${names.join(', ')} };`,
    '',
  ].join('\n');
  // JSON-литерал — валидный тип TS: значения становятся строковыми/числовыми литералами.
  const dts = [
    banner,
    ...entries.map(
      ([name, value]) => `export declare const ${name}: ${JSON.stringify(value, null, 2)};`,
    ),
    `declare const tokens: { ${names.map((name) => `${name}: typeof ${name}`).join('; ')} };`,
    'export default tokens;',
    '',
  ].join('\n');
  return { js, dts };
}
```

- [ ] **Step 5: Убедиться, что тест проходит**

Run: `pnpm --filter @mednet/tokens exec vitest run test/emit.test.ts`
Expected: PASS.

- [ ] **Step 6: Написать скрипт сборки и настроить пакет**

`packages/tokens/scripts/build.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { emitJs, emitJson, emitThemeCss, emitTokensCss } from '../src/emit.ts';
import { loadTokens } from '../src/load.ts';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const tokens = loadTokens(root);
const { js, dts } = emitJs(tokens);

mkdirSync(dist, { recursive: true });
const files: Record<string, string> = {
  'tokens.css': emitTokensCss(tokens),
  'theme.css': emitThemeCss(tokens),
  'tokens.json': emitJson(tokens),
  'index.js': js,
  'index.d.ts': dts,
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(new URL(name, dist), content);
}
console.log(
  `@mednet/tokens: ${tokens.primitives.length} примитивов, ${tokens.semantic.length} семантических → dist/`,
);
```

`packages/tokens/package.json` — привести к этому виду; блок `devDependencies`, который записал pnpm, **оставить как есть** (в листинге он не показан):

```json
{
  "name": "@mednet/tokens",
  "version": "0.0.0",
  "description": "Дизайн-токены ЦНИИОИЗ: палитра брендбука, семантика shadcn, тема Tailwind v4",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/tokens"
  },
  "files": ["dist", "tokens", "README.md"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./tokens.css": "./dist/tokens.css",
    "./theme.css": "./dist/theme.css",
    "./tokens.json": "./dist/tokens.json",
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "generate": "tsx scripts/generate-primitives.ts",
    "build": "tsx scripts/build.ts",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  }
}
```

- [ ] **Step 7: Собрать и проверить результат**

Run:

```bash
pnpm --filter @mednet/tokens build
pnpm --filter @mednet/tokens test
pnpm --filter @mednet/tokens typecheck
```

Expected: `@mednet/tokens: 103 примитивов, 46 семантических → dist/`; тесты PASS.
Откуда числа: примитивы — `white` + `black` (2) + 8 цветов × 11 шагов (88) + `graphite` (11) + `danger` (2) = 103; семантика — все ключи `tokens/semantic.json` кроме `$type`/`$description` = 46.
Проверить глазами: `packages/tokens/dist/tokens.css` содержит `--mn-primary: var(--mn-red-600);` и `--primary: var(--mn-primary);`.

- [ ] **Step 8: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(tokens): emit tokens.css, Tailwind v4 theme, JSON and typed JS"
```

---

### Task 6: Интеграция с Tailwind v4 и README токенов

**Files:**
- Create: `packages/tokens/README.md`
- Test: `packages/tokens/test/tailwind.test.ts`

**Interfaces:**
- Consumes: `dist/theme.css` (Task 5).
- Produces: доказательство, что тема работает в Tailwind: стандартной палитры нет, бренд и семантика есть, шрифт — Montserrat.

- [ ] **Step 1: Поставить Tailwind в devDependencies пакета**

Run: `pnpm --filter @mednet/tokens add -D tailwindcss@^4.3.3 @tailwindcss/node@^4.3.3`

- [ ] **Step 2: Написать тест**

`packages/tokens/test/tailwind.test.ts`:

```ts
import { compile } from '@tailwindcss/node';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkg = fileURLToPath(new URL('../', import.meta.url));

/** Компилирует тему пакета (dist/theme.css) с заданными классами. */
async function build(candidates: string[]): Promise<string> {
  const compiler = await compile(
    '@import "tailwindcss" source(none);\n@import "./dist/theme.css";\n',
    { base: pkg, onDependency: () => {} },
  );
  return compiler.build(candidates);
}

describe('тема Tailwind', () => {
  it('не содержит стандартной палитры Tailwind', async () => {
    const css = await build(['bg-pink-500', 'text-slate-700']);
    expect(css).not.toMatch(/\.bg-pink-500/);
    expect(css).not.toMatch(/\.text-slate-700/);
  });

  it('даёт шкалы бренда через переменные', async () => {
    const css = await build(['bg-red-500', 'text-graphite-900']);
    expect(css).toMatch(/\.bg-red-500\s*\{[^}]*var\(--mn-red-500\)/);
    expect(css).toMatch(/\.text-graphite-900\s*\{[^}]*var\(--mn-graphite-900\)/);
  });

  it('даёт семантику shadcn', async () => {
    const css = await build(['bg-primary', 'text-primary-foreground', 'border-border']);
    expect(css).toMatch(/\.bg-primary\s*\{[^}]*var\(--primary\)/);
    expect(css).toMatch(/\.border-border\s*\{[^}]*var\(--border\)/);
  });

  it('ставит Montserrat шрифтом по умолчанию', async () => {
    const css = await build(['font-sans']);
    expect(css).toMatch(/--font-sans:\s*"Montserrat"/);
  });

  it('даёт резиновые размеры заголовков', async () => {
    const css = await build(['text-h1']);
    expect(css).toMatch(/\.text-h1\s*\{[^}]*var\(--mn-text-h1\)/);
  });
});
```

- [ ] **Step 3: Прогнать тест**

Run: `pnpm --filter @mednet/tokens build && pnpm --filter @mednet/tokens exec vitest run test/tailwind.test.ts`
Expected: PASS.
Если `compile` из `@tailwindcss/node` не принимает такие аргументы (API зафиксирован на 4.3.3: `compile(css, { base, onDependency })` → `{ build(candidates) }`), сверьтесь с `node_modules/@tailwindcss/node/dist/index.d.mts` и поправьте вызов, не меняя проверок.

- [ ] **Step 4: Написать README**

`packages/tokens/README.md`:

````markdown
# @mednet/tokens

Дизайн-токены ЦНИИОИЗ: палитра брендбука v8, семантика shadcn/ui, тема Tailwind CSS v4.

## Tailwind v4 (Next.js, Vite)

```css
@import "tailwindcss";
@import "@mednet/tokens/theme.css";
```

Стандартная палитра Tailwind удалена — доступны только цвета бренда (`bg-red-500`, `text-blue-700`, шаги 50–950, базовый цвет — 500) и семантика (`bg-primary`, `text-muted-foreground`, `border-border`). Шрифт по умолчанию — Montserrat (файлы шрифта подключайте отдельно, например из `@mednet/css/fonts.css` или `@fontsource/montserrat`).

## Обычный CSS

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mednet/tokens@0/dist/tokens.css">
```

```css
.notice { background: var(--mn-info-muted); color: var(--mn-info); }
```

На существующих сайтах используйте только переменные с префиксом `--mn-*`: имена без префикса (`--primary`, `--accent`, `--muted`) конфликтуют с Bootstrap 4 и самописными темами.

## JS

```ts
import { color, semantic, font } from '@mednet/tokens';

color.red['500']; // '#d6867f' — базовый красный бренда
semantic.primary; // '#b55c57' — кнопки и ссылки
```

## Как устроено

- `tokens/primitives.json` — примитивы в формате DTCG, **генерируются** из `src/brand.ts` (`pnpm generate`).
- `tokens/semantic.json` — семантика: только алиасы на примитивы.
- `pnpm build` → `dist/tokens.css`, `dist/theme.css`, `dist/tokens.json`, `dist/index.js`.
- `pnpm test` проверяет контраст всех семантических пар (WCAG 2.1 AA). Если пара не проходит — меняйте ступень в `semantic.json`, а не порог.
````

- [ ] **Step 5: Полный прогон пакета и commit**

Run: `pnpm --filter @mednet/tokens test && pnpm --filter @mednet/tokens typecheck`
Expected: PASS.

```bash
pnpm format
git add -A
git commit -m "test(tokens): verify Tailwind v4 theme; add README"
```

---

### Task 7: `@mednet/css` — шрифты из fontsource

**Files:**
- Create: `packages/css/package.json`, `packages/css/tsconfig.json`, `packages/css/scripts/fonts.ts`
- Test: `packages/css/test/fonts.test.ts`

**Interfaces:**
- Consumes: `tsconfig.base.json` (Task 1).
- Produces:
  - `FONT_WEIGHTS = [500, 600, 700] as const`, `FONT_SUBSETS = ['cyrillic', 'latin'] as const`
  - `interface FontFaces { css: string; files: string[] }`
  - `extractFontFaces(fontsourceCss: string, subsets: readonly string[]): FontFaces` — оставляет только нужные подмножества, `src` → `url(./fonts/<file>.woff2) format('woff2')`, сохраняет `unicode-range`.
  - `loadFontFaces(fontsourceDir: string): FontFaces` — читает `500.css`, `600.css`, `700.css`.

- [ ] **Step 1: Создать пакет**

`packages/css/package.json`:

```json
{
  "name": "@mednet/css",
  "version": "0.0.0",
  "description": "CSS для сайтов без React: компоненты Basecoat в теме ЦНИИОИЗ, шрифты, токены",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/css"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  }
}
```

`packages/css/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["scripts", "test"]
}
```

Run:

```bash
pnpm --filter @mednet/css add -D @mednet/tokens@workspace:* basecoat-css@1.0.2 --save-exact
pnpm --filter @mednet/css add -D @fontsource/montserrat@^5.3.0 tailwindcss@^4.3.3 @tailwindcss/node@^4.3.3 vitest tsx typescript@~6.0.3 @types/node
```

Expected: в `devDependencies` `"basecoat-css": "1.0.2"` (без `^`) и `"@mednet/tokens": "workspace:*"`.

- [ ] **Step 2: Написать падающий тест**

`packages/css/test/fonts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractFontFaces } from '../scripts/fonts.ts';

// Фрагмент @fontsource/montserrat/500.css (формат fontsource 5.x).
const SAMPLE = `/* montserrat-cyrillic-ext-500-normal */
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-display: swap;
  font-weight: 500;
  src: url(./files/montserrat-cyrillic-ext-500-normal.woff2) format('woff2'), url(./files/montserrat-cyrillic-ext-500-normal.woff) format('woff');
  unicode-range: U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F;
}

/* montserrat-cyrillic-500-normal */
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-display: swap;
  font-weight: 500;
  src: url(./files/montserrat-cyrillic-500-normal.woff2) format('woff2'), url(./files/montserrat-cyrillic-500-normal.woff) format('woff');
  unicode-range: U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;
}

/* montserrat-latin-500-normal */
@font-face {
  font-family: 'Montserrat';
  font-style: normal;
  font-display: swap;
  font-weight: 500;
  src: url(./files/montserrat-latin-500-normal.woff2) format('woff2'), url(./files/montserrat-latin-500-normal.woff) format('woff');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153;
}
`;

describe('extractFontFaces', () => {
  const result = extractFontFaces(SAMPLE, ['cyrillic', 'latin']);

  it('оставляет только нужные подмножества', () => {
    expect(result.files).toEqual([
      'montserrat-cyrillic-500-normal.woff2',
      'montserrat-latin-500-normal.woff2',
    ]);
    expect(result.css).not.toContain('cyrillic-ext');
  });

  it('переписывает путь на ./fonts/ и убирает woff-фолбэк', () => {
    expect(result.css).toContain(
      "src: url(./fonts/montserrat-cyrillic-500-normal.woff2) format('woff2');",
    );
    expect(result.css).not.toContain('.woff)');
    expect(result.css).not.toContain('./files/');
  });

  it('сохраняет unicode-range (без него подмножества перекрывают друг друга)', () => {
    expect(result.css).toContain('unicode-range: U+0301,U+0400-045F');
  });
});
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/css exec vitest run test/fonts.test.ts`
Expected: FAIL — `Failed to resolve import "../scripts/fonts.ts"`.

- [ ] **Step 4: Реализовать**

`packages/css/scripts/fonts.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FONT_WEIGHTS = [500, 600, 700] as const;
export const FONT_SUBSETS = ['cyrillic', 'latin'] as const;

export interface FontFaces {
  css: string;
  files: string[];
}

/**
 * Берёт @font-face из общего CSS fontsource (`500.css`): только там есть unicode-range,
 * без него кириллица и латиница перекрывают друг друга. Оставляет нужные подмножества,
 * переписывает путь на ./fonts/ и убирает woff-фолбэк.
 */
export function extractFontFaces(fontsourceCss: string, subsets: readonly string[]): FontFaces {
  const css: string[] = [];
  const files: string[] = [];
  for (const block of fontsourceCss.split(/(?=\/\* montserrat-)/)) {
    const subset = /\/\* montserrat-(.+)-\d{3}-normal \*\//.exec(block)?.[1];
    if (!subset || !subsets.includes(subset)) continue;
    const file = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(block)?.[1];
    if (!file) throw new Error(`В блоке Montserrat ${subset} нет woff2`);
    files.push(file);
    css.push(block.replace(/src:[^;]+;/, `src: url(./fonts/${file}) format('woff2');`).trim());
  }
  return { css: css.join('\n\n'), files };
}

/** @font-face для всех нужных начертаний из каталога пакета @fontsource/montserrat. */
export function loadFontFaces(fontsourceDir: string): FontFaces {
  const parts = FONT_WEIGHTS.map((weight) =>
    extractFontFaces(readFileSync(join(fontsourceDir, `${weight}.css`), 'utf8'), FONT_SUBSETS),
  );
  return {
    css: parts.map((part) => part.css).join('\n\n'),
    files: parts.flatMap((part) => part.files),
  };
}
```

- [ ] **Step 5: Прогнать тест и типы**

Run: `pnpm --filter @mednet/css exec vitest run test/fonts.test.ts && pnpm --filter @mednet/css typecheck`
Expected: PASS, `tsc` без ошибок.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(css): extract self-hosted Montserrat font faces from fontsource"
```

---

### Task 8: `@mednet/css` — сборка `mednet.css`

**Files:**
- Create: `packages/css/src/mednet.css`, `packages/css/src/base.css`, `packages/css/scripts/build.ts`
- Modify: `packages/css/package.json` (`build`, `exports`, `files`, CDN-поля, `publishConfig`)
- Test: `packages/css/test/build.test.ts`

**Interfaces:**
- Consumes: `@mednet/tokens/theme.css` (Task 5), `loadFontFaces` (Task 7), `basecoat-css/maia` и `basecoat-css/all.min` (пакет basecoat-css 1.0.2).
- Produces: `dist/mednet.css`, `dist/mednet.min.css`, `dist/fonts.css` (только `@font-face`), `dist/fonts/*.woff2` + `dist/fonts/OFL.txt`, `dist/mednet.js` (JS Basecoat). Экспорты пакета: `@mednet/css/mednet.css`, `/mednet.min.css`, `/fonts.css`, `/mednet.js`, `/package.json`.

- [ ] **Step 1: Написать падающий тест результата сборки**

`packages/css/test/build.test.ts`:

```ts
import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FONT_SUBSETS, FONT_WEIGHTS } from '../scripts/fonts.ts';

const distUrl = (file: string) => new URL(`../dist/${file}`, import.meta.url);
const read = (file: string) => readFileSync(distUrl(file), 'utf8');

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
        expect(css).toContain(`url(./fonts/${file})`);
        expect(existsSync(distUrl(`fonts/${file}`)), file).toBe(true);
      }
    }
  });
});

describe('остальные файлы dist', () => {
  it('fonts.css — только @font-face', () => {
    const fonts = read('fonts.css');
    expect(fonts).toContain('@font-face');
    expect(fonts).not.toContain('.btn');
  });

  it('кладёт лицензию шрифта', () => {
    expect(read('fonts/OFL.txt')).toMatch(/SIL OPEN FONT LICENSE/i);
  });

  it('кладёт JS Basecoat', () => {
    expect(statSync(distUrl('mednet.js')).size).toBeGreaterThan(1000);
  });

  it('минифицированная версия меньше обычной', () => {
    expect(statSync(distUrl('mednet.min.css')).size).toBeLessThan(statSync(distUrl('mednet.css')).size);
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/css exec vitest run test/build.test.ts`
Expected: FAIL — `ENOENT: no such file or directory … dist/mednet.css`.

- [ ] **Step 3: Написать точку входа и базовые стили**

`packages/css/src/mednet.css`:

```css
/*
 * Точка входа @mednet/css. Порядок важен (спека §6):
 * Basecoat (стиль Maia) → тема бренда (перекрывает :root и @theme Basecoat) → база.
 * source(none): Tailwind-утилит в итоговом файле нет — только компоненты.
 */
@import 'tailwindcss' source(none);
@import 'basecoat-css/maia';
@import '@mednet/tokens/theme.css';
@import './base.css';
```

`packages/css/src/base.css`:

```css
/* Базовая типографика бренда. Компоненты Basecoat (@layer components) её перекрывают. */
@layer base {
  body {
    font-family: var(--font-sans);
    font-weight: var(--mn-font-weight-body);
  }

  h1,
  h2,
  h3,
  h4 {
    font-weight: var(--mn-font-weight-heading);
    line-height: 1.2;
  }

  h1 {
    font-size: var(--mn-text-h1);
  }

  h2 {
    font-size: var(--mn-text-h2);
  }

  h3 {
    font-size: var(--mn-text-h3);
  }

  h4 {
    font-size: var(--mn-text-h4);
  }
}
```

- [ ] **Step 4: Написать скрипт сборки**

`packages/css/scripts/build.ts`:

```ts
import { compile, optimize } from '@tailwindcss/node';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFontFaces } from './fonts.ts';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version: string;
};
const banner = `/*! @mednet/css v${version} | дизайн-система ЦНИИОИЗ | Basecoat (MIT), Tailwind CSS (MIT), Montserrat (OFL-1.1) */`;

mkdirSync(join(dist, 'fonts'), { recursive: true });

// Шрифты: @font-face + файлы woff2 + лицензия OFL (обязательна при распространении).
const fontsourceDir = dirname(require.resolve('@fontsource/montserrat/package.json'));
const fonts = loadFontFaces(fontsourceDir);
for (const file of fonts.files) {
  copyFileSync(join(fontsourceDir, 'files', file), join(dist, 'fonts', file));
}
copyFileSync(require.resolve('@fontsource/montserrat/LICENSE'), join(dist, 'fonts', 'OFL.txt'));
writeFileSync(join(dist, 'fonts.css'), `${banner}\n${fonts.css}\n`);

// Компоненты Basecoat + тема бренда.
const entry = join(root, 'src', 'mednet.css');
const compiler = await compile(readFileSync(entry, 'utf8'), {
  base: dirname(entry),
  onDependency: () => {},
});
const css = `${banner}\n${fonts.css}\n\n${compiler.build([])}`;
writeFileSync(join(dist, 'mednet.css'), css);
writeFileSync(join(dist, 'mednet.min.css'), optimize(css, { minify: true }).code);

// JS Basecoat для интерактивных компонентов (диалоги, выпадающие меню, табы).
copyFileSync(require.resolve('basecoat-css/all.min'), join(dist, 'mednet.js'));

console.log(
  `@mednet/css: ${Math.round(css.length / 1024)} КБ CSS, ${fonts.files.length} файлов шрифтов → dist/`,
);
```

- [ ] **Step 5: Настроить пакет**

`packages/css/package.json` — привести к этому виду; блок `devDependencies` из Task 7 **оставить как есть** (в листинге он не показан):

```json
{
  "name": "@mednet/css",
  "version": "0.0.0",
  "description": "CSS для сайтов без React: компоненты Basecoat в теме ЦНИИОИЗ, шрифты, токены",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/css"
  },
  "files": ["dist", "demo", "README.md"],
  "style": "dist/mednet.css",
  "jsdelivr": "dist/mednet.min.css",
  "unpkg": "dist/mednet.min.css",
  "exports": {
    "./mednet.css": "./dist/mednet.css",
    "./mednet.min.css": "./dist/mednet.min.css",
    "./fonts.css": "./dist/fonts.css",
    "./mednet.js": "./dist/mednet.js",
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsx scripts/build.ts",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  }
}
```

- [ ] **Step 6: Собрать и прогнать тесты через turbo**

Run: `pnpm turbo run test --filter=@mednet/css...`
Expected: turbo собирает `@mednet/tokens`, затем `@mednet/css` (`@mednet/css: ~230 КБ CSS, 6 файлов шрифтов → dist/`), все тесты обоих пакетов PASS.
Если сборка падает с `Cannot apply unknown utility class \`X\``: Basecoat требует семантическое имя или цвет, которого нет в токенах. Добавьте его в `tokens/semantic.json` (и в `REQUIRED_SEMANTIC`), но **не** возвращайте стандартную палитру.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(css): build mednet.css (Basecoat Maia + brand theme + fonts)"
```

---

### Task 9: Демо-страница статики и README `@mednet/css`

**Files:**
- Create: `packages/css/demo/index.html`, `packages/css/README.md`

**Interfaces:**
- Consumes: `dist/mednet.css`, `dist/mednet.js` (Task 8). Разметка Basecoat 1.0: варианты — `data-variant`, размеры — `data-size`; карточка и алерт — `header` / `section` / `footer`; поля — `.field > label + input`.
- Produces: `demo/index.html` со ссылками `../dist/…` (docs-сайт копирует `demo/` и `dist/` рядом, Task 10); страница участвует в скриншот- и a11y-тестах (Task 12).

- [ ] **Step 1: Написать демо**

`packages/css/demo/index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>@mednet/css — компоненты</title>
    <link rel="stylesheet" href="../dist/mednet.css" />
    <script src="../dist/mednet.js" defer></script>
    <style>
      /* Раскладка демо. Tailwind-утилит в mednet.css нет — поэтому свой минимальный CSS. */
      main {
        max-width: 64rem;
        margin: 0 auto;
        padding: 2.5rem 1.5rem;
        display: grid;
        gap: 2.5rem;
      }
      .demo-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      .demo-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
      }
      .demo-title {
        grid-column: 1 / -1;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Компоненты @mednet/css</h1>
        <p>Basecoat (стиль Maia) в теме ЦНИИОИЗ. Страница использует только mednet.css и mednet.js.</p>
      </header>

      <section aria-labelledby="buttons">
        <h2 id="buttons">Кнопки</h2>
        <div class="demo-row">
          <button class="btn" type="button">Подать заявку</button>
          <button class="btn" data-variant="secondary" type="button">Вторичная</button>
          <button class="btn" data-variant="outline" type="button">Контурная</button>
          <button class="btn" data-variant="ghost" type="button">Прозрачная</button>
          <button class="btn" data-variant="link" type="button">Ссылка</button>
          <button class="btn" data-variant="destructive" type="button">Удалить</button>
          <button class="btn" data-size="sm" type="button">Маленькая</button>
          <button class="btn" data-size="lg" type="button">Большая</button>
          <button class="btn" type="button" disabled>Недоступна</button>
        </div>
      </section>

      <section aria-labelledby="badges">
        <h2 id="badges">Бейджи</h2>
        <div class="demo-row">
          <span class="badge">Новое</span>
          <span class="badge" data-variant="secondary">Черновик</span>
          <span class="badge" data-variant="outline">Архив</span>
          <span class="badge" data-variant="destructive">Отклонено</span>
        </div>
      </section>

      <section class="demo-grid" aria-labelledby="alerts">
        <h2 id="alerts" class="demo-title">Уведомления</h2>
        <div class="alert">
          <h3>Приём заявок открыт</h3>
          <section>Заявки принимаются до 31 октября включительно.</section>
        </div>
        <div class="alert" data-variant="destructive">
          <h3>Проверьте СНИЛС</h3>
          <section>Контрольная сумма не совпадает.</section>
        </div>
      </section>

      <section aria-labelledby="form-title">
        <h2 id="form-title">Форма</h2>
        <form class="card" onsubmit="return false">
          <header>
            <h3>Заявка на обучение</h3>
            <p>Программа «Организация здравоохранения и общественное здоровье»</p>
          </header>
          <section class="demo-grid">
            <div class="field">
              <label for="name">ФИО</label>
              <input id="name" type="text" placeholder="Иванова Мария Петровна" />
            </div>
            <div class="field">
              <label for="email">Эл. почта</label>
              <input id="email" type="email" placeholder="name@example.ru" />
            </div>
            <div class="field">
              <label for="region">Регион</label>
              <select id="region">
                <option>Москва</option>
                <option>Санкт-Петербург</option>
                <option>Новосибирская область</option>
              </select>
            </div>
            <div class="field">
              <label for="comment">Комментарий</label>
              <textarea id="comment" rows="3"></textarea>
            </div>
            <label class="label">
              <input type="checkbox" class="input" />
              Согласен на обработку персональных данных
            </label>
          </section>
          <footer class="demo-row">
            <button class="btn" type="submit">Отправить</button>
            <button class="btn" data-variant="outline" type="reset">Очистить</button>
          </footer>
        </form>
      </section>

      <section aria-labelledby="table-title">
        <h2 id="table-title">Таблица</h2>
        <table class="table">
          <caption>
            Заявки по федеральным округам
          </caption>
          <thead>
            <tr>
              <th scope="col">Округ</th>
              <th scope="col">Заявок</th>
              <th scope="col">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Центральный</td>
              <td>1 284</td>
              <td><span class="badge">Принято</span></td>
            </tr>
            <tr>
              <td>Северо-Западный</td>
              <td>642</td>
              <td><span class="badge" data-variant="secondary">На проверке</span></td>
            </tr>
            <tr>
              <td>Сибирский</td>
              <td>318</td>
              <td><span class="badge" data-variant="destructive">Отклонено</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Посмотреть глазами**

Run: `pnpm --filter @mednet/css build`, затем открыть `packages/css/demo/index.html` в браузере (двойной клик).
Expected: шрифт Montserrat (кириллица без «прыгающих» глифов), основная кнопка — кирпично-лососёвая `#b55c57` с белым текстом и скруглением-«пилюлей», карточка — скругление `rounded-2xl`, фокус по Tab — синее кольцо. Если что-то из Basecoat выглядит не стилизованным (например, `select` в `.field`) — это нормально для v1, отметьте в README раздела «Известные ограничения», не дописывайте свой CSS.

- [ ] **Step 3: Написать README**

`packages/css/README.md`:

````markdown
# @mednet/css

Готовый CSS для сайтов без React (статика, MODX, любые шаблонизаторы): компоненты [Basecoat](https://basecoatui.com) (стиль Maia) в теме ЦНИИОИЗ, шрифт Montserrat и токены бренда.

## Подключение

Без сборки — с CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mednet/css@0/dist/mednet.min.css">
<script src="https://cdn.jsdelivr.net/npm/@mednet/css@0/dist/mednet.js" defer></script>
```

Или скопируйте к себе папку `dist/` из пакета (`npm i @mednet/css`) целиком — шрифты лежат в `dist/fonts/` и подключаются относительными путями.

Только шрифты (без компонентов): `dist/fonts.css`.

## Разметка

```html
<button class="btn">Подать заявку</button>
<button class="btn" data-variant="outline" data-size="sm">Отмена</button>

<div class="card">
  <header><h3>Заголовок</h3><p>Описание</p></header>
  <section>Содержимое</section>
  <footer><button class="btn">Действие</button></footer>
</div>

<div class="field">
  <label for="email">Эл. почта</label>
  <input id="email" type="email">
</div>
```

Все компоненты: [документация Basecoat](https://basecoatui.com). Живой пример — `demo/index.html`.

## Важно

- **Tailwind-утилит (`flex`, `p-4`, `gap-2`) в файле нет** — только компоненты. Для раскладки пишите свой CSS на переменных `--mn-*` или используйте HTML-шаблон со сборкой.
- На существующем сайте подключайте `mednet.css` **после** CSS сайта и в своём CSS используйте только переменные `--mn-*` (Bootstrap 4 объявляет свой `--primary`).
- Цвета — только через переменные: `color: var(--mn-primary)`, не HEX.

## Лицензии

Код — MIT. Montserrat — SIL Open Font License 1.1 (`dist/fonts/OFL.txt`). Basecoat и Tailwind CSS — MIT.
````

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "docs(css): static demo page and README"
```

---

### Task 10: Docs-сайт — каркас и страница токенов

**Files:**
- Create: `apps/docs/package.json`, `apps/docs/tsconfig.json`, `apps/docs/next.config.ts`, `apps/docs/postcss.config.mjs`, `apps/docs/app/globals.css`, `apps/docs/app/layout.tsx`, `apps/docs/app/page.tsx`, `apps/docs/app/tokens/page.tsx`, `apps/docs/scripts/copy-static-demo.mjs`

**Interfaces:**
- Consumes: `@mednet/tokens` JS (`color`, `semantic`) и `@mednet/tokens/theme.css` (Task 5); `@mednet/css` `dist/` и `demo/` (Tasks 8–9).
- Produces: статический сайт в `apps/docs/out/` (маршруты `/`, `/tokens/`); копия демо статики в `public/static-demo/{dist,demo}` → URL `/static-demo/demo/index.html`; turbo-задачи `build`, `typecheck`.

- [ ] **Step 1: Создать приложение**

`apps/docs/package.json`:

```json
{
  "name": "docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node scripts/copy-static-demo.mjs && next dev",
    "build": "node scripts/copy-static-demo.mjs && next build",
    "typecheck": "tsc --noEmit"
  }
}
```

Run:

```bash
pnpm --filter docs add next react react-dom @fontsource/montserrat culori @mednet/tokens@workspace:* @mednet/css@workspace:*
pnpm --filter docs add -D tailwindcss@^4.3.3 @tailwindcss/postcss@^4.3.3 typescript@~6.0.3 @types/react @types/react-dom @types/node @types/culori
```

`apps/docs/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["node"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "noUncheckedSideEffectImports": false,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

`apps/docs/next.config.ts`:

```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default config;
```

`apps/docs/postcss.config.mjs`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

`apps/docs/scripts/copy-static-demo.mjs`:

```js
// Копирует dist/ и demo/ пакета @mednet/css в public/, сохраняя их взаимное расположение:
// demo/index.html ссылается на ../dist/mednet.css.
import { cpSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const cssPackage = dirname(require.resolve('@mednet/css/package.json'));
const target = fileURLToPath(new URL('../public/static-demo/', import.meta.url));

rmSync(target, { recursive: true, force: true });
cpSync(join(cssPackage, 'dist'), join(target, 'dist'), { recursive: true });
cpSync(join(cssPackage, 'demo'), join(target, 'demo'), { recursive: true });
console.log(`Демо статики → ${target}`);
```

- [ ] **Step 2: Стили и общий макет**

`apps/docs/app/globals.css`:

```css
@import 'tailwindcss';
@import '@mednet/tokens/theme.css';

@layer base {
  body {
    font-weight: var(--mn-font-weight-body);
  }

  h1,
  h2,
  h3 {
    font-weight: var(--mn-font-weight-heading);
  }
}
```

`apps/docs/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'mednet-kit', template: '%s — mednet-kit' },
  description: 'Дизайн-система ЦНИИОИЗ',
};

const NAV = [
  { href: '/', label: 'Обзор' },
  { href: '/tokens/', label: 'Токены' },
  { href: '/css/', label: 'CSS для статики' },
  { href: '/recipes/', label: 'Внедрение' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-background font-sans text-foreground">
        <header className="border-b border-border">
          <nav aria-label="Разделы" className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-4">
            <span className="font-bold">mednet-kit</span>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
```

`apps/docs/app/page.tsx`:

```tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <h1 className="text-h1">Дизайн-система ЦНИИОИЗ</h1>
      <p className="mt-4 max-w-3xl text-lead text-muted-foreground">
        Токены бренда, CSS для статических сайтов и (скоро) React-компоненты, чтобы прототипы
        сразу выглядели по брендбуку.
      </p>
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        <li className="rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-h3">@mednet/tokens</h2>
          <p className="mt-2 text-muted-foreground">
            Палитра брендбука, семантика shadcn, тема Tailwind v4.
          </p>
          <Link href="/tokens/" className="mt-4 inline-block font-semibold text-primary underline">
            Токены
          </Link>
        </li>
        <li className="rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-h3">@mednet/css</h2>
          <p className="mt-2 text-muted-foreground">
            Компоненты для сайтов без React одной строкой подключения.
          </p>
          <Link href="/css/" className="mt-4 inline-block font-semibold text-primary underline">
            CSS для статики
          </Link>
        </li>
      </ul>
    </>
  );
}
```

- [ ] **Step 3: Страница токенов**

`apps/docs/app/tokens/page.tsx`:

```tsx
import { color, semantic } from '@mednet/tokens';
import { wcagContrast } from 'culori';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Токены' };

const HUES = [
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'violet',
  'beige',
  'peach',
  'graphite',
  'danger',
] as const;

const ratio = (foreground: string, background: string) =>
  wcagContrast(foreground, background).toFixed(2);

export default function TokensPage() {
  return (
    <>
      <h1 className="text-h1">Токены</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Палитра брендбука v8: базовый цвет — шаг 500, оттенки брендбука стоят на 100–300 и 500–700,
        остальные шаги сгенерированы в OKLCH. Под каждым цветом — контраст с белым.
      </p>

      <section aria-labelledby="palette" className="mt-12">
        <h2 id="palette" className="text-h2">
          Палитра
        </h2>
        {HUES.map((hue) => (
          <div key={hue} className="mt-8">
            <h3 className="text-h4">{hue}</h3>
            <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
              {Object.entries(color[hue] as Record<string, string>).map(([step, hex]) => (
                <li key={step} className="text-xs">
                  <div className="h-12 rounded-lg border border-border" style={{ backgroundColor: hex }} />
                  <div className="mt-1 font-semibold">{step}</div>
                  <div className="text-muted-foreground">{hex}</div>
                  <div className="text-muted-foreground">{ratio(hex, '#ffffff')}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="semantic" className="mt-16">
        <h2 id="semantic" className="text-h2">
          Семантика
        </h2>
        <p className="mt-2 text-muted-foreground">
          В Tailwind — <code>bg-primary</code>, в CSS — <code>var(--primary)</code>, на чужих
          сайтах — <code>var(--mn-primary)</code>.
        </p>
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2">Токен</th>
              <th scope="col" className="py-2">Цвет</th>
              <th scope="col" className="py-2">HEX</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(semantic).map(([name, hex]) => (
              <tr key={name} className="border-b border-border">
                <td className="py-2 font-semibold">{name}</td>
                <td className="py-2">
                  <span
                    className="inline-block h-6 w-12 rounded-md border border-border align-middle"
                    style={{ backgroundColor: hex }}
                  />
                </td>
                <td className="py-2 text-muted-foreground">{hex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Собрать сайт**

Run: `pnpm turbo run build --filter=docs...`
Expected: собираются `@mednet/tokens`, `@mednet/css`, затем `docs`: `Демо статики → …public\static-demo\`, Next печатает маршруты `/`, `/tokens` как `○ (Static)`, появляется `apps/docs/out/index.html` и `apps/docs/out/static-demo/demo/index.html`.
Если `next build` переписал `tsconfig.json` (добавил пути типов) — оставьте его правки, это нормально.

- [ ] **Step 5: Проверить типы и посмотреть**

Run: `pnpm turbo run typecheck --filter=docs`, затем `pnpm --filter docs dev` и открыть `http://localhost:3000/tokens/`.
Expected: `tsc` без ошибок; страница токенов показывает 10 шкал и таблицу семантики, шрифт — Montserrat.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(docs): Next.js static docs skeleton with tokens page"
```

---

### Task 11: Docs — «CSS для статики» и «Внедрение»

**Files:**
- Create: `apps/docs/app/css/page.tsx`, `apps/docs/app/recipes/page.tsx`

**Interfaces:**
- Consumes: макет и стили Task 10; `/static-demo/demo/index.html` (Task 10).
- Produces: маршруты `/css/`, `/recipes/` (участвуют в тестах Task 12). Рецепты соответствуют спеке §15.

- [ ] **Step 1: Страница CSS для статики**

`apps/docs/app/css/page.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'CSS для статики' };

const CDN = 'https://cdn.jsdelivr.net/npm/@mednet/css@0/dist';

const CONNECT = `<link rel="stylesheet" href="${CDN}/mednet.min.css">
<script src="${CDN}/mednet.js" defer></script>`;

const MARKUP = `<button class="btn">Подать заявку</button>
<button class="btn" data-variant="outline">Отмена</button>

<div class="card">
  <header><h3>Заголовок</h3><p>Описание</p></header>
  <section>Содержимое</section>
</div>`;

export default function CssPage() {
  return (
    <>
      <h1 className="text-h1">CSS для статики</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        <code>@mednet/css</code> — компоненты Basecoat (стиль Maia) в теме бренда, шрифт Montserrat и
        токены одним файлом. Без React и без сборки.
      </p>

      <h2 className="mt-12 text-h2">Подключение</h2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm">
        <code>{CONNECT}</code>
      </pre>
      <p className="mt-3 text-muted-foreground">
        Или скопируйте к себе папку <code>dist/</code> из пакета — шрифты подключаются относительными
        путями.
      </p>

      <h2 className="mt-12 text-h2">Разметка</h2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm">
        <code>{MARKUP}</code>
      </pre>
      <p className="mt-3 text-muted-foreground">
        Tailwind-утилит (<code>flex</code>, <code>p-4</code>) в файле нет — только компоненты.
      </p>

      <h2 className="mt-12 text-h2">Компоненты</h2>
      <iframe
        title="Демо компонентов @mednet/css"
        src="/static-demo/demo/index.html"
        className="mt-4 h-[1600px] w-full rounded-xl border border-border"
      />
    </>
  );
}
```

- [ ] **Step 2: Страница рецептов внедрения**

`apps/docs/app/recipes/page.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Внедрение в существующие сайты' };

const TOKENS_CDN = 'https://cdn.jsdelivr.net/npm/@mednet/tokens@0/dist/tokens.css';
const FONTS_CDN = 'https://cdn.jsdelivr.net/npm/@mednet/css@0/dist/fonts.css';

const PMSP = `<!-- после собственных стилей сайта -->
<link rel="stylesheet" href="${FONTS_CDN}">
<link rel="stylesheet" href="${TOKENS_CDN}">

<style>
  :root {
    --accent: var(--mn-primary);          /* было #2e6b52 / #8f3150 */
    --accent-dark: var(--mn-primary-hover);
    --accent-tint: var(--mn-red-100);
    --ink: var(--mn-foreground);
    --muted: var(--mn-muted-foreground);  /* у pmsp --muted — цвет текста */
    --line: var(--mn-border);
    --line-soft: var(--mn-beige-200);
    --bg-warm: var(--mn-beige-100);
    --font-display: var(--mn-font-sans);
    --font-text: var(--mn-font-sans);
  }
</style>`;

const MEDNET = `<!-- ПОСЛЕ bootstrap.min.css: Bootstrap 4 объявляет свой --primary -->
<link rel="stylesheet" href="${TOKENS_CDN}">

/* style_new.css: заменить литералы на переменные (без учёта регистра) */
#e06b65 → var(--mn-primary)        /* 108 вхождений; #e06b65 на белом — 3.25:1, не проходит AA */
#cf5a54 → var(--mn-primary-hover)
#3b3b3b → var(--mn-foreground)`;

const ANTD = `import { font, semantic } from '@mednet/tokens';
import type { ThemeConfig } from 'antd';

export const mednetTheme: ThemeConfig = {
  token: {
    colorPrimary: semantic.primary,
    colorError: semantic.destructive,
    colorSuccess: semantic.success,
    colorWarning: semantic.warning,
    colorInfo: semantic.info,
    colorText: semantic.foreground,
    colorTextSecondary: semantic['muted-foreground'],
    colorBorder: semantic.input,
    colorBgLayout: semantic.muted,
    fontFamily: font.sans,
    borderRadius: 16,
  },
};

// <ConfigProvider theme={mednetTheme}>…</ConfigProvider>`;

const TAILWIND = `@import "tailwindcss";
@import "@mednet/tokens/theme.css";`;

function Recipe({
  id,
  title,
  children,
  code,
}: {
  id: string;
  title: string;
  children: ReactNode;
  code: string;
}) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      <div className="mt-3 max-w-3xl text-muted-foreground">{children}</div>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm">
        <code>{code}</code>
      </pre>
    </section>
  );
}

export default function RecipesPage() {
  return (
    <>
      <h1 className="text-h1">Внедрение в существующие сайты</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Переписывать сайт не нужно. Главное правило: на чужом сайте используйте только переменные с
        префиксом <code>--mn-*</code> — имена без префикса (<code>--primary</code>,{' '}
        <code>--accent</code>, <code>--muted</code>) конфликтуют с Bootstrap и самописными темами.
      </p>

      <Recipe id="pmsp" title="Статика на CSS-переменных (pmsp-*)" code={PMSP}>
        У сайта уже есть свои переменные — достаточно переназначить их на токены бренда.
      </Recipe>

      <Recipe id="mednet" title="MODX + Bootstrap 4 (mednet.ru)" code={MEDNET}>
        Переменных нет — акцент вшит литералами. Подключаем токены и заменяем литералы.
      </Recipe>

      <Recipe id="antd" title="React + Ant Design (olimpiada)" code={ANTD}>
        Тема для <code>ConfigProvider</code> из JS-экспорта токенов.
      </Recipe>

      <Recipe id="tailwind" title="Любой проект на Tailwind v4" code={TAILWIND}>
        Стандартная палитра Tailwind заменится палитрой бренда.
      </Recipe>
    </>
  );
}
```

- [ ] **Step 3: Собрать и проверить**

Run: `pnpm turbo run build typecheck --filter=docs...`
Expected: маршруты `/`, `/css`, `/recipes`, `/tokens` — `○ (Static)`; `tsc` без ошибок.
Открыть `pnpm --filter docs dev` → `/css/` (в iframe — демо с Montserrat и брендовыми кнопками) и `/recipes/`.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add -A
git commit -m "feat(docs): static CSS page and adoption recipes for existing sites"
```

---

### Task 12: Скриншот- и a11y-тесты в Docker

**Files:**
- Create: `apps/docs/playwright.config.ts`, `apps/docs/tests/pages.ts`, `apps/docs/tests/visual.spec.ts`, `apps/docs/tests/a11y.spec.ts`, `apps/docs/scripts/serve-out.mjs`, `apps/docs/scripts/visual-docker.mjs`, `apps/docs/tests/__screenshots__/*.png` (генерируются)
- Modify: `apps/docs/package.json` (скрипты), корневой `package.json` (скрипт `test:visual`)

**Interfaces:**
- Consumes: `apps/docs/out/` (Tasks 10–11).
- Produces: `pnpm test:visual` (корень) — тесты в Docker-образе Playwright; `pnpm --filter docs test:visual:update` — обновить эталоны; `pnpm --filter docs test:visual` — запуск внутри Linux-контейнера (используется CI, Task 13).

- [ ] **Step 1: Поставить Playwright**

Run: `pnpm --filter docs add -D @playwright/test@1.64.0 @axe-core/playwright --save-exact`
Expected: в `apps/docs/package.json` — `"@playwright/test": "1.64.0"` без `^`.

- [ ] **Step 2: Статический сервер для out/**

`apps/docs/scripts/serve-out.mjs`:

```js
// Минимальный статический сервер для apps/docs/out (Next static export) — для Playwright.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../out/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  let file = normalize(join(root, decodeURIComponent(pathname)));
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    statSync(file);
  } catch {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(4173, '127.0.0.1', () => console.log('out/ → http://127.0.0.1:4173'));
```

- [ ] **Step 3: Конфиг и тесты**

`apps/docs/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Эталоны снимаются только в Linux-образе Playwright — суффикс платформы не нужен.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
  webServer: {
    command: 'node scripts/serve-out.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
```

`apps/docs/tests/pages.ts`:

```ts
/** Страницы docs-сайта и демо статики, которые проверяются скриншотами и axe. */
export const PAGES = [
  ['overview', '/'],
  ['tokens', '/tokens/'],
  ['css', '/css/'],
  ['recipes', '/recipes/'],
  ['static-demo', '/static-demo/demo/index.html'],
] as const;
```

`apps/docs/tests/visual.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { PAGES } from './pages.ts';

for (const [name, path] of PAGES) {
  test(`внешний вид: ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      // Демо внутри iframe снимается отдельной страницей static-demo.
      mask: [page.locator('iframe')],
    });
  });
}
```

`apps/docs/tests/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES } from './pages.ts';

for (const [name, path] of PAGES) {
  test(`доступность: ${name}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} эл.)`)).toEqual([]);
  });
}
```

- [ ] **Step 4: Запуск в Docker**

`apps/docs/scripts/visual-docker.mjs`:

```js
// Запускает скриншот- и a11y-тесты в официальном Linux-образе Playwright (шрифты рендерятся
// одинаково на любой машине). Репозиторий монтируется только для чтения исходников:
// внутри контейнера свои node_modules (бинарники Windows там не работают).
// --update — перезаписать эталоны в apps/docs/tests/__screenshots__.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const IMAGE = 'mcr.microsoft.com/playwright:v1.64.0-noble';
const PNPM = '10.34.6';
const update = process.argv.includes('--update');
const repo = fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\\/]$/, '');

const script = [
  'set -euo pipefail',
  'mkdir -p /work',
  'tar -C /src --exclude=node_modules --exclude=.turbo --exclude=dist --exclude=.next --exclude=out --exclude=.git --exclude=public/static-demo -cf - . | tar -C /work -xf -',
  'cd /work',
  `npm install -g pnpm@${PNPM} >/dev/null`,
  'pnpm install --frozen-lockfile',
  'pnpm turbo run build --filter=docs...',
  'cd apps/docs',
  `pnpm exec playwright test ${update ? '--update-snapshots' : ''} || { cp -r playwright-report test-results /src/apps/docs/ 2>/dev/null; exit 1; }`,
  ...(update
    ? ['rm -rf /src/apps/docs/tests/__screenshots__', 'cp -r tests/__screenshots__ /src/apps/docs/tests/']
    : []),
].join('\n');

const result = spawnSync(
  'docker',
  ['run', '--rm', '--ipc=host', '-v', `${repo}:/src`, IMAGE, 'bash', '-c', script],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
```

В `apps/docs/package.json` в `scripts` добавить:

```json
"test:visual": "playwright test",
"test:visual:docker": "node scripts/visual-docker.mjs",
"test:visual:update": "node scripts/visual-docker.mjs --update"
```

В корневой `package.json` в `scripts` добавить:

```json
"test:visual": "pnpm --filter docs test:visual:docker"
```

- [ ] **Step 5: Снять эталоны**

Run: `pnpm --filter docs test:visual:update`
Expected: Docker скачивает образ (первый раз — несколько минут), внутри собирается docs, `10 passed` (5 скриншотов + 5 проверок axe), в `apps/docs/tests/__screenshots__/` появились `overview.png`, `tokens.png`, `css.png`, `recipes.png`, `static-demo.png`.
Если упала проверка доступности — **исправить причину** (контраст → токены; структура → разметку страницы), а не отключать правило. Открыть все 5 PNG и посмотреть глазами: Montserrat, брендовые цвета, ничего не обрезано.

- [ ] **Step 6: Убедиться, что тесты стабильны**

Run: `pnpm test:visual`
Expected: `10 passed` без `--update` (эталоны совпадают при повторной сборке).

- [ ] **Step 7: Commit**

```bash
pnpm format
git add -A
git commit -m "test(docs): screenshot and axe tests in the Playwright Docker image"
```

---

### Task 13: CI в GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: корневые скрипты (Task 1), `pnpm --filter docs test:visual` (Task 12), `.nvmrc`.
- Produces: обязательные проверки на каждый push в `main` и PR: формат, сборка, типы, тесты, скриншоты + axe.

- [ ] **Step 1: Написать workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Формат, сборка, типы, тесты
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm turbo run build typecheck test

  visual:
    name: Скриншоты и доступность
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.64.0-noble
      options: --ipc=host
    steps:
      - uses: actions/checkout@v5
      - run: npm install -g pnpm@10.34.6
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=docs...
      - run: pnpm --filter docs test:visual
        env:
          CI: 'true'
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            apps/docs/playwright-report
            apps/docs/test-results
```

- [ ] **Step 2: Проверить локально то же, что делает job `check`**

Run: `pnpm install --frozen-lockfile && pnpm format:check && pnpm turbo run build typecheck test`
Expected: всё зелёное.

- [ ] **Step 3: Commit и push**

```bash
git add -A
git commit -m "ci: format, build, typecheck, tests and visual checks"
git push origin main
```

- [ ] **Step 4: Убедиться, что CI зелёный**

Run: `gh run watch --repo hpnssflw/mednet-kit --exit-status $(gh run list --repo hpnssflw/mednet-kit --workflow CI --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: обе задачи (`check`, `visual`) — success.
Если `visual` падает на расхождении скриншотов, а локально в Docker всё зелёное — скачать артефакт `playwright-report` (`gh run download`), посмотреть diff. Эталоны должны сниматься тем же образом `v1.64.0-noble`; другой версии Playwright быть не должно.

---

### Task 14: Релизный конвейер и первая публикация

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md`, `.changeset/initial-release.md`, `.github/workflows/release.yml`
- Modify: корневой `package.json` (скрипты changesets)

**Interfaces:**
- Consumes: собранные `@mednet/tokens`, `@mednet/css` (Tasks 5, 8); CI (Task 13).
- Produces: версия `0.1.0` обоих пакетов на npm; workflow, который на merge в `main` открывает Version PR, а после его merge публикует пакеты (единая версия, provenance).

> Шаги 5–8 выполняет **владелец** (учётные записи npm и GitHub): это публикация от его имени.

- [ ] **Step 1: Поставить Changesets и настроить**

Run: `pnpm add -Dw @changesets/cli`

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [["@mednet/*"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["docs"]
}
```

`.changeset/README.md`:

```markdown
# Changesets

Любое изменение пакета `@mednet/*` сопровождается changeset: `pnpm changeset`.
Все пакеты `@mednet/*` версионируются вместе (одна версия кита). Изменение бренда, ломающее внешний вид, — major.
```

`.changeset/initial-release.md`:

```markdown
---
'@mednet/tokens': minor
'@mednet/css': minor
---

Первый релиз: токены бренда ЦНИИОИЗ (палитра брендбука, семантика shadcn, тема Tailwind v4) и CSS-слой для сайтов без React (Basecoat Maia + Montserrat).
```

В корневой `package.json` в `scripts` добавить:

```json
"changeset": "changeset",
"version-packages": "changeset version && pnpm install --lockfile-only",
"release": "turbo run build --filter=./packages/* && changeset publish"
```

- [ ] **Step 2: Релизный workflow**

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: release-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write
  id-token: write # npm trusted publishing (OIDC) и provenance

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: npm install -g npm@latest # trusted publishing требует npm 11.5.1+
      - run: pnpm install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          version: pnpm version-packages
          publish: pnpm release
          title: 'Релиз пакетов @mednet/*'
          commit: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_CONFIG_PROVENANCE: 'true'
```

- [ ] **Step 3: Проверить конфигурацию changesets**

Run: `pnpm changeset status --verbose`
Expected: `@mednet/tokens` и `@mednet/css` — `minor` → будут `0.1.0`; `docs` не упоминается.

- [ ] **Step 4: Commit (без push)**

```bash
pnpm format
git add -A
git commit -m "ci: changesets release pipeline with fixed versioning"
```

- [ ] **Step 5 (владелец): Скоуп и лицензия**

1. Подтвердить лицензию **MIT** для пакетов (это публичный npm от имени организации). Если нужна другая — поменять поле `license` в `packages/*/package.json` и корневом `package.json` до публикации.
2. Войти на npmjs.com → **Add Organization** → имя `mednet` (бесплатный план, публичные пакеты).
3. Если имя занято — создать `cniioiz` и переименовать скоуп в репозитории:

```bash
git grep -l '@mednet/' -- packages apps package.json .changeset README.md | xargs sed -i 's#@mednet/#@cniioiz/#g'
sed -i 's#"@mednet/\*"#"@cniioiz/*"#' .changeset/config.json
pnpm install
pnpm turbo run build typecheck test
git add -A && git commit -m "chore: rename npm scope to @cniioiz"
```

- [ ] **Step 6 (владелец): Первая публикация вручную**

Trusted publisher на npm настраивается в настройках уже существующего пакета, поэтому первая версия публикуется локально:

```bash
npm login
pnpm version-packages           # 0.0.0 → 0.1.0, CHANGELOG.md, обновлённый lockfile
pnpm turbo run build test --filter=./packages/*
git add -A && git commit -m "chore: release 0.1.0"   # pnpm publish требует чистое дерево
pnpm --filter "./packages/*" publish --access public
git push origin main
```

Expected: на npm появились `@mednet/tokens@0.1.0` и `@mednet/css@0.1.0`; в опубликованном `package.json` `@mednet/css` нет строк `workspace:` (pnpm заменяет их сам).

- [ ] **Step 7 (владелец): Включить trusted publishing**

Для каждого пакета на npmjs.com: **Settings → Trusted Publisher → GitHub Actions**: owner `hpnssflw`, repository `mednet-kit`, workflow `release.yml`. После этого в **Settings → Publishing access** включить «Require two-factor authentication and disallow tokens».

- [ ] **Step 8: Проверить автоматический релиз**

1. `pnpm changeset` → выбрать оба пакета, `patch`, текст «Проверка автоматической публикации». Commit, push.
2. Workflow **Release** открывает PR «Релиз пакетов @mednet/*» → merge.
3. Workflow публикует `0.1.1`.

Expected: `npm view @mednet/tokens version` → `0.1.1`; на странице пакета на npmjs.com есть отметка provenance.
Если публикация падает на авторизации (`ENEEDAUTH` / `E401`) — значит, `pnpm publish` в этой версии не поддерживает OIDC. Запасной вариант: создать granular access token (только publish, только пакеты `@mednet/*`), добавить секрет `NPM_TOKEN` в репозиторий и в шаг `changesets/action` добавить `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`. Зафиксировать в спеке D14, что используется токен.

- [ ] **Step 9: Проверить CDN**

Run: `curl -sI https://cdn.jsdelivr.net/npm/@mednet/css@0/dist/mednet.min.css | head -1`
Expected: `HTTP/2 200`. Открыть в браузере страницу с двумя строками подключения из README `@mednet/css` — кнопка `<button class="btn">` должна быть брендовой.

---

## Вне этого плана (следующие этапы спеки §17)

- Этап 3: `@mednet/ui` (shadcn в стиле Maia), `@mednet/lint-config`, `llms.md`.
- Этап 4: фирменные блоки (Logo из `assets/brand/logo/`, Header, Footer…) и тест совпадения React/HTML.
- Этап 5: CLI `npm create @mednet/app`, шаблоны, AI-слой.
- Деплой docs-сайта и домен — отдельная задача (спека §1).
- Bebas Neue с кириллицей — спека Q6.
