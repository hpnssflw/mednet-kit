# Пилот, план A: `@mednet/ui`, `@mednet/lint-config`, страница `/ui` — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React-пакет `@mednet/ui` (весь набор shadcn/ui на Base UI в стиле Maia, в теме бренда, плюс логотип, шапка, подвал, каркасы `PublicLayout`/`AppShell` и `llms.md` для агентов), пакет `@mednet/lint-config` (ESLint + stylelint, защита бренда) и страница `/ui` docs-сайта, на которой Next проверяет собранный пакет со скриншотами и axe.

**Architecture:** Компоненты генерирует CLI `shadcn` прямо в `packages/ui/src/components` по `components.json` пакета (`style: "base-maia"`); всё, что кит меняет в сгенерированном коде, делает идемпотентный скрипт `scripts/postgen.mjs`, поэтому повторная генерация воспроизводима. Внутри пакета импорты идут через `imports` из `package.json` (`#components/*` → `src` для CLI и Vitest, `dist` для всех остальных); `tsc` собирает пофайлово в `dist` (ESM + `.d.ts`), `"use client"` сохраняется сам. Проект подключает одну строку CSS `@import '@mednet/ui/styles.css'` (Tailwind + тема `@mednet/tokens` + `@source` на `dist` пакета) и импортирует модули по подпутям `@mednet/ui/<модуль>`.

**Tech Stack:** shadcn CLI 4.21.4 (стиль `base-maia`), `@base-ui/react` 1.9, `cn` 0.4 (замена clsx + tailwind-merge), lucide-react, recharts 3.8, Tailwind CSS 4.3, TypeScript 6.0 (`tsc`, NodeNext), React 19.3, Next.js 16.4, Vitest 5 + Testing Library 16 + jsdom 30, svgo 4.1, ESLint 9 (пакет допускает 9 и 10) + eslint-config-next 16.4, stylelint 17, Playwright 1.64 (Docker) + @axe-core/playwright.

**Спецификации:** [пилот](../specs/2026-10-14-pilot-ui-template-cli-design.md) (дальше — «спека пилота»), [основная](../specs/2026-10-13-mednet-design-system-design.md) (дальше — «спека»). Проверенные факты, на которых стоит план: `.superpowers/sdd/2026-10-14-plan-a-prototype/facts.md`, `facts-lint.md`, `facts-render.md`, `facts-legacy.md` (локальные, не в git).

## Global Constraints

- Node `>=22.12` (локально 24.20), pnpm `10.34.6`, TypeScript `~6.0.3` — **не 7.x**, React `^19.3.0`, Next `^16.4.0`, Tailwind `^4.3.3`, Vitest `^5.0.4`.
- CLI shadcn — **ровно `4.21.4`** (devDependency `@mednet/ui`); стиль — **`base-maia`**, иконки — `lucide`. Основа примитивов — **Base UI**: в `@mednet/ui` нет зависимостей `radix-ui`, `@radix-ui/*`, `vaul`, `sonner`, `next-themes`. Смена элемента — проп `render`, **не** `asChild`.
- Сгенерированные файлы не правятся руками: `packages/ui/src/components/**`, `src/hooks/**`, `src/brand/logo/**`, `src/shadcn-tailwind.css`, `src/index.ts`. Любая правка — в генераторе (`scripts/postgen.mjs`, `gen-logos.mjs`, `gen-index.mjs`, `vendor-shadcn-css.mjs`). Сгенерированное исключено из Prettier.
- Внутри `@mednet/ui`: импорт соседних модулей пакета — `#components/<имя>`, `#hooks/<имя>`, `#lib/<имя>`; относительные импорты — с расширением `.js` (NodeNext). Подпути для потребителей — `@mednet/ui/<модуль>`.
- Рукописный код — в стиле репозитория (Prettier: одинарные кавычки, точки с запятой, ширина 100). Комментарии и тексты для людей — по-русски, идентификаторы — по-английски.
- Цвета — только из `@mednet/tokens` (семантические классы `bg-primary`, `text-muted-foreground`, `border-border`, `bg-field`…). Стандартная палитра Tailwind удалена темой токенов. Заливка полей ввода — `--field` (белый), не `--input` (это граница с контрастом 3:1).
- Новые пакеты `@mednet/ui` и `@mednet/lint-config` до плана B помечены `"private": true`: Version PR их версионирует, но `changeset publish` пропускает. Снимает `private` и публикует первую версию план B (по `docs/releasing.md`, раздел «Новый пакет»). Версия в `package.json` — текущая версия кита `0.1.1`.
- Правила `AGENTS.md`: ничего не публиковать, не создавать npm-токены, не мержить Version PR, не запускать `pnpm version-packages`; изменения в `packages/*` — с changeset.
- Скриншот- и a11y-тесты — только в Docker-образе `mcr.microsoft.com/playwright:v1.64.0-noble` (`pnpm test:visual`). Порт 4173 на машине автора занят другим проектом — Playwright локально вне Docker не запускать.
- Windows-машина автора: Vitest — с `pool: 'threads'` (с `forks` падает «Timeout waiting for worker to respond»).
- Браузеры (спека D18): Chrome/Edge 109+ (последние для Windows 7/8.1), Firefox 128+, Safari 16.4+. Chrome 109 ниже базовой линии Tailwind/Next/Base UI (111) — его держат плагин `@mednet/ui/postcss` и smoke-тест в Chromium 109 (Task 14).

---

## Карта файлов

```
.
├─ .prettierignore                                  Task 2, 3, 5, 8, 9 (сгенерированное, фикстуры)
├─ .gitignore                                       Task 8 (packages/ui/llms.md)
├─ .changeset/*.md                                  Task 11, 14, 15
├─ .github/workflows/ci.yml                         Task 14 (job chrome109)
├─ README.md AGENTS.md package.json                 Task 14, 15
├─ docs/superpowers/specs/*.md                      Task 1 (решения прототипа)
├─ docs/releasing.md                                Task 14
├─ packages/ui/
│  ├─ package.json tsconfig.json tsconfig.build.json components.json vitest.config.ts   Task 2 (+3, 5–8, 14)
│  ├─ LICENSE THIRD_PARTY_NOTICES.md README.md      Task 2, 8
│  ├─ postcss.cjs                                   Task 14  плагин для Chrome 109
│  ├─ scripts/clean.mjs vendor-shadcn-css.mjs       Task 2
│  ├─ scripts/postgen.mjs scripts/ru-labels.json    Task 3   импорт cn, русские подписи
│  ├─ scripts/gen-logos.mjs                         Task 5   SVG → TSX
│  ├─ scripts/gen-index.mjs build-llms.mjs check-dist.mjs, llms/*.md   Task 8
│  ├─ src/lib/utils.ts                              Task 2   cn с размерами бренда
│  ├─ src/styles.css src/shadcn-tailwind.css        Task 2
│  ├─ src/brand.css                                 Task 2 (описание), Task 4 (правила)
│  ├─ src/components/*.tsx src/hooks/use-mobile.ts  Task 3 (генерация)
│  ├─ src/brand/logo/*.tsx src/brand/logo.tsx       Task 5
│  ├─ src/brand/site-header.tsx site-footer.tsx     Task 6
│  ├─ src/layouts/skip-link.tsx public-layout.tsx app-shell.tsx   Task 7
│  ├─ src/index.ts                                  Task 8 (генерация)
│  └─ src/__tests__/*.test.ts(x), setup.ts          Tasks 2–8, 14
├─ packages/lint-config/                            Task 9, 10
├─ packages/css/
│  ├─ src/overrides.css                             Task 11  выравнивание под shadcn Maia
│  ├─ scripts/build.ts package.json README.md       Task 14  плагин для Chrome 109
│  └─ test/build.test.ts                            Task 11, 14
└─ apps/docs/
   ├─ package.json postcss.config.mjs app/globals.css app/layout.tsx   Task 12 (+14)
   ├─ app/(site)/… (перенос страниц), app/(site)/ui/   Task 12
   ├─ app/(demo)/ui/app-shell/ app/(demo)/ui/public-layout/   Task 12
   ├─ app/(demo)/parity/ public/parity/*.html       Task 13
   ├─ scripts/chrome109.mjs chrome109-docker.mjs    Task 14
   └─ tests/pages.ts ui.spec.ts parity.spec.ts parity-known.json __screenshots__/   Task 12, 13
```

---

### Task 1: Решения прототипа — в спеки

**Files:**
- Modify: `docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md`, `docs/superpowers/specs/2026-10-13-mednet-design-system-design.md`

**Interfaces:**
- Consumes: ничего.
- Produces: решения П8–П14, на которые ссылаются остальные задачи.

- [ ] **Step 1: Спека пилота — новые решения**

В таблицу «Решения пилота» после строки П7 добавить:

```markdown
| П8 | Основа примитивов — **Base UI**, стиль shadcn `base-maia` (не `radix-maia`); смена элемента — проп `render`, не `asChild` | shadcn сам рекомендует Base UI; вид Maia одинаковый; одна библиотека примитивов вместо двух (radix-стиль всё равно тянет Base UI для combobox); нет `vaul`, `sonner`, `next-themes`; есть `toast` |
| П9 | Код shadcn не правится руками: импорт `cn` и русские подписи — скрипт `postgen`, цвета бренда — `brand.css` поверх сгенерированных классов | Повторная генерация воспроизводима, `shadcn add --diff` показывает только апстрим |
| П10 | Примитивы — только npm-пакет `@mednet/ui`; блоки shadcn в проекте собираются на них через заглушки `components/ui/*` (реэкспорт) в шаблоне | CLI shadcn не умеет брать примитивы из npm-пакета (проверено); свой registry отдал бы каждому проекту копию примитивов |
| П11 | Montserrat подключает `@mednet/ui/styles.css` (`@fontsource/montserrat`) | `@mednet/tokens` только называет шрифт; без `@font-face` React-страницы шли системным шрифтом |
| П12 | Поддерживаемые браузеры: Chrome/Edge **109+** (последние для Windows 7/8.1), Firefox 128+, Safari 16.4+. Chrome 109 — ниже базовой линии Tailwind/Next/Base UI (111), поэтому: статические копии цветов и `var(--x, )` (плагин `@mednet/ui/postcss`, он же в сборке `@mednet/css`) и smoke-тест в Chromium 109 | В Chrome 109 без этого исчезали кольца фокуса (в т. ч. в опубликованном `mednet.min.css`), деструктивные кнопки становились сплошь красными, фон под диалогом — чёрным; JS работает |
| П13 | Эталон стиля Maia — сгенерированный shadcn; `@mednet/css` (Basecoat) выравнивается под него; совпадение React и статики проверяет тест паритета по вычисленным стилям (не по пикселям) | Пиксели расходятся на 3–12 % на тексте даже при совпадении всех стилей |
| П14 | `@mednet/lint-config`: ESLint 9 в шаблоне (пакет допускает 9 и 10), stylelint — только наши 3 правила, без `stylelint-config-standard`; пакет экспортирует `restrictedImports`/`restrictedSyntax` для расширения | Плагины `eslint-config-next` объявляют только ESLint 9; `standard` даёт ложные ошибки на Tailwind v4; своё правило проекта молча заменяет наше |
```

В разделе «1. `@mednet/ui`»:
- в пункте «Зависимости» заменить список на: «обычные — то, что ставит shadcn для `base-maia`: `@base-ui/react`, `cn`, `class-variance-authority`, `lucide-react`, `recharts` (для Chart), `cmdk`, `date-fns`, `react-day-picker`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `@shadcn/react`; плюс `@fontsource/montserrat`, `tw-animate-css`, `@mednet/tokens`»;
- в пункте «Импорт» дописать: «Плагин для Chrome 109 — `@mednet/ui/postcss`».

В разделе «3. Шаблон `templates/next`», пресет `tool`: заменить «`sonner`» на «уведомления `toast`».

- [ ] **Step 2: Основная спека**

В «Журнал решений» после D16 добавить:

```markdown
| D17 | Примитивы React — **Base UI** (shadcn `base-maia`), не Radix | Рекомендация shadcn, стабильный 1.x с ежемесячными релизами; вид Maia тот же; одна библиотека примитивов. Цена — проп `render` вместо `asChild` (правило в `llms.md` и lint) |
| D18 | Браузеры: Chrome/Edge 109+, Firefox 128+, Safari 16.4+ | Chrome 109 — последний для Windows 7/8.1; поддержка обеспечивается статическими копиями цветов (`@mednet/ui/postcss`) и smoke-тестом в Chromium 109 |
```

В D16 дописать в колонку «Почему»: «Эталон — сгенерированный shadcn Maia; Basecoat выравнивается под него (тест паритета, §14)».

В §7 «Основа»: первый пункт — «Полный набор shadcn/ui на Base UI (`shadcn add --all` в пакет, стиль `base-maia`)…»; в конце раздела добавить пункт «Цвета бренда в компонентах — `src/brand.css` поверх сгенерированных классов; сгенерированный код не правится руками (спека пилота П9)».

В §10 пункт «запрет прямого импорта `@radix-ui/*`» заменить на «запрет прямого импорта примитивов `@base-ui/*`, `radix-ui`, `@radix-ui/*` (только через `@mednet/ui`)».

В §14 в таблицу «Качество» добавить строки:

```markdown
| Паритет React ↔ статика | Playwright: вычисленные стили пар компонентов `@mednet/ui` и `@mednet/css` (покой, наведение, фокус), допуски ±0,5px и ±3/255; известные расхождения — в списке с причиной, устаревшая запись тоже валит тест | да |
| Chrome 109 | smoke-тест в Docker-образе Playwright 1.29.2 (Chromium 109): гидратация, кольца фокуса, полупрозрачные заливки, затемнение под диалогом | да |
```

В §19 «Риски» добавить строку:

```markdown
| Chrome 109 ниже базовой линии Tailwind, Next и Base UI (111) — обновление любой из них может молча сломать Windows 7/8.1 | smoke-тест в Chromium 109 в CI |
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs
git commit -m "docs(spec): pilot decisions from prototype — Base UI, brand.css, browsers, parity, lint"
```

---

### Task 2: `@mednet/ui` — каркас пакета, `cn`, стили

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/tsconfig.build.json`, `packages/ui/components.json`, `packages/ui/vitest.config.ts`, `packages/ui/LICENSE`, `packages/ui/THIRD_PARTY_NOTICES.md`, `packages/ui/scripts/clean.mjs`, `packages/ui/scripts/vendor-shadcn-css.mjs`, `packages/ui/src/lib/utils.ts`, `packages/ui/src/styles.css`, `packages/ui/src/brand.css` (пока только описание), `packages/ui/src/shadcn-tailwind.css` (генерируется), `packages/ui/src/__tests__/setup.ts`, `packages/ui/src/__tests__/utils.test.ts`, `packages/ui/src/__tests__/styles.test.ts`
- Modify: `.prettierignore`

**Interfaces:**
- Consumes: `@mednet/tokens` (workspace) — `theme.css` с семантическими цветами, `--text-h1…h4`, `--text-lead`, `--field`.
- Produces: пакет `@mednet/ui` в workspace; `cn(...inputs: ClassValue[]): string` из `#lib/utils` (подпуть `@mednet/ui/utils`); `src/styles.css` (подпуть `@mednet/ui/styles.css`); alias-импорты `#components/*`, `#hooks/*`, `#lib/*`; Vitest-конфиг с условием `mednet-source` (тесты видят исходники без сборки); скрипты `build`, `typecheck`, `test`, `vendor-css`.

- [ ] **Step 1: Создать `packages/ui/package.json`**

```json
{
  "name": "@mednet/ui",
  "version": "0.1.1",
  "private": true,
  "description": "React-компоненты ЦНИИОИЗ: shadcn/ui (Base UI, стиль Maia) в теме бренда, логотип, шапка, подвал, каркасы страниц",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/ui"
  },
  "sideEffects": ["**/*.css"],
  "files": [
    "dist",
    "src/styles.css",
    "src/brand.css",
    "src/shadcn-tailwind.css",
    "README.md",
    "THIRD_PARTY_NOTICES.md"
  ],
  "imports": {
    "#components/*": {
      "mednet-source": "./src/components/*.tsx",
      "default": "./dist/components/*.js"
    },
    "#hooks/*": {
      "mednet-source": "./src/hooks/*.ts",
      "default": "./dist/hooks/*.js"
    },
    "#lib/*": {
      "mednet-source": "./src/lib/*.ts",
      "default": "./dist/lib/*.js"
    }
  },
  "exports": {
    "./styles.css": "./src/styles.css",
    "./utils": {
      "types": "./dist/lib/utils.d.ts",
      "default": "./dist/lib/utils.js"
    },
    "./*": {
      "types": "./dist/components/*.d.ts",
      "default": "./dist/components/*.js"
    },
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "node scripts/clean.mjs && tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "vendor-css": "node scripts/vendor-shadcn-css.mjs"
  },
  "peerDependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.3.0"
  },
  "dependencies": {
    "@fontsource/montserrat": "^5.3.0",
    "@mednet/tokens": "workspace:*",
    "cn": "^0.4.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/node": "^4.3.3",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^24",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "jsdom": "30.1.2",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "shadcn": "4.21.4",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.3",
    "vitest": "^5.0.4"
  }
}
```

Почему так (проверено прототипом, не менять без причины):
- `imports` с условием `mednet-source` **первым ключом**: CLI shadcn пишет файлы туда, куда указывает цель алиаса, — первая цель ведёт его в `src`. TypeScript и Next это условие не знают и берут `default` (`dist`); TypeScript при этом сам сопоставляет `dist/*.js` с `src/*.tsx`, поэтому typecheck работает и до сборки. Vitest включает условие явно (Step 4). Вариант `{ "types": "./src/…" }` не годится — протекает в типы потребителей.
- `tw-animate-css`, `@mednet/tokens` и `@fontsource/montserrat` — `dependencies`, а не dev: их импортирует CSS пакета в проекте потребителя (pnpm строгий). Montserrat грузит сам `@mednet/ui`: `@mednet/tokens` только называет шрифт, без `@font-face` текст уходит в системный шрифт (проверено прототипом).
- `sideEffects: ["**/*.css"]` — JS без побочных эффектов (tree-shaking), CSS бандлер выбрасывать не должен.
- `"private": true` — до первой публикации в плане B (Global Constraints).

- [ ] **Step 2: Создать `tsconfig.json`, `tsconfig.build.json`, `components.json`, `scripts/clean.mjs`**

`packages/ui/tsconfig.json`:

```jsonc
{
  // Не наследует tsconfig.base.json: тот для пакетов без выпуска (noEmit, allowImportingTsExtensions),
  // а здесь tsc собирает dist. verbatimModuleSyntax выключен: shadcn смешивает типы и значения в импортах.
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src"]
}
```

`packages/ui/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/__tests__"]
}
```

`packages/ui/components.json` (`shadcn init` в пакете-библиотеке не работает — «could not detect a supported framework», поэтому файл пишется руками; `baseColor` обязателен по схеме, но не используется — тема из `@mednet/tokens`):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-maia",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "#components",
    "utils": "#lib/utils",
    "ui": "#components",
    "lib": "#lib",
    "hooks": "#hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle"
}
```

`packages/ui/scripts/clean.mjs`:

```js
// Чистый dist перед tsc: tsc не удаляет файлы модулей, которых больше нет в src.
import { rmSync } from 'node:fs';

rmSync(new URL('../dist', import.meta.url), { recursive: true, force: true });
```

- [ ] **Step 3: Лицензии**

Run: `cp packages/css/LICENSE packages/ui/LICENSE`

`packages/ui/THIRD_PARTY_NOTICES.md`:

````markdown
# Сторонний код

`@mednet/ui` содержит код, сгенерированный CLI [shadcn/ui](https://ui.shadcn.com) (стиль `base-maia`): компоненты в `dist/components/`, хук `dist/hooks/use-mobile.js` и копию `shadcn/dist/tailwind.css` в `src/shadcn-tailwind.css`. Кит меняет в нём импорт `cn` и подписи (`scripts/postgen.mjs`), а цвета перекрывает правилами `src/brand.css`. Лицензия shadcn/ui требует сохранять уведомление:

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
````

- [ ] **Step 4: Vitest**

`packages/ui/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // '#components/*' и др. → исходники src/ без сборки (условие из "imports" в package.json).
  resolve: { conditions: ['mednet-source'] },
  test: {
    environment: 'jsdom',
    // С пулом forks на Windows Vitest падает: «Timeout waiting for worker to respond».
    pool: 'threads',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

`packages/ui/src/__tests__/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// jsdom не реализует matchMedia, а useIsMobile (Sidebar) его вызывает.
// typeof window — файл подключается и к тестам с @vitest-environment node (brand, postcss).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

Run: `pnpm install`
Expected: зависимости `@mednet/ui` установлены, lockfile обновлён. Сообщение pnpm «Ignored build scripts: …» про пакеты из дерева `shadcn` — не трогать, CLI работает без них.

- [ ] **Step 5: Написать падающий тест `cn`**

`packages/ui/src/__tests__/utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cn } from '#lib/utils';

describe('cn', () => {
  it('размер шрифта бренда не вытесняет цвет', () => {
    expect(cn('text-foreground text-sm', 'text-h3')).toBe('text-foreground text-h3');
  });

  it('цвет не вытесняет размер шрифта бренда', () => {
    expect(cn('text-lead', 'text-muted-foreground')).toBe('text-lead text-muted-foreground');
  });

  it('конфликтующие утилиты по-прежнему сливаются', () => {
    expect(cn('px-2 py-1', 'px-4', false, undefined)).toBe('py-1 px-4');
  });
});
```

- [ ] **Step 6: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/ui test`
Expected: FAIL — `Failed to resolve import "#lib/utils"` (файла ещё нет).

- [ ] **Step 7: Реализовать `cn`**

`packages/ui/src/lib/utils.ts`:

```ts
import type { CnFunction } from 'cn';
import { createCn } from 'cn/config';

// cn (замена clsx + tailwind-merge от shadcn) не знает размеры шрифта бренда из @mednet/tokens:
// без расширения cn('text-foreground', 'text-h3') считает text-h3 цветом и выбрасывает text-foreground.
// Тип указан явно: без него tsc падает с TS2883 (тип cn нельзя назвать без ссылки на CnFunction).
export const cn: CnFunction = createCn({
  extend: { classGroups: { 'font-size': [{ text: ['lead', 'h1', 'h2', 'h3', 'h4'] }] } },
});
```

- [ ] **Step 8: Убедиться, что тест проходит**

Run: `pnpm --filter @mednet/ui test`
Expected: PASS, 3 теста.

- [ ] **Step 9: Стили — тест**

`packages/ui/src/__tests__/styles.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const styles = read('../styles.css');

describe('styles.css', () => {
  it('подключает Tailwind развёрнуто (бренд-правки до утилит), тему, анимации, shadcn, шрифт', () => {
    const imports = [...styles.matchAll(/@import '([^']+)'/g)].map((match) => match[1]);
    expect(imports).toEqual([
      'tailwindcss/theme.css',
      'tailwindcss/preflight.css',
      './brand.css',
      'tailwindcss/utilities.css',
      '@mednet/tokens/theme.css',
      'tw-animate-css',
      './shadcn-tailwind.css',
      '@fontsource/montserrat/500.css',
      '@fontsource/montserrat/600.css',
      '@fontsource/montserrat/700.css',
    ]);
    expect(styles).toContain("@import './brand.css' layer(utilities);");
  });

  it('сканирует dist пакета: Tailwind не смотрит в node_modules', () => {
    expect(styles).toContain("@source '../dist';");
  });

  it('копия shadcn/tailwind.css совпадает с установленным shadcn', () => {
    const vendored = read('../shadcn-tailwind.css');
    const original = read('../../node_modules/shadcn/dist/tailwind.css');
    expect(vendored.endsWith(original)).toBe(true);
  });
});
```

Run: `pnpm --filter @mednet/ui test`
Expected: FAIL — `ENOENT … styles.css`.

- [ ] **Step 10: Стили — реализация**

`packages/ui/scripts/vendor-shadcn-css.mjs`:

```js
// Копирует shadcn/dist/tailwind.css в src/: компонентам нужны его варианты (data-open, data-checked…),
// анимации аккордеона и утилиты, а тянуть CLI shadcn (~300 пакетов) в зависимости проекта незачем.
import { readFileSync, writeFileSync } from 'node:fs';

const shadcn = new URL('../node_modules/shadcn/', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('package.json', shadcn), 'utf8'));
const css = readFileSync(new URL('dist/tailwind.css', shadcn), 'utf8');
const header = `/* Копия shadcn@${version}/dist/tailwind.css (MIT, см. THIRD_PARTY_NOTICES.md). Обновляется pnpm vendor-css, не редактировать. */\n`;

writeFileSync(new URL('../src/shadcn-tailwind.css', import.meta.url), header + css);
console.log(`src/shadcn-tailwind.css ← shadcn@${version}`);
```

