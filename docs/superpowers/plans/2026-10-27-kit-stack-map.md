# Карта «на чём строится кит» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Один файл `stack.json` в `@mednet/ui` описывает, на чём построен кит и где искать API; из него генерируется раздел `llms.md` и страница `/docs/stack` в docs-сайте playground.

**Architecture:** Источник — `packages/ui/stack.json` (публикуется в пакете, без версий). Общий модуль `scripts/stack.mjs` читает его, подставляет версии из `package.json` пакета и рисует markdown-раздел; `build-llms.mjs` вставляет раздел в `llms.md`. Playground копирует `stack.json` из `node_modules/@mednet/ui`, считает версии тем же правилом и показывает карточки на странице `/docs/stack`.

**Tech Stack:** Node ESM-скрипты (`.mjs`), vitest 5, React 19 + react-router 8, пакеты `@mednet/ui/*`, pnpm, changesets.

Спека: `docs/superpowers/specs/2026-10-27-kit-stack-map-design.md`.

## Global Constraints

- Кит: пути от `packages/ui`. `src/components/**`, `src/hooks/**`, `src/index.ts`, `llms.md` — сгенерированы, руками не править (AGENTS.md).
- Изменение в `packages/*`, которое видит потребитель, требует changeset; здесь — `patch` на `@mednet/ui`.
- Не публиковать пакеты, не запускать `pnpm version-packages`, не мержить Version PR, не менять `.github/workflows/release.yml`.
- Версии в `stack.json` не хранятся: берутся из `package.json` пакета при сборке.
- Записи `stack.json` — 17 штук: `base` (shadcn/ui, Base UI, Tailwind CSS, tw-animate-css, class-variance-authority), `lib` (lucide-react, recharts, embla-carousel-react, react-day-picker, date-fns, cmdk, input-otp, react-resizable-panels), `kit` (`@mednet/tokens`, `@mednet/css`, `@mednet/lint-config`, Montserrat). Не включать `@shadcn/react`, `lightningcss`, `svgo`, тестовые и сборочные зависимости.
- `usage`: `inside` | `peer` | `project`; `group`: `base` | `lib` | `kit`; поле `llms` необязательное и ставится только если URL отвечает 200.
- Тексты — на русском, как в остальной справке. Тесты в ките не ходят в сеть.
- Playground (`C:\A\mednet-playground\react`) — вне git и вне репозитория кита; перед правками сделать копию `react/src` (Task 3, Step 1). Страница в playground появляется только после релиза кита или с локальным `stack.json`.
- Тесты кита: `pnpm --filter @mednet/ui test`; сборка: `pnpm --filter @mednet/ui build`.

> Уточнение к спеке: в spec 3 сказано сократить пункты 6, 12 и 13 `intro.md`. Пункт 13 — правило установки peer-зависимостей (команда `npm i …`), а не описание стека, поэтому он остаётся; сокращаются 6 и 12.

---

### Task 1: `stack.json`, общий модуль и тест

**Files:**
- Create: `packages/ui/stack.json`
- Create: `packages/ui/scripts/stack.mjs`
- Create: `packages/ui/src/__tests__/stack.test.ts`
- Modify: `packages/ui/package.json` (`files`, `exports`)

**Interfaces:**
- Produces (`scripts/stack.mjs`):
  - `readStack(root: URL): StackEntry[]` — читает `stack.json` из `root`, к каждой записи добавляет `version: string | null`.
  - `versionOf(pkg: object, name: string | null): string | null` — версия пакета `name` по `package.json` пакета `pkg`: `@mednet/*` → `pkg.version`; иначе диапазон из `dependencies`, `peerDependencies`, `devDependencies` (в таком порядке); `null` для `name === null`; если не найден — `undefined`-результат считается ошибкой теста.
  - `renderStackSection(entries: StackEntry[]): string` — markdown раздела `## Стек и где искать API`.
  - `GROUPS: { base: string; lib: string; kit: string }` — заголовки групп.
- `StackEntry`: `{ id, name, package: string | null, group, role, docs, llms?, when, usage, version }`.

- [ ] **Step 1: Написать падающий тест**

`packages/ui/src/__tests__/stack.test.ts`:

```ts
// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — .mjs без типов
import { GROUPS, readStack, renderStackSection, versionOf } from '../../scripts/stack.mjs';

interface Entry {
  id: string;
  name: string;
  package: string | null;
  group: 'base' | 'lib' | 'kit';
  role: string;
  docs: string;
  llms?: string;
  when: string;
  usage: 'inside' | 'peer' | 'project';
  version: string | null;
}

const root = new URL('../../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const entries: Entry[] = readStack(root);

describe('stack.json', () => {
  it('в наборе есть все обязательные библиотеки', () => {
    const ids = entries.map((e) => e.id);
    for (const id of [
      'shadcn-ui',
      'base-ui',
      'tailwindcss',
      'lucide-react',
      'recharts',
      'embla-carousel-react',
      'react-day-picker',
      'cmdk',
      'input-otp',
      'react-resizable-panels',
      'mednet-tokens',
    ])
      expect(ids).toContain(id);
  });

  it('id уникальны', () => {
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(readStack(root).map((e: Entry) => [e.id, e] as const))(
    '%s: поля заполнены, ссылки — https',
    (_id, e) => {
      expect(Object.keys(GROUPS)).toContain(e.group);
      expect(['inside', 'peer', 'project']).toContain(e.usage);
      for (const key of ['name', 'role', 'when'] as const) expect(e[key].trim()).not.toBe('');
      expect(e.docs).toMatch(/^https:\/\//);
      if (e.llms) expect(e.llms).toMatch(/^https:\/\//);
    },
  );

  it('у каждого пакета из stack.json находится версия', () => {
    for (const e of entries) {
      if (e.package === null) continue;
      expect(versionOf(pkg, e.package), e.package).toBeTruthy();
    }
  });

  it('пакеты со способом inside и peer объявлены в package.json', () => {
    const declared = new Set([
      ...Object.keys(pkg.dependencies),
      ...Object.keys(pkg.peerDependencies),
      ...Object.keys(pkg.devDependencies),
    ]);
    for (const e of entries.filter((x) => x.usage !== 'project' && x.package))
      expect(declared.has(e.package as string), e.package as string).toBe(true);
  });

  it('stack.json опубликован и экспортирован', () => {
    expect(pkg.files).toContain('stack.json');
    expect(pkg.exports['./stack.json']).toBe('./stack.json');
    expect(existsSync(new URL('stack.json', root))).toBe(true);
  });
});

describe('renderStackSection', () => {
  const text: string = renderStackSection(entries);

  it('начинается с заголовка раздела и содержит все записи', () => {
    expect(text.startsWith('## Стек и где искать API')).toBe(true);
    for (const e of entries) expect(text).toContain(e.name);
  });

  it('разбит на группы и содержит правило поиска API', () => {
    for (const title of Object.values(GROUPS) as string[]) expect(text).toContain(`### ${title}`);
    expect(text).toContain('не выдумывайте');
  });

  it('содержит версию и ссылку на документацию', () => {
    const base = entries.find((e) => e.id === 'base-ui') as Entry;
    expect(text).toContain(base.version as string);
    expect(text).toContain(base.docs);
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/ui exec vitest run src/__tests__/stack.test.ts`
Expected: FAIL — «Cannot find module '../../scripts/stack.mjs'».

- [ ] **Step 3: Создать `packages/ui/stack.json`**

```json
[
  {
    "id": "shadcn-ui",
    "name": "shadcn/ui",
    "package": null,
    "group": "base",
    "role": "Основа кита: набор компонентов и их API. Кит — это shadcn/ui на Base UI в стиле Maia и теме бренда; код компонентов не копируется в проект, а ставится пакетом.",
    "docs": "https://ui.shadcn.com/docs/components/base",
    "llms": "https://ui.shadcn.com/llms.txt",
    "when": "Эталон API и примеров любого компонента кита: имена частей, композиция, варианты. Ссылка на страницу компонента есть у каждого модуля в разделе «Компоненты shadcn/ui».",
    "usage": "inside"
  },
  {
    "id": "base-ui",
    "name": "Base UI",
    "package": "@base-ui/react",
    "group": "base",
    "role": "Поведение и доступность компонентов. Часть компонента подменяется пропом `render`, не `asChild`; Radix в ките нет.",
    "docs": "https://base-ui.com/react/overview/quick-start",
    "llms": "https://base-ui.com/llms.txt",
    "when": "Пропсы и события, которых нет в справке кита: `value`, `onValueChange`, `disabled`, `render`, `open`, `onOpenChange`.",
    "usage": "inside"
  },
  {
    "id": "tailwindcss",
    "name": "Tailwind CSS v4",
    "package": "tailwindcss",
    "group": "base",
    "role": "Стили: утилитарные классы и тема. Тема бренда подключается строкой `@import '@mednet/ui/styles.css'`; палитра Tailwind заменена брендовой.",
    "docs": "https://tailwindcss.com/docs",
    "when": "Классы утилит, брейкпоинты, `@theme`, `@source`. Цвета — только семантические классы кита, см. правила выше.",
    "usage": "peer"
  },
  {
    "id": "tw-animate-css",
    "name": "tw-animate-css",
    "package": "tw-animate-css",
    "group": "base",
    "role": "Анимации появления и исчезновения (`animate-in`, `fade-in`, `slide-in-*`) в диалогах, меню и подсказках.",
    "docs": "https://github.com/Wombosvideo/tw-animate-css",
    "when": "Свои анимации в стиле кита — классы `animate-in`/`animate-out` и модификаторы.",
    "usage": "inside"
  },
  {
    "id": "class-variance-authority",
    "name": "class-variance-authority",
    "package": "class-variance-authority",
    "group": "base",
    "role": "Варианты компонентов (`variant`, `size`) и функции вроде `buttonVariants`.",
    "docs": "https://cva.style/docs",
    "when": "Список значений `variant` и `size` и значения по умолчанию — в `defaultVariants` компонента, не в документации cva.",
    "usage": "inside"
  },
  {
    "id": "lucide-react",
    "name": "lucide-react",
    "package": "lucide-react",
    "group": "lib",
    "role": "Единственный источник иконок. Контурные, одного стиля; залитые иконки запрещены.",
    "docs": "https://lucide.dev/icons/",
    "when": "Поиск иконки по имени и по тегам; импорт — `import { Search } from 'lucide-react'`.",
    "usage": "peer"
  },
  {
    "id": "recharts",
    "name": "Recharts",
    "package": "recharts",
    "group": "lib",
    "role": "Графики. Обёртки кита — `@mednet/ui/chart` (`ChartContainer`, `ChartTooltip`, `ChartLegend`), цвета рядов — `chart-1…chart-8`.",
    "docs": "https://recharts.github.io/",
    "when": "Компоненты графиков (`BarChart`, `LineChart`, `Area`, `Pie`, оси, сетка) и их пропсы — импортируются из `recharts`.",
    "usage": "peer"
  },
  {
    "id": "embla-carousel-react",
    "name": "Embla Carousel",
    "package": "embla-carousel-react",
    "group": "lib",
    "role": "Слайдер: движок компонента `Carousel` (`@mednet/ui/carousel`).",
    "docs": "https://www.embla-carousel.com/",
    "when": "Опции `opts` (`loop`, `align`, `slidesToScroll`), плагины, API `setApi` / `scrollNext`.",
    "usage": "inside"
  },
  {
    "id": "react-day-picker",
    "name": "React DayPicker",
    "package": "react-day-picker",
    "group": "lib",
    "role": "Календарь: движок `Calendar` (`@mednet/ui/calendar`). По-русски — `<Calendar locale={ru} />`, `import { ru } from 'react-day-picker/locale'`.",
    "docs": "https://daypicker.dev/",
    "when": "Режимы выбора (`mode='single' | 'range' | 'multiple'`), `disabled`, `locale`, `captionLayout`.",
    "usage": "peer"
  },
  {
    "id": "date-fns",
    "name": "date-fns",
    "package": "date-fns",
    "group": "lib",
    "role": "Работа с датами в календаре и полях дат.",
    "docs": "https://date-fns.org/docs/Getting-Started",
    "when": "Форматирование и арифметика дат: `format`, `addDays`, `isSameDay`; русская локаль — `date-fns/locale/ru`.",
    "usage": "inside"
  },
  {
    "id": "cmdk",
    "name": "cmdk",
    "package": "cmdk",
    "group": "lib",
    "role": "Командная палитра и поиск: движок `Command` (`@mednet/ui/command`), используется в `Combobox`.",
    "docs": "https://github.com/dip/cmdk",
    "when": "Фильтрация и сортировка (`filter`, `shouldFilter`), `value`, группы и пустое состояние.",
    "usage": "inside"
  },
  {
    "id": "input-otp",
    "name": "input-otp",
    "package": "input-otp",
    "group": "lib",
    "role": "Ввод одноразовых кодов: движок `InputOTP` (`@mednet/ui/input-otp`).",
    "docs": "https://github.com/guilhermerodz/input-otp",
    "when": "`maxLength`, `pattern`, `onComplete`, `containerClassName`.",
    "usage": "inside"
  },
  {
    "id": "react-resizable-panels",
    "name": "react-resizable-panels",
    "package": "react-resizable-panels",
    "group": "lib",
    "role": "Панели с изменяемым размером: движок `Resizable` (`@mednet/ui/resizable`).",
    "docs": "https://github.com/bvaughn/react-resizable-panels",
    "when": "Размеры панелей (`defaultSize`, `minSize`, `maxSize`), `direction`, сохранение раскладки.",
    "usage": "inside"
  },
  {
    "id": "mednet-tokens",
    "name": "@mednet/tokens",
    "package": "@mednet/tokens",
    "group": "kit",
    "role": "Токены бренда: цвета, радиусы, тени, шрифты — CSS-переменные `--mn-*`, `theme.css` для Tailwind и JSON.",
    "docs": "https://github.com/hpnssflw/mednet-kit/tree/main/packages/tokens",
    "when": "Значение цвета или радиуса бренда, переменные для сайта без Tailwind, палитра для графиков вне React.",
    "usage": "project"
  },
  {
    "id": "mednet-css",
    "name": "@mednet/css",
    "package": "@mednet/css",
    "group": "kit",
    "role": "То же оформление для страниц без React: статика, MODX, шаблонизаторы (CDN jsDelivr или папка `dist/`).",
    "docs": "https://github.com/hpnssflw/mednet-kit/tree/main/packages/css",
    "when": "Классы и разметка для страниц без React.",
    "usage": "project"
  },
  {
    "id": "mednet-lint-config",
    "name": "@mednet/lint-config",
    "package": "@mednet/lint-config",
    "group": "kit",
    "role": "ESLint и stylelint: запрещают чужие UI-библиотеки, иконки не из lucide-react и цвета вне токенов.",
    "docs": "https://github.com/hpnssflw/mednet-kit/tree/main/packages/lint-config",
    "when": "Настройка линтеров и список запретов; ставится в каждый проект с китом.",
    "usage": "project"
  },
  {
    "id": "montserrat",
    "name": "Montserrat",
    "package": "@fontsource/montserrat",
    "group": "kit",
    "role": "Шрифт бренда. Подключается в коде приложения: `import '@mednet/ui/fonts.css'`, не через `@import` в CSS.",
    "docs": "https://fontsource.org/fonts/montserrat",
    "when": "Начертания и веса шрифта; размеры заголовков — классы `text-h1…text-h4`.",
    "usage": "inside"
  }
]
```

- [ ] **Step 4: Создать `packages/ui/scripts/stack.mjs`**

```js
// Карта «на чём строится кит»: stack.json + версии из package.json → записи и markdown-раздел llms.md.
import { readFileSync } from 'node:fs';

export const GROUPS = {
  base: 'Основа',
  lib: 'Функциональные библиотеки',
  kit: 'Экосистема кита',
};
const USAGE = {
  inside: 'внутри кита, напрямую не импортируйте',
  peer: 'peer-зависимость, импортируйте напрямую',
  project: 'ставится в проект отдельно',
};

/** Версия пакета по package.json кита: свои пакеты — версия кита (одна на все), чужие — диапазон. */
export function versionOf(pkg, name) {
  if (name === null) return null;
  if (name.startsWith('@mednet/')) return pkg.version;
  for (const key of ['dependencies', 'peerDependencies', 'devDependencies'])
    if (pkg[key]?.[name]) return pkg[key][name];
  return undefined;
}

export function readStack(root) {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const entries = JSON.parse(readFileSync(new URL('stack.json', root), 'utf8'));
  return entries.map((entry) => ({ ...entry, version: versionOf(pkg, entry.package) ?? null }));
}

const cell = (text) => text.replaceAll('|', '\\|');
const links = (entry) =>
  [`[документация](${entry.docs})`, entry.llms ? `[llms.txt](${entry.llms})` : null]
    .filter(Boolean)
    .join(', ');

export function renderStackSection(entries) {
  const parts = [
    '## Стек и где искать API',
    '',
    'На чём построен кит и куда смотреть, когда нужного пропса или примера нет в этой справке. **Нет в справке кита — ищите в документации основы (Base UI / shadcn/ui), затем в библиотеке из таблицы; не выдумывайте пропсы и не тащите чужие библиотеки.** Если у библиотеки есть `llms.txt` — читайте его: это самый быстрый путь к её API.',
    '',
  ];
  for (const [group, title] of Object.entries(GROUPS)) {
    const rows = entries.filter((entry) => entry.group === group);
    parts.push(
      `### ${title}`,
      '',
      '| Что | За что отвечает | Куда смотреть | Когда |',
      '| --- | --- | --- | --- |',
      ...rows.map((entry) => {
        const name = `${entry.name}${entry.version ? ` \`${entry.version}\`` : ''} — ${USAGE[entry.usage]}`;
        return `| ${cell(name)} | ${cell(entry.role)} | ${links(entry)} | ${cell(entry.when)} |`;
      }),
      '',
    );
  }
  return parts.join('\n').trim();
}
```

- [ ] **Step 5: Обновить `packages/ui/package.json`**

В `files` после `"llms.md",` добавить `"stack.json",`; в `exports` после `"./llms.md": "./llms.md",` добавить `"./stack.json": "./stack.json",`.

- [ ] **Step 6: Запустить тест, убедиться, что проходит**

Run: `pnpm --filter @mednet/ui exec vitest run src/__tests__/stack.test.ts`
Expected: PASS. Если падает «у каждого пакета находится версия» — у пакета нет записи в `package.json`: поправить `package` в `stack.json` (например, `embla-carousel-react`, `date-fns`, `cmdk`, `input-otp`, `react-resizable-panels` есть в `dependencies`).

- [ ] **Step 7: Вручную проверить ссылки**

Run:
```bash
for u in https://ui.shadcn.com/llms.txt https://base-ui.com/llms.txt https://base-ui.com/react/overview/quick-start https://tailwindcss.com/docs https://cva.style/docs https://lucide.dev/icons/ https://recharts.github.io/ https://www.embla-carousel.com/ https://daypicker.dev/ https://date-fns.org/docs/Getting-Started https://fontsource.org/fonts/montserrat https://ui.shadcn.com/docs/components/base; do printf '%s ' "$u"; curl -s -o /dev/null -w '%{http_code}\n' -L "$u"; done
```
Expected: 200 везде. Если у ссылки `llms` не 200 — удалить поле `llms` у записи; если не 200 `docs` — найти актуальный адрес и заменить. (Ссылки GitHub-репозиториев проверять так же.) Повторить Step 6.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/stack.json packages/ui/scripts/stack.mjs packages/ui/src/__tests__/stack.test.ts packages/ui/package.json
git commit -m "feat(ui): stack.json — карта стека кита и модуль рендера"
```

---

### Task 2: Раздел в `llms.md` и защита публикации

**Files:**
- Modify: `packages/ui/scripts/build-llms.mjs:1-8, 77-86`
- Modify: `packages/ui/llms/intro.md` (пункты 6 и 12)
- Modify: `packages/ui/scripts/check-dist.mjs`
- Modify: `packages/ui/src/__tests__/package.test.ts` (тест на раздел)

**Interfaces:**
- Consumes: `readStack(root: URL)`, `renderStackSection(entries: StackEntry[])` из `scripts/stack.mjs` (Task 1).
- Produces: в `llms.md` раздел `## Стек и где искать API` между `intro.md` и `brand.md`.

- [ ] **Step 1: Написать падающий тест**

В `packages/ui/src/__tests__/package.test.ts` после теста `'llms.md: правило render вместо asChild и строка стилей'` добавить:

```ts
  it('llms.md: раздел «Стек и где искать API» с основными библиотеками', () => {
    const text = llms();
    expect(text).toContain('## Стек и где искать API');
    for (const name of ['Base UI', 'lucide-react', 'Recharts', 'Embla Carousel', 'shadcn/ui'])
      expect(text).toContain(name);
    expect(text.indexOf('## Стек и где искать API')).toBeLessThan(
      text.indexOf('## Модули фирменных блоков'),
    );
  });
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/ui build && pnpm --filter @mednet/ui exec vitest run src/__tests__/package.test.ts -t "Стек"`
Expected: FAIL — в `llms.md` нет раздела.

- [ ] **Step 3: Изменить `build-llms.mjs`**

После `import ts from 'typescript';` добавить:

```js
import { readStack, renderStackSection } from './stack.mjs';
```

В сборке `text` вставить раздел между `intro.md` и `brand.md`:

```js
  read('llms/intro.md'),
  '',
  renderStackSection(readStack(root)),
  '',
  read('llms/brand.md'),
```

- [ ] **Step 4: Сократить дубли в `llms/intro.md`**

Пункт 6:

```md
6. **Иконки — только `lucide-react`** (где искать иконки и API — раздел «Стек и где искать API» ниже).
```

Пункт 12:

```md
12. **Графики:** компоненты графика импортируйте из `recharts` (peer-зависимость, `npm i recharts`), обёртки — из `@mednet/ui/chart`; документация и `llms.txt` — раздел «Стек и где искать API» ниже.
```

Пункт 13 не менять.

- [ ] **Step 5: Защита публикации**

В `scripts/check-dist.mjs` массив `required` дополнить `'stack.json',`; после проверки `missing` добавить проверку раздела:

```js
import { readFileSync } from 'node:fs';
```
(объединить с существующим импортом `existsSync`: `import { existsSync, readFileSync } from 'node:fs';`) и перед завершением скрипта:

```js
const llms = readFileSync(new URL('../llms.md', import.meta.url), 'utf8');
if (!llms.includes('## Стек и где искать API')) {
  console.error('@mednet/ui: в llms.md нет раздела «Стек и где искать API». Выполните «pnpm build».');
  process.exit(1);
}
```

- [ ] **Step 6: Собрать и прогнать тесты**

Run:
```bash
pnpm --filter @mednet/ui build && pnpm --filter @mednet/ui test && node packages/ui/scripts/check-dist.mjs
```
Expected: build OK, все тесты PASS, `check-dist` молча завершается с кодом 0. Просмотреть `packages/ui/llms.md`: раздел стоит сразу после правил, три таблицы, версии в обратных кавычках, ссылки на `llms.txt` у shadcn/ui и Base UI.

- [ ] **Step 7: Changeset**

`.changeset/ui-stack-map.md`:

```md
---
'@mednet/ui': patch
---

В пакет добавлен `stack.json` (`@mednet/ui/stack.json`) — карта того, на чём построен кит: shadcn/ui, Base UI, Tailwind, lucide-react, Recharts, Embla Carousel, react-day-picker и другие, с ролью, ссылками на документацию, `llms.txt` и подсказкой, когда куда смотреть. В `llms.md` появился раздел «Стек и где искать API». Вид компонентов и API не менялись.
```

- [ ] **Step 8: Форматирование и Commit**

Run: `pnpm exec prettier --check packages/ui/stack.json packages/ui/scripts packages/ui/llms packages/ui/src/__tests__/stack.test.ts .changeset/ui-stack-map.md` (при замечаниях — `--write` на тех же путях).

```bash
git add packages/ui/scripts packages/ui/llms packages/ui/src/__tests__/package.test.ts .changeset/ui-stack-map.md
git commit -m "feat(ui): раздел «Стек и где искать API» в llms.md"
```

---

### Task 3: Страница `/docs/stack` в playground

Playground — вне git; пока Task 1–2 не выпущены в npm, используется локальный `stack.json` (Step 3).

**Files:**
- Create: `C:\A\mednet-playground\react\scripts\gen-stack.mjs`
- Create: `C:\A\mednet-playground\react\src\stack.json` (генерируется)
- Create: `C:\A\mednet-playground\react\src\docs\stack-page.tsx`
- Modify: `C:\A\mednet-playground\react\package.json` (скрипт `gen:stack`)
- Modify: `C:\A\mednet-playground\react\src\docs\nav.ts` (пункт после «Установки»)
- Modify: `C:\A\mednet-playground\react\src\App.tsx` (маршрут)
- Modify: `C:\A\mednet-playground\react\src\docs\component-page.tsx:158` (ссылка на `/docs/stack`)

**Interfaces:**
- Consumes: `node_modules/@mednet/ui/stack.json` и `package.json` (поля `version`, `dependencies`, `peerDependencies`, `devDependencies`) — формат из Task 1.
- Produces: `src/stack.json` — массив `StackEntry` (с полем `version: string | null`); компонент `Stack` из `src/docs/stack-page.tsx`.

- [ ] **Step 1: Копия и скрипт генерации**

```bash
cd /c/A/mednet-playground/react && cp -r src ../src-backup-stack-2026-10-27
```

`scripts/gen-stack.mjs`:

```js
// src/stack.json из @mednet/ui/stack.json: добавляет версии по package.json установленного кита.
// Источник — --from <путь к stack.json> (локальная проверка до релиза) или node_modules/@mednet/ui/stack.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fromIdx = process.argv.indexOf('--from');
const source = fromIdx > 0 ? resolve(process.argv[fromIdx + 1]) : resolve('node_modules/@mednet/ui/stack.json');
const pkgPath = fromIdx > 0 ? resolve(process.argv[fromIdx + 1], '../package.json') : resolve('node_modules/@mednet/ui/package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

function versionOf(name) {
  if (name === null) return null;
  if (name.startsWith('@mednet/')) return pkg.version;
  for (const key of ['dependencies', 'peerDependencies', 'devDependencies']) if (pkg[key]?.[name]) return pkg[key][name];
  throw new Error(`gen-stack: у ${name} нет версии в package.json @mednet/ui`);
}

const entries = JSON.parse(readFileSync(source, 'utf8')).map((e) => ({ ...e, version: versionOf(e.package) }));
writeFileSync(resolve('src/stack.json'), `${JSON.stringify(entries, null, 2)}\n`);
console.log(`stack.json: ${entries.length} записей (${source})`);
```

В `package.json` в `scripts` после `"gen:api"` добавить `"gen:stack": "node scripts/gen-stack.mjs",`.

- [ ] **Step 2: Страница**

`src/docs/stack-page.tsx`:

```tsx
import { ExternalLink } from 'lucide-react';
import { Badge } from '@mednet/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@mednet/ui/card';
import stack from '../stack.json';
import { A, C, H2, P, PageHeader } from './ui';

interface Entry {
  id: string;
  name: string;
  package: string | null;
  group: 'base' | 'lib' | 'kit';
  role: string;
  docs: string;
  llms?: string;
  when: string;
  usage: 'inside' | 'peer' | 'project';
  version: string | null;
}

const entries = stack as Entry[];
const groups: { key: Entry['group']; title: string; text: string }[] = [
  { key: 'base', title: 'Основа', text: 'Что определяет компоненты и их API.' },
  { key: 'lib', title: 'Функциональные библиотеки', text: 'Иконки, графики, слайдер, календарь и другие движки внутри компонентов.' },
  { key: 'kit', title: 'Экосистема кита', text: 'Токены, статические стили, линтеры и шрифт.' },
];
const usage: Record<Entry['usage'], string> = {
  inside: 'внутри кита',
  peer: 'peer-зависимость',
  project: 'ставится в проект',
};

export function Stack() {
  return (
    <article>
      <PageHeader
        title="Стек"
        lead="На чём построен кит и куда смотреть за API, когда нужного пропса нет в справке компонента."
      />
      <P>
        Нет нужного свойства на странице компонента — ищите в документации основы (<A href="https://base-ui.com/react/overview/quick-start">Base UI</A> и{' '}
        <A href="https://ui.shadcn.com/docs/components/base">shadcn/ui</A>), затем в библиотеке из списка ниже. Агентам та же карта доступна в разделе «Стек и где искать API» файла{' '}
        <C>llms.md</C>.
      </P>
      {groups.map((g) => (
        <section key={g.key}>
          <H2>{g.title}</H2>
          <P>{g.text}</P>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {entries
              .filter((e) => e.group === g.key)
              .map((e) => (
                <Card key={e.id}>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      {e.name}
                      {e.version ? <Badge variant="secondary">{e.version}</Badge> : null}
                    </CardTitle>
                    <CardDescription>{e.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>
                      <span className="font-medium">Когда смотреть: </span>
                      {e.when}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <a href={e.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                        Документация <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                      {e.llms ? (
                        <a href={e.llms} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                          llms.txt <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ) : null}
                      <Badge variant="outline">{usage[e.usage]}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </article>
  );
}
```

Если `CardContent` или `Badge` отсутствуют в `@mednet/ui` — проверить `ls node_modules/@mednet/ui/dist/components/{card,badge}.js` и использовать то, что экспортирует модуль.

- [ ] **Step 3: Меню и маршрут**

`src/docs/nav.ts`, в `started` после `{ title: 'Установка', … }`:

```ts
  { title: 'Стек', to: '/docs/stack' },
```

`src/App.tsx`: добавить импорт `import { Stack } from './docs/stack-page';` и маршрут после `installation`:

```tsx
          <Route path="/docs/stack" element={<Stack />} />
```

- [ ] **Step 4: Ссылка со страницы компонента**

`src/docs/component-page.tsx:158`: заменить

```tsx
        Компонент входит в пакет <C>@mednet/ui</C> (<A href="/docs/installation">установка</A>). Импортируйте нужные части по подпути:
```

на

```tsx
        Компонент входит в пакет <C>@mednet/ui</C> (<A href="/docs/installation">установка</A>, <A href="/docs/stack">на чём построен кит</A>). Импортируйте нужные части по подпути:
```

- [ ] **Step 5: Сгенерировать данные и проверить сборку**

До релиза кита (локальный файл):
```bash
cd /c/A/mednet-playground/react && node scripts/gen-stack.mjs --from /c/A/mednet-kit/packages/ui/stack.json
```
После релиза: `pnpm update @mednet/ui && pnpm gen:stack`.

Run: `pnpm gen:stack` (или команда выше) → «stack.json: 17 записей»; затем `pnpm build && pnpm lint`.
Expected: сборка и линт проходят.

- [ ] **Step 6: Визуальная проверка**

Run: `pnpm dev`, открыть `/docs/stack` (Chrome, claude-in-chrome или Playwright из `apps/docs/node_modules` кита): три группы, 17 карточек, версии в бейджах, ссылки открываются в новой вкладке, пункт «Стек» в сайдбаре после «Установки», светлая и тёмная тема читаемы, на 375 px нет горизонтального скролла. Открыть `/docs/components/button` — ссылка «на чём построен кит» ведёт на `/docs/stack`.

- [ ] **Step 7: Зафиксировать результат**

Playground не под git: сохранить копию изменённых файлов не нужно, резервная копия `../src-backup-stack-2026-10-27` уже сделана в Step 1. Отчитаться о результатах проверки.

---

## Self-Review

**Покрытие спеки.** Источник `stack.json`, публикация в `files`/`exports`, версии из `package.json` — Task 1. Состав записей — Task 1 (17 записей; в чате было «13» — без `@mednet/css`, `@mednet/lint-config` и Montserrat). `llms.md`, сокращение `intro.md` — Task 2. Тесты `stack.json`, `check-dist` — Task 1–2. Страница, сайдбар, ссылка со страницы компонента — Task 3. Changeset `patch` — Task 2. Порядок «кит → релиз → playground» отражён во вступлении Task 3.

**Отклонение от спеки (согласовать):** пункт 13 `intro.md` не сокращается (это правило установки); в спеке написано «6, 12, 13».

**Плейсхолдеры:** нет; ссылки в `stack.json` проверяются шагом 7 Task 1.

**Типы:** `StackEntry`/`Entry` (`id, name, package, group, role, docs, llms?, when, usage, version`) совпадают в `stack.mjs`, тесте, `gen-stack.mjs` и `stack-page.tsx`; функции `readStack`, `versionOf`, `renderStackSection`, `GROUPS` названы одинаково во всех задачах.