Run: `pnpm --filter @mednet/ui vendor-css`
Expected: `src/shadcn-tailwind.css ← shadcn@4.21.4`.

`packages/ui/src/styles.css`:

```css
/*
 * Стили @mednet/ui. Проекту достаточно одной строки в globals.css:
 *   @import '@mednet/ui/styles.css';
 * Tailwind подключён развёрнуто: бренд-правки (brand.css) должны стоять в слое utilities
 * раньше утилит Tailwind — тогда они перекрывают сгенерированный класс shadcn, но уступают
 * вариантам (hover:, aria-expanded:) и классам проекта. С обычным @import 'tailwindcss'
 * блок @layer utilities из этого файла попадает после утилит (проверено прототипом).
 */
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import './brand.css' layer(utilities);
@import 'tailwindcss/utilities.css' layer(utilities);

/* Тема бренда: палитра Tailwind удалена, цвета только из токенов. */
@import '@mednet/tokens/theme.css';
@import 'tw-animate-css';
@import './shadcn-tailwind.css';
/* Montserrat self-hosted (спека D11): в 500.css все подмножества с unicode-range — браузер качает только нужные. */
@import '@fontsource/montserrat/500.css';
@import '@fontsource/montserrat/600.css';
@import '@fontsource/montserrat/700.css';

/* Классы компонентов живут в dist пакета, а node_modules Tailwind сам не сканирует. */
@source '../dist';

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background font-sans text-foreground;
    /* текст 500 (спека §5), как body в @mednet/css */
    font-weight: var(--mn-font-weight-body);
  }
}
```

`packages/ui/src/brand.css` (правила добавит Task 4; пока только описание, чтобы импорт работал):

```css
/*
 * Бренд-правки shadcn Maia для React (зеркало packages/css/src/overrides.css).
 * Подключается в styles.css как `@import './brand.css' layer(utilities)` ДО утилит Tailwind.
 * Сгенерированные файлы shadcn не трогаем — `shadcn add <x> --diff` показывает только апстрим.
 */
```

- [ ] **Step 11: Исключить сгенерированное из Prettier**

В конец `.prettierignore` добавить:

```
# @mednet/ui: сгенерированный код не форматируется — так `shadcn add --diff` показывает только наши правки
packages/ui/src/components
packages/ui/src/hooks
packages/ui/src/shadcn-tailwind.css
```

- [ ] **Step 12: Проверить**

Run: `pnpm --filter @mednet/ui test && pnpm --filter @mednet/ui typecheck && pnpm format:check`
Expected: 6 тестов PASS; typecheck без ошибок; Prettier — «All matched files use Prettier code style!» (если ругается на новые файлы пакета — `pnpm prettier --write packages/ui` и повторить).

- [ ] **Step 13: Commit**

```bash
git add .prettierignore packages/ui pnpm-lock.yaml
git commit -m "feat(ui): @mednet/ui package scaffold, cn with brand font sizes, styles.css"
```

---

### Task 3: Генерация набора shadcn (base-maia) и сборка

**Files:**
- Create: `packages/ui/src/components/*.tsx` (CLI), `packages/ui/src/hooks/use-mobile.ts` (CLI), `packages/ui/scripts/postgen.mjs`, `packages/ui/scripts/ru-labels.json`, `packages/ui/src/__tests__/generated.test.ts`, `packages/ui/src/__tests__/modules.test.ts`
- Modify: `packages/ui/package.json` (зависимости от CLI, скрипт `generate`)

**Interfaces:**
- Consumes: Task 2 — `components.json`, `imports`, `#lib/utils`.
- Produces: модули `@mednet/ui/<имя>` для всех компонентов набора (`button`, `dialog`, `field`, `input`, `sidebar`, `tooltip`, `toast`, `chart`…), `#hooks/use-mobile`; `dist/components/*.js` + `.d.ts`; скрипт `pnpm generate` (повторная генерация + `postgen`); файл `scripts/ru-labels.json` — массив `[файл, английский текст, русский текст]`.

- [ ] **Step 1: Падающий тест инвариантов сгенерированного кода**

`packages/ui/src/__tests__/generated.test.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const components = new URL('../components/', import.meta.url);
const files = existsSync(components)
  ? readdirSync(components).filter((file) => file.endsWith('.tsx'))
  : [];
const source = (file: string) => readFileSync(new URL(file, components), 'utf8');
const labels: [string, string, string][] = JSON.parse(
  readFileSync(new URL('../../scripts/ru-labels.json', import.meta.url), 'utf8'),
);

describe('сгенерированные компоненты', () => {
  it('полный набор base-maia', () => {
    expect(files.length).toBeGreaterThanOrEqual(61);
    expect(files).toEqual(
      expect.arrayContaining([
        'button.tsx',
        'chart.tsx',
        'dialog.tsx',
        'field.tsx',
        'sidebar.tsx',
        'toast.tsx',
        'tooltip.tsx',
      ]),
    );
  });

  it.each(files)('%s: cn из своего lib/utils, импорты через #, без Radix', (file) => {
    const text = source(file);
    expect(text).not.toContain('from "cn"');
    expect(text).not.toMatch(/from "@\//);
    expect(text).not.toMatch(/from "(radix-ui|@radix-ui\/[^"]+|next-themes|vaul|sonner)"/);
  });

  it.each(labels)('%s: «%s» переведено', (file, en, ru) => {
    expect(source(file)).not.toContain(en);
    expect(source(file)).toContain(ru);
  });
});
```

`packages/ui/scripts/ru-labels.json` — подписи для экранного диктора и тексты по умолчанию, которые shadcn пишет по-английски (строки — ровно как в сгенерированном коде; найдены в прототипе):

```json
[
  ["breadcrumb.tsx", "aria-label=\"breadcrumb\"", "aria-label=\"Навигационная цепочка\""],
  ["breadcrumb.tsx", "<span className=\"sr-only\">More</span>", "<span className=\"sr-only\">Ещё</span>"],
  ["carousel.tsx", "<span className=\"sr-only\">Previous slide</span>", "<span className=\"sr-only\">Предыдущий слайд</span>"],
  ["carousel.tsx", "<span className=\"sr-only\">Next slide</span>", "<span className=\"sr-only\">Следующий слайд</span>"],
  ["command.tsx", "title = \"Command Palette\"", "title = \"Команды\""],
  ["command.tsx", "description = \"Search for a command to run...\"", "description = \"Найдите команду\""],
  ["dialog.tsx", "<span className=\"sr-only\">Close</span>", "<span className=\"sr-only\">Закрыть</span>"],
  ["message-scroller.tsx", "\"Scroll to end\" : \"Scroll to start\"", "\"Прокрутить в конец\" : \"Прокрутить в начало\""],
  ["pagination.tsx", "aria-label=\"pagination\"", "aria-label=\"Страницы\""],
  ["pagination.tsx", "text = \"Previous\"", "text = \"Назад\""],
  ["pagination.tsx", "aria-label=\"Go to previous page\"", "aria-label=\"Предыдущая страница\""],
  ["pagination.tsx", "text = \"Next\"", "text = \"Вперёд\""],
  ["pagination.tsx", "aria-label=\"Go to next page\"", "aria-label=\"Следующая страница\""],
  ["pagination.tsx", "<span className=\"sr-only\">More pages</span>", "<span className=\"sr-only\">Ещё страницы</span>"],
  ["questionnaire.tsx", "{children ?? \"Previous\"}", "{children ?? \"Назад\"}"],
  ["questionnaire.tsx", "{children ?? \"Skip\"}", "{children ?? \"Пропустить\"}"],
  ["questionnaire.tsx", "{children ?? \"Next\"}", "{children ?? \"Далее\"}"],
  ["questionnaire.tsx", "{children ?? \"Submit\"}", "{children ?? \"Отправить\"}"],
  ["sheet.tsx", "<span className=\"sr-only\">Close</span>", "<span className=\"sr-only\">Закрыть</span>"],
  ["sidebar.tsx", "<SheetTitle>Sidebar</SheetTitle>", "<SheetTitle>Меню</SheetTitle>"],
  ["sidebar.tsx", "<SheetDescription>Displays the mobile sidebar.</SheetDescription>", "<SheetDescription>Разделы приложения</SheetDescription>"],
  ["sidebar.tsx", "<span className=\"sr-only\">Toggle Sidebar</span>", "<span className=\"sr-only\">Показать или скрыть меню</span>"],
  ["sidebar.tsx", "aria-label=\"Toggle Sidebar\"", "aria-label=\"Показать или скрыть меню\""],
  ["sidebar.tsx", "title=\"Toggle Sidebar\"", "title=\"Показать или скрыть меню\""],
  ["spinner.tsx", "aria-label=\"Loading\"", "aria-label=\"Загрузка\""],
  ["toast.tsx", "aria-label=\"Close toast\"", "aria-label=\"Закрыть уведомление\""]
]
```

Run: `pnpm --filter @mednet/ui test`
Expected: FAIL — «полный набор base-maia»: `expected 0 to be greater than or equal to 61`.

- [ ] **Step 2: Пробный прогон CLI — куда он будет писать**

```bash
cd packages/ui
pnpm exec shadcn add style --dry-run
pnpm exec shadcn add button --dry-run
```

Expected: в плане файлов — `src/lib/utils.ts`, `src/styles.css` (для `style`) и `src/components/button.tsx` (на Windows `src\components\button.tsx`), ничего вида `@/…`, `dist/…` или путей в другие пакеты. **Если пути другие — остановиться**: с неверными алиасами CLI пишет в чужие папки (в прототипе — в соседний пакет workspace). Проверить `imports` в `package.json` и `aliases` в `components.json` по Task 2.

- [ ] **Step 3: Сгенерировать стиль и весь набор**

```bash
pnpm exec shadcn add style -y --overwrite
pnpm exec shadcn add --all -y --overwrite
git checkout -- src/lib/utils.ts src/styles.css
git status --short
```

- `add style` — базовый элемент стиля `base-maia`: ставит зависимости (`@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`…). Без него `add --all` молча не ставит зависимости. Он же перезаписывает `src/lib/utils.ts` и `src/styles.css` своими версиями — `git checkout` возвращает наши из Task 2.
- `add --all` идёт 1,5–7 минут (сеть).

Expected `git status`: новые `src/components/*.tsx` (61 файл или больше), `src/hooks/use-mobile.ts`, изменённые `package.json` и `../../pnpm-lock.yaml`. **Ничего вне `packages/ui` кроме lockfile.** Если CLI изменил `components.json` — вернуть: `git checkout -- components.json`.

- [ ] **Step 4: Привести зависимости к ожидаемому составу**

`dependencies` в `packages/ui/package.json` должны содержать ровно эти пакеты (версии CLI может поставить новее — оставить как поставил):

```json
"dependencies": {
  "@base-ui/react": "^1.9.0",
  "@fontsource/montserrat": "^5.3.0",
  "@mednet/tokens": "workspace:*",
  "@shadcn/react": "^0.3.1",
  "class-variance-authority": "^0.7.1",
  "cmdk": "^1.1.1",
  "cn": "^0.4.0",
  "date-fns": "^4.4.0",
  "embla-carousel-react": "^8.6.0",
  "input-otp": "^1.5.0",
  "lucide-react": "^1.56.0",
  "react-day-picker": "^10.0.2",
  "react-resizable-panels": "^4.14.5",
  "recharts": "3.8.0",
  "tw-animate-css": "^1.4.0"
}
```

- Если CLI перенёс `tw-animate-css` в `devDependencies`: `pnpm add tw-animate-css@^1.4.0` (из `packages/ui`).
- `shadcn` остаётся в `devDependencies` ровно `4.21.4`; если CLI переписал на `^4.21.4` — вернуть точную версию.
- Пакетов `radix-ui`, `@radix-ui/*`, `vaul`, `sonner`, `next-themes`, `clsx`, `tailwind-merge` быть не должно; если есть — `pnpm remove <пакет>`.
- `@shadcn/react` нужен AI-компонентам набора (`message-scroller`, `questionnaire`).

Добавить скрипт в `scripts`:

```json
"generate": "shadcn add --all -y --overwrite && node scripts/postgen.mjs"
```

- [ ] **Step 5: Правки поверх shadcn — `scripts/postgen.mjs`**

```js
// Правки поверх сгенерированного shadcn. Запуск: pnpm generate (вместе с генерацией)
// или node scripts/postgen.mjs. Идемпотентен: повторный запуск ничего не меняет.
// Падает, если правку применить не к чему: значит, shadcn поменял исходник — правку пересмотреть.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const components = new URL('../src/components/', import.meta.url);
/** @type {[string, string, string][]} [файл, английский текст, русский текст] */
const labels = JSON.parse(readFileSync(new URL('./ru-labels.json', import.meta.url), 'utf8'));
const files = readdirSync(components).filter((file) => file.endsWith('.tsx'));
const problems = [];
let changed = 0;

for (const file of new Set(labels.map(([target]) => target))) {
  if (!files.includes(file)) problems.push(`${file}: файла нет`);
}

for (const file of files) {
  const url = new URL(file, components);
  const before = readFileSync(url, 'utf8');
  let text = before;

  // 1. cn — из своего lib/utils: там размеры шрифта бренда (text-h1…h4, text-lead).
  text = text.replaceAll('import { cn } from "cn"', 'import { cn } from "#lib/utils"');

  // 2. Подписи для экранного диктора и тексты по умолчанию — по-русски.
  for (const [target, en, ru] of labels) {
    if (target !== file) continue;
    if (text.includes(en)) text = text.replaceAll(en, ru);
    else if (!text.includes(ru)) problems.push(`${file}: не найдено ${en}`);
  }

  if (text !== before) {
    writeFileSync(url, text);
    changed += 1;
  }
}

console.log(`postgen: изменено файлов — ${changed} из ${files.length}`);
if (problems.length > 0) {
  console.error(`postgen: правки не применились:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
```

Run (из `packages/ui`): `node scripts/postgen.mjs && node scripts/postgen.mjs`
Expected: первый запуск — `postgen: изменено файлов — N из 61` (N ≈ 57), без ошибок; второй — `изменено файлов — 0 из 61`.

- [ ] **Step 6: Тест инвариантов проходит**

Run: `pnpm --filter @mednet/ui test`
Expected: PASS (`generated.test.ts` — 1 + 61 + 26 тестов, остальные — как раньше).

- [ ] **Step 7: Тест сборки — падающий**

`packages/ui/src/__tests__/modules.test.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const src = new URL('../components/', import.meta.url);
const dist = new URL('../../dist/components/', import.meta.url);
const names = readdirSync(src)
  .filter((file) => file.endsWith('.tsx'))
  .map((file) => file.slice(0, -'.tsx'.length));

describe('сборка компонентов', () => {
  it.each(names)('%s: есть .js и .d.ts, "use client" сохранён', (name) => {
    const tsx = readFileSync(new URL(`${name}.tsx`, src), 'utf8');
    const js = readFileSync(new URL(`${name}.js`, dist), 'utf8');
    expect(existsSync(new URL(`${name}.d.ts`, dist))).toBe(true);
    expect(js.startsWith('"use client";')).toBe(tsx.startsWith('"use client"'));
  });

  it.each(names)('%s: модуль выполняется', async (name) => {
    const module: Record<string, unknown> = await import(`#components/${name}`);
    expect(Object.keys(module).length).toBeGreaterThan(0);
  });
});
```

Run: `pnpm --filter @mednet/ui test`
Expected: FAIL — `ENOENT … dist/components/accordion.js` (сборки ещё нет).

- [ ] **Step 8: Собрать**

Run: `pnpm --filter @mednet/ui build`
Expected: `tsc` без ошибок за 30–60 с; `dist/components/*.js` + `*.d.ts`, `dist/hooks/use-mobile.*`, `dist/lib/utils.*`.

Если `tsc` падает в сгенерированном файле — не править файл руками: правка (если без неё не обойтись) добавляется в `postgen.mjs` с комментарием, почему.

- [ ] **Step 9: Тесты и типы проходят**

Run: `pnpm --filter @mednet/ui test && pnpm --filter @mednet/ui typecheck`
Expected: PASS. Если какой-то модуль падает при выполнении в jsdom из-за отсутствующего API браузера (`ResizeObserver`, `IntersectionObserver`), добавить заглушку в `src/__tests__/setup.ts` по образцу `matchMedia` (под той же проверкой `typeof window !== 'undefined'`) с комментарием, какой модуль её требует.

- [ ] **Step 10: Commit**

```bash
cd ../..
pnpm format:check
git add packages/ui pnpm-lock.yaml
git commit -m "feat(ui): generate full shadcn base-maia set, postgen (cn, Russian a11y labels)"
```

---

### Task 4: Бренд-правки компонентов — `brand.css`

**Files:**
- Modify: `packages/ui/src/brand.css`
- Create: `packages/ui/src/__tests__/brand.test.ts`

**Interfaces:**
- Consumes: `src/styles.css` (Task 2: `brand.css` в слое `utilities` до утилит), сгенерированные классы shadcn (Task 3): у полей — `border-input` и `bg-input/30`, у кнопки — `group/button`, у бейджа — `group/badge`, у контурной кнопки — `hover:bg-input/50`, у основной — `hover:bg-primary/80`, у бейджа-ссылки — `[a]:hover:bg-primary/80`.
- Produces: правила бренда в React: заливка полей, контурных кнопки и бейджа — `--field` (белый); подсветка контурной кнопки при наведении — `--muted`; наведение на основную кнопку и бейдж-ссылку — `--primary-hover` (#a55551, белый текст 5.23:1; у Maia `primary/80` даёт 3.20:1 — меньше AA).

Почему CSS, а не правка сгенерированных файлов (проверено прототипом): файлы shadcn остаются нетронутыми, и `shadcn add <x> --diff` показывает только апстрим. Ключ — **сгенерированные классы**, не `data-slot`: в Base UI при `render={<Button variant="outline" />}` у `DialogTrigger` побеждает `data-slot="dialog-trigger"`, а классы кнопки сохраняются. `[class~="…"]` совпадает с целым классом, `/` экранировать не надо. Специфичность правил полей — ровно (0,2,0): бьёт утилиту `bg-input/30` (0,1,0), уступает вариантам (`hover:`, `aria-expanded:`) и классам проекта — они идут позже в том же слое; если проект задал свой `bg-…`, `cn()` выкидывает `bg-input/30`, и правило перестаёт совпадать.

- [ ] **Step 1: Падающий тест**

`packages/ui/src/__tests__/brand.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';
import { beforeAll, describe, expect, it } from 'vitest';

const styles = new URL('../styles.css', import.meta.url);
let css = '';

beforeAll(async () => {
  const compiler = await compile(readFileSync(styles, 'utf8'), {
    base: fileURLToPath(new URL('../', import.meta.url)),
    onDependency: () => {},
  });
  // Классы, которые ставят сгенерированные компоненты, — как будто Tailwind нашёл их в dist.
  // Кавычки в селекторах приводим к одинарным — как в исходнике после Prettier.
  css = compiler
    .build([
      'bg-input/30',
      'hover:bg-input/50',
      'hover:bg-primary/80',
      '[a]:hover:bg-primary/80',
      'aria-expanded:bg-muted',
      'border-input',
      // Проверка палитры: стандартной шкалы slate нет, red — брендовая.
      'bg-slate-500',
      'bg-red-500',
    ])
    .replaceAll('"', "'");
});

/** Тело правила по началу селектора: [class~='border-input'] и т. п. */
const rule = (selectorStart: string) => {
  const start = css.indexOf(selectorStart);
  expect(start, selectorStart).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start) + 1);
};

describe('brand.css', () => {
  it('поля, контурные кнопка и бейдж заливаются --field, а не серым --input', () => {
    expect(rule(":is([class~='border-input']")).toContain('background-color: var(--field)');
  });

  it('правило полей стоит в слое utilities до утилиты bg-input/30 и до вариантов', () => {
    const utilities = css.indexOf('@layer utilities');
    const brand = css.indexOf(":is([class~='border-input']");
    const generated = css.indexOf('.bg-input\\/30');
    const variant = css.indexOf('.aria-expanded\\:bg-muted');
    expect(utilities).toBeGreaterThan(-1);
    expect(brand).toBeGreaterThan(utilities);
    expect(generated).toBeGreaterThan(brand);
    expect(variant).toBeGreaterThan(brand);
  });

  it('контурная кнопка при наведении — --muted', () => {
    expect(rule("[class~='group/button'][class~='hover:bg-input/50']:hover")).toContain(
      'background-color: var(--muted)',
    );
  });

  it('основная кнопка и бейдж-ссылка при наведении — --primary-hover', () => {
    expect(rule("[class~='group/button'][class~='hover:bg-primary/80']:hover")).toContain(
      'background-color: var(--primary-hover)',
    );
    expect(css).toContain("[class~='group/badge'][class~='[a]:hover:bg-primary/80']:is(a):hover");
  });

  it('палитры Tailwind в итоговом CSS нет — только токены', () => {
    expect(css).not.toContain('.bg-slate-500');
    expect(css).toMatch(/\.bg-red-500\s*\{\s*background-color:\s*var\(--mn-red-500\)/);
    expect(css).toContain('--primary: var(--mn-primary)');
  });
});
```

Run: `pnpm --filter @mednet/ui test brand`
Expected: FAIL — `expected -1 to be greater than -1` (правил ещё нет).

- [ ] **Step 2: Правила**

`packages/ui/src/brand.css` целиком:

```css
/*
 * Бренд-правки shadcn Maia для React (зеркало packages/css/src/overrides.css).
 * Подключается в styles.css как `@import './brand.css' layer(utilities)` ДО утилит Tailwind.
 * Сгенерированные файлы shadcn не трогаем — `shadcn add <x> --diff` показывает только апстрим.
 *
 * Ключ — сгенерированные классы ([class~='…'] = целое слово, «/» не экранируется), НЕ data-slot:
 * в Base UI при render={<Button />} у DialogTrigger/DialogClose/… побеждает data-slot внешней
 * части ('dialog-trigger'), а классы кнопки сохраняются. Маркеры: поля — border-input,
 * кнопка — group/button, бейдж — group/badge.
 *
 * Не трогаем (как статика): дорожку Switch и разделитель ButtonGroup (bg-input), поиск
 * в Command и в списке Combobox (белое на белом исчезнет), dark:* (тёмной темы в v1 нет, D15).
 */

/*
 * Заливка полей, контурных кнопки и бейджа: --input (графитовая граница 3:1, 30 %) → --field (белый).
 * Специфичность (0,2,0): бьёт утилиту bg-input/30 (0,1,0), уступает вариантам hover:, aria-expanded:
 * и классам проекта (они позже в том же слое). Свой bg-… проекта cn() не пропустит вместе с bg-input/30.
 */
:is([class~='border-input'], [class~='group/button'], [class~='group/badge'])[class~='bg-input/30']:where(
    :not([data-slot='command-input-wrapper'] *, [data-slot='combobox-content'] *)
  ) {
  background-color: var(--field);
}

@media (hover: hover) {
  /* Контурная кнопка при наведении: --input 50 % → --muted; (0,3,0) бьёт hover:bg-input/50. */
  [class~='group/button'][class~='hover:bg-input/50']:hover {
    background-color: var(--muted);
  }

  /*
   * Основная кнопка и бейдж-ссылка при наведении: Maia даёт primary/80 — белый текст 3.20:1, меньше AA.
   * Токен --primary-hover (#a55551) — 5.23:1.
   */
  [class~='group/button'][class~='hover:bg-primary/80']:hover,
  [class~='group/badge'][class~='[a]:hover:bg-primary/80']:is(a):hover {
    background-color: var(--primary-hover);
  }
}
```

- [ ] **Step 3: Тест проходит**

Run: `pnpm --filter @mednet/ui test brand`
Expected: PASS — 5 тестов. Если тест «до утилиты» падает, значит, `styles.css` подключает Tailwind одной строкой `@import 'tailwindcss'` — вернуть развёрнутый вариант из Task 2. Как правила выглядят в браузере (белые поля, `--muted` и `--primary-hover` при наведении, синее кольцо фокуса и красная граница `aria-invalid` сохраняются), проверяют тесты страницы `/ui` (Task 12) и паритета (Task 13).

- [ ] **Step 4: Commit**

```bash
pnpm format:check
git add packages/ui
git commit -m "feat(ui): brand.css — white field fill, muted outline hover, accessible primary hover"
```

---

### Task 5: `Logo` — генератор из SVG и компонент

**Files:**
- Create: `packages/ui/scripts/gen-logos.mjs`, `packages/ui/src/brand/logo/logo-horizontal.tsx`, `logo-vertical.tsx`, `logo-mark.tsx` (генерируются), `packages/ui/src/brand/logo.tsx`, `packages/ui/src/__tests__/logo.test.tsx`
- Modify: `packages/ui/package.json` (devDependency `svgo`, скрипт `logos`, экспорт `./logo`), `.prettierignore`

**Interfaces:**
- Consumes: `assets/brand/logo/logo-{horizontal,vertical,mark}.svg`.
- Produces: `@mednet/ui/logo` → `Logo({ variant?: 'horizontal' | 'vertical' | 'mark', title?: string, ...SVGProps<SVGSVGElement> })`, `LogoHorizontal`, `LogoVertical`, `LogoMark` (те же пропсы без `variant`), тип `LogoProps`. Серверный компонент (без `"use client"`): `useId` есть в серверной сборке React.

- [ ] **Step 1: Падающий тест**

`packages/ui/src/__tests__/logo.test.tsx`:

```tsx
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '../brand/logo.js';

const VARIANTS = ['horizontal', 'vertical', 'mark'] as const;

describe('Logo', () => {
  it('по умолчанию декоративный', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('с title — изображение с доступным именем', () => {
    render(<Logo variant="mark" title="ЦНИИОИЗ" />);
    expect(screen.getByRole('img', { name: 'ЦНИИОИЗ' })).toBeInTheDocument();
  });

  it('id не повторяются, даже если логотип дважды на странице', () => {
    const { container } = render(
      <>
        <Logo variant="vertical" />
        <Logo variant="vertical" />
      </>,
    );
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(VARIANTS)('%s: размер задаётся классом, а не атрибутами', (variant) => {
    const { container } = render(<Logo variant={variant} className="h-8 w-auto" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-8', 'w-auto');
    expect(svg).not.toHaveAttribute('width');
    expect(svg).toHaveAttribute('viewBox');
  });

  it('файлы логотипа совпадают с выводом генератора', () => {
    const out = mkdtempSync(join(tmpdir(), 'mednet-logo-'));
    const script = fileURLToPath(new URL('../../scripts/gen-logos.mjs', import.meta.url));
    execFileSync(process.execPath, [script, out]);
    for (const variant of VARIANTS) {
      const file = `logo-${variant}.tsx`;
      const committed = readFileSync(new URL(`../brand/logo/${file}`, import.meta.url), 'utf8');
      expect(readFileSync(join(out, file), 'utf8')).toBe(committed);
    }
  });
});
```

Run: `pnpm --filter @mednet/ui test logo`
Expected: FAIL — `Failed to resolve import "../brand/logo.js"`.

- [ ] **Step 2: Генератор**

Run (из `packages/ui`): `pnpm add -D svgo@4.1.0`

`packages/ui/scripts/gen-logos.mjs` (svgo 4 + маленький сериализатор в JSX; SVGR не берём: он даёт статичные id — два одинаковых логотипа на странице конфликтуют по `clipPath`, — и тянет `@babel/core`):

```js
// Логотип: SVG из assets/brand/logo → TSX в src/brand/logo (результат коммитится).
// Запуск: pnpm logos (или node scripts/gen-logos.mjs [папка-вывода] — так его вызывает тест).
// Id внутри SVG (clipPath, use) получают префикс из useId(): логотипы на одной странице не конфликтуют.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const SOURCE = new URL('../../../assets/brand/logo/', import.meta.url);
const OUT = process.argv[2] ?? fileURLToPath(new URL('../src/brand/logo/', import.meta.url));
// Варианты спеки §7; logo-horizontal-minzdrav.svg в набор не входит.
const FILES = ['logo-horizontal.svg', 'logo-vertical.svg', 'logo-mark.svg'];
const UID = '__uid__'; // временный префикс id, в TSX заменяется на useId()
const ALLOWED_TAGS = new Set(['svg', 'g', 'path', 'defs', 'clipPath', 'use', 'circle', 'rect', 'polygon', 'ellipse']);

const pascal = (name) => name.replace(/(^|-)(\w)/g, (_, __, char) => char.toUpperCase());
// Атрибуты SVG → пропсы React; aria-* и data-* остаются как есть.
const prop = (name) =>
  name === 'class'
    ? 'className'
    : /^(aria|data)-/.test(name)
      ? name
      : name.replace(/[-:]([a-z])/g, (_, char) => char.toUpperCase());

function toJsx(svg) {
  if (/<style|style=/.test(svg)) throw new Error('style не поддерживается: доработайте генератор');
  for (const [, tag] of svg.matchAll(/<([a-zA-Z]+)/g)) {
    if (!ALLOWED_TAGS.has(tag)) throw new Error(`неожиданный тег <${tag}>`);
  }
  const viewBox = svg.match(/<svg[^>]*\sviewBox="([^"]+)"/)[1];
  const body = svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .replace(/\s([a-zA-Z:-]+)="([^"]*)"/g, (_, name, value) => {
      const jsx = value.includes(UID) ? `{\`${value.replaceAll(UID, '${uid}')}\`}` : `"${value}"`;
      return ` ${prop(name)}=${jsx}`;
    })
    .replace(/<(\w+)([^>]*)><\/\1>/g, '<$1$2 />');
  return { viewBox, body };
}

for (const file of FILES) {
  const name = file.replace(/\.svg$/, '');
  const svg = await readFile(new URL(file, SOURCE), 'utf8');
  const { data } = optimize(svg, {
    multipass: true,
    plugins: [
      'preset-default', // svgo 4 больше не удаляет viewBox и title
      'removeXlink', // xlink:href → href
      'removeDimensions', // без width/height: размер задаёт CSS
      { name: 'removeAttrs', params: { attrs: ['data-text'] } }, // мусор извлечения из PDF
      { name: 'prefixIds', params: { prefix: UID, delim: '' } },
    ],
  });
  const { viewBox, body } = toJsx(data);
  const component = pascal(name);
  const tsx = `// Сгенерировано scripts/gen-logos.mjs из assets/brand/logo/${file}, не редактировать.
import { useId, type SVGProps } from "react";

export interface ${component}Props extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Доступное имя. Без него логотип декоративный (aria-hidden). */
  title?: string;
}

export function ${component}({ title, ...props }: ${component}Props) {
  const uid = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${viewBox}"
      role={title ? "img" : undefined}
      aria-labelledby={title ? \`\${uid}title\` : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title id={\`\${uid}title\`}>{title}</title> : null}
      ${body}
    </svg>
  );
}
`;
  await writeFile(join(OUT, `${name}.tsx`), tsx);
  console.log(`${file}: ${svg.length} Б svg → ${tsx.length} Б tsx`);
}
```

В `package.json` пакета добавить скрипт `"logos": "node scripts/gen-logos.mjs"`.

Run (из `packages/ui`): `mkdir -p src/brand/logo && pnpm logos`
Expected:

```
logo-horizontal.svg: 53376 Б svg → ~28100 Б tsx
logo-vertical.svg: 15327 Б svg → ~5200 Б tsx
logo-mark.svg: 810 Б svg → ~1250 Б tsx
```

Генератор падает с понятной ошибкой на `<style>`, `style=` и незнакомых тегах — так новый исходник не сконвертируется молча неправильно.

- [ ] **Step 3: Компонент `Logo`**

`packages/ui/src/brand/logo.tsx`:

```tsx
import type { SVGProps } from 'react';
import { LogoHorizontal } from './logo/logo-horizontal.js';
import { LogoMark } from './logo/logo-mark.js';
import { LogoVertical } from './logo/logo-vertical.js';

const VARIANTS = { horizontal: LogoHorizontal, vertical: LogoVertical, mark: LogoMark } as const;

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** horizontal — знак, «ЦНИИОИЗ» и дескриптор; vertical — знак и «ЦНИИОИЗ»; mark — только знак. */
  variant?: keyof typeof VARIANTS;
  /** Доступное имя («ЦНИИОИЗ»). Не нужно, если логотип внутри ссылки с aria-label. */
  title?: string;
}

/** Логотип ЦНИИОИЗ. Размер — классом высоты: `className="h-10 w-auto"`. */
export function Logo({ variant = 'horizontal', ...props }: LogoProps) {
  const Variant = VARIANTS[variant];
  return <Variant {...props} />;
}

// Отдельные варианты: в клиентском компоненте импорт одного варианта не тянет остальные.
export { LogoHorizontal, LogoMark, LogoVertical };
```

В `exports` пакета **перед** `"./*"` добавить:

```json
"./logo": {
  "types": "./dist/brand/logo.d.ts",
  "default": "./dist/brand/logo.js"
},
```

В `.prettierignore` к блоку `@mednet/ui` добавить строку `packages/ui/src/brand/logo`.

- [ ] **Step 4: Тест проходит**

Run: `pnpm --filter @mednet/ui test logo && pnpm --filter @mednet/ui typecheck`
Expected: PASS — 7 тестов; typecheck без ошибок.

- [ ] **Step 5: Commit**

```bash
pnpm format:check
git add .prettierignore packages/ui pnpm-lock.yaml
git commit -m "feat(ui): Logo generated from brand SVGs (svgo, runtime-unique ids)"
```

---

### Task 6: `SiteHeader` и `SiteFooter`

**Files:**
- Create: `packages/ui/src/brand/site-header.tsx`, `packages/ui/src/brand/site-footer.tsx`, `packages/ui/src/__tests__/site.test.tsx`
- Modify: `packages/ui/package.json` (экспорты `./site-header`, `./site-footer`)

**Interfaces:**
- Consumes: `Logo` из `./logo.js` (Task 5), `cn` из `#lib/utils` (Task 2).
- Produces:
  - `@mednet/ui/site-header` → `SiteHeader({ homeHref?: string = '/', nav?: ReactNode, actions?: ReactNode, ...ComponentProps<'header'> без children })`, тип `SiteHeaderProps`;
  - `@mednet/ui/site-footer` → `SiteFooter({ orgName?, copyright?, phone?: string | null, email?: string | null, year?: number, links?: ReactNode, ...ComponentProps<'footer'> без children })`, тип `SiteFooterProps`, константа `CNIIOIZ` (`fullName`, `shortName`, `phone`, `email`).
  Оба — серверные компоненты.

- [ ] **Step 1: Падающий тест**

`packages/ui/src/__tests__/site.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CNIIOIZ, SiteFooter } from '../brand/site-footer.js';
import { SiteHeader } from '../brand/site-header.js';

describe('SiteHeader', () => {
  it('логотип ведёт на главную, навигация и действия на месте', () => {
    render(
      <SiteHeader
        homeHref="/start"
        nav={<a href="/about">О нас</a>}
        actions={<button type="button">Войти</button>}
      />,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ЦНИИОИЗ — на главную' })).toHaveAttribute(
      'href',
      '/start',
    );
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toContainElement(
      screen.getByRole('link', { name: 'О нас' }),
    );
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('без nav нет пустого ориентира навигации', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'ЦНИИОИЗ — на главную' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('SiteFooter', () => {
  it('реквизиты ЦНИИОИЗ по умолчанию', () => {
    render(<SiteFooter year={2026} />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(CNIIOIZ.fullName);
    expect(footer).toHaveTextContent('© 2026 ФГБУ «ЦНИИОИЗ» Минздрава России');
    expect(screen.getByRole('link', { name: '+7 (495) 618-31-83' })).toHaveAttribute(
      'href',
      'tel:+74956183183',
    );
    expect(screen.getByRole('link', { name: 'mail@mednet.ru' })).toHaveAttribute(
      'href',
      'mailto:mail@mednet.ru',
    );
  });

  it('год по умолчанию — текущий', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`© ${new Date().getFullYear()}`);
  });

  it('реквизиты переопределяются и скрываются, ссылки — отдельный ориентир', () => {
    render(
      <SiteFooter
        orgName="Проектный офис"
        phone={null}
        email="office@example.ru"
        links={<a href="/privacy">Политика конфиденциальности</a>}
      />,
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Проектный офис');
    expect(screen.queryByRole('link', { name: /\+7/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'office@example.ru' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Дополнительные ссылки' })).toContainElement(
      screen.getByRole('link', { name: 'Политика конфиденциальности' }),
    );
  });
});
```

Run: `pnpm --filter @mednet/ui test site`
Expected: FAIL — `Failed to resolve import "../brand/site-footer.js"`.

- [ ] **Step 2: Реализация**

`packages/ui/src/brand/site-header.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '#lib/utils';
import { Logo } from './logo.js';

export interface SiteHeaderProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** Адрес главной страницы — ссылка на логотипе. */
  homeHref?: string;
  /** Пункты основной навигации: ссылки (`<a>` или `next/link`). */
  nav?: ReactNode;
  /** Действия справа: кнопки, вход, профиль. */
  actions?: ReactNode;
}

/** Шапка сайта: логотип ЦНИИОИЗ, основная навигация, действия. */
export function SiteHeader({ homeHref = '/', nav, actions, className, ...props }: SiteHeaderProps) {
  return (
    <header
      data-slot="site-header"
      className={cn('border-b border-border bg-background', className)}
      {...props}
    >
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
        <a
          href={homeHref}
          aria-label="ЦНИИОИЗ — на главную"
          className="shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Logo variant="horizontal" className="hidden h-11 w-auto sm:block" />
          <Logo variant="mark" className="h-9 w-auto sm:hidden" />
        </a>
        {nav ? (
          <nav
            aria-label="Основная навигация"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium"
          >
            {nav}
          </nav>
        ) : null}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
```

`packages/ui/src/brand/site-footer.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '#lib/utils';
import { Logo } from './logo.js';

/** Реквизиты по умолчанию — как в подвале mednet.ru (сверено 2026-10-14). */
export const CNIIOIZ = {
  fullName:
    'Центральный научно-исследовательский институт организации и информатизации здравоохранения Минздрава России',
  shortName: 'ФГБУ «ЦНИИОИЗ» Минздрава России',
  phone: '+7 (495) 618-31-83',
  email: 'mail@mednet.ru',
} as const;

export interface SiteFooterProps extends Omit<ComponentProps<'footer'>, 'children'> {
  /** Полное наименование организации. */
  orgName?: string;
  /** Правообладатель в строке «©». */
  copyright?: string;
  /** Телефон; `null` — не показывать. */
  phone?: string | null;
  /** Электронная почта; `null` — не показывать. */
  email?: string | null;
  /** Год в строке «©»; по умолчанию текущий (при static export — год сборки). */
  year?: number;
  /** Дополнительные ссылки: политика конфиденциальности, карта сайта… */
  links?: ReactNode;
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Подвал сайта с реквизитами ЦНИИОИЗ (переопределяются пропсами). */
export function SiteFooter({
  orgName = CNIIOIZ.fullName,
  copyright = CNIIOIZ.shortName,
  phone = CNIIOIZ.phone,
  email = CNIIOIZ.email,
  year = new Date().getFullYear(),
  links,
  className,
  ...props
}: SiteFooterProps) {
  return (
    <footer
      data-slot="site-footer"
      className={cn('border-t border-border bg-muted text-sm text-muted-foreground', className)}
      {...props}
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr_auto] md:items-start">
        <Logo variant="mark" className="h-10 w-auto" />
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{orgName}</p>
          {phone || email ? (
            <p className="flex flex-wrap gap-x-6 gap-y-1">
              {phone ? (
                <a href={telHref(phone)} className="hover:text-foreground">
                  {phone}
                </a>
              ) : null}
              {email ? (
                <a href={`mailto:${email}`} className="hover:text-foreground">
                  {email}
                </a>
              ) : null}
            </p>
          ) : null}
          <p>
            © {year} {copyright}
          </p>
        </div>
        {links ? (
          <nav aria-label="Дополнительные ссылки" className="flex flex-col gap-2">
            {links}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
```

В `exports` пакета перед `"./*"` добавить:

```json
"./site-header": {
  "types": "./dist/brand/site-header.d.ts",
  "default": "./dist/brand/site-header.js"
},
"./site-footer": {
  "types": "./dist/brand/site-footer.d.ts",
  "default": "./dist/brand/site-footer.js"
},
```

- [ ] **Step 3: Тест проходит**

Run: `pnpm --filter @mednet/ui test site && pnpm --filter @mednet/ui typecheck`
Expected: PASS — 5 тестов.

- [ ] **Step 4: Commit**

```bash
pnpm format:check
git add packages/ui
git commit -m "feat(ui): SiteHeader and SiteFooter with ЦНИИОИЗ defaults"
```

---

### Task 7: Каркасы `PublicLayout` и `AppShell`

**Files:**
- Create: `packages/ui/src/layouts/skip-link.tsx`, `packages/ui/src/layouts/public-layout.tsx`, `packages/ui/src/layouts/app-shell.tsx`, `packages/ui/src/__tests__/layouts.test.tsx`
- Modify: `packages/ui/package.json` (экспорты `./public-layout`, `./app-shell`)

**Interfaces:**
- Consumes: `SiteHeader`, `SiteFooter` (Task 6), `Logo` (Task 5), из `#components/sidebar`: `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarInset`, `SidebarProvider`, `SidebarRail`, `SidebarTrigger`; из `#components/tooltip`: `TooltipProvider` (Task 3).
- Produces:
  - `@mednet/ui/public-layout` → `PublicLayout({ children, nav?, actions?, homeHref?, footer?: ReactNode })`, тип `PublicLayoutProps`;
  - `@mednet/ui/app-shell` → `AppShell({ children, nav: ReactNode, title?: ReactNode, actions?: ReactNode, homeHref?: string, defaultOpen?: boolean })`, тип `AppShellProps`.
  Оба — серверные компоненты (в Next их можно рендерить в `layout.tsx` без `"use client"`); клиентские части — внутри. Обвязку Base UI (`<Toaster />`, корень `isolate`, `body` `relative`) даёт корневой layout приложения, не каркас (Task 12, `llms/intro.md`).

- [ ] **Step 1: Падающий тест**

`packages/ui/src/__tests__/layouts.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../layouts/app-shell.js';
import { PublicLayout } from '../layouts/public-layout.js';

describe('PublicLayout', () => {
  it('ссылка «к содержанию», шапка, основное содержимое и подвал', () => {
    render(
      <PublicLayout nav={<a href="/reports">Отчёты</a>}>
        <h1>Страница</h1>
      </PublicLayout>,
    );
    expect(screen.getByRole('link', { name: 'Перейти к содержанию' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Страница');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('подвал заменяется целиком', () => {
    render(
      <PublicLayout footer={<footer>Свой подвал</footer>}>
        <p>Текст</p>
      </PublicLayout>,
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Свой подвал');
  });
});

describe('AppShell', () => {
  it('боковая панель, верхняя панель и содержимое', () => {
    render(
      <AppShell nav={<p>Навигация</p>} title="Отчёты" actions={<button type="button">Профиль</button>}>
        <p>Таблица</p>
      </AppShell>,
    );
    expect(screen.getByRole('main')).toHaveTextContent('Таблица');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByText('Навигация')).toBeInTheDocument();
    expect(screen.getByText('Отчёты')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Профиль' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ЦНИИОИЗ — на главную' })).toHaveAttribute('href', '/');
  });

  it('кнопка меню сворачивает боковую панель', async () => {
    const { container } = render(
      <AppShell nav={<p>Навигация</p>}>
        <p>Таблица</p>
      </AppShell>,
    );
    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]');
    const trigger = container.querySelector('[data-slot="sidebar-trigger"]');
    expect(trigger).toHaveAccessibleName('Показать или скрыть меню');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await userEvent.click(trigger as HTMLElement);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });

  it('defaultOpen={false} — панель свёрнута сразу', () => {
    const { container } = render(
      <AppShell nav={<p>Навигация</p>} defaultOpen={false}>
        <p>Таблица</p>
      </AppShell>,
    );
    expect(container.querySelector('[data-slot="sidebar"][data-state]')).toHaveAttribute(
      'data-state',
      'collapsed',
    );
  });
});
```

Run: `pnpm --filter @mednet/ui test layouts`
Expected: FAIL — `Failed to resolve import "../layouts/app-shell.js"`.

- [ ] **Step 2: Реализация**

`packages/ui/src/layouts/skip-link.tsx` (внутренний модуль, в `exports` и индекс не входит):

```tsx
/** Ссылка «Перейти к содержанию»: первая по Tab, видна только в фокусе. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md"
    >
      Перейти к содержанию
    </a>
  );
}
```

`packages/ui/src/layouts/public-layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { SiteFooter } from '../brand/site-footer.js';
import { SiteHeader } from '../brand/site-header.js';
import { SkipLink } from './skip-link.js';

export interface PublicLayoutProps {
  children: ReactNode;
  /** Пункты основной навигации в шапке. */
  nav?: ReactNode;
  /** Действия справа в шапке. */
  actions?: ReactNode;
  /** Адрес главной — ссылка на логотипе. */
  homeHref?: string;
  /** Подвал целиком; по умолчанию — `<SiteFooter />` с реквизитами ЦНИИОИЗ. */
  footer?: ReactNode;
}

/** Каркас публичных страниц (лендинги, отчёты): шапка, содержимое, подвал. */
export function PublicLayout({ children, nav, actions, homeHref, footer }: PublicLayoutProps) {
  return (
    <div data-slot="public-layout" className="flex min-h-svh flex-col">
      <SkipLink />
      <SiteHeader nav={nav} actions={actions} homeHref={homeHref} />
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer ?? <SiteFooter />}
    </div>
  );
}
```

`packages/ui/src/layouts/app-shell.tsx`:

```tsx
import type { ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '#components/sidebar';
import { TooltipProvider } from '#components/tooltip';
import { Logo } from '../brand/logo.js';
import { SkipLink } from './skip-link.js';

export interface AppShellProps {
  children: ReactNode;
  /** Содержимое боковой панели: SidebarGroup, SidebarMenu… из `@mednet/ui/sidebar`. */
  nav: ReactNode;
  /** Заголовок раздела в верхней панели. */
  title?: ReactNode;
  /** Правая часть верхней панели: поиск, уведомления, профиль. */
  actions?: ReactNode;
  /** Адрес главной — ссылка на логотипе. */
  homeHref?: string;
  /**
   * Открыта ли панель при первой отрисовке. В Next — из cookie `sidebar_state`
   * (`(await cookies()).get('sidebar_state')?.value !== 'false'`); при `output: 'export'` не передавать.
   */
  defaultOpen?: boolean;
}

/** Каркас приложений (инструменты, кабинеты, дашборды): боковая панель + верхняя панель. */
export function AppShell({
  children,
  nav,
  title,
  actions,
  homeHref = '/',
  defaultOpen,
}: AppShellProps) {
  return (
    // TooltipProvider объединяет задержку подсказок пунктов свёрнутого меню (Base UI работает и без него).
    <TooltipProvider>
      <SkipLink />
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <a
              href={homeHref}
              aria-label="ЦНИИОИЗ — на главную"
              className="flex h-12 items-center rounded-md px-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Logo variant="horizontal" className="h-9 w-auto group-data-[collapsible=icon]:hidden" />
              <Logo
                variant="mark"
                className="hidden h-7 w-auto group-data-[collapsible=icon]:block"
              />
            </a>
          </SidebarHeader>
          <SidebarContent>{nav}</SidebarContent>
          <SidebarRail />
        </Sidebar>
        {/* SidebarInset — это <main>: второй <main> внутри не нужен. */}
        <SidebarInset id="main">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger />
            {title ? <div className="text-sm font-semibold">{title}</div> : null}
            {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
```

В `exports` пакета перед `"./*"` добавить:

```json
"./public-layout": {
  "types": "./dist/layouts/public-layout.d.ts",
  "default": "./dist/layouts/public-layout.js"
},
"./app-shell": {
  "types": "./dist/layouts/app-shell.d.ts",
  "default": "./dist/layouts/app-shell.js"
},
```

- [ ] **Step 3: Тест проходит**

Run: `pnpm --filter @mednet/ui test layouts && pnpm --filter @mednet/ui typecheck`
Expected: PASS — 5 тестов.

- [ ] **Step 4: Commit**

```bash
pnpm format:check
git add packages/ui
git commit -m "feat(ui): PublicLayout and AppShell layouts"
```

---

### Task 8: Корневой индекс, `llms.md`, README, защита публикации

**Files:**
- Create: `packages/ui/scripts/gen-index.mjs`, `packages/ui/src/index.ts` (генерируется), `packages/ui/scripts/build-llms.mjs`, `packages/ui/llms/intro.md`, `packages/ui/llms/brand.md`, `packages/ui/scripts/check-dist.mjs`, `packages/ui/README.md`, `packages/ui/src/__tests__/package.test.ts`
- Modify: `packages/ui/package.json` (скрипты `build`, `gen:index`, `prepublishOnly`; `exports` `.` и `./llms.md`; `files`), `.gitignore`, `.prettierignore`, `turbo.json` (outputs)

**Interfaces:**
- Consumes: всё из Tasks 2–7; `dist/**/*.d.ts` после `tsc`.
- Produces: `@mednet/ui` (корневой индекс: `export *` из всех публичных модулей), `@mednet/ui/llms.md` (файл `llms.md` в корне пакета, генерируется при сборке, в git не хранится), `pnpm gen:index`.

- [ ] **Step 1: Падающий тест**

`packages/ui/src/__tests__/package.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const llms = () => readFileSync(new URL('llms.md', root), 'utf8');

describe('пакет @mednet/ui', () => {
  it('src/index.ts соответствует генератору', () => {
    const script = fileURLToPath(new URL('scripts/gen-index.mjs', root));
    expect(() => execFileSync(process.execPath, [script, '--check'])).not.toThrow();
  });

  it.each(Object.entries(pkg.exports).filter(([key]) => !key.includes('*')))(
    'экспорт %s указывает на существующий файл',
    (_key, target) => {
      const files =
        typeof target === 'string' ? [target] : Object.values(target as Record<string, string>);
      for (const file of files) expect(existsSync(new URL(file, root))).toBe(true);
    },
  );

  it('llms.md: правило render вместо asChild и строка стилей', () => {
    expect(llms()).toContain('render={');
    expect(llms()).toContain("@import '@mednet/ui/styles.css';");
  });

  it.each(['logo', 'site-header', 'site-footer', 'public-layout', 'app-shell', 'button', 'sidebar', 'toast'])(
    'llms.md: модуль %s описан',
    (name) => {
      expect(llms()).toContain(`### \`@mednet/ui/${name}\``);
    },
  );

  it('llms.md: экспорты взяты из d.ts', () => {
    expect(llms()).toMatch(/### `@mednet\/ui\/button`\n\n- компоненты: `Button`\n- прочее: `buttonVariants`/);
    expect(llms()).toContain('https://ui.shadcn.com/docs/components/base/button');
  });

  it('llms.md: у каждого фирменного компонента есть раздел с примером', () => {
    for (const name of ['Logo', 'SiteHeader', 'SiteFooter', 'PublicLayout', 'AppShell']) {
      expect(llms()).toContain(`#### \`${name}\``);
    }
  });
});
```

Run: `pnpm --filter @mednet/ui test package`
Expected: FAIL — генератора индекса и `llms.md` ещё нет.

- [ ] **Step 2: Корневой индекс**

`packages/ui/scripts/gen-index.mjs`:

```js
// src/index.ts — корневой индекс: export * из всех публичных модулей.
// Запуск: pnpm gen:index; с --check только сверяет (тест package.test.ts).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../src/', import.meta.url);
const INTERNAL = new Set(['layouts/skip-link.tsx']);

const list = (dir) =>
  readdirSync(new URL(dir, src))
    .filter((file) => file.endsWith('.tsx') && !INTERNAL.has(dir + file))
    .sort()
    .map((file) => `./${dir}${file.replace(/\.tsx$/, '.js')}`);

const modules = [...list('components/'), ...list('brand/'), ...list('layouts/'), './lib/utils.js'];
const text = [
  '// Сгенерировано scripts/gen-index.mjs, не редактировать.',
  '// Рекомендуемый импорт — по подпутям (@mednet/ui/button): корневой индекс тянет все модули.',
  ...modules.map((module) => `export * from '${module}';`),
  '',
].join('\n');

const target = new URL('index.ts', src);
if (process.argv.includes('--check')) {
  if (!existsSync(target) || readFileSync(target, 'utf8') !== text) {
    console.error('src/index.ts устарел: выполните pnpm gen:index');
    process.exit(1);
  }
} else {
  writeFileSync(target, text);
  console.log(`src/index.ts: ${modules.length} модулей`);
}
```

В `scripts` пакета: `"gen:index": "node scripts/gen-index.mjs"`.

Run (из `packages/ui`): `pnpm gen:index`
Expected: `src/index.ts: 67 модулей` (61+ компонентов, 3 фирменных, 2 каркаса, utils).

В `exports` пакета первым ключом добавить:

```json
".": {
  "types": "./dist/index.d.ts",
  "default": "./dist/index.js"
},
```

В `.prettierignore` к блоку `@mednet/ui` добавить `packages/ui/src/index.ts` и `packages/ui/llms.md`.

- [ ] **Step 3: Тексты `llms.md`**

`packages/ui/llms/intro.md`:

````markdown
Справка по установленной версии `@mednet/ui` — React-компонентам дизайн-системы ЦНИИОИЗ. Читайте её перед тем, как писать интерфейс.

## Правила

1. **Стили — одна строка** в `app/globals.css`: `@import '@mednet/ui/styles.css';` (внутри Tailwind v4, тема бренда и классы компонентов). Montserrat (`@fontsource/montserrat`) подключается этой же строкой — отдельно ставить и импортировать шрифт не нужно.
2. **Импорт — по подпутям:** `import { Button } from '@mednet/ui/button';`. Корневой `@mednet/ui` тоже работает, но тянет все модули.
3. **Основа — Base UI, а не Radix.** Чтобы отрисовать часть компонента другим элементом, используйте проп `render`, **не** `asChild`:
   ```tsx
   <DialogTrigger render={<Button variant="outline" />}>Открыть</DialogTrigger>
   <SidebarMenuButton render={<Link href="/settings" />}>Настройки</SidebarMenuButton>
   ```
   **Ссылка, которая выглядит как кнопка**, — это ссылка с классами кнопки, а не `Button` с `render={<a />}` (Base UI навязывает кнопке семантику кнопки):
   ```tsx
   import { buttonVariants } from '@mednet/ui/button';
   <Link href="/reports" className={buttonVariants({ variant: 'outline' })}>Отчёты</Link>
   ```
   Примеры из интернета с `asChild` переписывайте на `render`. Не ставьте `@radix-ui/*`, `radix-ui`, `@base-ui/react` напрямую.
4. **Цвета — только семантические классы:** `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `text-muted-foreground`, `border-border`, `border-input`, `bg-field` (заливка полей), `ring-ring`, `bg-destructive`, `text-destructive`, `bg-card`, `bg-popover`, `chart-1…chart-8`. Стандартная палитра Tailwind (`slate-100`, `zinc-500`…) удалена, а `red-500`, `blue-700` и другие шкалы — брендовые (из `@mednet/tokens`); hex, `rgb()`, `oklch()` и `bg-[#…]` запрещены линтером (`@mednet/lint-config`).
5. **Типографика:** заголовки — `text-h1`…`text-h4`, вводный абзац — `text-lead`, остальное — `text-base`/`text-sm`/`text-xs`. Шрифт — Montserrat.
6. **Иконки — только `lucide-react`.**
7. **Корневой layout** (обвязка Base UI):
   ```tsx
   <html lang="ru">
     <body className="relative">
       <div className="isolate">
         <TooltipProvider>{children}</TooltipProvider>
       </div>
       <Toaster />
     </body>
   </html>
   ```
   `isolate` — порталы (диалоги, меню, подсказки, уведомления) всегда поверх страницы; `relative` — бэкдропы в Safari iOS 26+; `Toaster` (из `@mednet/ui/toast`) — один на приложение, вызов `toast.add({ title, description, type: 'success' })` из любого клиентского компонента. `TooltipProvider` (из `@mednet/ui/tooltip`) необязателен, он объединяет задержку подсказок.
8. **Календарь — по-русски:** `<Calendar locale={ru} />`, `import { ru } from 'react-day-picker/locale';`.
9. **Старые браузеры:** Chrome/Edge 109 (Windows 7/8.1) поддерживаются, если в `postcss.config.mjs` после `@tailwindcss/postcss` стоит `'@mednet/ui/postcss': {}`. Не работают там AI-компоненты `bubble` и эффект `shimmer` (относительные цвета, Chrome 119+) — не используйте их на публичных страницах.
10. Компоненты кита не копируйте в проект и не правьте их стили `className`-ами с цветами: нужен другой вид — спросите у владельцев кита.
````

`packages/ui/llms/brand.md`:

````markdown
## Фирменные блоки и каркасы

Серверные компоненты: их можно рендерить в `page.tsx`/`layout.tsx` без `"use client"`.

#### `Logo`

`import { Logo } from '@mednet/ui/logo';`

| Проп | Тип | По умолчанию |
|---|---|---|
| `variant` | `'horizontal' \| 'vertical' \| 'mark'` | `'horizontal'` |
| `title` | `string` — доступное имя; без него логотип декоративный (`aria-hidden`) | — |
| `className` и др. | атрибуты `<svg>`; размер — классом высоты | — |

```tsx
<a href="/" aria-label="ЦНИИОИЗ — на главную">
  <Logo className="h-10 w-auto" />
</a>
<Logo variant="mark" title="ЦНИИОИЗ" className="size-12" />
```

#### `SiteHeader`

`import { SiteHeader } from '@mednet/ui/site-header';` — логотип со ссылкой на главную, навигация, действия.

| Проп | Тип | По умолчанию |
|---|---|---|
| `homeHref` | `string` | `'/'` |
| `nav` | `ReactNode` — ссылки | — |
| `actions` | `ReactNode` — кнопки справа | — |

```tsx
<SiteHeader
  nav={<><Link href="/about">О проекте</Link><Link href="/reports">Отчёты</Link></>}
  actions={<Link href="/login" className={buttonVariants({ size: 'sm' })}>Войти</Link>}
/>
```

#### `SiteFooter`

`import { SiteFooter, CNIIOIZ } from '@mednet/ui/site-footer';` — реквизиты ЦНИИОИЗ по умолчанию (`CNIIOIZ`: `fullName`, `shortName`, `phone`, `email`).

| Проп | Тип | По умолчанию |
|---|---|---|
| `orgName` | `string` | полное наименование ЦНИИОИЗ |
| `copyright` | `string` | `ФГБУ «ЦНИИОИЗ» Минздрава России` |
| `phone`, `email` | `string \| null` (`null` — скрыть) | телефон и почта ЦНИИОИЗ |
| `year` | `number` | текущий |
| `links` | `ReactNode` | — |

```tsx
<SiteFooter links={<Link href="/privacy">Политика конфиденциальности</Link>} />
```

#### `PublicLayout`

`import { PublicLayout } from '@mednet/ui/public-layout';` — лендинги и отчёты: ссылка «Перейти к содержанию», `SiteHeader`, `<main id="main">`, `SiteFooter`. Пропсы: `nav`, `actions`, `homeHref` (как у `SiteHeader`), `footer` (замена подвала), `children`.

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="relative">
        <div className="isolate">
          <PublicLayout nav={<Link href="/about">О проекте</Link>}>{children}</PublicLayout>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
```

#### `AppShell`

`import { AppShell } from '@mednet/ui/app-shell';` — инструменты, кабинеты, дашборды: боковая панель (shadcn Sidebar, сворачивается до иконок, Ctrl/⌘+B), верхняя панель, содержимое.

| Проп | Тип | По умолчанию |
|---|---|---|
| `nav` | `ReactNode` — `SidebarGroup`/`SidebarMenu` из `@mednet/ui/sidebar` | обязателен |
| `title` | `ReactNode` — заголовок в верхней панели | — |
| `actions` | `ReactNode` — правая часть верхней панели | — |
| `homeHref` | `string` | `'/'` |
| `defaultOpen` | `boolean` — из cookie `sidebar_state`; при `output: 'export'` не передавать | `true` |

```tsx
// app/(app)/layout.tsx
import { LayoutDashboard } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppShell } from '@mednet/ui/app-shell';
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@mednet/ui/sidebar';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const defaultOpen = (await cookies()).get('sidebar_state')?.value !== 'false';
  return (
    <AppShell
      defaultOpen={defaultOpen}
      title="Мониторинг"
      nav={
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/dashboard" />} tooltip="Дашборд">
                <LayoutDashboard />
                <span>Дашборд</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      {children}
    </AppShell>
  );
}
```
````

- [ ] **Step 4: Генератор `llms.md`**

`packages/ui/scripts/build-llms.mjs`:

```js
// llms.md — справка для AI-агентов: правила, фирменные блоки, модули и их экспорты.
// Экспорты берутся из собранных dist/**/*.d.ts через TypeScript compiler API. Запускается в build после tsc.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const DOCS = 'https://ui.shadcn.com/docs/components/base/';
const BRAND = {
  logo: 'dist/brand/logo.d.ts',
  'site-header': 'dist/brand/site-header.d.ts',
  'site-footer': 'dist/brand/site-footer.d.ts',
  'public-layout': 'dist/layouts/public-layout.d.ts',
  'app-shell': 'dist/layouts/app-shell.d.ts',
};
const components = readdirSync(new URL('dist/components/', root))
  .filter((file) => file.endsWith('.d.ts'))
  .map((file) => file.slice(0, -'.d.ts'.length))
  .sort();
const modules = [
  ...Object.entries(BRAND).map(([name, file]) => ({ name, file, brand: true })),
  ...components.map((name) => ({ name, file: `dist/components/${name}.d.ts`, brand: false })),
];
const path = (file) => fileURLToPath(new URL(file, root));

const program = ts.createProgram(
  modules.map((module) => path(module.file)),
  {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    noEmit: true,
  },
);
const checker = program.getTypeChecker();

const GROUPS = { component: 'компоненты', hook: 'хуки', type: 'типы', value: 'прочее' };

function kind(symbol) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  if (target.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)) return 'type';
  if (/^use[A-Z]/.test(symbol.name)) return 'hook';
  // Компоненты бывают функциями и константами (ChartTooltip = RechartsPrimitive.Tooltip).
  if (/^[A-Z][a-z]/.test(symbol.name)) return 'component';
  return 'value';
}

function exportsOf(file) {
  const source = program.getSourceFile(path(file));
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) throw new Error(`llms: нет ${file} — сначала tsc`);
  const groups = {};
  for (const item of checker.getExportsOfModule(symbol)) (groups[kind(item)] ??= []).push(item.name);
  return Object.entries(GROUPS)
    .filter(([key]) => groups[key])
    .map(([key, label]) => `- ${label}: ${groups[key].sort().map((name) => `\`${name}\``).join(', ')}`)
    .join('\n');
}

const section = ({ name, file, brand }) =>
  [`### \`@mednet/ui/${name}\``, '', exportsOf(file), ...(brand ? [] : [`- документация: ${DOCS}${name}`]), ''].join(
    '\n',
  );
const read = (file) => readFileSync(new URL(file, root), 'utf8').trim();

const text = [
  `# @mednet/ui ${pkg.version} — справка для AI-агентов`,
  '',
  read('llms/intro.md'),
  '',
  read('llms/brand.md'),
  '',
  '## Модули фирменных блоков',
  '',
  ...modules.filter((module) => module.brand).map(section),
  '## Компоненты shadcn/ui (Base UI, стиль Maia)',
  '',
  'API и примеры — как в документации shadcn/ui для Base UI (ссылка у каждого модуля). Отличия кита: цвета из токенов бренда, подписи для экранного диктора по-русски.',
  '',
  ...modules.filter((module) => !module.brand).map(section),
].join('\n');

writeFileSync(new URL('llms.md', root), text);
console.log(`llms.md: ${modules.length} модулей`);
```

В `package.json` пакета:
- `"build": "node scripts/clean.mjs && tsc -p tsconfig.build.json && node scripts/build-llms.mjs"`;
- в `exports` после `"./styles.css"`: `"./llms.md": "./llms.md",`;
- в `files` добавить `"llms.md"`.

В корневой `.gitignore` добавить:

```
# генерируется сборкой @mednet/ui
packages/ui/llms.md
```

В `turbo.json` в `tasks.build.outputs` добавить `"llms.md"` (иначе при попадании в кэш turbo восстановит `dist`, но не `llms.md`). Перед правкой — по `AGENTS.md` прочитать `docs/README.md` установленного пакета `turbo` и страницу про `outputs`.

- [ ] **Step 5: Защита публикации и README**

`packages/ui/scripts/check-dist.mjs`:

```js
// Защита публикации: без сборки в npm уедет пакет без dist/ и llms.md.
import { existsSync } from 'node:fs';

const required = [
  'dist/index.js',
  'dist/components/button.js',
  'dist/brand/logo.js',
  'dist/layouts/app-shell.js',
  'llms.md',
];
const missing = required.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  console.error(
    `@mednet/ui: нельзя публиковать без сборки — нет ${missing.join(', ')}. Выполните «pnpm build».`,
  );
  process.exit(1);
}
```

В `scripts` пакета: `"prepublishOnly": "node scripts/check-dist.mjs"`.

`packages/ui/README.md`:

````markdown
# @mednet/ui

React-компоненты дизайн-системы ЦНИИОИЗ: весь набор [shadcn/ui](https://ui.shadcn.com) на [Base UI](https://base-ui.com) в стиле Maia и теме бренда, логотип, шапка и подвал сайта, каркасы страниц `PublicLayout` и `AppShell`. Для Next.js 16 (App Router, React Server Components) и других React 19-проектов на Tailwind CSS v4.

## Подключение

```bash
npm i @mednet/ui
npm i -D tailwindcss @tailwindcss/postcss
```

`app/globals.css` — одна строка:

```css
@import '@mednet/ui/styles.css';
```

Компоненты — по подпутям:

```tsx
import { Button } from '@mednet/ui/button';
import { AppShell } from '@mednet/ui/app-shell';
```

Правила для людей и AI-агентов — в `node_modules/@mednet/ui/llms.md` (генерируется под установленную версию). Главное: смена элемента — проп `render`, а не `asChild`; цвета — только семантические классы бренда.

## Разработка пакета

- Компоненты в `src/components` генерирует CLI shadcn по `components.json`; руками их не правят. Обновить из shadcn: `pnpm generate` (≈2–7 минут: `shadcn add --all --overwrite` + `scripts/postgen.mjs`), затем `pnpm build && pnpm test` и просмотр `git diff`.
- Что кит меняет в коде shadcn: импорт `cn` и русские подписи — `scripts/postgen.mjs` и `scripts/ru-labels.json` (скрипт падает, если правку не к чему применить: значит, shadcn поменял исходник); цвета бренда — правилами `src/brand.css` поверх сгенерированных классов, сами файлы не меняются.
- Chrome/Edge 109 (Windows 7/8.1): PostCSS-плагин `@mednet/ui/postcss` ставится в проекте после `@tailwindcss/postcss`.
- Логотип: `pnpm logos` (из `assets/brand/logo/*.svg`). Индекс: `pnpm gen:index`. CSS shadcn: `pnpm vendor-css`.
- Импорты внутри пакета — `#components/…`, `#hooks/…`, `#lib/…` (поле `imports` в `package.json`).

## Лицензии

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России. Код shadcn/ui — MIT, см. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
````

- [ ] **Step 6: Собрать и проверить**

Run: `pnpm --filter @mednet/ui build && pnpm --filter @mednet/ui test && pnpm --filter @mednet/ui typecheck`
Expected: сборка печатает `llms.md: 66 модулей` (или больше, если в наборе больше компонентов); все тесты PASS. Открыть `packages/ui/llms.md` и прочитать глазами разделы `button`, `chart`, `app-shell`.

- [ ] **Step 7: Commit**

```bash
pnpm format:check
git add .gitignore .prettierignore turbo.json packages/ui
git commit -m "feat(ui): root index, llms.md for agents, README, publish guard"
```

---

### Task 9: `@mednet/lint-config` — ESLint

**Files:**
- Create: `packages/lint-config/package.json`, `packages/lint-config/tsconfig.json`, `packages/lint-config/vitest.config.ts`, `packages/lint-config/LICENSE`, `packages/lint-config/eslint.js`, `packages/lint-config/eslint.d.ts`, `packages/lint-config/test/lint-config.test.ts`, `packages/lint-config/test/fixtures/bad.tsx`, `packages/lint-config/test/fixtures/good.tsx`
- Modify: `.prettierignore`

**Interfaces:**
- Consumes: ничего из других задач.
- Produces: `@mednet/lint-config/eslint` — `export default config: Linter.Config[]` (только правила ядра `no-restricted-imports` и `no-restricted-syntax`, без парсера и плагинов — парсер даёт `eslint-config-next`), `export const restrictedImports: { paths, patterns }`, `export const restrictedSyntax: { selector, message }[]` (для расширения в проекте). Использование в проекте (план B): `defineConfig([...nextVitals, ...nextTs, ...mednet, globalIgnores([...])])`.

Проверено прототипом на ESLint 9.39.5 и 10.12.0 с `eslint-config-next` 16.4.0 и в свежем `create-next-app` 16.4.0: 71 плохая строка — ровно по одному сообщению, хороший файл — 0. Особенности esquery (ESLint 9 и 10 — esquery 1.7.0): в `/…/` регулярке нельзя голый `/` (наши регулярки без него), флаги только `i m s u`, у `TemplateElement` — `value.raw`.

- [ ] **Step 1: Пакет**

`packages/lint-config/package.json`:

```json
{
  "name": "@mednet/lint-config",
  "version": "0.1.1",
  "private": true,
  "description": "ESLint и stylelint для проектов ЦНИИОИЗ: защита бренда",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/lint-config"
  },
  "files": ["eslint.js", "eslint.d.ts", "stylelint.js", "stylelint.d.ts", "README.md"],
  "exports": {
    "./eslint": {
      "types": "./eslint.d.ts",
      "default": "./eslint.js"
    },
    "./stylelint": {
      "types": "./stylelint.d.ts",
      "default": "./stylelint.js"
    },
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "peerDependencies": {
    "eslint": "^9.0.0 || ^10.0.0",
    "stylelint": "^17.0.0"
  },
  "peerDependenciesMeta": {
    "eslint": {
      "optional": true
    },
    "stylelint": {
      "optional": true
    }
  },
  "devDependencies": {
    "@types/node": "^24",
    "eslint": "^9.39.5",
    "eslint-config-next": "16.4.0",
    "next": "^16.4.0",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "stylelint": "^17.16.0",
    "typescript": "~6.0.3",
    "typescript-eslint": "^8.71.2",
    "vitest": "^5.0.4"
  }
}
```

- Зависимостей нет: только конфиги со встроенными правилами. Оба peer необязательны — проекту только с ESLint не будет шума.
- ESLint в devDependencies — 9 (как в `create-next-app` 16.4.0 и будущем шаблоне): с ESLint 10 плагины `eslint-config-next` (`react`, `import`, `jsx-a11y`) дают предупреждения о peer.
- `next` нужен тесту: парсер `eslint-config-next` делает `require('next/dist/compiled/babel/eslint-parser')`, не объявляя `next` зависимостью (без него — `Cannot find module 'next/dist/compiled/babel/eslint-parser'`). `react`/`react-dom` — peer у `next`.
- `typescript-eslint` 8.71 поддерживает TypeScript `<6.1.0` — с нашим `~6.0.3` совместим, с 7.x — нет.

`packages/lint-config/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["eslint.js", "stylelint.js", "test/*.ts", "vitest.config.ts"]
}
```

`packages/lint-config/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // С пулом forks на Windows Vitest падает: «Timeout waiting for worker to respond».
    pool: 'threads',
    // Первый холодный прогон с eslint-config-next — около минуты.
    testTimeout: 60_000,
  },
});
```

Run: `cp packages/css/LICENSE packages/lint-config/LICENSE && pnpm install`

В `.prettierignore` добавить:

```
# @mednet/lint-config: строки фикстур помечены // @bad — Prettier не должен их переносить
packages/lint-config/test/fixtures
```

- [ ] **Step 2: Фикстуры**

`packages/lint-config/test/fixtures/bad.tsx` — каждая строка с `// @bad` должна дать ровно одно сообщение (71 строка):

```tsx
import { Button } from "antd"; // @bad
import "antd/dist/reset.css"; // @bad
import MuiButton from "@mui/material/Button"; // @bad
import { createTheme } from "@mui/material"; // @bad
import type { Theme } from "@mui/material/styles"; // @bad
import { MantineProvider } from "@mantine/core"; // @bad
import { ChakraProvider } from "@chakra-ui/react"; // @bad
import "bootstrap/dist/css/bootstrap.min.css"; // @bad
import "bootstrap"; // @bad
import { Modal } from "react-bootstrap"; // @bad
import RBModal from "react-bootstrap/Modal"; // @bad
import * as RadixDialogPrimitive from "@radix-ui/react-dialog"; // @bad
import { Dialog as RadixDialog } from "radix-ui"; // @bad
import { Dialog as BaseDialog } from "@base-ui/react/dialog"; // @bad
import { Button as BaseButton } from "@base-ui/react"; // @bad
import { useRender } from "@base-ui/react/use-render"; // @bad
import { FaHome } from "react-icons/fa"; // @bad
import { HomeIcon } from "@heroicons/react/24/solid"; // @bad
import { IconHome } from "@tabler/icons-react"; // @bad
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // @bad
import { House } from "@phosphor-icons/react"; // @bad
import { HugeiconsIcon } from "@hugeicons/react"; // @bad
export { Slot } from "@radix-ui/react-slot"; // @bad
import type { CSSProperties } from "react";

declare function cn(...inputs: unknown[]): string;
declare function clsx(...inputs: unknown[]): string;
declare function cx(...inputs: unknown[]): string;
declare function cva(base: string, config?: unknown): () => string;

export const used = [Button, MuiButton, createTheme, MantineProvider, ChakraProvider, Modal, RBModal];
export const used2 = [RadixDialogPrimitive, RadixDialog, BaseDialog, BaseButton, useRender];
export const used3 = [FaHome, HomeIcon, IconHome, FontAwesomeIcon, House, HugeiconsIcon];
export type UsedTheme = Theme;

export const active = Math.random() > 0.5;
export const hex = "abc";
export const hue = 20;

// className: строка
export const c1 = <div className="bg-[#fff] p-4" />; // @bad
export const c2 = <div className="text-[rgb(1_2_3)]" />; // @bad
export const c3 = <div className="border-[oklch(0.6_0.1_20)]" />; // @bad
export const c4 = <svg className="fill-[#b55c57]" />; // @bad
export const c5 = <div className="[color:#333]" />; // @bad
export const c6 = <div className="bg-[#ffffff80]/50" />; // @bad
export const c7 = <div className="bg-[#fffa]" />; // @bad
export const c8 = <div className="text-[hsl(0_0%_0%)]" />; // @bad
export const c9 = <div className="bg-[rgba(0,0,0,.5)]" />; // @bad
export const c10 = <div className="bg-[hsla(0,0%,0%,.5)]" />; // @bad
export const c11 = <div className="bg-[hwb(0_0%_0%)]" />; // @bad
export const c12 = <div className="bg-[lab(50%_40_59)]" />; // @bad
export const c13 = <div className="bg-[lch(50%_70_40)]" />; // @bad
export const c14 = <div className="bg-[oklab(0.6_0.1_0.1)]" />; // @bad
export const c15 = <div className="bg-[color(display-p3_1_0_0)]" />; // @bad
export const c16 = <div className="shadow-[0_0_0_1px_#fff]" />; // @bad
export const c17 = <div className="bg-[linear-gradient(#fff_0%,transparent_100%)]" />; // @bad
export const c18 = <div className="[--brand:#b55c57]" />; // @bad
export const c19 = <div className="BG-[#FFF]" />; // @bad
export const c20 = <div className="text-[color:oklch(0.5_0.1_20)]" />; // @bad
// className: выражение, тернарник, шаблонная строка
export const e1 = <div className={"bg-[#fff]"} />; // @bad
export const e2 = <div className={active ? "text-[#000]" : "text-foreground"} />; // @bad
export const e3 = <div className={`p-2 bg-[#fafafa] ${active ? "ring-2" : ""}`} />; // @bad
export const e4 = <div className={`${hex} text-[rgb(0_0_0)]`} />; // @bad
export const e5 = <div className={cn("p-2", "bg-[#fff]")} />; // @bad
export const e6 = <div className={cn("p-2", active && `ring-[oklch(0.7_0.1_20)]`)} />; // @bad
// другие пропсы классов
export const p1 = <div classNames={{ root: "bg-[#fff]" }} />; // @bad
export const p2 = <div contentClassName="text-[#000]" />; // @bad
// style
export const s1 = <div style={{ color: "#fff" }} />; // @bad
export const s2 = <div style={{ backgroundColor: "rgb(0 0 0)" }} />; // @bad
export const s3 = <div style={{ borderColor: `oklch(0.5 0.1 ${hue})` }} />; // @bad
export const s4 = <div style={{ "--brand": "#b55c57" } as CSSProperties} />; // @bad
export const s5 = <div style={{ background: "linear-gradient(#fff, transparent)" }} />; // @bad
export const s6 = <div style={{ boxShadow: "0 0 0 1px hsla(0, 0%, 0%, .1)" }} />; // @bad
export const s7 = <div style={{ color: "rgba(0,0,0,.5)" }} />; // @bad
export const s8 = <div style={{ color: active ? "#000" : "var(--foreground)" }} />; // @bad
export const s9 = <div style={{ color: "color(srgb 1 0 0)" }} />; // @bad
export const s10 = <div style={{ outlineColor: "hwb(0 0% 0%)" }} />; // @bad
// cn / clsx / cx / cva / twMerge
export const k1 = cn("p-4", "bg-[#fff]"); // @bad
export const k2 = cn("p-4", active && "text-[#000]"); // @bad
export const k3 = cn({ "bg-[oklch(0.9_0.02_20)]": active }); // @bad
export const k4 = clsx(["p-2", ["border-[#ccc]"]]); // @bad
export const k5 = cx(`bg-[${hex}] text-[#111]`); // @bad
export const k6 = cva("inline-flex bg-[#fff]"); // @bad
export const k7 = cva("inline-flex", {
  variants: {
    tone: {
      brand: "bg-[#b55c57] text-white", // @bad
      soft: "bg-[color:rgb(181_92_87/0.1)]", // @bad
      plain: "bg-background",
    },
  },
  compoundVariants: [{ tone: "brand", className: "ring-[#000]" }], // @bad
});
declare function twMerge(...inputs: string[]): string;
export const k8 = twMerge("p-2", "text-[lch(50%_70_40)]"); // @bad
```

`packages/lint-config/test/fixtures/good.tsx` — ни одного сообщения:

```tsx
import { Button } from "@mednet/ui/button";
import { Dialog, DialogContent } from "@mednet/ui/dialog";
import { House } from "lucide-react";
import type { CSSProperties } from "react";

declare function cn(...inputs: unknown[]): string;
declare function clsx(...inputs: unknown[]): string;
declare function cva(base: string, config?: unknown): () => string;

export const used = [Button, Dialog, DialogContent, House];
export const active = Math.random() > 0.5;

// не цвета и не те места
export const n1 = <a href="#section">К разделу</a>;
export const n2 = <a href="#fff">Якорь, похожий на hex</a>;
export const n3 = <h2 id="section">Раздел</h2>;
export const n4 = <button aria-label="№1 #2">Кнопка</button>;
export const n5 = "Задача #123, цвет #fff в тексте";
export const n6 = <p title="rgb(0 0 0)">rgb(0 0 0) и #fff в тексте узла</p>;
export const n7 = (
  <svg viewBox="0 0 1 1" aria-hidden="true">
    <path fill="#d6867f" d="M0 0h1v1z" />
  </svg>
);
// классы без литеральных цветов
export const g1 = <div className="grid-cols-[1fr_2fr]" />;
export const g2 = <div className="bg-[var(--brand)]" />;
export const g3 = <div className="bg-primary/30 text-muted-foreground border-border" />;
export const g4 = <div className="w-[calc(100%-2rem)]" />;
export const g5 = <div className="bg-[color:var(--brand)] [--gap:1rem]" />;
export const g6 = <div className="data-[state=open]:bg-accent [&_svg]:size-4 bg-linear-to-r from-primary to-primary/0" />;
export const g7 = <div className={`p-2 ${active ? "bg-accent" : ""}`} />;
export const g8 = <div className={cn("p-4", active && "bg-primary text-primary-foreground")} />;
export const g9 = <div className="bg-[url(/hero.svg)] shadow-[0_0_0_1px_var(--border)]" />;
export const g10 = <div className="text-destructive bg-field hover:bg-primary-hover" />;
export const g11 = <div className="bg-[color-mix(in_oklab,var(--primary)_30%,transparent)]" />;
// style без литеральных цветов
export const st1 = <div style={{ width: "calc(100% - 1rem)" }} />;
export const st2 = <div style={{ color: "var(--primary)" }} />;
export const st3 = <div style={{ background: "color-mix(in oklab, var(--primary) 30%, transparent)" }} />;
export const st4 = <div style={{ gridTemplateColumns: "repeat(2, 1fr)", transform: "rotate(45deg)" }} />;
export const st5 = <div style={{ "--gap": "1rem", color: "currentColor" } as CSSProperties} />;
export const st6 = <div style={{ filter: "drop-shadow(0 0 2px var(--border))" }} />;
// cn / clsx / cva
export const k1 = cn("p-4", { "bg-primary": active }, ["text-sm", ["font-medium"]]);
export const k2 = clsx("rounded-lg", active && "ring-2 ring-ring");
export const k3 = cva("inline-flex items-center", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary-hover",
      outline: "border border-input bg-field",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});
```

- [ ] **Step 3: Падающий тест**

`packages/lint-config/test/lint-config.test.ts` (ESLint-часть; stylelint добавит Task 10):

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint, type Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import mednetEslint, { restrictedImports } from '../eslint.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

/** Номера строк с маркером — там обязано быть ровно одно сообщение. */
const badLines = (name: string, marker: string) =>
  readFileSync(fixture(name), 'utf8')
    .split('\n')
    .flatMap((line, index) => (line.includes(marker) ? [index + 1] : []));

async function lintTsx(base: Linter.Config[]) {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [...base, ...mednetEslint],
  });
  const [bad, good] = await eslint.lintFiles([fixture('bad.tsx'), fixture('good.tsx')]);
  return { bad: bad!, good: good! };
}

const standalone: Linter.Config[] = [
  { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } },
];

async function withNext(): Promise<Linter.Config[]> {
  const nextVitals = (await import('eslint-config-next/core-web-vitals')).default;
  const nextTs = (await import('eslint-config-next/typescript')).default;
  return [...nextVitals, ...nextTs];
}

describe.each([
  ['только парсер typescript-eslint', async () => standalone],
  ['вместе с eslint-config-next', withNext],
])('eslint: %s', (_name, base) => {
  it('ловит каждую плохую строку ровно один раз и молчит на хорошем файле', async () => {
    const { bad, good } = await lintTsx(await base());
    const expected = badLines('bad.tsx', '// @bad');
    expect(expected.length).toBeGreaterThan(60);
    expect(bad.messages.filter((message) => message.fatal)).toEqual([]);
    expect(bad.messages.map((message) => message.line)).toEqual(expected);
    expect(new Set(bad.messages.map((message) => message.ruleId))).toEqual(
      new Set(['no-restricted-imports', 'no-restricted-syntax']),
    );
    expect(good.messages).toEqual([]);
  });
});

describe('расширение в проекте', () => {
  it('свой список запретов проекта дополняет наш, а не заменяет', async () => {
    const eslint = new ESLint({
      cwd: root,
      overrideConfigFile: true,
      overrideConfig: [
        ...standalone,
        ...mednetEslint,
        {
          rules: {
            'no-restricted-imports': [
              'error',
              {
                ...restrictedImports,
                paths: [...restrictedImports.paths, { name: 'lodash', message: 'lodash-es' }],
              },
            ],
          },
        },
      ],
    });
    const [result] = await eslint.lintText('import "antd";\nimport "lodash";\n', {
      filePath: fixture('extend.ts'),
    });
    expect(result!.messages.map((message) => message.line)).toEqual([1, 2]);
  });
});
```

Run: `pnpm --filter @mednet/lint-config test`
Expected: FAIL — `Failed to load url ../eslint.js`.

- [ ] **Step 4: Конфиг ESLint**

`packages/lint-config/eslint.js` (писать редактором, не через heredoc в shell: в регулярках `String.raw` с `\`, которые shell съедает):

```js
// @mednet/lint-config/eslint — flat config: только правила ядра ESLint, без парсера и плагинов.
// Парсер (typescript-eslint для .ts/.tsx) приходит из eslint-config-next; ставьте этот массив после него.
// Правила проекта с теми же именами ЗАМЕНЯЮТ наши (ESLint не сливает опции) — расширяйте
// через экспортируемые restrictedImports / restrictedSyntax.

// ---------- Импорты ----------

const UI_KIT =
  'Сторонние UI-библиотеки в проектах ЦНИИОИЗ не используются: компоненты берите из @mednet/ui (список — node_modules/@mednet/ui/llms.md).';
const PRIMITIVES =
  'Примитивы напрямую не импортируйте — только через @mednet/ui (например, @mednet/ui/dialog). Композиция — через проп render, не asChild.';
const ICONS = 'Иконки — только lucide-react.';

/** Опции правила no-restricted-imports; экспортируются, чтобы проект мог дополнить список. */
export const restrictedImports = {
  paths: [
    { name: 'antd', message: UI_KIT },
    { name: 'bootstrap', message: UI_KIT },
    { name: 'react-bootstrap', message: UI_KIT },
    { name: 'radix-ui', message: PRIMITIVES },
    // @base-ui/react не дублируем в paths: его ловит паттерн '@base-ui/*' (иначе два сообщения на строку)
    { name: 'react-icons', message: ICONS },
    { name: '@tabler/icons-react', message: ICONS },
  ],
  patterns: [
    {
      group: ['antd/*', 'bootstrap/*', 'react-bootstrap/*', '@mui/*', '@mantine/*', '@chakra-ui/*'],
      message: UI_KIT,
    },
    {
      group: ['radix-ui/*', '@radix-ui/*', '@base-ui/*', '@base-ui-components/*'],
      message: PRIMITIVES,
    },
    {
      group: [
        'react-icons/*',
        '@tabler/icons-react/*',
        '@heroicons/*',
        '@fortawesome/*',
        '@phosphor-icons/*',
        '@hugeicons/*',
      ],
      message: ICONS,
    },
  ],
};

// ---------- Литеральные цвета ----------
// Регулярки вставляются в селекторы esquery как /…/i. В них нельзя использовать «/»
// (esquery заканчивает регулярку на первом «/»), флаги — только i m s u.
// Hex: после него не буква/цифра/дефис, но «_» можно — Tailwind пишет пробелы как «_» (#fff_0%).
// Функции: перед именем не буква/дефис — так color-mix( и --x-rgb( не ловятся.

const HEX = String.raw`#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})(?![\da-z-])`;
const FN = String.raw`(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(`;
const COLOR = `${HEX}|${FN}`;

/** Строка или кусок шаблонной строки с литеральным цветом. */
const COLOR_STRING = `:matches(Literal[value=/${COLOR}/i], TemplateElement[value.raw=/${COLOR}/i])`;

const CLASS_ATTR = String.raw`JSXAttribute[name.name=/^(?:className|classNames)$|ClassName$/]`;
const CLASS_CALL = String.raw`CallExpression[callee.name=/^(?:cn|cva|clsx|cx|tv|twMerge|twJoin)$/]`;
const STYLE_ATTR = String.raw`JSXAttribute[name.name=/^style$|Style$/]`;

/** Записи правила no-restricted-syntax; экспортируются, чтобы проект мог дополнить список. */
export const restrictedSyntax = [
  {
    // Один селектор на оба контекста: className={cn('bg-[#fff]')} — одно сообщение, а не два.
    selector: `:matches(${CLASS_ATTR}, ${CLASS_CALL}) ${COLOR_STRING}`,
    message:
      'Цвет литералом в классах (#fff, rgb(…), oklch(…), bg-[#…], text-[rgb(…)]) запрещён: берите семантический класс — bg-primary, text-muted-foreground, border-border, bg-destructive, bg-field — или шкалу бренда (bg-red-500).',
  },
  {
    selector: `${STYLE_ATTR} ${COLOR_STRING}`,
    message:
      'Цвет литералом в style запрещён: используйте класс (bg-primary, text-muted-foreground, border-border) или переменную токена — var(--primary), var(--muted-foreground), var(--border).',
  },
];

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    name: '@mednet/lint-config/eslint',
    rules: {
      'no-restricted-imports': ['error', restrictedImports],
      'no-restricted-syntax': ['error', ...restrictedSyntax],
    },
  },
];

export default config;
```

`packages/lint-config/eslint.d.ts`:

```ts
import type { Linter } from 'eslint';

export declare const restrictedImports: {
  paths: { name: string; message: string }[];
  patterns: { group: string[]; message: string }[];
};
export declare const restrictedSyntax: { selector: string; message: string }[];

declare const config: Linter.Config[];
export default config;
```

- [ ] **Step 5: Тест проходит**

Run: `pnpm --filter @mednet/lint-config test && pnpm --filter @mednet/lint-config typecheck`
Expected: PASS — 3 теста (первый холодный прогон — до минуты). Если «вместе с eslint-config-next» падает с `Cannot find module 'next/dist/compiled/babel/eslint-parser'` — `next` не установлен в devDependencies пакета. Сообщение `Pages directory cannot be found` от `@next/next/no-html-link-for-pages` — норма (в пакете нет `app/`).

Проверка, что тест ловит регресс: временно добавить в конец `bad.tsx` строку `export const z = <div className="bg-primary" />; // @bad` → тест падает; убрать строку.

- [ ] **Step 6: Commit**

```bash
pnpm format:check
git add .prettierignore packages/lint-config pnpm-lock.yaml
git commit -m "feat(lint-config): ESLint flat config — banned UI kits, primitives, icons, literal colours"
```

---

### Task 10: `@mednet/lint-config` — stylelint и README

**Files:**
- Create: `packages/lint-config/stylelint.js`, `packages/lint-config/stylelint.d.ts`, `packages/lint-config/test/fixtures/bad.css`, `good.css`, `tailwind.css`, `data-uri.css`, `packages/lint-config/README.md`
- Modify: `packages/lint-config/test/lint-config.test.ts`

**Interfaces:**
- Consumes: пакет из Task 9.
- Produces: `@mednet/lint-config/stylelint` — `export default config: Config` (правила `color-no-hex`, `color-named: never`, `function-disallowed-list`), `export const colorFunctions: string[]`. В проекте (план B): `stylelint.config.mjs` = `{ extends: ['@mednet/lint-config/stylelint'], ignoreFiles: ['.next/**', 'out/**', 'build/**'] }`, скрипт `"lint:css": "stylelint \"**/*.css\" --allow-empty-input"`.

Проверено прототипом (stylelint 17.16.0): 19 плохих строк — 19 предупреждений; хорошие файлы, весь синтаксис Tailwind v4 (`@theme`, `@source`, `@custom-variant`, `@utility`, `@apply`, `--alpha()`, `--spacing()`), `color-mix(in oklab, var(--a) 30%, transparent)`, `currentColor` и hex внутри `url("data:…")` — 0. `stylelint-config-standard` 40 (даже с `stylelint-config-tailwindcss` 1.0.1) даёт ложные ошибки на валидном Tailwind v4 и отвергает `currentColor` — проектам его не подключать. Пробел: `@apply bg-[#fff]` stylelint не видит (встроенные правила не читают параметры `@apply`).

- [ ] **Step 1: Фикстуры**

`packages/lint-config/test/fixtures/bad.css`:

```css
.a { color: #fff; } /* @bad */
.b { background: #b55c57cc; } /* @bad */
.c { color: red; } /* @bad */
.d { border-color: white; } /* @bad */
.e { color: rgb(0 0 0); } /* @bad */
.f { color: rgba(0, 0, 0, 0.5); } /* @bad */
.g { color: hsl(0 0% 0%); } /* @bad */
.h { color: hsla(0, 0%, 0%, 0.5); } /* @bad */
.i { color: hwb(0 0% 0%); } /* @bad */
.j { color: lab(50% 40 59); } /* @bad */
.k { color: lch(50% 70 40); } /* @bad */
.l { color: oklab(0.6 0.1 0.1); } /* @bad */
.m { color: oklch(0.6 0.1 20); } /* @bad */
.n { color: color(display-p3 1 0 0); } /* @bad */
.o { box-shadow: 0 0 0 1px #000; } /* @bad */
.p { background: linear-gradient(white, transparent); } /* @bad */
.q { --brand: #b55c57; } /* @bad */
.r { background: color-mix(in oklab, #b55c57 30%, transparent); } /* @bad */
.s { outline: 1px solid Black; } /* @bad */
```

`packages/lint-config/test/fixtures/good.css`:

```css
.a { color: var(--primary); }
.b { background: color-mix(in oklab, var(--primary) 30%, transparent); }
.c { color: transparent; border-color: currentColor; fill: currentcolor; }
.d { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff'/%3E%3C/svg%3E"); }
.e { width: calc(100% - 1rem); grid-template-columns: repeat(2, 1fr); }
.f { background: linear-gradient(var(--primary), transparent); }
.g { color: inherit; background: none; border-color: initial; }
.h { font-family: var(--font-sans), sans-serif; }
```

`packages/lint-config/test/fixtures/data-uri.css`:

```css
.raw-hash { background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><path fill='#fff'/></svg>"); }
.unquoted { background-image: url(data:image/svg+xml,%3Csvg%20fill='%23fff'%3E%3C/svg%3E); }
.named-in-url { background-image: url("/icons/white.svg"); }
```

`packages/lint-config/test/fixtures/tailwind.css`:

```css
@import "tailwindcss";
@import "@mednet/ui/styles.css";
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" source(none);

@plugin "@tailwindcss/typography";
@reference "../app/globals.css";

@source "../dist";
@source not "./legacy";
@source inline("bg-primary");

@custom-variant dark (&:is(.dark *));

@custom-variant data-open {
  &:where([data-state="open"]),
  &:where([data-open]:not([data-open="false"])) {
    @slot;
  }
}

@theme inline {
  --color-x: var(--y);
  --font-sans: var(--font-montserrat);
}

@theme {
  --spacing-18: 4.5rem;
}

@utility content-auto {
  content-visibility: auto;
}

@utility tab-* {
  tab-size: --value(integer);
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .card {
    @apply bg-primary rounded-lg hover:bg-primary-hover;
  }
}

.overlay {
  background: --alpha(var(--color-primary) / 50%);
  color: --alpha(var(--color-primary) / 50%);
  margin: --spacing(4);
  padding: theme(--spacing-4);
}

@variant dark {
  .x {
    color: var(--foreground);
  }
}

.y {
  @variant hover {
    color: var(--primary);
  }
}
```

- [ ] **Step 2: Падающий тест**

В `packages/lint-config/test/lint-config.test.ts` добавить импорты:

```ts
import stylelint from 'stylelint';
import mednetStylelint from '../stylelint.js';
```

и в конец файла:

```ts
describe('stylelint', () => {
  it('ловит литеральные цвета и не трогает токены, color-mix и синтаксис Tailwind v4', async () => {
    const { results } = await stylelint.lint({
      files: ['bad.css', 'good.css', 'tailwind.css', 'data-uri.css'].map(fixture),
      config: mednetStylelint,
    });
    const [bad, ...clean] = results;
    expect(bad!.warnings.map((warning) => warning.line).sort((a, b) => a - b)).toEqual(
      badLines('bad.css', '/* @bad */'),
    );
    for (const result of clean) {
      expect({ file: result.source, warnings: result.warnings }).toEqual({
        file: result.source,
        warnings: [],
      });
    }
  });
});
```

Run: `pnpm --filter @mednet/lint-config test`
Expected: FAIL — `Failed to load url ../stylelint.js`.

- [ ] **Step 3: Конфиг stylelint**

`packages/lint-config/stylelint.js`:

```js
// @mednet/lint-config/stylelint — только встроенные правила stylelint.
// Не подключайте вместе с ним stylelint-config-standard: на Tailwind v4 он даёт ложные ошибки
// (@apply, --spacing(), блочный @custom-variant) и отвергает currentColor.

/** Литеральные цветовые функции. color-mix() не входит: color-mix(in oklab, var(--a) 30%, transparent) разрешён. */
export const colorFunctions = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'];

const HINT =
  'берите токен — var(--primary), var(--muted-foreground), var(--border) — или @apply с семантическим классом (bg-primary, text-muted-foreground, border-border); полупрозрачность — color-mix(in oklab, var(--primary) 30%, transparent)';

/** @type {import('stylelint').Config} */
const config = {
  rules: {
    'color-no-hex': [
      true,
      { message: (/** @type {string} */ hex) => `Цвет литералом (${hex}) запрещён: ${HINT}.` },
    ],
    'color-named': [
      'never',
      { message: (/** @type {string} */ name) => `Именованный цвет (${name}) запрещён: ${HINT}.` },
    ],
    'function-disallowed-list': [
      colorFunctions,
      {
        message: (/** @type {string} */ fn) =>
          `Цветовая функция ${fn}() с литералом запрещена: ${HINT}.`,
      },
    ],
  },
};

export default config;
```

(Аннотации `/** @type {string} */` у параметров обязательны: без них `tsc` с `checkJs` падает с TS7006 — тип `Config.rules` не даёт контекста колбэкам `message`.)

`packages/lint-config/stylelint.d.ts`:

```ts
import type { Config } from 'stylelint';

export declare const colorFunctions: string[];

declare const config: Config;
export default config;
```

- [ ] **Step 4: README**

`packages/lint-config/README.md`:

````markdown
# @mednet/lint-config

ESLint и stylelint для проектов ЦНИИОИЗ: не пускают в проект чужие UI-библиотеки, примитивы мимо `@mednet/ui`, иконки не из `lucide-react` и цвета вне токенов бренда. Только встроенные правила — без своих плагинов.

## ESLint (Next 16)

```bash
npm i -D eslint@^9 eslint-config-next @mednet/lint-config
```

`eslint.config.mjs` — после конфигов Next:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import mednet from '@mednet/lint-config/eslint';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...mednet,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
```

Свои запреты **дополняйте**, а не объявляйте заново — правило с тем же именем заменяет наше целиком:

```js
import mednet, { restrictedImports } from '@mednet/lint-config/eslint';

// …после ...mednet:
{
  rules: {
    'no-restricted-imports': [
      'error',
      { ...restrictedImports, paths: [...restrictedImports.paths, { name: 'lodash', message: 'Берите lodash-es' }] },
    ],
  },
},
```

## stylelint

```bash
npm i -D stylelint @mednet/lint-config
```

`stylelint.config.mjs`:

```js
/** @type {import('stylelint').Config} */
const config = {
  extends: ['@mednet/lint-config/stylelint'],
  ignoreFiles: ['.next/**', 'out/**', 'build/**'],
};

export default config;
```

`package.json`: `"lint:css": "stylelint \"**/*.css\" --allow-empty-input"`. Не подключайте `stylelint-config-standard`: на Tailwind v4 он даёт ложные ошибки.

## Что не ловится

Цвет через переменную (`const c = '#fff'; style={{ color: c }}`), именованные цвета в `style`, `@apply bg-[#fff]` в CSS, динамический `import('antd')`. Это ловит ревью.

## Лицензия

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России.
````

- [ ] **Step 5: Тест проходит**

Run: `pnpm --filter @mednet/lint-config test && pnpm --filter @mednet/lint-config typecheck`
Expected: PASS — 4 теста; typecheck без ошибок.

- [ ] **Step 6: Commit**

```bash
pnpm format:check
git add packages/lint-config
git commit -m "feat(lint-config): stylelint config — literal colours banned, Tailwind v4 syntax clean"
```

---

### Task 11: `@mednet/css` — выравнивание статики под shadcn Maia

**Files:**
- Modify: `packages/css/src/overrides.css`, `packages/css/test/build.test.ts`, `apps/docs/tests/__screenshots__/static-demo.png`
- Create: `.changeset/css-maia-parity.md`

**Interfaces:**
- Consumes: ничего из других задач (селекторы Basecoat 1.0.2 в `dist/mednet.css`).
- Produces: статика совпадает с React (`@mednet/ui`) по вычисленным стилям — это проверит тест паритета (Task 13).

Прототип сравнил 561 свойство в 38 парах «React ↔ статика». После бренд-правок React расходятся 12, **все на стороне Basecoat** — отступления от shadcn Maia (эталон, спека пилота П13) и от спеки:
- граница контурной кнопки в фокусе и с `aria-invalid` — бежевая вместо синей/красной (у Basecoat `.btn[data-variant='outline']` той же специфичности идёт позже `.btn:focus-visible` — нарушение D7);
- триггер select — `font-weight: 400` вместо 500 (спека §5);
- заголовок карточки — `leading-none` (16px) вместо 1.5;
- вкладки: высота, тень у активной, контур фокуса.
Плюс общее для обеих сторон: наведение на основную кнопку (`primary/80`) даёт белому тексту 3.20:1 — меньше AA; спека задаёт `--primary-hover` (5.23:1). 8 правил ниже дают 561 из 561 (7 проверены вставкой в прототипе; правило наведения — тем же механизмом, проверит тест паритета).

- [ ] **Step 1: Падающий тест**

В `packages/css/test/build.test.ts` в `describe('бренд-правки Basecoat (src/overrides.css)', …)` добавить (хелпер `winning` уже есть в этом блоке):

```ts
  const FOCUS = COMPONENTS;
  const HOVER_PRIMARY = ':is(.btn:not([data-variant]), .btn[data-variant="primary"]):hover';

  it('контурная кнопка: в фокусе синяя граница (D7), с ошибкой — красная', () => {
    expect(winning('.btn[data-variant="outline"]:focus-visible', FOCUS, 'border-color')).toBe(
      'var(--ring)',
    );
    expect(winning('.btn[data-variant="outline"][aria-invalid="true"]', FOCUS, 'border-color')).toBe(
      'var(--destructive)',
    );
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
```

Run: `pnpm --filter @mednet/css build && pnpm --filter @mednet/css test`
Expected: FAIL — 5 новых тестов (`expected undefined to be 'var(--ring)'` и т. п.).

Если `winning(...)` возвращает `undefined` уже после Step 2, значит, Lightning CSS записал селектор иначе: найти его в `dist/mednet.css` (`grep -n 'aria-invalid' packages/css/dist/mednet.css`) и поправить строку в тесте, а не правило.

- [ ] **Step 2: Правила**

В `packages/css/src/overrides.css` внутри `@layer components { … }` перед блоком про уменьшение движения добавить:

```css
  /*
   * Выравнивание под shadcn Maia — эталон стиля (спека пилота П13); расхождения нашёл тест паритета.
   * Контурная кнопка: .btn[data-variant='outline'] у Basecoat той же специфичности, что
   * .btn:focus-visible и [aria-invalid], но идёт позже и перебивает их границу.
   */
  .btn[data-variant='outline']:focus-visible {
    border-color: var(--ring);
  }

  .btn[data-variant='outline'][aria-invalid='true'] {
    border-color: var(--destructive);
  }

  /* Текст 500 (спека §5): Basecoat ставит триггеру select font-normal. */
  .select:not(select) > button {
    font-weight: inherit;
  }

  /* Заголовок карточки как в shadcn Maia: межстрочный 1.5 (Basecoat card.css даёт leading-none). */
  .card > header > :is(h2, h3, [data-title], .card-title) {
    line-height: var(--mn-text-base-line-height);
  }

  /*
   * Вкладки как в shadcn Maia: высота calc(100% - 1px), без тени у активной, контур 1px в фокусе.
   * Тень гасится через --tw-shadow, а не box-shadow: none — иначе пропадёт и кольцо фокуса.
   */
  .tabs > [role='tablist'] > [role='tab'] {
    height: calc(100% - 1px);
  }

  .tabs > [role='tablist']:not([data-variant='line']) > [role='tab'][aria-selected='true'] {
    --tw-shadow: 0 0 #0000;
  }

  .tabs > [role='tablist'] > [role='tab']:focus-visible {
    outline: 1px solid var(--ring);
  }
```

И в существующий блок `@media (hover: hover) { … }` (там правило контурной кнопки) добавить:

```css
    /* Maia: primary/80 — белый текст 3.20:1, меньше AA; токен --primary-hover (#a55551) — 5.23:1. */
    :is(.btn:not([data-variant]), .btn[data-variant='primary']):hover,
    :is(.badge:not([data-variant]), .badge[data-variant='primary']):is(a):hover {
      background-color: var(--primary-hover);
    }
```

- [ ] **Step 3: Тест проходит**

Run: `pnpm --filter @mednet/css build && pnpm --filter @mednet/css test`
Expected: PASS (все, включая старые тесты `--field` и reduced-motion). Если новый тест не находит значение, а правило в `dist/mednet.css` есть, — Lightning CSS записал селектор или значение иначе (например, `0 0 #0000`): поправить строку в тесте по фактическому выводу, правило не трогать.

- [ ] **Step 4: Эталон скриншота статики**

Правило заголовка карточки (межстрочный 1 → 1.5) сдвигает всё, что ниже карточки на демо-странице статики, примерно на 8px — эталон `static-demo.png` меняется намеренно.

Run: `pnpm test:visual`
Expected: падает скриншот `static-demo` (и, возможно, страницы docs, где показаны компоненты статики); axe и интерактивные тесты — PASS.

Run: `pnpm --filter docs test:visual:update`
Затем **посмотреть каждый изменившийся PNG** в `apps/docs/tests/__screenshots__/` (Read): изменения — только от правил этой задачи (заголовок карточки, вкладки, триггер select). Если изменилось что-то ещё — найти причину, а не принимать эталон.

Run: `pnpm test:visual`
Expected: всё PASS.

- [ ] **Step 5: Changeset**

`.changeset/css-maia-parity.md`:

```markdown
---
'@mednet/css': minor
---

Компоненты статики выровнены под shadcn Maia (как в `@mednet/ui`): синяя граница контурной кнопки в фокусе и красная — с ошибкой, текст триггера select 500, межстрочный заголовка карточки 1.5, вкладки без тени у активной и с контуром в фокусе. Наведение на основную кнопку — токен `--primary-hover` (контраст белого текста 5.23:1 вместо 3.20:1).
```

(Тип `minor`, а не `major` по правилу «изменение бренда, меняющее вид»: это исправления до спеки, цвета бренда не меняются, кит ещё не внедрён. Окончательно тип подтверждает владелец до мержа Version PR.)

- [ ] **Step 6: Commit**

```bash
pnpm format:check
git add packages/css .changeset/css-maia-parity.md apps/docs/tests/__screenshots__
git commit -m "fix(css): align Basecoat with shadcn Maia — outline focus/invalid border, select weight, card title, tabs, primary hover contrast"
```

---

### Task 12: Docs-сайт — страница `/ui` и каркасы на собранном пакете

**Files:**
- Modify: `apps/docs/package.json`, `apps/docs/app/layout.tsx`, `apps/docs/app/globals.css`, `apps/docs/tests/pages.ts`, `apps/docs/tests/__screenshots__/*.png`
- Move: `apps/docs/app/page.tsx`, `apps/docs/app/tokens/`, `apps/docs/app/css/`, `apps/docs/app/recipes/` → `apps/docs/app/(site)/…`
- Create: `apps/docs/app/(site)/layout.tsx`, `apps/docs/app/(site)/ui/page.tsx`, `apps/docs/app/(site)/ui/demos.tsx`, `apps/docs/app/(demo)/ui/app-shell/page.tsx`, `apps/docs/app/(demo)/ui/public-layout/page.tsx`, `apps/docs/tests/ui.spec.ts`

**Interfaces:**
- Consumes: `@mednet/ui` целиком (Tasks 2–8): `Button`, `Badge`, `Input`, `Label`, `Textarea`, `Card*`, `Alert*`, `Tabs*`, `Checkbox`, `Switch`, `Dialog*`, `Toaster`/`toast`, `TooltipProvider`, `ChartContainer`/`ChartTooltip*`, `Sidebar*`, `Logo`, `SiteHeader`, `SiteFooter`, `PublicLayout`, `AppShell`, корневой индекс `@mednet/ui`.
- Produces: страницы `/ui/`, `/ui/app-shell/`, `/ui/public-layout/` в скриншот- и axe-тестах; корневой layout docs с обвязкой Base UI (её же повторит шаблон в плане B); группы маршрутов `(site)` (страницы с шапкой docs) и `(demo)` (страницы во весь экран).

Страница — интеграционный тест пакета: Next собирает его из `dist` с серверными компонентами и `output: 'export'`, без `transpilePackages`.

- [ ] **Step 1: Зависимости и стили**

В `apps/docs/package.json` в `dependencies` добавить `"@mednet/ui": "workspace:*"`, `"lucide-react": "^1.56.0"`, `"recharts": "3.8.0"` (Recharts — прямая зависимость приложения, которое рисует свои графики: pnpm строгий; версия — как у `@mednet/ui`). `@fontsource/montserrat` из зависимостей docs убрать: шрифт теперь подключает `@mednet/ui/styles.css`.

Run: `pnpm install`

`apps/docs/app/globals.css` целиком:

```css
@import '@mednet/ui/styles.css';

@layer base {
  h1,
  h2,
  h3 {
    font-weight: var(--mn-font-weight-heading);
  }
}
```

- [ ] **Step 2: Корневой layout и группа `(site)`**

```bash
cd apps/docs/app
mkdir -p "(site)"
git mv page.tsx tokens css recipes "(site)/"
cd ../../..
```

`apps/docs/app/layout.tsx` целиком:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from '@mednet/ui/toast';
import { TooltipProvider } from '@mednet/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'mednet-kit', template: '%s — mednet-kit' },
  description: 'Дизайн-система ЦНИИОИЗ',
};

// Обвязка Base UI (llms.md @mednet/ui): relative — бэкдропы в Safari iOS 26+,
// isolate — порталы всегда поверх страницы, Toaster — один на приложение.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="relative">
        <div className="isolate">
          <TooltipProvider>{children}</TooltipProvider>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
```

`apps/docs/app/(site)/layout.tsx`:

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'Обзор' },
  { href: '/tokens/', label: 'Токены' },
  { href: '/css/', label: 'CSS для статики' },
  { href: '/ui/', label: 'React' },
  { href: '/recipes/', label: 'Внедрение' },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <nav
          aria-label="Разделы"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-4"
        >
          <span className="font-bold">mednet-kit</span>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}
```

Run: `pnpm turbo run build --filter=docs...`
Expected: сборка зелёная, в `apps/docs/out` — те же страницы `/`, `/tokens/`, `/css/`, `/recipes/`.

- [ ] **Step 3: Страница `/ui`**

`apps/docs/app/(site)/ui/demos.tsx` (клиентские примеры: диалог, уведомление, график):

```tsx
'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Button } from '@mednet/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@mednet/ui/chart';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mednet/ui/dialog';
import { Input } from '@mednet/ui/input';
import { Label } from '@mednet/ui/label';
import { toast } from '@mednet/ui/toast';

export function DemoDialog() {
  return (
    <Dialog>
      {/* Base UI: render вместо asChild */}
      <DialogTrigger render={<Button variant="outline" />}>Открыть диалог</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заявка на обучение</DialogTitle>
          <DialogDescription>Проверьте данные перед отправкой.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="dialog-email">Эл. почта</Label>
          <Input id="dialog-email" type="email" placeholder="name@example.ru" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
          <Button>Отправить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DemoToast() {
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast.add({ title: 'Заявка отправлена', description: 'Номер 2026-0142', type: 'success' })
      }
    >
      Показать уведомление
    </Button>
  );
}

const DATA = [
  { district: 'ЦФО', requests: 1284 },
  { district: 'СЗФО', requests: 642 },
  { district: 'ЮФО', requests: 511 },
  { district: 'ПФО', requests: 798 },
  { district: 'СФО', requests: 318 },
];
const CONFIG = { requests: { label: 'Заявок', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function DemoChart() {
  return (
    <ChartContainer config={CONFIG} className="h-56 w-full">
      <BarChart data={DATA} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="district" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {/* Без анимации: иначе скриншот снимается на пустом графике (столбцы растут ~1,5 с). */}
        <Bar dataKey="requests" fill="var(--color-requests)" radius={8} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
```

`apps/docs/app/(site)/ui/page.tsx` (серверный компонент; импортирует и серверные, и клиентские модули — так проверяется RSC):

```tsx
import type { Metadata } from 'next';
import { Badge } from '@mednet/ui';
import { Alert, AlertDescription, AlertTitle } from '@mednet/ui/alert';
import { Button, buttonVariants } from '@mednet/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@mednet/ui/card';
import { Checkbox } from '@mednet/ui/checkbox';
import { Input } from '@mednet/ui/input';
import { Label } from '@mednet/ui/label';
import { Logo } from '@mednet/ui/logo';
import { SiteFooter } from '@mednet/ui/site-footer';
import { SiteHeader } from '@mednet/ui/site-header';
import { Switch } from '@mednet/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mednet/ui/tabs';
import { Textarea } from '@mednet/ui/textarea';
import { DemoChart, DemoDialog, DemoToast } from './demos';

export const metadata: Metadata = { title: 'React' };

export default function UiPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-h1">React: @mednet/ui</h1>
        <p className="text-lead text-muted-foreground">
          Весь набор shadcn/ui на Base UI в стиле Maia и теме бренда. Подключение — одна строка CSS
          и импорты по подпутям; правила для агентов — в node_modules/@mednet/ui/llms.md.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Кнопки</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Отправить заявку</Button>
          <Button variant="outline">Контурная</Button>
          <Button variant="secondary">Вторичная</Button>
          <Button variant="ghost">Прозрачная</Button>
          <Button variant="destructive">Удалить</Button>
          <Button variant="link">Ссылка</Button>
          <Button disabled>Недоступна</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Маленькая</Button>
          <Button size="lg">Большая</Button>
          {/* Ссылка с видом кнопки — классы кнопки на <a>, а не Button с render (у ссылки своя семантика). */}
          <a href="/recipes/" className={buttonVariants({ variant: 'outline' })}>
            Ссылка-кнопка
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Бейджи</h2>
        <div className="flex flex-wrap gap-3">
          <Badge>Новое</Badge>
          <Badge variant="secondary">Черновик</Badge>
          <Badge variant="outline">Архив</Badge>
          <Badge variant="destructive">Отклонено</Badge>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ui-name">ФИО</Label>
          <Input id="ui-name" placeholder="Иванова Мария Петровна" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ui-snils">СНИЛС</Label>
          <Input id="ui-snils" aria-invalid defaultValue="123-456-789 00" />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="ui-comment">Комментарий</Label>
          <Textarea id="ui-comment" placeholder="Текст" />
        </div>
        <div className="flex items-center gap-3">
          <Checkbox id="ui-agree" defaultChecked />
          <Label htmlFor="ui-agree">Согласен на обработку данных</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="ui-notify" />
          <Label htmlFor="ui-notify">Уведомлять по почте</Label>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Заявка на обучение</CardTitle>
            <CardDescription>Программа «Организация здравоохранения»</CardDescription>
          </CardHeader>
          <CardContent>Приём документов до 31 октября.</CardContent>
          <CardFooter className="gap-3">
            <DemoDialog />
            <DemoToast />
          </CardFooter>
        </Card>
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Приём заявок открыт</AlertTitle>
            <AlertDescription>Заявки принимаются до 31 октября.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Проверьте СНИЛС</AlertTitle>
            <AlertDescription>Контрольная сумма не совпадает.</AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Вкладки и график</h2>
        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Заявки по округам</TabsTrigger>
            <TabsTrigger value="about">О данных</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <DemoChart />
          </TabsContent>
          <TabsContent value="about">Тестовые данные.</TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Логотип</h2>
        <div className="flex flex-wrap items-end gap-10">
          <Logo className="h-14 w-auto" title="ЦНИИОИЗ" />
          <Logo variant="vertical" className="h-20 w-auto" title="ЦНИИОИЗ" />
          <Logo variant="mark" className="h-12 w-auto" title="ЦНИИОИЗ" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Шапка и подвал</h2>
        <p>
          Каркасы целиком: <a className="text-primary underline" href="/ui/public-layout/">PublicLayout</a>,{' '}
          <a className="text-primary underline" href="/ui/app-shell/">AppShell</a>.
        </p>
        <div className="overflow-hidden rounded-2xl border border-border">
          <SiteHeader
            nav={
              <>
                <a href="#about">О проекте</a>
                <a href="#reports">Отчёты</a>
              </>
            }
            actions={<Button size="sm">Войти</Button>}
          />
          <SiteFooter year={2026} links={<a href="#privacy">Политика конфиденциальности</a>} />
        </div>
      </section>
    </div>
  );
}
```

`Badge` намеренно импортирован из корневого `@mednet/ui` — так сборка проверяет и корневой индекс в RSC. `year={2026}` — чтобы скриншот не менялся с наступлением нового года.

- [ ] **Step 4: Каркасы во весь экран — группа `(demo)`**

`apps/docs/app/(demo)/ui/public-layout/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Button } from '@mednet/ui/button';
import { PublicLayout } from '@mednet/ui/public-layout';
import { SiteFooter } from '@mednet/ui/site-footer';

export const metadata: Metadata = { title: 'PublicLayout' };

export default function PublicLayoutDemo() {
  return (
    <PublicLayout
      homeHref="/ui/"
      nav={
        <>
          <a href="#about">О проекте</a>
          <a href="#reports">Отчёты</a>
          <a href="#contacts">Контакты</a>
        </>
      }
      actions={<Button size="sm">Подать заявку</Button>}
      footer={<SiteFooter year={2026} />}
    >
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6">
        <h1 className="text-h1">Мониторинг здравоохранения</h1>
        <p className="text-lead text-muted-foreground">
          Лендинг на PublicLayout: шапка с логотипом ЦНИИОИЗ, содержимое, подвал с реквизитами.
        </p>
        <Button size="lg">Начать</Button>
      </section>
    </PublicLayout>
  );
}
```

`apps/docs/app/(demo)/ui/app-shell/page.tsx`:

```tsx
import { FileText, LayoutDashboard, Settings } from 'lucide-react';
import type { Metadata } from 'next';
import { AppShell } from '@mednet/ui/app-shell';
import { Button } from '@mednet/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@mednet/ui/card';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@mednet/ui/sidebar';

export const metadata: Metadata = { title: 'AppShell' };

const ITEMS = [
  { href: '#dashboard', label: 'Дашборд', icon: LayoutDashboard, active: true },
  { href: '#reports', label: 'Отчёты', icon: FileText, active: false },
  { href: '#settings', label: 'Настройки', icon: Settings, active: false },
];

// Static export: defaultOpen не передаём (cookies() недоступны).
export default function AppShellDemo() {
  return (
    <AppShell
      homeHref="/ui/"
      title="Мониторинг"
      actions={<Button size="sm" variant="outline">Профиль</Button>}
      nav={
        <SidebarGroup>
          <SidebarGroupLabel>Разделы</SidebarGroupLabel>
          <SidebarMenu>
            {ITEMS.map(({ href, label, icon: Icon, active }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton isActive={active} tooltip={label} render={<a href={href} />}>
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Заявок за месяц', '3 553'],
          ['Обработано', '2 918'],
          ['Средний срок', '4,2 дня'],
        ].map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-h3">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 5: Интерактивные тесты — падающие**

`apps/docs/tests/pages.ts` — добавить в `PAGES` (после `recipes`):

```ts
  ['ui', '/ui/'],
  ['ui-app-shell', '/ui/app-shell/'],
  ['ui-public-layout', '/ui/public-layout/'],
```

`apps/docs/tests/ui.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('диалог открывается и закрывается с клавиатуры', async ({ page }) => {
  await page.goto('/ui/');
  await page.getByRole('button', { name: 'Открыть диалог' }).click();
  const dialog = page.getByRole('dialog', { name: 'Заявка на обучение' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('уведомление появляется', async ({ page }) => {
  await page.goto('/ui/');
  await page.getByRole('button', { name: 'Показать уведомление' }).click();
  await expect(page.getByText('Заявка отправлена')).toBeVisible();
});

test('бренд: поля белые, наведение на основную кнопку — --primary-hover', async ({ page }) => {
  await page.goto('/ui/');
  await expect(page.getByLabel('ФИО')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Контурная' })).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  const primary = page.getByRole('button', { name: 'Отправить заявку' });
  await primary.hover();
  await expect(primary).toHaveCSS('background-color', 'rgb(165, 85, 81)');
});

test('шрифт Montserrat загружен', async ({ page }) => {
  await page.goto('/ui/');
  expect(await page.evaluate(() => document.fonts.check('500 16px Montserrat'))).toBe(true);
});

test('AppShell: кнопка меню сворачивает боковую панель', async ({ page }) => {
  await page.goto('/ui/app-shell/');
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await page.locator('[data-slot="sidebar-trigger"]').click();
  await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
});
```

- [ ] **Step 6: Прогнать в Docker и обновить эталоны**

Run: `pnpm test:visual`
Expected: падают скриншоты новых страниц (эталонов ещё нет) и, возможно, старых — общий слой `base` из `@mednet/ui` (`border-border`, `outline-ring/50`) и шрифт из `@mednet/ui` могли сдвинуть пиксели. Интерактивные тесты и axe — PASS. Если axe нашёл serious/critical на новых страницах — исправить разметку страницы (не пакет), если причина в странице; если в пакете — остановиться и сообщить.

Run: `pnpm --filter docs test:visual:update`
Затем **посмотреть каждый изменившийся PNG** в `apps/docs/tests/__screenshots__/` (Read): у старых страниц — никаких заметных изменений, кроме не более чем пиксельных; у `ui.png` — белые поля, кнопки-пилюли, Montserrat, логотип, шапка, подвал; у `ui-app-shell.png` — бежевая боковая панель с логотипом и активным пунктом; у `ui-public-layout.png` — шапка, текст, подвал с реквизитами. Если старая страница изменилась заметно — найти причину, а не принимать эталон.

Run: `pnpm test:visual`
Expected: всё PASS.

- [ ] **Step 7: Commit**

```bash
pnpm format:check
git add apps/docs pnpm-lock.yaml
git commit -m "feat(docs): /ui showcase, PublicLayout and AppShell demos on the built @mednet/ui"
```

---

### Task 13: Тест паритета React ↔ статика

**Files:**
- Create: `apps/docs/app/(demo)/parity/page.tsx`, `apps/docs/app/(demo)/parity/dialog/page.tsx`, `apps/docs/app/(demo)/parity/parity-dialog.tsx`, `apps/docs/public/parity/static.html`, `apps/docs/public/parity/static-dialog.html`, `apps/docs/tests/parity.spec.ts`, `apps/docs/tests/parity-known.json`

**Interfaces:**
- Consumes: `@mednet/ui` (Tasks 2–8), `@mednet/css` из workspace с правками Task 11 (страница `/static-demo/dist/mednet.css` копируется `scripts/copy-static-demo.mjs`), корневой layout docs (Task 12).
- Produces: тест, который валит CI при любом новом расхождении React и статики по вычисленным стилям, а также при устаревшей записи в `parity-known.json`.

Как устроено (проверено прототипом в Docker): 38 пар элементов с одинаковым `data-testid` на React-странице и статической; для каждой — вычисленные стили в покое, при наведении и после фокуса с клавиатуры; цвет — в байтах sRGB через canvas, фон — видимый (с учётом подложек), шрифт — тот, которым Chromium реально нарисовал текст (CDP). Допуски: длины ±0,5px, цвета ±3/255 и ±0,02 альфы. Пиксели не сравниваются: на тексте они расходятся на 3–12 % даже при совпадении всех стилей. После Tasks 4 и 11 ожидается 561 из 561 — `parity-known.json` пустой.

- [ ] **Step 1: React-страницы пар**

`apps/docs/app/(demo)/parity/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Alert, AlertDescription, AlertTitle } from '@mednet/ui/alert';
import { Badge } from '@mednet/ui/badge';
import { Button } from '@mednet/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@mednet/ui/card';
import { Checkbox } from '@mednet/ui/checkbox';
import { Input } from '@mednet/ui/input';
import { Label } from '@mednet/ui/label';
import { RadioGroup, RadioGroupItem } from '@mednet/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mednet/ui/select';
import { Switch } from '@mednet/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mednet/ui/tabs';
import { Textarea } from '@mednet/ui/textarea';

export const metadata: Metadata = { title: 'Паритет: React' };

const REGIONS = [
  { value: 'msk', label: 'Москва' },
  { value: 'spb', label: 'Санкт-Петербург' },
  { value: 'nsk', label: 'Новосибирская область' },
];

// Пары для tests/parity.spec.ts: data-testid совпадают с public/parity/static.html.
export default function ParityPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <h1 className="text-h2">@mednet/ui — пары для сверки со статикой</h1>
      <section className="space-y-3">
        <h2 className="text-h4">Кнопки</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button data-testid="btn-default">Основная</Button>
          <Button data-testid="btn-outline" variant="outline">Контурная</Button>
          <Button data-testid="btn-secondary" variant="secondary">Вторичная</Button>
          <Button data-testid="btn-ghost" variant="ghost">Прозрачная</Button>
          <Button data-testid="btn-destructive" variant="destructive">Удалить</Button>
          <Button data-testid="btn-link" variant="link">Ссылка</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button data-testid="btn-xs" size="xs">XS</Button>
          <Button data-testid="btn-sm" size="sm">Маленькая</Button>
          <Button>Обычная</Button>
          <Button data-testid="btn-lg" size="lg">Большая</Button>
          <Button data-testid="btn-icon" size="icon" aria-label="Иконка">+</Button>
          <Button data-testid="btn-disabled" disabled>Недоступна</Button>
          <Button variant="outline" disabled>Недоступна</Button>
          <Button data-testid="btn-invalid" variant="outline" aria-invalid>Ошибка</Button>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-h4">Бейджи</h2>
        <div className="flex flex-wrap gap-3">
          <Badge data-testid="badge-default">Новое</Badge>
          <Badge data-testid="badge-secondary" variant="secondary">Черновик</Badge>
          <Badge data-testid="badge-outline" variant="outline">Архив</Badge>
          <Badge data-testid="badge-destructive" variant="destructive">Отклонено</Badge>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name" data-testid="label">ФИО</Label>
          <Input id="name" data-testid="input" placeholder="Иванова Мария Петровна" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bad">С ошибкой</Label>
          <Input id="bad" data-testid="input-invalid" aria-invalid defaultValue="123" />
        </div>
        <div className="grid gap-2">
          <Label>Регион</Label>
          <Select items={REGIONS} defaultValue="msk">
            <SelectTrigger data-testid="select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea id="comment" data-testid="textarea" placeholder="Текст" />
        </div>
        <div className="flex items-center gap-3">
          <Checkbox data-testid="checkbox" id="c1" />
          <Label htmlFor="c1">Согласен</Label>
          <Checkbox data-testid="checkbox-checked" defaultChecked aria-label="Отмечено" />
          <Switch data-testid="switch" aria-label="Выключено" />
          <Switch data-testid="switch-checked" defaultChecked aria-label="Включено" />
        </div>
        <RadioGroup defaultValue="a" className="flex gap-4">
          <Label>
            <RadioGroupItem data-testid="radio-checked" value="a" /> Очно
          </Label>
          <Label>
            <RadioGroupItem data-testid="radio" value="b" /> Заочно
          </Label>
        </RadioGroup>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <Card data-testid="card">
          <CardHeader>
            <CardTitle data-testid="card-title">Заявка на обучение</CardTitle>
            <CardDescription data-testid="card-description">
              Программа «Организация здравоохранения»
            </CardDescription>
          </CardHeader>
          <CardContent>Содержимое карточки</CardContent>
          <CardFooter>
            <Button>Отправить</Button>
          </CardFooter>
        </Card>
        <div className="space-y-4">
          <Alert data-testid="alert">
            <AlertTitle data-testid="alert-title">Приём заявок открыт</AlertTitle>
            <AlertDescription>Заявки принимаются до 31 октября.</AlertDescription>
          </Alert>
          <Alert data-testid="alert-destructive" variant="destructive">
            <AlertTitle>Проверьте СНИЛС</AlertTitle>
            <AlertDescription>Контрольная сумма не совпадает.</AlertDescription>
          </Alert>
        </div>
      </section>
      <section>
        <Tabs defaultValue="t1" data-testid="tabs">
          <TabsList data-testid="tabs-list">
            <TabsTrigger data-testid="tab-active" value="t1">Обзор</TabsTrigger>
            <TabsTrigger data-testid="tab" value="t2">Детали</TabsTrigger>
          </TabsList>
          <TabsContent value="t1">Панель «Обзор»</TabsContent>
          <TabsContent value="t2">Панель «Детали»</TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
```

`apps/docs/app/(demo)/parity/parity-dialog.tsx`:

```tsx
'use client';

import { Button } from '@mednet/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mednet/ui/dialog';
import { Input } from '@mednet/ui/input';

export function ParityDialog() {
  return (
    <Dialog defaultOpen>
      <DialogContent data-testid="dialog">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Заявка на обучение</DialogTitle>
          <DialogDescription>Проверьте данные перед отправкой.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Эл. почта" aria-label="Эл. почта" />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
          <Button>Отправить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

`apps/docs/app/(demo)/parity/dialog/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { ParityDialog } from '../parity-dialog';

export const metadata: Metadata = { title: 'Паритет: диалог' };

export default function ParityDialogPage() {
  return (
    <main className="p-8">
      <p className="text-muted-foreground">Фон страницы под диалогом</p>
      <ParityDialog />
    </main>
  );
}
```

- [ ] **Step 2: Статические страницы пар**

`apps/docs/public/parity/static.html` — разметка Basecoat 1.0.2 с теми же `data-testid` (проверена в прототипе):

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Паритет: статика</title>
    <link rel="stylesheet" href="/static-demo/dist/mednet.css" />
    <script src="/static-demo/dist/mednet.js" defer></script>
    <style>
      /* раскладка (в mednet.css нет утилит) повторяет React-страницу: max-w-4xl, p-8, gap-3 */
      main { max-width: 56rem; margin: 0 auto; padding: 2rem; display: grid; gap: 2rem; }
      .row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .stack { display: grid; gap: 0.5rem; align-content: start; }
    </style>
  </head>
  <body>
    <main>
      <h1>@mednet/css — пары для сверки с React</h1>
      <section class="stack">
        <h2>Кнопки</h2>
        <div class="row">
          <button class="btn" type="button" data-testid="btn-default">Основная</button>
          <button class="btn" data-variant="outline" type="button" data-testid="btn-outline">Контурная</button>
          <button class="btn" data-variant="secondary" type="button" data-testid="btn-secondary">Вторичная</button>
          <button class="btn" data-variant="ghost" type="button" data-testid="btn-ghost">Прозрачная</button>
          <button class="btn" data-variant="destructive" type="button" data-testid="btn-destructive">Удалить</button>
          <button class="btn" data-variant="link" type="button" data-testid="btn-link">Ссылка</button>
        </div>
        <div class="row">
          <button class="btn" data-size="xs" type="button" data-testid="btn-xs">XS</button>
          <button class="btn" data-size="sm" type="button" data-testid="btn-sm">Маленькая</button>
          <button class="btn" type="button">Обычная</button>
          <button class="btn" data-size="lg" type="button" data-testid="btn-lg">Большая</button>
          <button class="btn" data-size="icon" type="button" aria-label="Иконка" data-testid="btn-icon">+</button>
          <button class="btn" type="button" disabled data-testid="btn-disabled">Недоступна</button>
          <button class="btn" data-variant="outline" type="button" disabled>Недоступна</button>
          <button class="btn" data-variant="outline" type="button" aria-invalid="true" data-testid="btn-invalid">Ошибка</button>
        </div>
      </section>
      <section class="stack">
        <h2>Бейджи</h2>
        <div class="row">
          <span class="badge" data-testid="badge-default">Новое</span>
          <span class="badge" data-variant="secondary" data-testid="badge-secondary">Черновик</span>
          <span class="badge" data-variant="outline" data-testid="badge-outline">Архив</span>
          <span class="badge" data-variant="destructive" data-testid="badge-destructive">Отклонено</span>
        </div>
      </section>
      <section class="grid2">
        <div class="stack">
          <label class="label" for="name" data-testid="label">ФИО</label>
          <input class="input" type="text" id="name" placeholder="Иванова Мария Петровна" data-testid="input" />
        </div>
        <div class="stack">
          <label class="label" for="bad">С ошибкой</label>
          <input class="input" type="text" id="bad" aria-invalid="true" value="123" data-testid="input-invalid" />
        </div>
        <div class="stack">
          <label class="label">Регион</label>
          <div class="select" id="region">
            <button type="button" id="region-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="region-listbox" data-testid="select">
              <span class="truncate">Москва</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-muted-foreground opacity-50 shrink-0"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <div id="region-popover" data-popover aria-hidden="true">
              <div role="listbox" id="region-listbox" aria-orientation="vertical" aria-labelledby="region-trigger">
                <div role="option" data-value="msk" aria-selected="true">Москва</div>
                <div role="option" data-value="spb">Санкт-Петербург</div>
                <div role="option" data-value="nsk">Новосибирская область</div>
              </div>
            </div>
            <input type="hidden" name="region" value="msk" />
          </div>
        </div>
        <div class="stack">
          <label class="label" for="comment">Комментарий</label>
          <textarea class="textarea" id="comment" placeholder="Текст" data-testid="textarea"></textarea>
        </div>
        <div class="row">
          <input type="checkbox" class="input" id="c1" data-testid="checkbox" />
          <label class="label" for="c1">Согласен</label>
          <input type="checkbox" class="input" checked aria-label="Отмечено" data-testid="checkbox-checked" />
          <input type="checkbox" role="switch" class="input" aria-label="Выключено" data-testid="switch" />
          <input type="checkbox" role="switch" class="input" checked aria-label="Включено" data-testid="switch-checked" />
        </div>
        <div class="row">
          <label class="label"><input type="radio" class="input" name="form" value="a" checked data-testid="radio-checked" /> Очно</label>
          <label class="label"><input type="radio" class="input" name="form" value="b" data-testid="radio" /> Заочно</label>
        </div>
      </section>
      <section class="grid2">
        <div class="card" data-testid="card">
          <header>
            <h2 data-testid="card-title">Заявка на обучение</h2>
            <p data-testid="card-description">Программа «Организация здравоохранения»</p>
          </header>
          <section>Содержимое карточки</section>
          <footer><button class="btn" type="button">Отправить</button></footer>
        </div>
        <div class="stack">
          <div class="alert" data-testid="alert">
            <h2 data-testid="alert-title">Приём заявок открыт</h2>
            <section>Заявки принимаются до 31 октября.</section>
          </div>
          <div class="alert" data-variant="destructive" data-testid="alert-destructive">
            <h2>Проверьте СНИЛС</h2>
            <section>Контрольная сумма не совпадает.</section>
          </div>
        </div>
      </section>
      <section>
        <div class="tabs" id="tabs" data-testid="tabs">
          <nav role="tablist" aria-orientation="horizontal" data-testid="tabs-list">
            <button type="button" role="tab" id="tabs-tab-1" aria-controls="tabs-panel-1" aria-selected="true" tabindex="0" data-testid="tab-active">Обзор</button>
            <button type="button" role="tab" id="tabs-tab-2" aria-controls="tabs-panel-2" aria-selected="false" tabindex="-1" data-testid="tab">Детали</button>
          </nav>
          <div role="tabpanel" id="tabs-panel-1" aria-labelledby="tabs-tab-1" tabindex="-1">Панель «Обзор»</div>
          <div role="tabpanel" id="tabs-panel-2" aria-labelledby="tabs-tab-2" tabindex="-1" hidden>Панель «Детали»</div>
        </div>
      </section>
    </main>
  </body>
</html>
```

`apps/docs/public/parity/static-dialog.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Паритет: статика, диалог</title>
    <link rel="stylesheet" href="/static-demo/dist/mednet.css" />
    <script src="/static-demo/dist/mednet.js" defer></script>
  </head>
  <body>
    <main style="padding: 2rem"><p>Фон страницы под диалогом</p></main>
    <dialog id="dlg" class="dialog" aria-labelledby="dlg-title" aria-describedby="dlg-desc">
      <div data-testid="dialog">
        <header>
          <h2 id="dlg-title" data-testid="dialog-title">Заявка на обучение</h2>
          <p id="dlg-desc">Проверьте данные перед отправкой.</p>
        </header>
        <section><input class="input" type="email" placeholder="Эл. почта" aria-label="Эл. почта" /></section>
        <footer>
          <button class="btn" data-variant="outline" type="button" onclick="this.closest('dialog').close()">Отмена</button>
          <button class="btn" type="button">Отправить</button>
        </footer>
        <button type="button" aria-label="Закрыть" onclick="this.closest('dialog').close()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>
    </dialog>
    <script>
      document.getElementById('dlg').showModal();
    </script>
  </body>
</html>
```

(Prettier переформатирует оба файла при `pnpm format` — это нормально, `data-testid` и структура сохраняются.)

- [ ] **Step 3: Тест**

`apps/docs/tests/parity-known.json`:

```json
{}
```

`apps/docs/tests/parity.spec.ts`:

```ts
// Паритет React (@mednet/ui) ↔ статика (@mednet/css): вычисленные стили пар элементов с одинаковым
// data-testid в покое, при наведении и после фокуса с клавиатуры (спека §14, спека пилота П13).
// Известные расхождения — в parity-known.json ("<id>.<состояние>.<свойство>": "причина");
// запись, которая больше не расходится, тоже валит тест — список не зарастает.
import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';

const known: Record<string, string> = JSON.parse(
  readFileSync(new URL('./parity-known.json', import.meta.url), 'utf8'),
);

type State = 'hover' | 'focus';
interface Pair {
  id: string;
  states: State[];
  page: 'main' | 'dialog';
  size: boolean;
}

const B: State[] = ['hover', 'focus'];
const PAIRS: Pair[] = (
  [
    ['btn-default', B], ['btn-outline', B], ['btn-secondary', B], ['btn-ghost', B],
    ['btn-destructive', B], ['btn-link', B],
    ['btn-xs'], ['btn-sm'], ['btn-lg'], ['btn-icon', [], { size: true }], ['btn-disabled'],
    ['btn-invalid', ['focus']],
    ['badge-default'], ['badge-secondary'], ['badge-outline'], ['badge-destructive'],
    ['label'], ['input', ['focus']], ['input-invalid', ['focus']], ['select', ['focus']],
    ['textarea', ['focus']],
    ['checkbox', ['focus'], { size: true }], ['checkbox-checked', [], { size: true }],
    ['switch', ['focus'], { size: true }], ['switch-checked', [], { size: true }],
    ['radio', [], { size: true }], ['radio-checked', ['focus'], { size: true }],
    ['card'], ['card-title'], ['card-description'], ['alert'], ['alert-title'], ['alert-destructive'],
    ['tabs-list'], ['tab-active', ['focus']], ['tab', ['hover']],
    ['dialog', [], { page: 'dialog', size: true }], ['dialog-title', [], { page: 'dialog' }],
  ] as [string, State[]?, { page?: 'dialog'; size?: boolean }?][]
).map(([id, states = [], options = {}]) => ({
  id,
  states,
  page: options.page ?? 'main',
  size: Boolean(options.size),
}));

const URLS = {
  react: { main: '/parity/', dialog: '/parity/dialog/' },
  static: { main: '/parity/static.html', dialog: '/parity/static-dialog.html' },
} as const;

type Rgba = [number, number, number, number];
interface Snapshot {
  width: number;
  height: number;
  padding: number[];
  radius: number | 'pill';
  borderWidth: number;
  borderColor: Rgba | null;
  bg: number[];
  color: Rgba;
  fontSize: number;
  fontWeight: string;
  lineHeight: number | 'normal';
  shadow: { c: Rgba; n: number[]; inset: boolean }[];
  outline: { w: number; c: Rgba; off: number; st: string } | null;
  opacity: number;
  font?: string | null;
}
type Collected = Record<string, { rest: Snapshot; hover?: Snapshot; focus?: Snapshot | 'NOT_REACHED' } | null>;

/** Выполняется в странице: вычисленные стили элемента с data-testid. */
function snapshotInPage(id: string): Snapshot | null {
  const element = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) return null;
  const w = window as unknown as { __cv?: CanvasRenderingContext2D };
  const cv = (w.__cv ??= document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D);
  const rgba = (c: string): Rgba => {
    cv.clearRect(0, 0, 1, 1);
    cv.fillStyle = '#000';
    cv.fillStyle = c;
    cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data;
    return [d[0]!, d[1]!, d[2]!, +(d[3]! / 255).toFixed(2)];
  };
  // Фон, который видит человек: заливка элемента поверх заливок предков (до непрозрачной).
  const effectiveBg = (node: HTMLElement) => {
    const layers: Rgba[] = [];
    for (let n: HTMLElement | null = node; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let out = [255, 255, 255];
    for (const [r, g, b, a] of layers.reverse()) {
      out = [r * a + out[0]! * (1 - a), g * a + out[1]! * (1 - a), b * a + out[2]! * (1 - a)];
    }
    return out.map(Math.round);
  };
  const shadows = (value: string) =>
    value === 'none'
      ? []
      : value
          .split(/,(?![^(]*\))/)
          .map((part) => part.trim())
          .map((part) => {
            const col =
              part.match(/^(rgba?\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]+)/i)?.[0] ??
              '';
            const n = part
              .replace(col, '')
              .trim()
              .split(/\s+/)
              .filter((token) => token.endsWith('px'))
              .map(parseFloat);
            return { c: rgba(col), n, inset: part.includes('inset') };
          })
          .filter((shadow) => shadow.c[3] > 0 && shadow.n.some((v) => v !== 0));
  const s = getComputedStyle(element);
  const r = element.getBoundingClientRect();
  const radius = parseFloat(s.borderTopLeftRadius);
  return {
    width: r.width,
    height: r.height,
    padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(parseFloat),
    radius: radius >= Math.min(r.height, r.width) / 2 - 0.5 ? 'pill' : radius,
    borderWidth: parseFloat(s.borderTopWidth),
    borderColor: parseFloat(s.borderTopWidth) > 0 ? rgba(s.borderTopColor) : null,
    bg: effectiveBg(element),
    color: rgba(s.color),
    fontSize: parseFloat(s.fontSize),
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight === 'normal' ? 'normal' : parseFloat(s.lineHeight),
    shadow: shadows(s.boxShadow),
    outline:
      s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0
        ? null
        : {
            w: parseFloat(s.outlineWidth),
            c: rgba(s.outlineColor),
            off: parseFloat(s.outlineOffset),
            st: s.outlineStyle,
          },
    opacity: Number(s.opacity),
  };
}

/** Шрифт, которым Chromium реально нарисовал текст (CDP), — font-family этого не покажет. */
async function renderedFont(page: Page, id: string) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: `[data-testid="${id}"]`,
  });
  let name: string | null = null;
  try {
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    name = fonts.sort((a, b) => b.glyphCount - a.glyphCount)[0]?.familyName ?? null;
  } catch {
    name = null;
  }
  await cdp.detach();
  return name;
}

async function tabTo(page: Page, id: string) {
  await page.mouse.click(2, 2);
  for (let i = 0; i < 80; i += 1) {
    await page.keyboard.press('Tab');
    const reached = await page.evaluate((testId) => {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      return !!element && (element === document.activeElement || element.contains(document.activeElement));
    }, id);
    if (reached) return true;
  }
  return false;
}

async function collect(browser: Browser, side: keyof typeof URLS): Promise<Collected> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const result: Collected = {};
  for (const kind of ['main', 'dialog'] as const) {
    await page.goto(URLS[side][kind]);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: '*,*::before,*::after{transition:none!important;animation:none!important}',
    });
    await page.waitForTimeout(150);
    for (const pair of PAIRS.filter((p) => p.page === kind)) {
      const rest = await page.evaluate(snapshotInPage, pair.id);
      if (!rest) {
        result[pair.id] = null;
        continue;
      }
      rest.font = await renderedFont(page, pair.id);
      const entry: NonNullable<Collected[string]> = { rest };
      if (pair.states.includes('hover')) {
        await page.locator(`[data-testid="${pair.id}"]`).first().hover();
        await page.waitForTimeout(50);
        entry.hover = (await page.evaluate(snapshotInPage, pair.id)) ?? undefined;
        await page.mouse.move(2, 2);
      }
      if (pair.states.includes('focus')) {
        entry.focus = (await tabTo(page, pair.id))
          ? ((await page.evaluate(snapshotInPage, pair.id)) ?? 'NOT_REACHED')
          : 'NOT_REACHED';
        await page.mouse.click(2, 2);
      }
      result[pair.id] = entry;
    }
  }
  await page.close();
  return result;
}

const TOL = { px: 0.5, ch: 3, alpha: 0.02 };
const fmtC = (c: Rgba | number[] | null) =>
  c ? (c[3] === undefined || c[3] === 1 ? `rgb(${c.slice(0, 3).join(',')})` : `rgba(${c.join(',')})`) : '—';
const eqC = (a: number[] | null, b: number[] | null) =>
  (!a && !b) ||
  (!!a &&
    !!b &&
    a.slice(0, 3).every((v, i) => Math.abs(v - b[i]!) <= TOL.ch) &&
    Math.abs((a[3] ?? 1) - (b[3] ?? 1)) <= TOL.alpha);
const eqN = (a: unknown, b: unknown) =>
  typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= TOL.px : a === b;
const fmtSh = (list: Snapshot['shadow']) =>
  list.length
    ? list.map((s) => `${s.inset ? 'inset ' : ''}${s.n.join(' ')} ${fmtC(s.c)}`).join(' + ')
    : 'none';
const eqSh = (a: Snapshot['shadow'], b: Snapshot['shadow']) =>
  a.length === b.length &&
  a.every(
    (s, i) =>
      s.inset === b[i]!.inset &&
      s.n.length === b[i]!.n.length &&
      s.n.every((v, j) => Math.abs(v - b[i]!.n[j]!) <= TOL.px) &&
      eqC(s.c, b[i]!.c),
  );

interface Row {
  key: string;
  react: string;
  static: string;
  ok: boolean;
}

function compare(pair: Pair, R: Collected[string], S: Collected[string]): Row[] {
  const rows: Row[] = [];
  const add = <T,>(state: string, prop: string, a: T, b: T, eq: (x: T, y: T) => boolean, fmt: (v: T) => string = String) =>
    rows.push({ key: `${pair.id}.${state}.${prop}`, react: fmt(a), static: fmt(b), ok: eq(a, b) });
  for (const state of ['rest', ...pair.states] as const) {
    const a = R?.[state];
    const b = S?.[state];
    if (!a || !b || a === 'NOT_REACHED' || b === 'NOT_REACHED') {
      rows.push({
        key: `${pair.id}.${state}.present`,
        react: a ? String(a === 'NOT_REACHED' ? a : 'ok') : 'MISSING',
        static: b ? String(b === 'NOT_REACHED' ? b : 'ok') : 'MISSING',
        ok: false,
      });
      continue;
    }
    if (state === 'rest') {
      add(state, 'height', a.height, b.height, eqN, (v) => v.toFixed(1));
      if (pair.size) add(state, 'width', a.width, b.width, eqN, (v) => v.toFixed(1));
      add(state, 'padding', a.padding, b.padding, (x, y) => x.every((v, i) => eqN(v, y[i])), (v) => v.join(' '));
      add(state, 'radius', a.radius, b.radius, eqN, (v) => (typeof v === 'number' ? v.toFixed(1) : v));
      add(state, 'border-width', a.borderWidth, b.borderWidth, eqN);
      add(state, 'border-color', a.borderColor, b.borderColor, eqC, fmtC);
      add(state, 'background', a.bg, b.bg, eqC, fmtC);
      add(state, 'color', a.color, b.color, eqC, fmtC);
      add(state, 'font (rendered)', a.font, b.font, (x, y) => x === y);
      add(state, 'font-size', a.fontSize, b.fontSize, eqN);
      add(state, 'font-weight', a.fontWeight, b.fontWeight, (x, y) => x === y);
      add(state, 'line-height', a.lineHeight, b.lineHeight, eqN);
      add(state, 'box-shadow', a.shadow, b.shadow, eqSh, fmtSh);
      add(state, 'opacity', a.opacity, b.opacity, (x, y) => Math.abs(x - y) < 0.01);
    } else if (state === 'hover') {
      add(state, 'background', a.bg, b.bg, eqC, fmtC);
      add(state, 'color', a.color, b.color, eqC, fmtC);
    } else {
      add(state, 'border-color', a.borderColor, b.borderColor, eqC, fmtC);
      add(state, 'box-shadow (ring)', a.shadow, b.shadow, eqSh, fmtSh);
      add(
        state,
        'outline',
        a.outline,
        b.outline,
        (x, y) => (!x && !y) || (!!x && !!y && eqN(x.w, y.w) && eqC(x.c, y.c) && eqN(x.off, y.off)),
        (o) => (o ? `${o.st} ${o.w}px ${fmtC(o.c)} off ${o.off}` : 'none'),
      );
    }
  }
  return rows;
}

test('паритет React (@mednet/ui) ↔ статика (@mednet/css)', async ({ browser }) => {
  test.setTimeout(180_000);
  const react = await collect(browser, 'react');
  const stat = await collect(browser, 'static');
  const rows = PAIRS.flatMap((pair) => compare(pair, react[pair.id] ?? null, stat[pair.id] ?? null));
  const bad = rows.filter((row) => !row.ok);
  const unexpected = bad
    .filter((row) => !known[row.key])
    .map((row) => `${row.key}: React ${row.react} ≠ статика ${row.static}`);
  const badKeys = new Set(bad.map((row) => row.key));
  const stale = Object.keys(known).filter((key) => !badKeys.has(key));
  console.log(`${rows.length} проверок, совпало ${rows.length - bad.length}, известных расхождений ${bad.length - unexpected.length}`);
  expect(unexpected, 'новые расхождения React и статики').toEqual([]);
  expect(stale, 'записи parity-known.json, которые больше не расходятся, — удалите').toEqual([]);
});
```

- [ ] **Step 4: Прогнать**

Run: `pnpm test:visual`
Expected: `паритет React (@mednet/ui) ↔ статика (@mednet/css)` — PASS, в выводе `561 проверок, совпало 561`. Скриншот- и axe-тесты страниц `parity` не снимаются (их нет в `PAGES` — это фикстуры теста).

Если расхождение есть: не подгонять под него стили наугад. Сначала понять, какая сторона отступает от shadcn Maia и спеки (таблица в описании Task 11), поправить её (`src/brand.css` для React, `src/overrides.css` для статики); только если расхождение осознанное — записать в `parity-known.json` с причиной.

- [ ] **Step 5: Commit**

```bash
pnpm format
pnpm format:check
git add apps/docs
git commit -m "test(docs): React ↔ static parity by computed styles (38 pairs, rest/hover/focus)"
```

---

### Task 14: Chrome/Edge 109 (Windows 7/8.1)

**Files:**
- Create: `packages/ui/postcss.cjs`, `packages/ui/src/__tests__/postcss.test.ts`, `apps/docs/scripts/chrome109.mjs`, `apps/docs/scripts/chrome109-docker.mjs`, `.changeset/chrome-109.md`
- Modify: `packages/ui/package.json` (экспорт `./postcss`, `files`, зависимость `lightningcss`, devDependency `postcss`), `packages/css/package.json` (devDependencies `@mednet/ui`, `postcss`), `packages/css/scripts/build.ts`, `packages/css/test/build.test.ts`, `apps/docs/postcss.config.mjs`, `apps/docs/package.json` (скрипт), `package.json` (корневой скрипт), `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `@mednet/css` (сборка, Task 11), страницы docs `/parity/`, `/parity/dialog/`, `/parity/static.html`, `/parity/static-dialog.html` (Task 13), `/ui/app-shell/` (Task 12).
- Produces: PostCSS-плагин `@mednet/ui/postcss` (CommonJS, `module.exports = legacyFallbacks`, `legacyFallbacks.postcss = true`; ставится после `@tailwindcss/postcss`); `@mednet/css` `dist/mednet.css` и `dist/mednet.min.css` с теми же исправлениями; `pnpm test:chrome109` и job CI.

Что ломается в Chromium 109.0.5414.46 без исправлений (проверено и в прототипе, и повторно в Docker на опубликованном `mednet.min.css`: `focusShadow: "none"`, `destructiveBg: "rgb(198, 40, 40)"`):
- Tailwind v4 пишет запасное значение без прозрачности, а настоящее — внутри `@supports (color: color-mix(in lab, red, red))`: `bg-destructive/10` становится сплошь красным (текст не виден), `bg-black/80` под диалогом — чёрным;
- `var(--x,)` без пробела: если `--x` объявлено через `@property` без `initial-value` (`--tw-ring-inset`), Chrome 109 отбрасывает всё значение — **пропадают кольца фокуса** (минифицированный CSS: `mednet.min.css` и любая сборка Next);
- `oklch()` внутри SVG data-URI (шеврон select, галочка checkbox в Basecoat) — иконка не рисуется;
- `::backdrop` не видит переменных `:root` — фон под `<dialog>` не затемняется.
JS (Next 16 + Base UI) в 109 работает. `browserslist` в Next CSS не исправляет (проверено). Плагин вставляет перед каждым `@supports`-блоком копию со статическими цветами: 109 берёт копию, современные браузеры — блок `@supports`, который идёт позже, поэтому у них ничего не меняется (0 px разницы, светлая и тёмная тема). Подключение по имени подпути проверено с Turbopack и webpack (локальный путь в `postcss.config.mjs` Turbopack не находит; ESM-плагин webpack не грузит — поэтому CommonJS).

- [ ] **Step 1: Падающий тест плагина**

Run (из корня): `pnpm --filter @mednet/ui add lightningcss@^1.30.0 && pnpm --filter @mednet/ui add -D postcss@^8.5.0`

`packages/ui/src/__tests__/postcss.test.ts`:

```ts
// @vitest-environment node
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const legacyFallbacks = createRequire(import.meta.url)('../../postcss.cjs');
const run = (css: string) => postcss([legacyFallbacks()]).process(css, { from: undefined }).css;

const THEME = ':root { --destructive: #c62828; --mn-black: #000; }\n.dark { --destructive: #ef5350; }\n';
const GUARDED = (selector: string, percent: number) => `${selector} { background-color: var(--destructive); }
@supports (color: color-mix(in lab, red, red)) {
  ${selector} { background-color: color-mix(in oklab, var(--destructive) ${percent}%, transparent); }
}
`;

describe('@mednet/ui/postcss (Chrome/Edge 109)', () => {
  it('перед @supports — копия со статическим цветом, сам блок @supports не тронут', () => {
    const out = run(THEME + GUARDED('.bg-destructive\\/10', 10));
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
```

Run: `pnpm --filter @mednet/ui test postcss`
Expected: FAIL — `Cannot find module '../../postcss.cjs'`.

- [ ] **Step 2: Плагин**

`packages/ui/postcss.cjs`:

```js
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
//    не затемняется. Подставляем значения.
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
      const next = vars.has(name) ? vars.get(name) : fallback && fallback.trim() ? fallback.trim() : null;
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
```

В `packages/ui/package.json`: в `exports` после `"./llms.md"` добавить `"./postcss": "./postcss.cjs",`; в `files` добавить `"postcss.cjs"`.

Run: `pnpm --filter @mednet/ui test postcss`
Expected: PASS — 6 тестов.

- [ ] **Step 3: `@mednet/css` собирается с плагином**

Run (из корня): `pnpm --filter @mednet/css add -D @mednet/ui@workspace:* postcss@^8.5.0`

В `packages/css/test/build.test.ts` добавить в конец файла:

```ts
describe('Chrome/Edge 109 (Windows 7/8.1, спека D18)', () => {
  it.each(['mednet.css', 'mednet.min.css'])('%s: нет var(--x,) — в Chrome 109 он гасит кольца фокуса', (file) => {
    expect(read(file)).not.toMatch(/var\(--[\w-]+,\)/);
  });

  it.each(['mednet.css', 'mednet.min.css'])(
    '%s: у деструктивной кнопки есть статическая полупрозрачная заливка',
    (file) => {
      expect(read(file)).toMatch(/\.btn\[data-variant="?destructive"?\][^{]*\{[^}]*#c628281a/);
    },
  );

  it.each(['mednet.css', 'mednet.min.css'])('%s: иконки в data-URI без oklch()', (file) => {
    const uris = read(file).match(/data:image\/svg\+xml[^)]*/g) ?? [];
    expect(uris.length).toBeGreaterThan(0);
    for (const uri of uris) expect(uri).not.toContain('oklch(');
  });
});
```

Run: `pnpm --filter @mednet/css build && pnpm --filter @mednet/css test`
Expected: FAIL — 5 новых тестов (в `mednet.min.css` 91 запись `var(--x,)`). Случай `mednet.css` в первом `it.each` проходит уже сейчас (там `var(--x, )` с пробелом) — он страхует от регресса.

В `packages/css/scripts/build.ts`:
- после `import { loadFontFaces } from './fonts.ts';` добавить `import postcss from 'postcss';`;
- после строки `const require = createRequire(import.meta.url);` добавить:

```ts
// Chrome/Edge 109 (Windows 7/8.1, спека D18): статические копии цветов перед @supports, var(--x, ),
// hex вместо oklch() в иконках, значения в ::backdrop. Тот же плагин подключают Next-проекты.
const legacyFallbacks = postcss([require('@mednet/ui/postcss')()]);
const withLegacyFallbacks = (code: string) => legacyFallbacks.process(code, { from: undefined }).css;
```

- две строки записи CSS заменить на:

```ts
// Плагин — после optimize: минификатор Tailwind сам пишет var(--x,) без пробела.
writeFileSync(join(dist, 'mednet.css'), withLegacyFallbacks(optimize(css, { minify: false }).code));
writeFileSync(join(dist, 'mednet.min.css'), withLegacyFallbacks(optimize(css, { minify: true }).code));
```

Run: `pnpm turbo run build --filter=@mednet/css && pnpm --filter @mednet/css test`
Expected: PASS (turbo сначала собирает `@mednet/ui` — теперь это зависимость сборки `@mednet/css`).

Если тест деструктивной кнопки не находит `#c628281a` — посмотреть, как селектор записан в `dist/mednet.css` (`grep -n 'data-variant="destructive"' packages/css/dist/mednet.css | head`), и поправить регулярку теста.

- [ ] **Step 4: Docs — плагин в PostCSS**

`apps/docs/postcss.config.mjs` целиком:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    // Chrome/Edge 109 (Windows 7/8.1): статические копии цветов — после Tailwind.
    '@mednet/ui/postcss': {},
  },
};
```

Run: `pnpm turbo run build --filter=docs... && grep -rhoE 'var\(--[a-z0-9-]+,\)' apps/docs/out/_next/static | wc -l`
Expected: сборка зелёная, `0`.

- [ ] **Step 5: Smoke-тест в Chromium 109**

`apps/docs/scripts/chrome109.mjs` (выполняется в Docker-образе с Node 16, поэтому без зависимостей кроме `playwright-core` 1.29.2):

```js
// Smoke-тест в Chromium 109 — последнем Chrome для Windows 7/8.1 (спека D18, §14).
// Запуск: node scripts/chrome109-docker.mjs (Docker-образ Playwright 1.29.2 на собранном out/).
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const failures = [];

function check(name, ok, details) {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${details}`}`);
  if (!ok) failures.push(name);
}

/** Альфа цвета из getComputedStyle: rgb(…) → 1, rgba(…, a) → a. */
function alpha(color) {
  const match = color.match(/rgba\([^)]*,\s*([\d.]+)\)/);
  return match ? Number(match[1]) : 1;
}

const browser = await chromium.launch();
check(`Chromium ${browser.version()}`, browser.version().startsWith('109.'), 'ожидался Chromium 109');

async function open(path) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return { page, errors };
}

async function focusShadow(page, testId) {
  await page.mouse.click(2, 2);
  for (let i = 0; i < 80; i += 1) {
    await page.keyboard.press('Tab');
    const shadow = await page.evaluate((id) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      return element === document.activeElement ? getComputedStyle(element).boxShadow : null;
    }, testId);
    if (shadow !== null) return shadow;
  }
  return 'элемент не получил фокус';
}

for (const [side, path] of [
  ['React', '/parity/'],
  ['статика', '/parity/static.html'],
]) {
  const { page, errors } = await open(path);
  const style = (id, property) =>
    page.$eval(`[data-testid="${id}"]`, (element, p) => getComputedStyle(element)[p], property);
  const ring = await focusShadow(page, 'btn-outline');
  check(`${side}: кольцо фокуса у контурной кнопки`, /rgba?\(/.test(ring), ring);
  const destructive = await style('btn-destructive', 'backgroundColor');
  check(`${side}: деструктивная кнопка полупрозрачная`, alpha(destructive) < 0.5, destructive);
  const input = await style('input', 'backgroundColor');
  check(`${side}: поле ввода белое`, input === 'rgb(255, 255, 255)', input);
  check(`${side}: без ошибок JS`, errors.length === 0, errors.join('; '));
  await page.close();
}

{
  const { page } = await open('/parity/dialog/');
  const overlay = await page.$eval('[data-slot="dialog-overlay"]', (element) => getComputedStyle(element).backgroundColor);
  check('React: фон под диалогом затемнён, а не залит чёрным', alpha(overlay) > 0 && alpha(overlay) < 1, overlay);
  await page.close();
}

{
  const { page } = await open('/parity/static-dialog.html');
  const backdrop = await page.$eval('dialog', (element) => getComputedStyle(element, '::backdrop').backgroundColor);
  check('статика: фон под диалогом затемнён', alpha(backdrop) > 0, backdrop);
  await page.close();
}

{
  const { page, errors } = await open('/ui/app-shell/');
  await page.click('[data-slot="sidebar-trigger"]');
  await page.waitForTimeout(500);
  const state = await page.getAttribute('[data-slot="sidebar"][data-state]', 'data-state');
  check('React: AppShell сворачивается (страница ожила)', state === 'collapsed', state);
  check('React AppShell: без ошибок JS', errors.length === 0, errors.join('; '));
  await page.close();
}

await browser.close();
if (failures.length > 0) {
  console.error(`Chromium 109: не прошло проверок — ${failures.length}`);
  process.exit(1);
}
console.log('Chromium 109: все проверки прошли');
```

`apps/docs/scripts/chrome109-docker.mjs`:

```js
// Запускает scripts/chrome109.mjs в Docker-образе Playwright 1.29.2 (Chromium 109) на собранном out/.
// Next в образе не собрать (там Node 16), поэтому сначала: pnpm turbo run build --filter=docs...
// apps/docs монтируется только для чтения; playwright-core ставится внутри контейнера.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const IMAGE = 'mcr.microsoft.com/playwright:v1.29.2-focal';
const docs = fileURLToPath(new URL('../', import.meta.url)).replace(/[\\/]$/, '');

if (!existsSync(`${docs}/out/index.html`)) {
  console.error('Нет apps/docs/out — сначала pnpm turbo run build --filter=docs...');
  process.exit(1);
}

const script = [
  'set -euo pipefail',
  'mkdir -p /tmp/smoke && cd /tmp/smoke',
  'npm init -y >/dev/null',
  'npm install --no-audit --no-fund playwright-core@1.29.2 >/dev/null',
  'cp /docs/scripts/chrome109.mjs .',
  '(node /docs/scripts/serve-out.mjs &)',
  'sleep 1',
  'node chrome109.mjs',
].join('\n');

const result = spawnSync(
  'docker',
  ['run', '--rm', '--ipc=host', '-v', `${docs}:/docs:ro`, IMAGE, 'bash', '-c', script],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
```

В `apps/docs/package.json` в `scripts` добавить `"test:chrome109": "node scripts/chrome109-docker.mjs"`; в корневом `package.json` — `"test:chrome109": "pnpm --filter docs test:chrome109"`.

Run: `pnpm test:chrome109`
Expected: `✓ Chromium 109.0.5414.46` и все проверки ✓, `Chromium 109: все проверки прошли`, код 0.

Проверка, что тест ловит регресс: временно убрать строку `'@mednet/ui/postcss': {},` из `apps/docs/postcss.config.mjs`, пересобрать docs, `pnpm test:chrome109` → ✗ на кольце фокуса и деструктивной кнопке React; вернуть строку, пересобрать.

- [ ] **Step 6: CI**

В `.github/workflows/ci.yml` в `jobs` добавить (SHA — те же, что у job `check`):

```yaml
  chrome109:
    name: Chrome 109 (Windows 7/8.1)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=docs...
      - run: pnpm test:chrome109
```

- [ ] **Step 7: Changeset и документация**

`.changeset/chrome-109.md`:

```markdown
---
'@mednet/css': patch
'@mednet/ui': minor
---

Chrome/Edge 109 (Windows 7/8.1): в `mednet.css` и `mednet.min.css` вернулись кольца фокуса (в минифицированной версии Chrome 109 их терял), полупрозрачные заливки (деструктивные кнопки и бейджи больше не сплошь красные), иконки select и checkbox и затемнение под диалогом. В современных браузерах вид не меняется. Для React-проектов — PostCSS-плагин `@mednet/ui/postcss` (после `@tailwindcss/postcss`).
```

В `packages/css/README.md` в раздел «Важно» добавить пункт: «Поддерживаются Chrome/Edge 109+ (в том числе Windows 7/8.1), Firefox 128+, Safari 16.4+. В Chrome 109 не работают только анимации открытия и авторазмер textarea.»

В `docs/releasing.md` в «Известные особенности» добавить: «Job CI `chrome109` гоняет smoke-тест в Chromium 109 (Docker `mcr.microsoft.com/playwright:v1.29.2-focal`): Tailwind, Next и Base UI официально поддерживают Chrome 111+, и их обновление может молча сломать Windows 7/8.1 — job это поймает.»

- [ ] **Step 8: Commit**

```bash
pnpm format:check
git add packages/ui packages/css apps/docs package.json .github/workflows/ci.yml .changeset/chrome-109.md docs/releasing.md pnpm-lock.yaml
git commit -m "fix: Chrome/Edge 109 support — legacy colour fallbacks, focus rings, smoke test in Chromium 109"
```

---

### Task 15: Changeset, README, правила для агентов, итоговая проверка

**Files:**
- Create: `.changeset/pilot-a-ui-lint-config.md`
- Modify: `README.md`, `AGENTS.md`

**Interfaces:**
- Consumes: всё из Tasks 1–14.
- Produces: запись для Version PR; таблица пакетов в README; правила работы с `@mednet/ui` для агентов.

- [ ] **Step 1: Changeset**

`.changeset/pilot-a-ui-lint-config.md`:

```markdown
---
'@mednet/ui': minor
'@mednet/lint-config': minor
---

Новые пакеты (до первой публикации помечены `private`): `@mednet/ui` — весь набор shadcn/ui на Base UI в стиле Maia и теме бренда, логотип, шапка и подвал, каркасы `PublicLayout` и `AppShell`, справка `llms.md` для AI-агентов; `@mednet/lint-config` — правила ESLint и stylelint, которые не пускают в проект чужие UI-библиотеки, иконки и цвета вне токенов.
```

Changesets версионирует `private`-пакеты вместе с остальными (группа `fixed`), но `changeset publish` их пропускает — публикация будет в плане B. Плагин для Chrome 109 уже описан в `.changeset/chrome-109.md` (Task 14), здесь его не повторять.

- [ ] **Step 2: README корня**

В таблицу пакетов `README.md` добавить две строки после `@mednet/css`:

```markdown
| [`@mednet/ui`](packages/ui)                   | React-компоненты: shadcn/ui (Base UI, Maia) в теме бренда, логотип, шапка, подвал, каркасы страниц — **ещё не опубликован** |
| [`@mednet/lint-config`](packages/lint-config) | ESLint и stylelint: защита бренда в проектах — **ещё не опубликован**                                                       |
```

(Prettier выровняет таблицу: `pnpm format`.)

В раздел «Лицензия» дописать: «Код shadcn/ui в `@mednet/ui` — [THIRD_PARTY_NOTICES.md](packages/ui/THIRD_PARTY_NOTICES.md).»

- [ ] **Step 3: Правила для агентов**

В `AGENTS.md` после раздела «Релизы» добавить:

```markdown
## `@mednet/ui`

- `src/components/**`, `src/hooks/**`, `src/brand/logo/**`, `src/index.ts`, `src/shadcn-tailwind.css` — сгенерированы; руками не править. Импорт `cn` и подписи — `scripts/postgen.mjs` (+ `scripts/ru-labels.json`), затем `pnpm --filter @mednet/ui generate`; цвета бренда — правилами `src/brand.css` по сгенерированным классам (не по `data-slot`).
- Любое изменение вида компонента — на обеих сторонах (`packages/ui/src/brand.css` и `packages/css/src/overrides.css`): тест паритета в docs (`tests/parity.spec.ts`) сравнивает их вычисленные стили. Эталон — shadcn Maia.
- Chrome/Edge 109 поддерживается (`@mednet/ui/postcss`, job CI `chrome109`): не убирайте плагин из сборок и не отключайте job.
- Основа — Base UI: проп `render`, не `asChild`; зависимостей `radix-ui`/`@radix-ui/*` в пакете быть не должно.
- Импорты внутри пакета — `#components/…`, `#hooks/…`, `#lib/…`.
- Новый публичный модуль — ключ в `exports` пакета, `pnpm --filter @mednet/ui gen:index`, раздел в `llms/brand.md`, если это фирменный блок.
```

- [ ] **Step 4: Итоговая проверка — как в CI**

Run:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm turbo run build typecheck test
pnpm test:visual
pnpm test:chrome109
```

Expected: всё зелёное; `pnpm test:visual` — скриншот-, axe-, интерактивные тесты и паритет проходят в Docker; `pnpm test:chrome109` — все проверки в Chromium 109. Затем `git status` — чисто (кроме коммита этого шага).

- [ ] **Step 5: Commit и push**

```bash
git add .changeset/pilot-a-ui-lint-config.md README.md AGENTS.md
git commit -m "docs: changeset, README and agent rules for @mednet/ui and @mednet/lint-config"
git push
```

После push проверить в GitHub Actions, что CI зелёный (jobs `check`, `visual`, `chrome109`), а Release обновил Version PR «Релиз пакетов @mednet/\*» (новые пакеты в нём есть, публикации нет). **Version PR не мержить** — это решение владельца.

---

## Вне этого плана

- **План B:** `templates/next` (заглушки `components/ui/*` для блоков shadcn, Docker, CI, пресеты), `@mednet/create-app`, пилотный прогон, снятие `"private"` и первая публикация `@mednet/ui`, `@mednet/lint-config`, `@mednet/create-app`.
- Этапы спеки §17: HTML-версии фирменных блоков (этап 4), `DataTable` и недостающие компоненты (6), `@mednet/charts` и `@mednet/validators` (6–7), registry блоков и `.mcp.json` (8).
