# Пилот, план B: шаблон `templates/next`, CLI `@mednet/create-app`, пилотный прогон, релиз — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Статус плана:** все 22 задачи расписаны полностью; заготовок нет. Факты прототипа (facts-1, facts-2, facts-3) завершены.

**Goal:** Команда (люди и AI-агенты) создаёт брендированный Next-проект одной командой `npm create @mednet/app <имя>`. Для этого план делает:
- шаблон `templates/next`: база, четыре пресета, CI-варианты, AI-слой, Docker;
- CLI `@mednet/create-app`;
- автоматический пилотный прогон каждого пресета: скрипт и матрица в CI;
- страницу docs «Новый проект»;
- подготовку первой публикации `@mednet/ui`, `@mednet/lint-config` и `@mednet/create-app`.

**Architecture:** Шаблон — обычные файлы в `templates/next/{base, presets/<пресет>, ci/<github|gitlab>}`. В pnpm workspace он не входит. CLI написан на TypeScript (`tsc` → `dist`). При сборке он копирует шаблон в `packages/create-app/template/`, а при запуске собирает проект: база → пресет (фрагмент `package.json` сливается) → CI → подстановка `{{name}}` и `{{kitVersion}}` → `_gitignore` → `.gitignore` → `npm install` → `git init`. Проект работает только на npm. Шаблон проверяется на только что собранных пакетах кита: локально — песочницей `pnpm sandbox`, в CI — пилотом `pnpm pilot` для каждого пресета. И песочница, и пилот кладут проект во временную папку и берут `@mednet/*` из тарболов `pnpm pack`. Пилот прогоняет `check`, `build`, e2e, собирает Docker-образ и ждёт ответа `/api/health`.

**Tech Stack:**
- Проект из шаблона: Next.js 16.4.1 (App Router, Turbopack, `output: 'standalone'`), React 19.3, Tailwind CSS 4.3 с `@mednet/ui/postcss`, TypeScript `~6.0.3`.
- Проверки проекта: ESLint 9.39 с eslint-config-next 16.4.1 и `@mednet/lint-config`, stylelint 17.16, Prettier 3.9 с prettier-plugin-tailwindcss 0.8, Vitest 5.0 с Testing Library 16 и jsdom 30, Playwright 1.64.0 с axe.
- Данные и деплой: TanStack Query 5.104, Docker `node:24-alpine` (BuildKit).
- CLI: Node ≥22.12, `util.parseArgs`, `@clack/prompts` 1.8.
- Репозиторий кита: pnpm 10.34.6, turbo 2.11, changesets 3.

**Спецификации:**
- [спека пилота](../specs/2026-10-14-pilot-ui-template-cli-design.md) (дальше «спека пилота»): объём — разделы 3–5 и «Порядок»;
- [основная спека](../specs/2026-10-13-mednet-design-system-design.md) (дальше «спека»): §11 и §12.

**Проверенные факты** (локальные файлы, в git их нет; ссылки вида «facts-1 §7»):
- `.superpowers/sdd/2026-10-14-plan-b-prototype/facts-1-template-base.md` (готов);
- `facts-2-presets-blocks.md` (готов; исходники пресетов — §7);
- `facts-3-cli-pilot.md` (готов).

**Решения владельца:** `owner-decisions.md` в той же папке.

**Исходники прототипов:**
- `scratchpad/proto-b1/app` — база;
- `proto-b2/tpl` — раскладка base и presets;
- `.superpowers/sdd/2026-10-14-plan-b-prototype/proto-3-sources/` — CLI, пилот, YAML.

---

## Решения владельца, принятые 2026-10-15 (обязательны)

Это пересказ `owner-decisions.md`. Пересматривать эти решения в ходе плана не нужно; вопросов, без ответа на которые план не выполнить, нет. Открытыми остаются только необязательные пункты на усмотрение владельца:
- отменить решение контроллера по `use-mobile` (пункт 6) — тогда Tasks 5 и 12 меняются;
- ручная проверка интерактивных вопросов CLI в настоящем терминале (Task 3: без псевдотерминала их проверили только по типам);
- пилотный проект в приватном репозитории для DevOps (спека пилота §5, пункт 7 чек-листа Task 22).

1. **ESLint 9 в шаблоне** (П14).
   - Берётся последний 9.x — `^9.39.5`.
   - Предупреждение `npm warn deprecated eslint@9.39.5` при установке допустимо.
   - На ESLint 10 переходим, когда его объявит `eslint-config-next`.
   - `@mednet/lint-config` по-прежнему допускает и 9, и 10.
2. **Насыщенность заголовков переносится в `@mednet/ui/styles.css`.** Правило `@layer base { h1, h2, h3 { font-weight: var(--mn-font-weight-heading); } }`:
   - уходит из `apps/docs/app/globals.css` в пакет;
   - в `globals.css` шаблона не повторяется;
   - скриншоты docs не меняются: правило переезжает, а не меняется.

   Это Task 6. Changeset для `@mednet/ui` — `patch`: пакет ещё не опубликован, и потребителей правка не затрагивает (решение контроллера). Существующий changeset пилота её не покрывает: `.changeset/pilot-a-ui-lint-config.md` израсходован релизом 0.2.0 (коммит `236705f`).
3. **Шаблон только для npm.**
   - Dockerfile работает с `package-lock.json` и `npm ci`.
   - CLI всегда ставит зависимости через npm — даже при запуске через `pnpm create` или `yarn create` — и честно объясняет почему.
   - Task 3 правит текст спеки пилота (§4) и README CLI.
4. **`Command` (cmdk) остаётся в `@mednet/ui`.**
5. **Кит сейчас в версии 0.2.0.** `@mednet/tokens` и `@mednet/css` 0.2.0 опубликованы. `@mednet/ui` и `@mednet/lint-config` 0.2.0 лежат в репозитории с пометкой `private`.
6. **`use-mobile` — подпуть кита.**
   - `@mednet/ui` экспортирует `@mednet/ui/use-mobile`: явный ключ `exports` → `dist/hooks/use-mobile.js` и типы; обновляются `gen-index`, `llms`, `check-dist` и тесты. Это Task 5.
   - Шаблон держит заглушку `hooks/use-mobile.ts` = `export * from '@mednet/ui/use-mobile'`, как остальные.
   - Хук shadcn шаблон не копирует: его ловит `react-hooks/set-state-in-effect` (facts-2 Q1.1).
   - Решение принял контроллер по П10; владелец может его отменить.
7. **Заглушки и блоки shadcn** (facts-2 Q1.2, Q1.3). Это Task 12.
   - Заглушки `components/ui/*` (61), `hooks/use-mobile.ts` и `lib/utils.ts` **закоммичены** в `templates/next/base`. Генератор `npm run ui:stubs` остаётся в проекте для обновлений.
   - `npm run ui:add -- <блок>` — кроссплатформенная замена `yes n |`: отвечает «n» на вопросы о перезаписи, меняет `from "cn"` на `from '@/lib/utils'` и убирает зависимость `cn`, которую добавил shadcn.
   - `AGENTS.md` предупреждает: официальным блокам бывают нужны `sonner`, `next-themes` и `@dnd-kit/*`, которых в ките нет (вместо `sonner` — `toast` из `@mednet/ui/toast`). Блок должен пройти `npm run check`.
   - Таблицы — TanStack Table v9. `playwright-core` 1.64.0 стоит рядом с `@playwright/test`. `recharts` объявляет пресет `dashboard`.
8. **Версии кита в проекте — `^{{kitVersion}}`.** Например, `^0.2.0` = `>=0.2.0 <0.3.0`: проект получает патчи кита своего минора (facts-3 §7). Строки — в `templates/next/base/package.json` (Tasks 7, 10, 12).
9. **Actions в CI шаблона закреплены по SHA с комментарием `# vX.Y.Z`**, как в CI кита (Dependabot умеет их обновлять). SHA те же, что в `.github/workflows/ci.yml` кита:
   - `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0`;
   - `actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0`.

   Других actions в CI шаблона нет (Task 4).
10. **GitLab CI шаблона принят как проверенный только по синтаксису** (facts-3 §6). README шаблона говорит об этом прямо; первый настоящий прогон делает DevOps (Tasks 4, 13).
11. **Релиз — только владелец.** Снятие `"private"` с трёх пакетов, три ручные первые публикации с 2FA, `npm trust`, `mfa=publish` и пилотный репозиторий для DevOps (спека пилота §5) — это чек-лист владельца в Task 22. Агент их не выполняет (facts-3 §7, `docs/releasing.md`, «Новый пакет»).
## Решения плана (выведены из фактов)

1. **`templates/next` не входит в pnpm workspace**, поэтому `pnpm-workspace.yaml` не меняется. Причины:
   - в `package.json` базы стоят плейсхолдеры `"name": "{{name}}"` и `"@mednet/ui": "^{{kitVersion}}"` (facts-3 §4). Это недопустимые спецификации для pnpm: `pnpm install` всего репозитория упал бы;
   - шаблон — самостоятельный npm-проект на тарболах кита (facts-1 §0, §7; facts-2 §0.2);
   - Turbo видит изменения шаблона через `inputs` в `packages/create-app/turbo.json` (facts-3 §3).

   Проверка шаблона — песочница (Task 7) и пилот (Task 15).
2. **Раскладка шаблона.**
   - Каталоги: `templates/next/base/**`, `templates/next/presets/<пресет>/**`, `templates/next/ci/<github|gitlab>/**`.
   - CLI умеет заменить файл базы файлом пресета с тем же путём. Но по соглашению пресеты **только добавляют** файлы (facts-2 Q6), и тест Task 14 следит, чтобы ни один путь пресета не совпадал с путём базы.
   - `presets/<пресет>/package.json` — фрагмент (только `dependencies`; у `landing` его нет). Сам он в проект не копируется (facts-3 §3–4). При слиянии с базовым `package.json`:
     - поля `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies` и `overrides` сливаются и сортируются;
     - `scripts` дописываются после базовых;
     - остальные поля заменяются.
3. **В базе нет `app/page.tsx`: страницу даёт пресет.**
   - Наложение не умеет удалять файлы. При этом `app/page.tsx` (пресет `landing`) и `app/(app)/page.tsx` (пресеты `tool`, `cabinet`, `dashboard`, прототип B2) оба обслуживают `/`, и Next не соберёт проект, где есть оба файла.
   - Поэтому демо B1 (`app/page.tsx`, `components/items-list.tsx`, `app/api/items`) в базу не входит.
   - Базу проверяют её собственные тесты (`/api/health`, провайдеры, `lib/api.ts`), `next build` и e2e: здоровье и корневой layout на странице 404.
4. **Тесты Vitest лежат в `tests/`.** Пресеты B2 импортируют помощники из `./render`, поэтому `tests/render.tsx` (`renderWithQuery`, `mockFetch`) — общий файл базы. Маска `include: ['**/*.test.{ts,tsx}']` из B1 находит тесты и в `tests/`, и рядом с кодом.
5. **`lib/api.ts` объединяет два прототипа.**
   - Из B1: `ApiError` со `status`, префикс `NEXT_PUBLIC_API_URL`, заголовок `Accept`.
   - Из B2: `apiPost` и `apiPut`. Их используют пресеты `tool` и `cabinet` (proto-b2).
6. **Подстановка `{{name}}` и `{{kitVersion}}` идёт в четырёх файлах:** `package.json`, `README.md`, `AGENTS.md` и `app/layout.tsx`.
   - `app/layout.tsx` добавлен ради заголовка вкладки `%s — <имя>`, как в B2.
   - В CI-файлах и `docker-compose.yml` подстановки нет. Тег образа в CI — `app:ci` (facts-3 §6). В compose нет ключа `image:`, поэтому compose сам называет образ `<папка>-app`.
7. **Тесты CLI работают на фикстуре шаблона** (`packages/create-app/test/fixtures/template`), а не на реальном `templates/next`. Иначе потоки CLI и шаблона не смогли бы идти параллельно. Генерацию из реального шаблона по каждому пресету проверяет пилот (Tasks 15, 20).
8. **Логика CLI — функция `run(argv, ctx): Promise<number>`** в `src/cli.ts`, а `src/index.ts` — тонкая обёртка. Так коды выхода 0, 1, 2 и 130 проверяются юнит-тестами.
9. **Только npm (решение владельца 3).**
   - `detectPm` по `npm_config_user_agent` нужен только для пояснения `npmOnlyNote`.
   - `install(cwd)` всегда запускает `npm install`.
   - В «следующих шагах» CLI печатает команды npm.
10. **Песочница импортирует `packages/create-app/src/generate.ts` напрямую:** Node 24 снимает типы сам (проверено: Node 24.20.0, импорт `.ts` из `.mjs`, без предупреждений). Поэтому у CLI стоит `erasableSyntaxOnly: true`, и логика генерации существует в одном месте.
11. **В шаблоне есть `.gitattributes` с `* text=auto eol=lf`, как в ките.** У автора на Windows `core.autocrlf=true`, и без этого файла клон проекта получил бы CRLF, а `prettier --check` (`endOfLine: lf`) упал бы.
12. **Корневой `.prettierignore` исключает `templates/next`.** `.prettierrc.json` шаблона подключает `prettier-plugin-tailwindcss`, а в ките этого плагина нет. Формат шаблона проверяет `npm run format:check` в песочнице, то есть Prettier самого проекта.
13. **Dockerfile шаблона без кода для тарболов кита.**
    - Пилот создаёт `Dockerfile.pilot`: вставляет `COPY .mednet-tarballs ./.mednet-tarballs` перед строкой-якорем `COPY package.json package-lock.json ./` (facts-3 §5, п. 3). Якорь в шаблоне нужно сохранить.
    - Вариант facts-1 §7 с `COPY .mednet-tarball[s] …` тоже проверен. Но он показывал бы заказчику служебную строку кита.
    - BuildKit нужен в обоих вариантах из-за `RUN --mount=type=cache` (facts-1 §7).
14. **`tsconfig.json` шаблона: `next typegen && tsc --noEmit` и `"noUncheckedSideEffectImports": false`.**
    - Без typegen и без этой опции TypeScript 6 падает на `import './globals.css'` с ошибкой `TS2882` (facts-3 §5, п. 2; так же сделано в docs-сайте).
    - С typegen проходит и без опции (facts-1 §3c). С опцией проходит в обоих режимах: проверено при написании плана на `node_modules` прототипа B1.
15. **`ARG NEXT_PUBLIC_API_URL` в стадии build Dockerfile.** `NEXT_PUBLIC_*` встраивается в клиентский код при сборке (facts-1 §6), а без `ARG` значение из `docker build --build-arg` до `next build` не дойдёт. Пустое значение по умолчанию сохраняет проверенное поведение: запросы идут на тот же адрес. Это единственное непроверенное прототипом отличие Dockerfile; сборку проверяет пилот в CI.
16. **Axe и Playwright стоят в базе,** а не в пресетах: e2e всех пресетов B2 используют `@axe-core/playwright`.
    - `playwright-core` закрепляется ровно `1.64.0`, как `@playwright/test`. Иначе типы `AxeBuilder` расходятся (facts-2 §0.2).
    - В базе e2e проверяет `/api/health` и корневой layout.
17. **Исходники пресетов взяты из facts-2 §7 с правками плана.**
    1. Код отформатирован Prettier (`singleQuote`, ширина 100, `trailingComma: all`; в проекте ещё `prettier-plugin-tailwindcss` сортирует классы). В прототипе B2 не было Prettier.
    2. Из моков `tool` и `cabinet` убрана строка `export const dynamic = 'force-dynamic'` (решение по facts-1 §2); `next build` обязан показать `ƒ /api/items` и `ƒ /api/profile` (Tasks 17, 18).
    3. Пресеты лежат поверх базы плана, а не базы B2.
    4. Из Vitest-тестов пресетов убран `afterEach(() => vi.unstubAllGlobals())`: подмены снимает `vitest.setup.ts` базы (Task 8).
    5. e2e `tool` и `cabinet` создают и сохраняют данные с уникальным значением на каждую попытку (`Date.now()`): мок хранит данные в памяти сервера, а повтор упавшего теста в CI (`retries: 1`) идёт на том же сервере.
    6. У `tool` добавлены `tests/dialog.test.tsx` и `tests/items-route.test.ts` (Task 17).

    При написании плана все четыре пресета собраны поверх базы плана, установка — общий `node_modules` прототипа B2 (без записи в него). Результат по каждому:
    - `next typegen && tsc --noEmit` — exit 0;
    - `eslint --max-warnings=0` — exit 0;
    - Vitest зелёный.

    Ожидаемые числа тестов (сосчитаны по коду плана; база — 3 файла и 6 тестов):
    - Vitest: `landing` — 7 тестов в 4 файлах, `tool` — 11 в 6, `cabinet` — 8 в 4, `dashboard` — 7 в 4;
    - Playwright (`playwright test --list`): у каждого пресета 3 теста в 2 файлах — 2 в `e2e/health.spec.ts` базы и 1 в `e2e/smoke.spec.ts` пресета.

    Правки 4–5 сделаны при сведении плана и проверены только Prettier; их, как и `next build` и e2e с axe на базе плана, проверяют песочница пресета и пилот в CI (Task 20).
18. **Заглушки в ките генерирует тот же скрипт, что и в проекте:** `templates/next/base/scripts/gen-ui-stubs.mjs` с аргументом `packages/ui/src/components`. Тест кита (`scripts/lib/template-scripts.test.mjs`) сверяет заглушки с компонентами `@mednet/ui`, поэтому новый компонент кита без заглушки не останется (facts-2 Q1.3).

## Расхождения прототипов и как план их разрешает

- **Страница и демо `items`.** B1 держит их в базе, у B2 в базе страницы нет. План следует B2 (решение 3).
- **Где лежат тесты.**
  - B1: `app/page.test.tsx`;
  - B2: `tests/page.test.tsx`, а `include` сужен до `tests/**`;
  - план: тесты в `tests/`, маска из B1 (решение 4).
- **Набор функций `lib/api.ts`.** У B1 только `apiGet`, у B2 нет `NEXT_PUBLIC_API_URL`. План объединяет оба варианта (решение 5).
- **`export const dynamic = 'force-dynamic'` в `/api/health`** (так в B2). GET-обработчики Next 16 и так динамические, а вместе с `cacheComponents` эта строка — ошибка (facts-1 §2). План эту строку не ставит.
- **`export default { … }` в `postcss.config.mjs`** (так в B2). ESLint это не пропускает (facts-1 §3a). План пишет `const config = …; export default config;`.
- **Проверка типов на свежем дереве.**
  - facts-1 §3c: `tsc --noEmit` проходит и без `next-env.d.ts`;
  - facts-3 §5, п. 2: простой `tsc --noEmit` падает на `TS2882`;
  - план: typegen плюс опция (решение 14), проходит в обоих режимах.
- **Тарболы в Docker.**
  - facts-1 §7: одна строка `COPY .mednet-tarball[s]` в шаблоне;
  - facts-3 §5: `Dockerfile.pilot` с вставкой перед якорем;
  - план: `Dockerfile.pilot` (решение 13).
- **Пользователь в контейнере.** B3 создаёт пользователя `app` через `addgroup`/`adduser`, B1 берёт готового `node` (uid 1000). План использует `node`, как проверенный финальный Dockerfile facts-1 §7.
- **Копирование `node_modules` между стадиями.** B3 копирует их из deps в build. B1 строит build `FROM deps` — на Docker Desktop это на 265 с быстрее (facts-1 §7). План следует B1.
- **`overrides` для тарболов.**
  - B3 задаёт одинаковые спецификации и для прямых, и для транзитивных пакетов;
  - B1 задаёт `overrides` только для транзитивного `@mednet/tokens`;
  - оба варианта работают с npm 11 (facts-1 §7, facts-3 §5, п. 1);
  - план берёт вариант B1.
- **Работа без lockfile.** facts-3 §5, п. 4 предлагает `package-lock.json*` или `npm install` без lockfile. Решение владельца 3 — строгий `npm ci`. Поэтому README требует закоммитить lockfile, а CLI ставит зависимости через npm, и lockfile появляется сам.
- **Job `pilot-gitlab` в прототипе B3.** Он передаёт CLI абсолютный путь `"$RUNNER_TEMP/gl"`, а `validateName` такое имя отвергнет: в нём есть `/`. В прототипе этот job проверялся только actionlint, но не запускался. План запускает CLI с `working-directory: ${{ runner.temp }}` и коротким именем `gl` (Task 20).
- **Стиль кода прототипа B3.** Он без точек с запятой. Код CLI в плане переформатирован под Prettier кита.
- **`hooks/use-mobile.ts`.** В B2 это собственный хук шаблона на `useSyncExternalStore`. По решению владельца 6 это заглушка-реэкспорт `@mednet/ui/use-mobile` (Task 5, Task 12).
- **`scripts/ui-add.mjs`.** В B2 скрипт только отвечает «n», а по решению владельца 7 он ещё правит импорт `cn` и убирает зависимость `cn`. Кроме того, команда передаётся одной строкой с `shell: true`, а не массивом аргументов (как в CLI, иначе Node 24 печатает DEP0190). Это непроверенное отличие от B2, его проверяет Task 12, Step 8.

---

## Global Constraints

**Версии и среда**
- **Кит и новый пакет.** Кит — `0.2.0`. Новый пакет `@mednet/create-app` — версия `0.2.0` и `"private": true` до Task 22, как `@mednet/ui` и `@mednet/lint-config` (facts-3 §7, `docs/releasing.md`, «Новый пакет»).
- **Среда.** Node 24.20 (`.nvmrc` = `24`), npm 11.19, pnpm `10.34.6`. TypeScript **`~6.0.3`, не 7.x**: `typescript-eslint` 8.71 требует `<6.1.0` (facts-1 §1).
- **Шаблон: пакеты кита** — `@mednet/ui` (`dependencies`) и `@mednet/lint-config` (`devDependencies`) с диапазоном **`^{{kitVersion}}`** (решение владельца 8, Р1); CLI подставляет версию CLI.
- **Шаблон: `dependencies`** (facts-1 §1, §9):
  - `next` — точно `16.4.1`;
  - `react` и `react-dom` — `^19.3.1`;
  - `@tanstack/react-query` — `^5.104.2`;
  - `lucide-react` — `^1.57.0`.
- **Шаблон: `devDependencies` для сборки и типов:**
  - `@types/react` и `@types/react-dom` — `^19.3.0`;
  - `@types/node` — `^24.19.2`;
  - `tailwindcss` и `@tailwindcss/postcss` — `^4.3.3`;
  - `typescript` — `~6.0.3`.
- **Шаблон: `devDependencies` для линтеров:**
  - `eslint` — `^9.39.5` (решение владельца 1);
  - `eslint-config-next` — точно `16.4.1`;
  - `stylelint` — `^17.16.0`;
  - `prettier` — `^3.9.10`;
  - `prettier-plugin-tailwindcss` — `^0.8.1`.
- **Шаблон: `devDependencies` для тестов:**
  - `vitest` — `^5.0.4`, без `@vitejs/plugin-react`;
  - `@testing-library/react` — `^16.3.3`, `@testing-library/dom` — `^10.4.2`, `@testing-library/jest-dom` — `^7.0.1`, `@testing-library/user-event` — `^14.6.8`;
  - `jsdom` — `^30.1.2`;
  - `@playwright/test` и `playwright-core` — **точно `1.64.0`**. Это версия Docker-образа `mcr.microsoft.com/playwright:v1.64.0-noble`; поднимать их вместе (facts-1 §5, facts-2 §0.2);
  - `@axe-core/playwright` — `4.13.0`.
- **Пресеты** (facts-2 §0.1, Q6), по одному фрагменту `package.json` на пресет:
  - `@tanstack/react-table` — `^9.3.1` (major 9, API v9: `tableFeatures`, `useTable`, `table.FlexRender`);
  - `zod` — `^4.6.7`;
  - `react-hook-form` — `^7.90.0`;
  - `@hookform/resolvers` — `^5.9.1`;
  - `recharts` — `^3.8.0`, только в `dashboard` (facts-1 §2).
- **Docker.**
  - Образ `node:24-alpine`, нужен BuildKit (Docker 23+).
  - Пользователь `node`, переменная `HOSTNAME=0.0.0.0` обязательна, проверка здоровья — `wget` на `127.0.0.1`.
  - В `public/` должен быть хотя бы один файл.
  - `.dockerignore` **не** исключает `.mednet-tarballs` (facts-1 §7, facts-3 §5).
- **CLI.**
  - `@clack/prompts` — `^1.8.1`.
  - Флаги разбирает `util.parseArgs` с `allowNegative: true`.
  - Пакет `validate-npm-package-name` не нужен: имя проверяет короткое регулярное выражение.
  - Единственный bin называется `create-app`: yarn classic ищет `create-<имя>` (facts-3 §1–2, §4).
- **Блоки shadcn.** Для `npm run ui:add` нужен CLI shadcn ровно `4.21.4`: так у `@mednet/ui`. Флага «пропустить существующие файлы» у `shadcn add` нет, а `-y` не отвечает на вопросы о перезаписи (facts-2 Q1).

**Решения, обязательные для всех задач** (подробности — «Решения владельца» выше)
- **Только npm** (решение владельца 3). Проект из шаблона ставит зависимости только npm: `Dockerfile` — `npm ci` по `package-lock.json`, CI шаблона — `npm ci`, CLI всегда запускает `npm install` и при запуске через `pnpm create`/`yarn create` печатает пояснение (`npmOnlyNote`). В шаблоне нет `pnpm-lock.yaml`, `yarn.lock` и команд установки через pnpm или yarn.
- **ESLint 9 в шаблоне** (`^9.39.5`), `@mednet/lint-config` допускает 9 и 10 (решение владельца 1, П14).
- **TypeScript `~6.0.3`** и в шаблоне, и в `@mednet/create-app`.
- **Playwright `1.64.0` ровно** — `@playwright/test` и `playwright-core` вместе, как образ `mcr.microsoft.com/playwright:v1.64.0-noble` (решение владельца 7).
- **Actions в CI шаблона — по SHA с комментарием `# vX.Y.Z`**, те же SHA, что в `.github/workflows/ci.yml` кита (решение владельца 9, Р2).
- **GitLab CI шаблона проверен только по синтаксису**; README шаблона говорит об этом прямо, первый настоящий прогон — у DevOps (решение владельца 10, Р3).
- **Насыщенность заголовков — в ките:** правило `h1, h2, h3 { font-weight: var(--mn-font-weight-heading) }` живёт в `@mednet/ui/styles.css` (Task 6); `globals.css` шаблона и docs-сайта — одна строка `@import '@mednet/ui/styles.css';`, правило не повторяется (решение владельца 2).
- **`use-mobile` — подпуть кита** `@mednet/ui/use-mobile` (Task 5); в шаблоне — заглушка `hooks/use-mobile.ts` = `export * from '@mednet/ui/use-mobile'`, хук shadcn не копируется (решение владельца 6).
- **`Command` (cmdk) остаётся в `@mednet/ui`** (решение владельца 4): задач по нему в плане нет.

**Как запускать проверки**
- **У npm флаги — после `--`:** `npm create @mednet/app my-app -- --preset tool`. Без `--` npm сам забирает `--yes` и `--no-*` (facts-3 §1).
- **Локально — только быстрые проверки:** юнит-тесты, typecheck, lint, одна `next build` там, где она нужна. Сборка Docker-образов, Playwright e2e и пилот четырёх пресетов идут в GitHub Actions (Task 20). На машине автора параллельные агенты держат CPU на 100 %.
- **Исключения — лёгкие запуски Docker:**
  - actionlint (Tasks 4, 20);
  - `docker compose config` (Task 11);
  - эталоны скриншотов docs (Task 21): они коммитятся, поэтому снимаются в Linux-образе Playwright штатной командой кита `pnpm test:visual:update`.
- **Vitest локально — только `pool: 'threads'`.** Если запуск под нагрузкой падает с `[vitest-pool-runner]: Timeout waiting for worker to respond`, это не ошибка теста.
  - Причина: в Vitest 5 время старта воркера жёстко ограничено 60 с (`START_TIMEOUT = 6e4`), а воркер с jsdom под нагрузкой стартует дольше (facts-1 §3d).
  - Что делать: повторить с `--maxWorkers=1 --no-file-parallelism`, когда машина свободнее (так проверено при написании плана), и отметить повтор в отчёте.
- **Порты.** Порт 4173 на машине автора занят. Свободные порты — 4319–4329. e2e по умолчанию слушает 4321, пилот — 4328.
- **Шаблон правится только в `templates/next/**`.** Песочница — одноразовая копия: правки внутри неё теряются при следующем запуске `node scripts/sandbox.mjs`.

**Стиль и правила**
- **Prettier.**
  - Код кита (`packages/**`, `scripts/**`, `apps/docs/**`) форматирует Prettier кита: одинарные кавычки, точки с запятой, ширина 100. Перед коммитом — `pnpm exec prettier --write <пути>` и `pnpm format:check`.
  - Файлы шаблона форматирует Prettier проекта: в песочнице `npm run format:check`.
- **Язык.** Комментарии и тексты для людей — по-русски, идентификаторы — по-английски.
- **Конфиги шаблона** с объектом по умолчанию пишутся как `const config = {…}; export default config;` (facts-1 §3a).
- **Цвета** — только семантические классы токенов. **Основа** — Base UI: проп `render`, не `asChild`. **Иконки** — только `lucide-react`.
- **Секреты.** В `templates/next` не должно быть настоящих `.env*`: они переживают упаковку в npm (facts-3 §3).

**Правила агента (`AGENTS.md`)**
- Не публиковать пакеты (`npm publish`, `pnpm publish`, `changeset publish`). Для проверок `pnpm pack` можно.
- Не создавать npm-токены.
- Не мержить Version PR.
- Не запускать `pnpm version-packages`.
- Не менять `.github/workflows/release.yml`.
- Изменения в `packages/*`, видимые потребителю, — с changeset (Tasks 5, 6 и 22).
- Сгенерированные файлы `@mednet/ui` (`src/index.ts`, `src/components/**`) руками не правятся: индекс — `pnpm --filter @mednet/ui gen:index` (`AGENTS.md` кита).

---

## Карта файлов

```
.
├─ .gitignore .prettierignore                               Task 1
├─ pnpm-lock.yaml                                           Task 1
├─ package.json                                             Task 7 (sandbox), Task 15 (pilot)
├─ .github/workflows/ci.yml                                 Task 20
├─ .changeset/ui-use-mobile.md                              Task 5
├─ .changeset/ui-heading-weight.md                          Task 6
├─ .changeset/pilot-b-create-app.md README.md docs/releasing.md   Task 22
├─ docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md   Task 3 (П15, §4), Task 6 (П16, §3)
├─ scripts/
│  ├─ lib/kit-tarballs.mjs lib/kit-tarballs.test.mjs        Task 7 (+15: dockerfileForPilot)
│  ├─ lib/template-scripts.test.mjs                         Task 12
│  ├─ lib/template-docs.test.mjs                            Task 13
│  ├─ sandbox.mjs                                           Task 7
│  └─ pilot.mjs                                             Task 15
├─ packages/ui/
│  ├─ package.json scripts/gen-index.mjs scripts/build-llms.mjs scripts/check-dist.mjs   Task 5
│  ├─ src/index.ts (генерируется) src/__tests__/package.test.ts                       Task 5
│  └─ src/styles.css src/__tests__/styles.test.ts                                     Task 6
├─ packages/create-app/
│  ├─ package.json                                          Task 1 (+3, 14)
│  ├─ tsconfig.json tsconfig.build.json vitest.config.ts LICENSE scripts/clean.mjs   Task 1
│  ├─ scripts/copy-template.mjs scripts/check-dist.mjs turbo.json                    Task 14
│  ├─ src/generate.ts test/generate.test.ts test/fixtures/template/**                Task 1
│  ├─ src/args.ts src/name.ts src/pm.ts test/{args,name,pm}.test.ts                  Task 2
│  ├─ src/cli.ts src/index.ts README.md test/cli.test.ts                             Task 3
│  ├─ test/template.test.ts   (копия и состав шаблона: база, пресеты)                Task 14
│  └─ template/                (не в git: копия templates/next, собирается)          Task 14
├─ templates/next/
│  ├─ base/
│  │  ├─ package.json                                                       Task 7 (+10, 12)
│  │  ├─ .nvmrc _gitignore .gitattributes                                   Task 7
│  │  ├─ tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs stylelint.config.mjs   Task 8
│  │  ├─ .prettierrc.json .prettierignore vitest.config.ts vitest.setup.ts                       Task 8
│  │  ├─ app/layout.tsx app/providers.tsx app/globals.css app/api/health/route.ts               Task 8
│  │  ├─ tests/health.test.ts tests/providers.test.tsx                                           Task 8
│  │  ├─ lib/api.ts tests/render.tsx tests/api.test.ts                                           Task 9
│  │  ├─ playwright.config.ts e2e/health.spec.ts                                                 Task 10
│  │  ├─ Dockerfile .dockerignore docker-compose.yml public/.gitkeep                             Task 11
│  │  ├─ components.json scripts/gen-ui-stubs.mjs scripts/ui-add.mjs                             Task 12
│  │  ├─ components/ui/*.tsx (61) hooks/use-mobile.ts lib/utils.ts (генерируются)                 Task 12
│  │  └─ AGENTS.md CLAUDE.md README.md                                                           Task 13
│  ├─ presets/landing/   app/page.tsx tests/page.test.tsx e2e/smoke.spec.ts  (3 файла, без package.json)   Task 16
│  ├─ presets/tool/      package.json app/(app)/{layout,page}.tsx app/api/items/route.ts lib/items.ts
│  │                     components/{items-table,create-item-dialog}.tsx
│  │                     tests/{page.test.tsx,dialog.test.tsx,items-route.test.ts} e2e/smoke.spec.ts  (11)   Task 17
│  ├─ presets/cabinet/   package.json app/(app)/{layout,page}.tsx app/api/profile/route.ts lib/profile.ts
│  │                     components/profile-form.tsx tests/page.test.tsx e2e/smoke.spec.ts  (8)          Task 18
│  ├─ presets/dashboard/ package.json app/(app)/{layout,page}.tsx app/api/stats/route.ts lib/stats.ts
│  │                     components/dashboard.tsx tests/page.test.tsx e2e/smoke.spec.ts  (8)             Task 19
│  └─ ci/github/.github/workflows/ci.yml  ci/gitlab/.gitlab-ci.yml                               Task 4
└─ apps/docs/
   ├─ app/globals.css                                       Task 6 (правило заголовков уходит в пакет)
   ├─ app/(site)/new-project/page.tsx app/(site)/layout.tsx  Task 21
   └─ tests/pages.ts tests/__screenshots__/*.png             Task 21
```

---

## Порядок и параллельность

```
                ┌─ Поток CLI (worktree plan-b-cli):    Task 2 ──► 3 ──► 4 ──────────────────────────┐
Task 1 (main) ──┼─ Поток Кит (worktree plan-b-kit):    Task 5 (use-mobile) ──► 6 (заголовки) ─────────┤
                └─ Поток Шаблон (worktree plan-b-tpl): Task 7 ──► 8 ──► 9 ──► 10 ──► 11               │
                                                        ──► [влить main с Task 5] ──► 12 ──► 13 ────────┴──► merge в main

После слияния трёх потоков:
  Task 14 (CLI: шаблон в пакете) ──► Task 15 (пилот)                          ← main
  Task 16 ∥ Task 17 ∥ Task 18 ∥ Task 19 (пресеты)                             ← четыре worktree, параллельно с 14–15
  Tasks 15–19 ──► Task 20 (CI кита: пилот) ──► Task 21 (docs) ──► Task 22 (подготовка релиза)
```

**Потоки и слияние**
- **Task 1** выполняется в `main`. Он создаёт `generate.ts` (его использует песочница), меняет `pnpm-lock.yaml` и корневые ignore-файлы. После него параллельные потоки не трогают общих файлов.
- **Worktree** — после Task 1:
  ```bash
  for d in cli kit tpl; do git worktree add ../mednet-kit-$d -b plan-b-$d; done
  for d in cli kit tpl; do (cd ../mednet-kit-$d && pnpm install --frozen-lockfile); done
  ```
- **Какие файлы правит каждый поток** (пересечений нет, слияние в `main` без конфликтов):
  - CLI: `packages/create-app/**`, `templates/next/ci/**` и спека пилота (Task 3);
  - Кит: `packages/ui/**`, `apps/docs/app/globals.css`, `.changeset/ui-*.md` и спека пилота (Task 6);
  - Шаблон: `scripts/**`, корневой `package.json` и `templates/next/base/**`.

  Спеку пилота правят Task 3 и Task 6. Правки в §3 и §4 git объединит сам, но обе задачи дописывают строку в конец таблицы «Решения пилота» (П15 и П16) — второй влитый поток получит конфликт в этой таблице. Разрешение: оставить обе строки, П15 перед П16.
- **Перед Task 12** влейте в `plan-b-tpl` ветку `main`, в которую уже слит поток Кит (`git merge main`). Заглушка `hooks/use-mobile.ts` реэкспортирует `@mednet/ui/use-mobile`: без Task 5 упадёт `tsc` в песочнице, потому что песочница пакует `@mednet/ui` из своего worktree.
- **Tasks 14 и 15** выполняются в `main` после слияния потоков. Task 14 нужны `templates/next/base` целиком и `dist/index.js` (Task 3): без шаблона сборка CLI в CI упадёт. Task 15 нужны Tasks 7, 11 и 14.
- **Пресеты (Tasks 16–19)** стартуют, когда база шаблона (Tasks 7–13) в `main`. Каждый пресет — свой worktree:
  ```bash
  for p in landing tool cabinet dashboard; do git worktree add ../mednet-kit-$p -b plan-b-$p; done
  for p in landing tool cabinet dashboard; do (cd ../mednet-kit-$p && pnpm install --frozen-lockfile); done
  ```
  У каждого своя песочница `mednet-sandbox-<пресет>`. Каждый пресет создаёт файлы только в `templates/next/presets/<свой>/**`: наборы файлов четырёх задач не пересекаются, общих файлов (база, корневые файлы, CLI, CI, тест состава Task 14) пресеты не правят, поэтому вливаются в `main` в любом порядке без конфликтов. От Tasks 14–15 они не зависят: список файлов каждого пресета Task 14 закрепил заранее, а тест пресета, которого ещё нет в ветке, пропускается.
- **Task 15 полностью проверяется только в CI** (Task 20), на пресетах. Локально проверяются юнит-тесты помощников.
- **Task 20 мержится в `main` только после всех пресетов.** Иначе job `pilot` в CI будет красным.
- **Ревью.** Каждую задачу проверяет свежий ревьюер. Ревью можно вести конвейером: пока ревьюер проверяет задачу N, исполнитель того же потока делает N+1.

**Общие файлы и порядок их правок**

Каждый общий файл правят задачи одного потока или задачи, идущие строго друг за другом, — в указанном порядке.

- `pnpm-lock.yaml` — только Task 1. Шаблон не входит в workspace; песочница и пилот ставят зависимости npm во временных папках.
- Корневой `package.json` — Task 7 (`sandbox`, поток Шаблон), затем Task 15 (`pilot`, `main`).
- `pnpm-workspace.yaml` — никто. `packages/create-app` попадает в workspace через `packages/*`, а `templates/*` в workspace не входит (решение 1).
- Корневой `turbo.json` — никто. Свой `packages/create-app/turbo.json` (`inputs` и `outputs` сборки) создаёт Task 14.
- `.github/workflows/ci.yml` — только Task 20. `@mednet/create-app` сам попадает в job `check` через `pnpm turbo run build typecheck test`.
- `.gitignore`, `.prettierignore` — только Task 1.
- `.changeset/*` — Tasks 5, 6 и 22 (разные файлы).
- `README.md` (корень) и `docs/releasing.md` — только Task 22.
- `packages/ui/**` — Tasks 5 → 6 (разные файлы, один поток).
- `packages/create-app/package.json` — Tasks 1 → 3 → 14.
- `packages/create-app/test/template.test.ts` — только Task 14 (списки файлов базы и всех пресетов).
- `templates/next/base/package.json` — Tasks 7 → 10 → 12.
- `templates/next/base/{README,AGENTS,CLAUDE}.md` — только Task 13.
- `templates/next/presets/<пресет>/**` — только задача этого пресета (16, 17, 18, 19).
- `scripts/lib/*` — Task 7 (`kit-tarballs.mjs` и тест) → Task 12 (`template-scripts.test.mjs`) → Task 13 (`template-docs.test.mjs`) → Task 15 (`dockerfileForPilot` в `kit-tarballs.mjs` и тест). Tasks 7, 12, 13 — поток Шаблон, Task 15 — `main` после слияния.
- Спека пилота — Task 3 (поток CLI) и Task 6 (поток Кит); конфликт в таблице решений разрешается, как сказано выше.
- `apps/docs/**` — Task 6 (`app/globals.css`), затем Task 21 (страница, навигация, эталоны).

**Version PR.** С момента, когда в `main` попадает changeset Task 5, Release держит открытым Version PR «Релиз пакетов @mednet/\*» с минором кита. Его не мержат до Task 22: это решение владельца (`AGENTS.md` кита).

## Обзор задач

| №  | Задача | Результат | Зависит от | Поток |
| -- | ------ | --------- | ---------- | ----- |
| 1  | CLI: каркас и `generate()` | Пакет `@mednet/create-app` в workspace. Сборка проекта из шаблона (на фикстуре): база → пресет → CI → подстановки → `.gitignore`. Корневые ignore-файлы | — | main |
| 2  | CLI: флаги, имя, npm, git | `parseOptions`, `validateName`/`checkTarget`, `detectPm`/`npmOnlyNote`/`install`/`gitInit` с тестами | 1 | CLI |
| 3  | CLI: `run`, вопросы, точка входа | Команда `create-app` с кодами выхода 0, 1, 2 и 130, вопросы `@clack/prompts`, README пакета, спека пилота (П15, §4: только npm) | 2 | CLI |
| 4  | Шаблон: CI-варианты | `ci/github` и `ci/gitlab`; проверены actionlint и разбором YAML | 1 | CLI |
| 5  | Кит: подпуть `@mednet/ui/use-mobile` | `exports`, индекс, `llms.md`, `check-dist`, тесты; changeset `minor` | 1 | Кит |
| 6  | Кит: заголовки в `@mednet/ui/styles.css` | Правило насыщенности переехало из docs в пакет; changeset `patch`; спека пилота (П16) | 1 | Кит |
| 7  | Песочница шаблона | `pnpm sandbox`: проект из шаблона на тарболах кита. `package.json`, `.nvmrc`, `_gitignore`, `.gitattributes` базы | 1 | Шаблон |
| 8  | Шаблон: каркас Next | Конфиги, корневой layout, провайдеры, `/api/health`. В песочнице `check` и `next build`; в CSS нет `var(--x,)` | 7 | Шаблон |
| 9  | Шаблон: данные | `lib/api.ts` (`apiGet`, `apiPost`, `apiPut`, `ApiError`) и `tests/render.tsx` с тестами | 8 | Шаблон |
| 10 | Шаблон: e2e | `npm run test:e2e` (Playwright 1.64.0): здоровье и корневой layout; axe для пресетов | 9 | Шаблон |
| 11 | Шаблон: Docker | `Dockerfile` (standalone, не от root, проверка здоровья), `.dockerignore`, `docker-compose.yml`, `public/` | 10 | Шаблон |
| 12 | Шаблон: заглушки и блоки shadcn | 61 заглушка, `hooks/use-mobile.ts`, `lib/utils.ts`, `components.json`, `npm run ui:stubs` и `npm run ui:add`; тест кита на синхронность заглушек | 11, 5 | Шаблон |
| 13 | Шаблон: AI-слой и README | `AGENTS.md` (около 100 строк, блок Next дословно), `CLAUDE.md`, README с разделами «Деплой» и «Docker»; тест кита `template-docs.test.mjs` | 12 | Шаблон |
| 14 | CLI: шаблон внутри пакета | Копия `templates/next` при сборке, кэш turbo, защита публикации; тест состава шаблона: файлы базы и каждого пресета, пресеты только добавляют файлы | 3, 4, 13 | main |
| 15 | Пилотный прогон | `pnpm pilot --preset <пресет>`: тарболы → собранный CLI → check, build, e2e, блок Next, Docker, 200 от `/api/health` | 7, 11, 14 | main |
| 16 | Пресет `landing` | `PublicLayout`: hero, 4 карточки, полоса с призывом к действию; Vitest и e2e с axe | 13 | пресеты |
| 17 | Пресет `tool` | `AppShell`: таблица TanStack Table v9 с поиском, диалог «Создать», `toast`, мок `/api/items` | 13 | пресеты |
| 18 | Пресет `cabinet` | `AppShell`: анкета на react-hook-form и zod, мок `/api/profile` | 13 | пресеты |
| 19 | Пресет `dashboard` | `AppShell`: KPI и графики `chart-1…8`, мок `/api/stats` | 13 | пресеты |
| 20 | CI кита: пилот | Матрица из четырёх пресетов, генерация с `--ci gitlab`, тесты `scripts/` | 15–19 | main |
| 21 | Docs: «Новый проект» | Страница с командой, флагами и пресетами; пункт навигации; эталоны скриншотов | 3 (выполнять после 20) | main |
| 22 | Подготовка релиза | Changeset, README, `releasing.md`, чек-лист первой публикации трёх пакетов для владельца | 5, 6, 20, 21 | main |

---

### Task 1: `@mednet/create-app` — каркас пакета и `generate()`

**Files:**
- Create: `packages/create-app/package.json`, `packages/create-app/tsconfig.json`, `packages/create-app/tsconfig.build.json`, `packages/create-app/vitest.config.ts`, `packages/create-app/LICENSE`, `packages/create-app/scripts/clean.mjs`, `packages/create-app/src/generate.ts`, `packages/create-app/test/generate.test.ts`, `packages/create-app/test/fixtures/template/**` (12 файлов, Step 4)
- Modify: `.gitignore`, `.prettierignore`, `pnpm-lock.yaml`

**Interfaces:**
- Consumes: ничего.
- Produces:
  - `generate(input: GenerateInput): void`. Тип входа: `interface GenerateInput { templateRoot: string; dest: string; name: string; preset: string | null; ci: string; kitVersion: string }`.
    - `preset: null` — только база (так работает песочница, Task 7).
    - `ci: 'none'` — без CI-файлов.
    - Если пресета или CI нет, функция бросает `Error` с текстом `Пресет «x» не найден в шаблоне` или `CI «x» не найден в шаблоне`.
  - `mergePackageJson(base: PackageJson, fragment: PackageJson): PackageJson`, где `type PackageJson = Record<string, unknown>`.
  - `substitute(text: string, vars: Record<string, string>): string`. Заменяет **каждое** вхождение известного ключа, а не только первое: в `README.md` шаблона `{{name}}` встречается 5 раз, в `app/layout.tsx` — 2 (Task 13, Task 8). Неизвестные `{{ключ}}` остаются в тексте как есть.
  - `SUBSTITUTED_FILES = ['package.json', 'README.md', 'AGENTS.md', 'app/layout.tsx']`.
  - Контракт раскладки шаблона:
    - `<templateRoot>/base/**`;
    - `<templateRoot>/presets/<пресет>/**`, фрагмент `package.json` необязателен;
    - `<templateRoot>/ci/<ci>/**`;
    - `_gitignore` переименовывается в `.gitignore`.
  - Фикстура `packages/create-app/test/fixtures/template` — на ней работают тесты Tasks 2–3.
  - Скрипты пакета: `build`, `test`, `typecheck`.

Проверено. Прототип B3 (facts-3 §3–4): 27 тестов зелёные. При написании плана код этой задачи извлечён из плана и прогнан на TypeScript 6.0.3 и Vitest 5.0.4: `tsc` чистый, 7 тестов проходят.

- [ ] **Step 1: Файлы пакета**

`packages/create-app/package.json`:

```json
{
  "name": "@mednet/create-app",
  "version": "0.2.0",
  "private": true,
  "description": "Создаёт проект ЦНИИОИЗ на Next.js и @mednet/ui: npm create @mednet/app <имя>",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/create-app"
  },
  "files": [
    "dist",
    "template",
    "README.md"
  ],
  "engines": {
    "node": ">=22.12"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "node scripts/clean.mjs && tsc -p tsconfig.build.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@clack/prompts": "^1.8.1"
  },
  "devDependencies": {
    "@types/node": "^24",
    "typescript": "~6.0.3",
    "vitest": "^5.0.4"
  }
}
```

`packages/create-app/tsconfig.json`:

```jsonc
{
  // Не наследует tsconfig.base.json: тот — для пакетов без выпуска, а здесь tsc собирает dist.
  // Соседние модули импортируются как './args.ts'; tsc переписывает их на './args.js'
  // (rewriteRelativeImportExtensions). erasableSyntaxOnly — без enum, namespace и parameter
  // properties: scripts/sandbox.mjs кита запускает src/generate.ts в Node 24 без сборки.
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "erasableSyntaxOnly": true,
    "rewriteRelativeImportExtensions": true,
    "skipLibCheck": true
  },
  "include": ["src", "test", "vitest.config.ts"],
  "exclude": ["test/fixtures"]
}
```

`packages/create-app/tsconfig.build.json`. Опция `noEmitOnError` нужна, потому что без неё `tsc` пишет `dist` и при ошибках типов (facts-3 §3):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

`packages/create-app/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // С пулом forks на Windows Vitest падает: «Timeout waiting for worker to respond».
    pool: 'threads',
    // Под нагрузкой (параллельная сборка turbo) один тест из 27 не уложился в 5 с (facts-3 §7).
    testTimeout: 30_000,
    include: ['test/**/*.test.ts'],
  },
});
```

`packages/create-app/scripts/clean.mjs`:

```js
// Чистые dist/ и template/ перед сборкой: tsc не удаляет файлы модулей, которых больше нет в src.
import { rmSync } from 'node:fs';

rmSync(new URL('../dist', import.meta.url), { recursive: true, force: true });
rmSync(new URL('../template', import.meta.url), { recursive: true, force: true });
```

Лицензия — копия корневой:

```bash
cp LICENSE packages/create-app/LICENSE
```

- [ ] **Step 2: Установить зависимости**

Run: `pnpm install`

Expected: exit 0. В `git diff --stat pnpm-lock.yaml` появились раздел `importers` для `packages/create-app` и пакеты `@clack/core`, `@clack/prompts`. Других изменений нет.

- [ ] **Step 3: Корневые ignore-файлы**

В конец `.gitignore` добавить:

```gitignore

# копия templates/next внутри @mednet/create-app (собирается scripts/copy-template.mjs)
packages/create-app/template/
```

В конец `.prettierignore` добавить:

```gitignore

# Шаблон проекта форматирует Prettier самого проекта (с prettier-plugin-tailwindcss):
# .prettierrc.json шаблона ссылается на плагин, которого в ките нет
templates/next
# @mednet/create-app: копия шаблона (собирается) и фикстуры тестов
packages/create-app/template
packages/create-app/test/fixtures
```

- [ ] **Step 4: Фикстура шаблона**

Это маленький шаблон той же раскладки, что и настоящий. Файлы `.tsx` и `.ts` в ней — просто текст: фикстура исключена из `tsconfig.json`, и Vitest её не импортирует.

```bash
F=packages/create-app/test/fixtures/template
mkdir -p "$F/base/app/api/health" "$F/presets/landing/app" "$F/presets/tool/app/(app)" \
  "$F/ci/github/.github/workflows" "$F/ci/gitlab"
cat > "$F/base/package.json" <<'EOF'
{
  "name": "{{name}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "check": "npm run lint"
  },
  "dependencies": {
    "@mednet/ui": "^{{kitVersion}}",
    "next": "16.4.1"
  },
  "devDependencies": {
    "@mednet/lint-config": "^{{kitVersion}}"
  }
}
EOF
printf '# {{name}}\n\nКит @mednet/* {{kitVersion}}. Чужая разметка {{other}} остаётся.\n\ndocker run --name {{name}} {{name}}:{{kitVersion}}\n' > "$F/base/README.md"
printf '# {{name}}: правила для агентов\n\n@mednet/ui {{kitVersion}}\n' > "$F/base/AGENTS.md"
printf "title: '{{name}}'\n" > "$F/base/app/layout.tsx"
printf 'base\n' > "$F/base/app/page.tsx"
printf 'health {{name}}\n' > "$F/base/app/api/health/route.ts"
printf 'node_modules\n' > "$F/base/_gitignore"
printf 'landing\n' > "$F/presets/landing/app/page.tsx"
printf 'tool\n' > "$F/presets/tool/app/(app)/page.tsx"
cat > "$F/presets/tool/package.json" <<'EOF'
{
  "dependencies": {
    "@tanstack/react-table": "^9.3.1"
  },
  "scripts": {
    "seed": "node scripts/seed.mjs"
  }
}
EOF
printf 'name: CI\n' > "$F/ci/github/.github/workflows/ci.yml"
printf 'stages: [check]\n' > "$F/ci/gitlab/.gitlab-ci.yml"
find "$F" -type f | sort
```

Expected: 12 путей.
- В базе 7 файлов: `package.json`, `README.md`, `AGENTS.md`, `_gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/api/health/route.ts`.
- В пресетах 3 файла: `landing/app/page.tsx`, `tool/package.json`, `tool/app/(app)/page.tsx`.
- В CI 2 файла.

- [ ] **Step 5: Падающий тест**

`packages/create-app/test/generate.test.ts`:

```ts
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generate, mergePackageJson, substitute, type GenerateInput } from '../src/generate.ts';

const templateRoot = join(import.meta.dirname, 'fixtures', 'template');

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'create-app-generate-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function make(input: Partial<GenerateInput> = {}): string {
  const dest = join(tmp, 'proj');
  generate({
    templateRoot,
    dest,
    name: 'proj',
    preset: 'tool',
    ci: 'github',
    kitVersion: '9.9.9',
    ...input,
  });
  return input.dest ?? dest;
}

function read(dest: string, file: string): string {
  return readFileSync(join(dest, file), 'utf8');
}

describe('mergePackageJson', () => {
  it('зависимости сливаются и сортируются, scripts дописываются после базовых, прочее заменяется', () => {
    const merged = mergePackageJson(
      {
        name: 'x',
        scripts: { dev: 'a', build: 'b' },
        dependencies: { next: '1', '@mednet/ui': '2' },
      },
      { scripts: { seed: 'c' }, dependencies: { zod: '4' }, description: 'пресет' },
    );
    expect(Object.keys(merged.dependencies as object)).toEqual(['@mednet/ui', 'next', 'zod']);
    expect(Object.keys(merged.scripts as object)).toEqual(['dev', 'build', 'seed']);
    expect(merged).toMatchObject({ name: 'x', description: 'пресет' });
  });
});

describe('substitute', () => {
  it('подставляет каждое вхождение известных ключей, неизвестные оставляет', () => {
    expect(
      substitute('{{name}}@{{kitVersion}} {{other}} {{name}}/{{name}}:{{kitVersion}}', {
        name: 'n',
        kitVersion: '1.0.0',
      }),
    ).toBe('n@1.0.0 {{other}} n/n:1.0.0');
  });
});

describe('generate', () => {
  it('база + пресет + CI github: наложение, слияние package.json, подстановки, .gitignore', () => {
    const dest = make();
    const pkg = JSON.parse(read(dest, 'package.json')) as {
      name: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.name).toBe('proj');
    expect(Object.entries(pkg.dependencies)).toEqual([
      ['@mednet/ui', '^9.9.9'],
      ['@tanstack/react-table', '^9.3.1'],
      ['next', '16.4.1'],
    ]);
    expect(pkg.devDependencies).toEqual({ '@mednet/lint-config': '^9.9.9' });
    expect(Object.keys(pkg.scripts)).toEqual(['dev', 'check', 'seed']);
    expect(read(dest, 'app/(app)/page.tsx')).toBe('tool\n');
    // каждое вхождение, а не только первое: в README шаблона {{name}} встречается 5 раз
    expect(read(dest, 'README.md')).toBe(
      '# proj\n\nКит @mednet/* 9.9.9. Чужая разметка {{other}} остаётся.\n\ndocker run --name proj proj:9.9.9\n',
    );
    expect(read(dest, 'AGENTS.md')).toBe('# proj: правила для агентов\n\n@mednet/ui 9.9.9\n');
    expect(read(dest, 'app/layout.tsx')).toBe("title: 'proj'\n");
    // файлы вне SUBSTITUTED_FILES не трогаются
    expect(read(dest, 'app/api/health/route.ts')).toBe('health {{name}}\n');
    expect(read(dest, '.gitignore')).toBe('node_modules\n');
    expect(existsSync(join(dest, '_gitignore'))).toBe(false);
    expect(read(dest, '.github/workflows/ci.yml')).toBe('name: CI\n');
    expect(existsSync(join(dest, '.gitlab-ci.yml'))).toBe(false);
  });

  it('файл пресета заменяет файл базы; пресет без package.json; CI gitlab', () => {
    const dest = make({ preset: 'landing', ci: 'gitlab' });
    expect(read(dest, 'app/page.tsx')).toBe('landing\n');
    expect(JSON.parse(read(dest, 'package.json')).dependencies).toEqual({
      '@mednet/ui': '^9.9.9',
      next: '16.4.1',
    });
    expect(read(dest, '.gitlab-ci.yml')).toBe('stages: [check]\n');
    expect(existsSync(join(dest, '.github'))).toBe(false);
  });

  it('CI none — без файлов CI', () => {
    const dest = make({ ci: 'none' });
    expect(existsSync(join(dest, '.github'))).toBe(false);
    expect(existsSync(join(dest, '.gitlab-ci.yml'))).toBe(false);
  });

  it('preset null — только база (песочница шаблона)', () => {
    const dest = make({ preset: null, ci: 'none' });
    expect(read(dest, 'app/page.tsx')).toBe('base\n');
    expect(existsSync(join(dest, 'app/(app)'))).toBe(false);
    expect(JSON.parse(read(dest, 'package.json')).name).toBe('proj');
  });

  it('нет пресета или CI в шаблоне — понятная ошибка', () => {
    expect(() => make({ preset: 'shop' })).toThrow('Пресет «shop» не найден в шаблоне');
    expect(() => make({ dest: join(tmp, 'other'), ci: 'bitbucket' })).toThrow(
      'CI «bitbucket» не найден в шаблоне',
    );
  });
});
```

- [ ] **Step 6: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/create-app test`

Expected: FAIL — `Failed to load url ../src/generate.ts … Does the file exist?`

- [ ] **Step 7: Реализация**

`packages/create-app/src/generate.ts`:

```ts
import { cpSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface GenerateInput {
  /** Папка шаблона: base/, presets/<пресет>/, ci/<github|gitlab>/. */
  templateRoot: string;
  /** Папка проекта; создаётся, если её нет. */
  dest: string;
  /** Имя проекта → {{name}}. */
  name: string;
  /** Пресет; null — только база (песочница шаблона в ките). */
  preset: string | null;
  /** github | gitlab | none. */
  ci: string;
  /** Версия кита (= версия CLI) → {{kitVersion}}. */
  kitVersion: string;
}

export type PackageJson = Record<string, unknown>;

/** Поля package.json, которые фрагмент пресета дополняет, а не заменяет. */
const MERGED_KEYS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'overrides',
  'scripts',
];
/** Из них сортируются по имени, как это делает npm; scripts сохраняют порядок базы. */
const SORTED_KEYS = new Set(MERGED_KEYS.filter((key) => key !== 'scripts'));

/** Файлы, в которых подставляются {{name}} и {{kitVersion}}. */
export const SUBSTITUTED_FILES = ['package.json', 'README.md', 'AGENTS.md', 'app/layout.tsx'];

export function mergePackageJson(base: PackageJson, fragment: PackageJson): PackageJson {
  const result: PackageJson = { ...base };
  for (const [key, value] of Object.entries(fragment)) {
    if (!MERGED_KEYS.includes(key)) {
      result[key] = value;
      continue;
    }
    const merged = {
      ...(base[key] as Record<string, unknown> | undefined),
      ...(value as Record<string, unknown>),
    };
    result[key] = SORTED_KEYS.has(key) ? sortKeys(merged) : merged;
  }
  return result;
}

function sortKeys(object: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b, 'en')));
}

/** {{ключ}} → значение во всех вхождениях (флаг g); неизвестные ключи остаются как есть. */
export function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}

/** Собирает проект: база → пресет (package.json сливается) → CI → подстановки → .gitignore. */
export function generate(input: GenerateInput): void {
  const { templateRoot, dest, preset, ci } = input;
  cpSync(join(templateRoot, 'base'), dest, { recursive: true });

  if (preset !== null) {
    const presetDir = join(templateRoot, 'presets', preset);
    if (!existsSync(presetDir)) {
      throw new Error(`Пресет «${preset}» не найден в шаблоне: ${presetDir}`);
    }
    const fragmentPath = join(presetDir, 'package.json');
    cpSync(presetDir, dest, {
      recursive: true,
      filter: (source) => resolve(source) !== resolve(fragmentPath),
    });
    if (existsSync(fragmentPath)) {
      const packagePath = join(dest, 'package.json');
      const merged = mergePackageJson(readJson(packagePath), readJson(fragmentPath));
      writeFileSync(packagePath, `${JSON.stringify(merged, null, 2)}\n`);
    }
  }

  if (ci !== 'none') {
    const ciDir = join(templateRoot, 'ci', ci);
    if (!existsSync(ciDir)) throw new Error(`CI «${ci}» не найден в шаблоне: ${ciDir}`);
    cpSync(ciDir, dest, { recursive: true });
  }

  const vars = { name: input.name, kitVersion: input.kitVersion };
  for (const file of SUBSTITUTED_FILES) {
    const path = join(dest, file);
    if (existsSync(path)) writeFileSync(path, substitute(readFileSync(path, 'utf8'), vars));
  }

  // npm выбрасывает .gitignore из пакета (facts-3 §3) — в шаблоне он лежит как _gitignore
  const gitignore = join(dest, '_gitignore');
  if (existsSync(gitignore)) renameSync(gitignore, join(dest, '.gitignore'));
}

function readJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageJson;
}
```

- [ ] **Step 8: Тесты проходят**

Run: `pnpm --filter @mednet/create-app test`

Expected: `Test Files  1 passed (1)`, `Tests  7 passed (7)`.

- [ ] **Step 9: Типы, сборка, формат**

Run:

```bash
pnpm --filter @mednet/create-app typecheck
pnpm --filter @mednet/create-app build && ls packages/create-app/dist
pnpm exec prettier --write packages/create-app .gitignore .prettierignore
pnpm format:check
```

Expected:
- typecheck — exit 0 без вывода;
- в `dist` — `generate.js`;
- `All matched files use Prettier code style!`

- [ ] **Step 10: Commit**

```bash
git add packages/create-app .gitignore .prettierignore pnpm-lock.yaml
git commit -m "feat(create-app): package scaffold and template generator (base, preset overlay, CI, substitutions)"
```

---

### Task 2: CLI — флаги, имя проекта, npm, git

**Files:**
- Create: `packages/create-app/src/args.ts`, `packages/create-app/src/name.ts`, `packages/create-app/src/pm.ts`, `packages/create-app/test/args.test.ts`, `packages/create-app/test/name.test.ts`, `packages/create-app/test/pm.test.ts`

**Interfaces:**
- Consumes: каркас пакета из Task 1.
- Produces:
  - `args.ts`:
    - кортежи `TEMPLATES = ['next', 'html']`, `DEPLOYS = ['docker', 'static']`, `PRESETS = ['landing', 'tool', 'cabinet', 'dashboard']`, `CIS = ['github', 'gitlab', 'none']` (все `as const`);
    - `interface Options { name: string | undefined; template: string; deploy: string; preset: string; ci: string; yes: boolean; install: boolean; git: boolean; help: boolean; explicit: Set<string> }`;
    - `class UsageError extends Error`;
    - `parseOptions(argv: string[]): Options` — бросает `UsageError`;
    - `HELP: string`.
  - `name.ts`:
    - `validateName(name: string | undefined): string | null`;
    - `checkTarget(dir: string): string | null`.
  - `pm.ts`:
    - `type Pm = 'npm' | 'pnpm' | 'yarn' | 'bun'`;
    - `detectPm(userAgent?: string): Pm` — чем запущен CLI;
    - `npmOnlyNote(launcher: Pm): string | null` — пояснение для запуска не через npm;
    - `install(cwd: string): boolean` — всегда `npm install`;
    - `gitInit(cwd: string): { ok: boolean; note?: string }`.

Проверено прототипом B3 (facts-3 §2, §4):
- `allowNegative` в Node 24.20 разбирает `--no-install` как `install: false`. В `values` попадают только переданные флаги — по ним строится `explicit`.
- Команда установки передаётся одной строкой: иначе Node 24 печатает `DEP0190`.
- Запасную подпись коммита git ставит, только когда `user.name` и `user.email` не заданы.

Что изменено по решению владельца 3: `install` больше не принимает менеджер пакетов, а `runCmd` из прототипа удалён. Код задачи проверен при написании плана: `tsc` чистый, тесты зелёные.

- [ ] **Step 1: Падающие тесты**

`packages/create-app/test/args.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { HELP, UsageError, parseOptions } from '../src/args.ts';

describe('parseOptions', () => {
  it('значения по умолчанию', () => {
    expect(parseOptions(['app'])).toMatchObject({
      name: 'app',
      template: 'next',
      deploy: 'docker',
      preset: 'landing',
      ci: 'github',
      yes: false,
      install: true,
      git: true,
      help: false,
    });
  });

  it('--no-install и --no-git (allowNegative); явные флаги запоминаются', () => {
    const options = parseOptions([
      'app',
      '--yes',
      '--no-install',
      '--no-git',
      '--preset',
      'tool',
      '--ci=gitlab',
    ]);
    expect(options).toMatchObject({
      yes: true,
      install: false,
      git: false,
      preset: 'tool',
      ci: 'gitlab',
    });
    expect([...options.explicit].sort()).toEqual(['ci', 'git', 'install', 'preset', 'yes']);
  });

  it('короткие -y и -h; имя можно не указывать', () => {
    expect(parseOptions(['-y'])).toMatchObject({ name: undefined, yes: true });
    expect(parseOptions(['-h']).help).toBe(true);
  });

  it('ошибки — UsageError с русским текстом', () => {
    expect(() => parseOptions(['app', '--wat'])).toThrow(UsageError);
    expect(() => parseOptions(['app', '--wat'])).toThrow('Неверные аргументы');
    expect(() => parseOptions(['app', '--preset', 'shop'])).toThrow(
      '--preset: «shop» не подходит. Допустимо: landing, tool, cabinet, dashboard.',
    );
    expect(() => parseOptions(['app', '--ci', 'bitbucket'])).toThrow(
      'Допустимо: github, gitlab, none',
    );
    expect(() => parseOptions(['app', '--template', 'html'])).toThrow('Шаблон html появится позже');
    expect(() => parseOptions(['app', '--deploy', 'static'])).toThrow(
      'Деплой static появится позже',
    );
    expect(() => parseOptions(['app', 'extra'])).toThrow('Лишние аргументы: extra');
  });

  it('справка показывает «--» для npm', () => {
    expect(HELP).toContain('npm create @mednet/app <имя> -- [флаги]');
  });
});
```

`packages/create-app/test/name.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkTarget, validateName } from '../src/name.ts';

describe('validateName', () => {
  it.each(['app', 'my-app', 'a.b_c', 'app2', '2gis'])('допустимо: %s', (name) => {
    expect(validateName(name)).toBeNull();
  });

  it.each(['', 'My App', 'App', '_x', '.x', '-x', '@scope/x', 'a/b', 'a b', 'node_modules'])(
    'недопустимо: %j',
    (name) => {
      expect(validateName(name)).not.toBeNull();
    },
  );

  it('без имени — подсказка с командой', () => {
    expect(validateName(undefined)).toBe('Укажите имя проекта: npm create @mednet/app <имя>');
  });

  it('длиннее 214 символов', () => {
    expect(validateName('a'.repeat(215))).toBe('Имя длиннее 214 символов');
  });
});

describe('checkTarget', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'create-app-name-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('папки нет или пустая — можно; непустая или это файл — ошибка', () => {
    expect(checkTarget(join(tmp, 'new'))).toBeNull();
    mkdirSync(join(tmp, 'empty'));
    expect(checkTarget(join(tmp, 'empty'))).toBeNull();
    writeFileSync(join(tmp, 'empty', 'file.txt'), '');
    expect(checkTarget(join(tmp, 'empty'))).toMatch(/не пуста/);
    expect(checkTarget(join(tmp, 'empty', 'file.txt'))).toMatch(/не папка/);
  });
});
```

`packages/create-app/test/pm.test.ts`:

```ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectPm, gitInit, npmOnlyNote } from '../src/pm.ts';

describe('detectPm', () => {
  it.each([
    ['npm/11.19.0 node/v24.20.0 win32 x64 workspaces/false', 'npm'],
    ['pnpm/10.34.6 npm/? node/v24.20.0 win32 x64', 'pnpm'],
    ['yarn/1.22.22 npm/? node/v24.20.0 win32 x64', 'yarn'],
    ['bun/1.2.0 npm/? node/v24.20.0 linux x64', 'bun'],
    [undefined, 'npm'],
  ])('%s → %s', (userAgent, pm) => {
    expect(detectPm(userAgent)).toBe(pm);
  });
});

describe('npmOnlyNote', () => {
  it('npm — без пояснения; pnpm/yarn — объясняет, почему проект на npm', () => {
    expect(npmOnlyNote('npm')).toBeNull();
    expect(npmOnlyNote('pnpm')).toContain('npm ci');
    expect(npmOnlyNote('yarn')).toContain('хотя CLI запущен через yarn');
  });
});

describe('gitInit', () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it('репозиторий на ветке main с первым коммитом', () => {
    dir = mkdtempSync(join(tmpdir(), 'create-app-git-'));
    writeFileSync(join(dir, 'README.md'), '# app\n');
    // Подпись коммитов из глобального конфига машины не должна влиять на тест
    vi.stubEnv('GIT_CONFIG_COUNT', '1');
    vi.stubEnv('GIT_CONFIG_KEY_0', 'commit.gpgsign');
    vi.stubEnv('GIT_CONFIG_VALUE_0', 'false');

    expect(gitInit(dir)).toEqual({ ok: true });
    const git = (...args: string[]) =>
      spawnSync('git', args, { cwd: dir, encoding: 'utf8' }).stdout.trim();
    expect(git('rev-list', '--count', 'HEAD')).toBe('1');
    expect(git('branch', '--show-current')).toBe('main');
  });
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm --filter @mednet/create-app test`

Expected: FAIL — три новых файла не загружаются (`Failed to load url ../src/args.ts`, `../src/name.ts`, `../src/pm.ts`). `generate.test.ts` остаётся зелёным.

- [ ] **Step 3: Реализация**

`packages/create-app/src/args.ts`:

```ts
import { parseArgs } from 'node:util';

export const TEMPLATES = ['next', 'html'] as const;
export const DEPLOYS = ['docker', 'static'] as const;
export const PRESETS = ['landing', 'tool', 'cabinet', 'dashboard'] as const;
export const CIS = ['github', 'gitlab', 'none'] as const;

export interface Options {
  name: string | undefined;
  template: string;
  deploy: string;
  preset: string;
  ci: string;
  yes: boolean;
  install: boolean;
  git: boolean;
  help: boolean;
  /** Флаги, заданные явно: в интерактивном режиме спрашиваем только про остальные. */
  explicit: Set<string>;
}

/** Ошибка в аргументах: код выхода 2 и справка. */
export class UsageError extends Error {}

export const HELP = `Создаёт проект ЦНИИОИЗ на Next.js и @mednet/ui.

Использование:
  npm create @mednet/app <имя> -- [флаги]    у npm флаги — после «--»
  pnpm create @mednet/app <имя> [флаги]
  yarn create @mednet/app <имя> [флаги]

Флаги:
  --preset landing|tool|cabinet|dashboard   стартовая страница (по умолчанию landing)
  --ci github|gitlab|none                   CI проекта (по умолчанию github)
  --template next                           шаблон (html появится позже)
  --deploy docker                           деплой (static появится позже)
  -y, --yes                                 без вопросов: флаги и значения по умолчанию
  --no-install                              не устанавливать зависимости
  --no-git                                  не создавать git-репозиторий
  -h, --help                                эта справка

Зависимости проекта всегда ставятся через npm: Dockerfile и CI собирают проект
командой npm ci по package-lock.json.
`;

function parse(argv: string[]) {
  try {
    return parseArgs({
      args: argv,
      allowPositionals: true,
      // --no-install, --no-git → install: false, git: false (Node ≥ 22.4)
      allowNegative: true,
      options: {
        template: { type: 'string' },
        deploy: { type: 'string' },
        preset: { type: 'string' },
        ci: { type: 'string' },
        yes: { type: 'boolean', short: 'y' },
        install: { type: 'boolean' },
        git: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    throw new UsageError(`Неверные аргументы: ${(error as Error).message}`);
  }
}

export function parseOptions(argv: string[]): Options {
  const { values, positionals } = parse(argv);
  if (positionals.length > 1) {
    throw new UsageError(`Лишние аргументы: ${positionals.slice(1).join(' ')}`);
  }
  const options: Options = {
    name: positionals[0],
    template: values.template ?? 'next',
    deploy: values.deploy ?? 'docker',
    preset: values.preset ?? 'landing',
    ci: values.ci ?? 'github',
    yes: values.yes ?? false,
    install: values.install ?? true,
    git: values.git ?? true,
    help: values.help ?? false,
    // values содержит только переданные флаги
    explicit: new Set(Object.keys(values)),
  };
  oneOf('--template', options.template, TEMPLATES);
  oneOf('--deploy', options.deploy, DEPLOYS);
  oneOf('--preset', options.preset, PRESETS);
  oneOf('--ci', options.ci, CIS);
  if (options.template === 'html') {
    throw new UsageError('Шаблон html появится позже. Сейчас доступен: next.');
  }
  if (options.deploy === 'static') {
    throw new UsageError('Деплой static появится позже. Сейчас доступен: docker.');
  }
  return options;
}

function oneOf(flag: string, value: string, allowed: readonly string[]): void {
  if (!allowed.includes(value)) {
    throw new UsageError(`${flag}: «${value}» не подходит. Допустимо: ${allowed.join(', ')}.`);
  }
}
```

`packages/create-app/src/name.ts`:

```ts
import { existsSync, readdirSync, statSync } from 'node:fs';

// Имя проекта = имя папки = "name" в package.json, поэтому scoped-имена (@scope/x) не принимаются.
// Правила npm для нового пакета: строчные латинские буквы, цифры, «-», «.», «_»;
// не начинается с «.», «_» или «-»; не длиннее 214 символов.
const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const RESERVED = new Set(['node_modules', 'favicon.ico']);

/** null — имя подходит; иначе текст ошибки. */
export function validateName(name: string | undefined): string | null {
  if (!name) return 'Укажите имя проекта: npm create @mednet/app <имя>';
  if (name.length > 214) return 'Имя длиннее 214 символов';
  if (!NAME_PATTERN.test(name)) {
    return `Имя «${name}» не подходит: только строчные латинские буквы, цифры, «-», «.», «_»; первая — буква или цифра`;
  }
  if (RESERVED.has(name)) return `Имя «${name}» зарезервировано`;
  return null;
}

/** null — папки нет или она пуста; иначе текст ошибки. */
export function checkTarget(dir: string): string | null {
  if (!existsSync(dir)) return null;
  if (!statSync(dir).isDirectory()) return `«${dir}» уже существует, и это не папка`;
  if (readdirSync(dir).length > 0) {
    return `Папка «${dir}» не пуста. Выберите другое имя или очистите папку`;
  }
  return null;
}
```

`packages/create-app/src/pm.ts`:

```ts
import { spawnSync } from 'node:child_process';

export type Pm = 'npm' | 'pnpm' | 'yarn' | 'bun';

/** Чем запущен CLI: «npm/11.19.0 node/v24.20.0 …» → npm. Нужно только для npmOnlyNote. */
export function detectPm(userAgent = process.env.npm_config_user_agent): Pm {
  const name = userAgent?.split(' ')[0]?.split('/')[0];
  return name === 'pnpm' || name === 'yarn' || name === 'bun' ? name : 'npm';
}

/**
 * Шаблон только для npm (решение владельца 2026-10-15): Dockerfile и CI собирают проект
 * командой npm ci по package-lock.json. Запуск не через npm — честно объясняем.
 */
export function npmOnlyNote(launcher: Pm): string | null {
  if (launcher === 'npm') return null;
  return `Проект рассчитан на npm: Dockerfile и CI собирают его командой npm ci по package-lock.json. Поэтому зависимости ставятся через npm, хотя CLI запущен через ${launcher}.`;
}

/** npm install с выводом в консоль; false — команда завершилась с ошибкой. */
export function install(cwd: string): boolean {
  // shell: true — на Windows npm это npm.cmd. Команда строкой, а не массивом аргументов:
  // иначе Node 24 печатает DEP0190.
  return spawnSync('npm install', { cwd, stdio: 'inherit', shell: true }).status === 0;
}

function git(cwd: string, args: string[]) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

/**
 * git init + первый коммит. Нет user.name/user.email (CI, чистая машина) — коммит от запасной
 * личности. Сбой — не ошибка CLI, а предупреждение в note.
 */
export function gitInit(cwd: string): { ok: boolean; note?: string } {
  if (git(cwd, ['--version']).status !== 0) {
    return { ok: false, note: 'git не найден — репозиторий не создан' };
  }
  if (git(cwd, ['init', '-q', '-b', 'main']).status !== 0) {
    return { ok: false, note: 'git init не удался — репозиторий не создан' };
  }
  git(cwd, ['add', '-A']);
  const configured = (key: string) => git(cwd, ['config', key]).stdout.trim() !== '';
  const identity =
    configured('user.name') && configured('user.email')
      ? []
      : ['-c', 'user.name=mednet-create-app', '-c', 'user.email=create-app@mednet.invalid'];
  const commit = git(cwd, [
    ...identity,
    'commit',
    '-q',
    '-m',
    'chore: initial commit from @mednet/create-app',
  ]);
  return commit.status === 0
    ? { ok: true }
    : {
        ok: false,
        note: `репозиторий создан, но первый коммит не удался: ${commit.stderr.trim()}`,
      };
}
```

- [ ] **Step 4: Тесты проходят**

Run: `pnpm --filter @mednet/create-app test`

Expected: `Test Files  4 passed (4)`, `Tests  37 passed (37)`. Из них `generate` — 7, `args` — 5, `name` — 18, `pm` — 7.

- [ ] **Step 5: Типы и формат**

Run:

```bash
pnpm --filter @mednet/create-app typecheck
pnpm exec prettier --write packages/create-app
pnpm format:check
```

Expected: exit 0 и `All matched files use Prettier code style!`

- [ ] **Step 6: Commit**

```bash
git add packages/create-app
git commit -m "feat(create-app): flags, project name check, npm-only install with launcher note, git init"
```

---

### Task 3: CLI — команда `run`, вопросы, точка входа, README; спека пилота: только npm

**Files:**
- Create: `packages/create-app/src/cli.ts`, `packages/create-app/src/index.ts`, `packages/create-app/README.md`, `packages/create-app/test/cli.test.ts`
- Modify: `packages/create-app/package.json` (`bin`), `docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md` (П15, §4, «Изменения основной спеки»)

**Interfaces:**
- Consumes:
  - из Task 1 — `generate`;
  - из Task 2 — `parseOptions`, `Options`, `UsageError`, `HELP`, `PRESETS`, `CIS`, `validateName`, `checkTarget`, `detectPm`, `npmOnlyNote`, `install`, `gitInit`.
- Produces:
  - `run(argv: string[], ctx: RunContext): Promise<number>`, где `interface RunContext { cwd: string; templateRoot: string; kitVersion: string; interactive: boolean; userAgent: string | undefined }`.
  - Коды выхода:
    - `0` — готово;
    - `1` — ошибка: папка не пуста или копирование не удалось;
    - `2` — неверные флаги или имя, а также `html` и `static`;
    - `130` — отмена.
  - Исполняемый `dist/index.js`: первая строка `#!/usr/bin/env node`, bin `create-app`.
  - Пути из `dist/index.js` (оба работают и из тарбола, facts-3 §4):
    - `kitVersion` читается из `../package.json`;
    - `templateRoot` — это `../template`.

Проверено:
- Прототип B3 (facts-3 §2): без терминала, с `--yes` или при `CI` вопросы не задаются, ничего не зависает.
- Проверка `isCancel` сужает тип только через `return`. Стрелочная функция, которая завершает процесс, тип не сужает.
- **Интерактивную ветку** с настоящими вопросами в прототипе проверяли только по типам: без псевдотерминала её не запустить. Ручная проверка в терминале — по желанию владельца.
- Код этой задачи извлечён из плана и проверен: `tsc` чистый, 44 теста зелёные. После сборки `dist/index.js --help` печатает справку, а `--preset shop` даёт код 2.

- [ ] **Step 1: Падающий тест**

`packages/create-app/test/cli.test.ts`:

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run, type RunContext } from '../src/cli.ts';

const templateRoot = join(import.meta.dirname, 'fixtures', 'template');
/** Без вопросов, без npm install и без git — тест не трогает сеть и не создаёт репозиторий. */
const QUIET = ['--yes', '--no-install', '--no-git'];

let tmp: string;
let ctx: RunContext;
let errors: string[];

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'create-app-run-'));
  ctx = { cwd: tmp, templateRoot, kitVersion: '9.9.9', interactive: false, userAgent: undefined };
  errors = [];
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.join(' '));
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(tmp, { recursive: true, force: true });
});

describe('run', () => {
  it('--help — справка и код 0', async () => {
    expect(await run(['--help'], ctx)).toBe(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('npm create @mednet/app'));
  });

  it('без имени и без терминала — код 2 и подсказка', async () => {
    expect(await run(QUIET, ctx)).toBe(2);
    expect(errors.join('\n')).toContain('Ошибка: Укажите имя проекта');
  });

  it('неверный флаг и «появится позже» — код 2 со справкой', async () => {
    expect(await run(['app', '--preset', 'shop'], ctx)).toBe(2);
    expect(await run(['app', '--template', 'html'], ctx)).toBe(2);
    expect(errors.join('\n')).toContain('Шаблон html появится позже');
    expect(errors.join('\n')).toContain('Использование:');
  });

  it('недопустимое имя — код 2', async () => {
    expect(await run(['My App', ...QUIET], ctx)).toBe(2);
    expect(errors.join('\n')).toContain('Имя «My App» не подходит');
  });

  it('непустая папка — код 1, ничего не записано', async () => {
    mkdirSync(join(tmp, 'app'));
    writeFileSync(join(tmp, 'app', 'keep.txt'), 'моё');
    expect(await run(['app', ...QUIET], ctx)).toBe(1);
    expect(errors.join('\n')).toContain('не пуста');
    expect(existsSync(join(tmp, 'app', 'package.json'))).toBe(false);
  });

  it('проект по флагам: пресет, CI, версия кита; без install и git', async () => {
    expect(await run(['app', ...QUIET, '--preset', 'tool', '--ci', 'gitlab'], ctx)).toBe(0);
    const dest = join(tmp, 'app');
    const pkg = JSON.parse(readFileSync(join(dest, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('app');
    expect(pkg.dependencies['@mednet/ui']).toBe('^9.9.9');
    expect(existsSync(join(dest, 'app/(app)/page.tsx'))).toBe(true);
    expect(existsSync(join(dest, '.gitlab-ci.yml'))).toBe(true);
    expect(existsSync(join(dest, '.git'))).toBe(false);
  });

  it('в терминале с --yes вопросов нет: значения по умолчанию (landing, github)', async () => {
    expect(await run(['app', ...QUIET], { ...ctx, interactive: true })).toBe(0);
    expect(readFileSync(join(tmp, 'app', 'app/page.tsx'), 'utf8')).toBe('landing\n');
    expect(existsSync(join(tmp, 'app', '.github/workflows/ci.yml'))).toBe(true);
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `pnpm --filter @mednet/create-app test`

Expected: FAIL — `Failed to load url ../src/cli.ts`. Остальные 4 файла зелёные.

- [ ] **Step 3: Реализация `run`**

`packages/create-app/src/cli.ts`:

```ts
import * as p from '@clack/prompts';
import { basename, resolve } from 'node:path';
import { CIS, HELP, PRESETS, UsageError, parseOptions, type Options } from './args.ts';
import { generate } from './generate.ts';
import { checkTarget, validateName } from './name.ts';
import { detectPm, gitInit, install, npmOnlyNote } from './pm.ts';

export interface RunContext {
  /** Папка, в которой создаётся проект. */
  cwd: string;
  /** Шаблон: base/, presets/<пресет>/, ci/<github|gitlab>/. */
  templateRoot: string;
  /** Версия CLI = версия кита: подставляется в {{kitVersion}}. */
  kitVersion: string;
  /** Есть терминал и это не CI — можно задавать вопросы. */
  interactive: boolean;
  /** npm_config_user_agent: чем запущен CLI (для пояснения, что проект на npm). */
  userAgent: string | undefined;
}

const PRESET_HINTS: Record<(typeof PRESETS)[number], string> = {
  landing: 'лендинг или отчёт: PublicLayout, hero, карточки',
  tool: 'внутренний инструмент: AppShell, таблица, диалог',
  cabinet: 'кабинет: AppShell, анкета на react-hook-form и zod',
  dashboard: 'дашборд: AppShell, KPI, графики',
};

/** Создаёт проект. Код выхода: 0 — готово, 1 — ошибка, 2 — неверные аргументы или имя, 130 — отмена. */
export async function run(argv: string[], ctx: RunContext): Promise<number> {
  let options: Options;
  try {
    options = parseOptions(argv);
  } catch (error) {
    if (error instanceof UsageError) return fail(`${error.message}\n\n${HELP}`, 2);
    throw error;
  }
  if (options.help) {
    console.log(HELP);
    return 0;
  }
  if (ctx.interactive && !options.yes && !(await ask(options, ctx.kitVersion))) return 130;

  const name = options.name ?? '';
  const nameError = validateName(name);
  if (nameError !== null) return fail(nameError, 2);
  const dest = resolve(ctx.cwd, name);
  const targetError = checkTarget(dest);
  if (targetError !== null) return fail(targetError, 1);

  const spinner = p.spinner();
  spinner.start('Копирую шаблон');
  try {
    generate({
      templateRoot: ctx.templateRoot,
      dest,
      name,
      preset: options.preset,
      ci: options.ci,
      kitVersion: ctx.kitVersion,
    });
  } catch (error) {
    spinner.stop('Шаблон не скопирован');
    return fail(error instanceof Error ? error.message : String(error), 1);
  }
  spinner.stop('Шаблон готов');

  const note = npmOnlyNote(detectPm(ctx.userAgent));
  if (note) p.log.info(note);
  if (options.install && !install(dest)) {
    p.log.warn('Зависимости не установлены. Выполните «npm install» в папке проекта.');
  }
  // git — после установки: package-lock.json попадает в первый коммит
  if (options.git) {
    const git = gitInit(dest);
    if (git.note) p.log.warn(git.note);
  }
  const steps = [
    `cd ${basename(dest)}`,
    ...(options.install ? [] : ['npm install']),
    'npm run dev',
  ];
  p.outro(`Готово. Дальше:\n  ${steps.join('\n  ')}\n\nПравила для AI-агентов — в AGENTS.md`);
  return 0;
}

function fail(message: string, code: number): number {
  console.error(`Ошибка: ${message}`);
  return code;
}

function cancelled(): false {
  p.cancel('Отменено');
  return false;
}

/** Вопросы только про то, что не задано флагами. false — пользователь отменил. */
async function ask(options: Options, kitVersion: string): Promise<boolean> {
  p.intro(`@mednet/create-app ${kitVersion}`);
  if (!options.name) {
    const name = await p.text({
      message: 'Имя проекта',
      placeholder: 'my-app',
      validate: (value) => validateName(value) ?? undefined,
    });
    if (p.isCancel(name)) return cancelled();
    options.name = name;
  }
  if (!options.explicit.has('preset')) {
    const preset = await p.select({
      message: 'Стартовая страница',
      initialValue: 'landing',
      options: PRESETS.map((value) => ({ value, label: value, hint: PRESET_HINTS[value] })),
    });
    if (p.isCancel(preset)) return cancelled();
    options.preset = preset;
  }
  if (!options.explicit.has('ci')) {
    const ci = await p.select({
      message: 'CI',
      initialValue: 'github',
      options: CIS.map((value) => ({ value, label: value })),
    });
    if (p.isCancel(ci)) return cancelled();
    options.ci = ci;
  }
  if (!options.explicit.has('install')) {
    const installNow = await p.confirm({
      message: 'Установить зависимости (npm install)?',
      initialValue: true,
    });
    if (p.isCancel(installNow)) return cancelled();
    options.install = installNow;
  }
  return true;
}
```

- [ ] **Step 4: Тесты проходят**

Run: `pnpm --filter @mednet/create-app test`

Expected: `Test Files  5 passed (5)`, `Tests  44 passed (44)`.

- [ ] **Step 5: Точка входа и `bin`**

`packages/create-app/src/index.ts`. Первая строка обязательна, и `tsc` её сохраняет (facts-3 §3):

```ts
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { run } from './cli.ts';

// dist/index.js → ../package.json и ../template: так работает и из npm-тарбола (facts-3 §4)
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

try {
  process.exitCode = await run(process.argv.slice(2), {
    cwd: process.cwd(),
    templateRoot: fileURLToPath(new URL('../template', import.meta.url)),
    kitVersion: version,
    // Без терминала (пайп, CI, агент) вопросов нет: флаги и значения по умолчанию
    interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY) && !process.env.CI,
    userAgent: process.env.npm_config_user_agent,
  });
} catch (error) {
  console.error(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
```

`packages/create-app/package.json` целиком; добавлен `bin`. Bin у пакета один и называется ровно `create-app`. npm и pnpm запустят единственный bin при любом имени, а yarn classic ищет `create-<имя>` (facts-3 §1):

```json
{
  "name": "@mednet/create-app",
  "version": "0.2.0",
  "private": true,
  "description": "Создаёт проект ЦНИИОИЗ на Next.js и @mednet/ui: npm create @mednet/app <имя>",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/create-app"
  },
  "bin": {
    "create-app": "dist/index.js"
  },
  "files": [
    "dist",
    "template",
    "README.md"
  ],
  "engines": {
    "node": ">=22.12"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "node scripts/clean.mjs && tsc -p tsconfig.build.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@clack/prompts": "^1.8.1"
  },
  "devDependencies": {
    "@types/node": "^24",
    "typescript": "~6.0.3",
    "vitest": "^5.0.4"
  }
}
```

- [ ] **Step 6: README пакета**

`packages/create-app/README.md`:

````markdown
# @mednet/create-app

Создаёт проект ЦНИИОИЗ на Next.js 16 и дизайн-системе `@mednet/*`: компоненты `@mednet/ui`, защита бренда `@mednet/lint-config`, правила для AI-агентов (`AGENTS.md`), тесты, Docker и CI.

## Запуск

```bash
npm create @mednet/app my-app
# у npm флаги — после «--»:
npm create @mednet/app my-app -- --preset tool --ci gitlab
```

Без флагов CLI задаёт вопросы. Без терминала (CI, AI-агент) и с `--yes` вопросов нет: берутся флаги и значения по умолчанию.

CLI можно запустить и через `pnpm create @mednet/app my-app` или `yarn create @mednet/app my-app` (флаги без `--`), но проект всё равно на npm: зависимости ставит `npm install`, а `Dockerfile` и CI собирают проект командой `npm ci` по `package-lock.json`.

## Флаги

- `--preset landing|tool|cabinet|dashboard` — стартовая страница, по умолчанию `landing`:
  - `landing` — лендинг на `PublicLayout`;
  - `tool` — инструмент с таблицей и диалогом (`AppShell`);
  - `cabinet` — кабинет с анкетой (`AppShell`);
  - `dashboard` — дашборд с KPI и графиками (`AppShell`).
- `--ci github|gitlab|none` — CI проекта, по умолчанию `github`.
- `--template next` — шаблон (`html` появится позже).
- `--deploy docker` — деплой (`static` появится позже).
- `-y`, `--yes` — без вопросов.
- `--no-install` — не устанавливать зависимости.
- `--no-git` — не создавать git-репозиторий.

Версии `@mednet/*` в проекте совпадают с версией CLI.

## Коды выхода

- `0` — проект создан;
- `1` — ошибка: папка не пуста или шаблон не скопирован;
- `2` — неверные флаги или имя, шаблон `html` или деплой `static`;
- `130` — отменено.

## Лицензия

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России.
````

- [ ] **Step 7: Спека пилота — только npm**

В `docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md` (файл в `.prettierignore`, форматирование руками):

1. В таблицу «Решения пилота» после строки П14 добавить:

```markdown
| П15 | Шаблон `next` — только для npm: CLI всегда ставит зависимости через npm, даже при запуске через `pnpm create`/`yarn create`, и объясняет почему | `Dockerfile` и CI собирают проект `npm ci` по `package-lock.json`; варианты под pnpm и yarn удвоили бы Docker и CI (решение владельца 2026-10-15) |
```

2. В разделе «4. `@mednet/create-app`» строку

```markdown
- Запуск: `npm create @mednet/app <имя>` (а также `pnpm create` / `yarn create`).
```

заменить на

```markdown
- Запуск: `npm create @mednet/app <имя>` (а также `pnpm create` / `yarn create`). У npm флаги идут после `--`: `npm create @mednet/app my-app -- --preset tool`.
```

3. В той же секции в строке «Шаги: …» заменить «(`package.json`, `README.md`, `AGENTS.md`)» на «(`package.json`, `README.md`, `AGENTS.md`, `app/layout.tsx`)». Там же заменить «установка зависимостей менеджером из `npm_config_user_agent`» на «установка зависимостей через npm (П15)».

4. В раздел «Изменения основной спеки» добавить пункт:

```markdown
- §11: менеджер пакетов проекта — всегда npm (П15), а не `npm_config_user_agent`.
```

- [ ] **Step 8: Сборка и запуск собранного CLI**

Run:

```bash
pnpm --filter @mednet/create-app typecheck
pnpm --filter @mednet/create-app build
head -n 1 packages/create-app/dist/index.js
node packages/create-app/dist/index.js --help
node packages/create-app/dist/index.js app --preset shop; echo "exit=$?"
```

Expected:
- typecheck — exit 0;
- `#!/usr/bin/env node`;
- справка, первая строка — `Создаёт проект ЦНИИОИЗ на Next.js и @mednet/ui.`;
- `Ошибка: --preset: «shop» не подходит. Допустимо: landing, tool, cabinet, dashboard.`, затем справка и `exit=2`.

Проект собранным CLI до Task 14 не создать: в пакете ещё нет `template/`.

- [ ] **Step 9: Формат и commit**

```bash
pnpm exec prettier --write packages/create-app
pnpm format:check
git add packages/create-app docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md
git commit -m "feat(create-app): run command, prompts, create-app bin, README; spec: template is npm-only (P15)"
```

---

### Task 4: Шаблон — CI-варианты `github` и `gitlab`

**Files:**
- Create: `templates/next/ci/github/.github/workflows/ci.yml`, `templates/next/ci/gitlab/.gitlab-ci.yml`

**Interfaces:**
- Consumes: контракт раскладки из Task 1 — CLI накладывает `ci/<github|gitlab>/` поверх проекта.
- Produces: CI сгенерированного проекта. Шаги: `npm ci`, `npm run check`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`, `docker build -t app:ci .`. Скрипт `test:e2e` даёт Task 10, `Dockerfile` — Task 11. Целиком CI проверяет пилот (Tasks 15, 20).

Проверено прототипом B3 (facts-3 §6): actionlint в Docker (`rhysd/actionlint:latest`) — exit 0, YAML для GitLab разбирается. По сравнению с прототипом:
- actions закреплены по SHA с комментарием `# vX.Y.Z` (решение владельца 9), SHA взяты из `.github/workflows/ci.yml` кита: `actions/checkout` v5.1.0, `actions/setup-node` v5.0.0;
- у job GitHub добавлены `permissions: contents: read`, `name` и `timeout-minutes`;
- у GitLab тег образа постоянный (`app:ci`), а не `$CI_REGISTRY_IMAGE:…`: если реестр выключен, переменная пуста, и `docker build` упал бы;
- кэш npm у GitLab — только в job проверок;
- GitLab на настоящем раннере не проверялся: принят как проверенный по синтаксису, первый прогон — у DevOps (решение владельца 10).

e2e внутри снова запускает `next build` (`webServer` в `playwright.config.ts`, facts-1 §5): это вторая сборка в CI. Так записано в facts-1 §5.

- [ ] **Step 1: GitHub Actions**

`templates/next/ci/github/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  check:
    name: Проверки, сборка, e2e, Docker-образ
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
      - uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: docker build -t app:ci .
```

- [ ] **Step 2: GitLab CI**

`templates/next/ci/gitlab/.gitlab-ci.yml`:

```yaml
# Проверки и сборка образа. Образ только собирается (проверка Dockerfile);
# публикацию в реестр и деплой настраивает DevOps.
stages: [check, image]

default:
  image: node:24-bookworm

check:
  stage: check
  cache:
    key:
      files: [package-lock.json]
    paths: [.npm/]
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run check
    - npm run build
    - npx playwright install --with-deps chromium
    - npm run test:e2e

docker-build:
  stage: image
  image: docker:28
  services: [docker:28-dind]
  variables:
    DOCKER_TLS_CERTDIR: /certs
  script:
    - docker build -t app:ci .
```

- [ ] **Step 3: actionlint**

actionlint ищет корень проекта по папке `.git`: без неё он пишет «no project was found» (facts-3 §6). Нужен запущенный Docker Desktop. Команда — для Git Bash; на Linux вместо `pwd -W` подставьте `pwd`.

Run:

```bash
AL="$(mktemp -d)" && cp -r templates/next/ci/github/.github "$AL/" && git -C "$AL" init -q \
  && MSYS_NO_PATHCONV=1 docker run --rm -v "$(cd "$AL" && pwd -W):/repo" -w /repo rhysd/actionlint:latest; echo "exit=$?"
```

Expected: замечаний нет, `exit=0`.

- [ ] **Step 4: YAML GitLab**

Run: `npx --yes yaml@2.9.1 valid < templates/next/ci/gitlab/.gitlab-ci.yml; echo "exit=$?"`

Expected: `exit=0`. При ошибке — `YAMLParseError …` и `exit=1`. Команда проверена на версии 2.9.1. Первый запуск скачивает пакет, это около минуты.

- [ ] **Step 5: Commit**

```bash
git add templates/next/ci
git commit -m "ci(templates): GitHub Actions and GitLab CI variants for generated projects"
```

---

### Task 5: Кит — подпуть `@mednet/ui/use-mobile`

**Files:**
- Modify: `packages/ui/package.json` (`exports`), `packages/ui/scripts/gen-index.mjs`, `packages/ui/scripts/build-llms.mjs`, `packages/ui/scripts/check-dist.mjs`, `packages/ui/src/__tests__/package.test.ts`, `packages/ui/src/index.ts` (генерируется: `pnpm --filter @mednet/ui gen:index`)
- Create: `.changeset/ui-use-mobile.md`

**Interfaces:**
- Consumes: существующий хук `packages/ui/src/hooks/use-mobile.ts` (`useIsMobile(): boolean`, сгенерирован shadcn). Его сборка — `dist/hooks/use-mobile.js` и `.d.ts`.
- Produces:
  - подпуть `@mednet/ui/use-mobile` → `{ types: './dist/hooks/use-mobile.d.ts', default: './dist/hooks/use-mobile.js' }`;
  - `useIsMobile` в корневом индексе `@mednet/ui`;
  - раздел `` ### `@mednet/ui/use-mobile` `` в `llms.md` с группой «хуки: `useIsMobile`» и без ссылки на документацию shadcn;
  - заглушку `hooks/use-mobile.ts` в шаблоне (Task 12): `export * from '@mednet/ui/use-mobile'`.

Факты (facts-2 §0.3, Q1.1):
- Сейчас хук не экспортируется: в `exports` нет `./hooks/*`, в корневом индексе его нет.
- Блок shadcn с боковой панелью тогда пишет в проект копию хука, и её ловит `react-hooks/set-state-in-effect` из `eslint-config-next`.
- Правило кита (`AGENTS.md`, «`@mednet/ui`»): новый публичный модуль — ключ в `exports`, `gen:index`, раздел в `llms.md`, путь в `check-dist`. Решение владельца 6.

- [ ] **Step 1: Падающие тесты**

В `packages/ui/src/__tests__/package.test.ts`:

1. В список `it.each([...])` теста `'llms.md: модуль %s описан'` после `'toast',` добавить `'use-mobile',`.
2. В конец `describe` (после теста `'llms.md: у каждого фирменного компонента есть раздел с примером'`) добавить:

```ts
  it('хук use-mobile — публичный подпуть: на него ссылается заглушка hooks/use-mobile.ts шаблона', () => {
    expect(pkg.exports['./use-mobile']).toEqual({
      types: './dist/hooks/use-mobile.d.ts',
      default: './dist/hooks/use-mobile.js',
    });
    expect(llms()).toMatch(/### `@mednet\/ui\/use-mobile`\n\n- хуки: `useIsMobile`\n/);
    expect(llms()).not.toContain('docs/components/base/use-mobile');
  });
```

Run: `pnpm turbo run test --filter=@mednet/ui -- src/__tests__/package.test.ts`

Expected: FAIL — `llms.md: модуль use-mobile описан` и новый тест: `expected undefined to deeply equal { types: …, default: … }`.

- [ ] **Step 2: Экспорт, индекс, справка, защита публикации**

`packages/ui/package.json`, в `exports`, после блока `"./app-shell"` (перед `"./*"`):

```json
    "./use-mobile": {
      "types": "./dist/hooks/use-mobile.d.ts",
      "default": "./dist/hooks/use-mobile.js"
    },
```

`packages/ui/scripts/gen-index.mjs`, строку

```js
const modules = [...list('components/'), ...list('brand/'), ...list('layouts/'), './lib/utils.js'];
```

заменить на

```js
// Хук use-mobile — публичный подпуть @mednet/ui/use-mobile (заглушка hooks/use-mobile.ts в шаблоне)
const modules = [
  ...list('components/'),
  ...list('brand/'),
  ...list('layouts/'),
  './hooks/use-mobile.js',
  './lib/utils.js',
];
```

`packages/ui/scripts/build-llms.mjs`, блок

```js
const modules = [
  ...Object.entries(BRAND).map(([name, file]) => ({ name, file, brand: true })),
  ...components.map((name) => ({ name, file: `dist/components/${name}.d.ts`, brand: false })),
];
```

заменить на

```js
const modules = [
  ...Object.entries(BRAND).map(([name, file]) => ({ name, file, brand: true, docs: false })),
  ...components.map((name) => ({
    name,
    file: `dist/components/${name}.d.ts`,
    brand: false,
    docs: true,
  })),
  // Хук блоков shadcn (боковая панель); своей страницы в документации shadcn у него нет
  { name: 'use-mobile', file: 'dist/hooks/use-mobile.d.ts', brand: false, docs: false },
];
```

В том же файле функцию `section`

```js
const section = ({ name, file, brand }) =>
  [
    `### \`@mednet/ui/${name}\``,
    '',
    exportsOf(file),
    ...(brand ? [] : [`- документация: ${DOCS}${name}`]),
    '',
  ].join('\n');
```

заменить на

```js
const section = ({ name, file, docs }) =>
  [
    `### \`@mednet/ui/${name}\``,
    '',
    exportsOf(file),
    ...(docs ? [`- документация: ${DOCS}${name}`] : []),
    '',
  ].join('\n');
```

`packages/ui/scripts/check-dist.mjs`: в массив `required` после `'dist/layouts/app-shell.js',` добавить:

```js
  'dist/hooks/use-mobile.js',
```

Корневой индекс — генератором, руками не править:

```bash
pnpm --filter @mednet/ui gen:index
git diff packages/ui/src/index.ts
```

Expected: `src/index.ts: 68 модулей`. В diff — одна новая строка `export * from './hooks/use-mobile.js';` перед `export * from './lib/utils.js';`.

- [ ] **Step 3: Тесты и сборка пакета проходят**

Run:

```bash
pnpm turbo run build test --filter=@mednet/ui
node packages/ui/scripts/check-dist.mjs && echo "check-dist: ok"
grep -A3 '### `@mednet/ui/use-mobile`' packages/ui/llms.md
```

Expected:
- `build` печатает `llms.md: 67 модулей`, все тесты `@mednet/ui` зелёные (в том числе тест `экспорт ./use-mobile указывает на существующий файл`);
- `check-dist: ok`;
- `grep` показывает:

```
### `@mednet/ui/use-mobile`

- хуки: `useIsMobile`
```

- [ ] **Step 4: Changeset, формат, commit**

`.changeset/ui-use-mobile.md`:

```markdown
---
'@mednet/ui': minor
---

Подпуть `@mednet/ui/use-mobile` (`useIsMobile`): блоки shadcn импортируют хук из `@/hooks/use-mobile`, и шаблон проекта держит там заглушку-реэкспорт, как для компонентов. Своя копия хука из shadcn в проекте не нужна (её ловит правило `react-hooks/set-state-in-effect`).
```

```bash
pnpm exec prettier --write packages/ui/package.json packages/ui/scripts packages/ui/src/__tests__/package.test.ts
pnpm format:check
git add packages/ui .changeset/ui-use-mobile.md
git commit -m "feat(ui): public @mednet/ui/use-mobile subpath for project stubs (index, llms, check-dist)"
```

---

### Task 6: Кит — насыщенность заголовков в `@mednet/ui/styles.css`

**Files:**
- Modify: `packages/ui/src/styles.css`, `packages/ui/src/__tests__/styles.test.ts`, `apps/docs/app/globals.css`, `docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md` (П16, §3)
- Create: `.changeset/ui-heading-weight.md`

**Interfaces:**
- Consumes: ничего из других задач.
- Produces:
  - `@mednet/ui/styles.css` задаёт `h1`, `h2`, `h3` насыщенность `var(--mn-font-weight-heading)` в слое `base`, после Preflight;
  - `globals.css` потребителя — одна строка `@import '@mednet/ui/styles.css';`. На это опирается шаблон (Task 8).

Что известно:
- Решение владельца 2: правило переезжает, а не меняется.
- Без правила Preflight Tailwind сбрасывает насыщенность заголовков, и `h1` рисовался с насыщенностью 500 (facts-1 §2). С правилом в Docker-образе B1 — 600 (facts-1 §7).
- `@mednet/css` из `@mednet/ui` берёт только PostCSS-плагин, а не `styles.css` (`packages/css/scripts/build.ts`). Поэтому `mednet.css` не меняется.
- Скриншоты docs сравнит job CI `visual`. Локально Docker не запускается: эталоны совпадать должны, потому что правило то же и стоит в том же слое `base` после Preflight.
- Changeset `patch` (решение владельца 2).

- [ ] **Step 1: Падающий тест**

В `packages/ui/src/__tests__/styles.test.ts` перед тестом `'копия shadcn/tailwind.css совпадает с установленным shadcn'` добавить:

```ts
  it('задаёт заголовкам насыщенность бренда: Preflight Tailwind её сбрасывает', () => {
    expect(styles).toMatch(
      /h1,\s*h2,\s*h3\s*\{\s*font-weight: var\(--mn-font-weight-heading\);\s*\}/,
    );
  });
```

Run: `pnpm --filter @mednet/ui test -- src/__tests__/styles.test.ts`

Expected: FAIL — `expected '/*\n * Стили @mednet/ui…' to match /h1,\s*h2,…/`.

- [ ] **Step 2: Правило в пакете**

В `packages/ui/src/styles.css` внутри существующего блока `@layer base { … }`, после правила `body { … }`, добавить:

```css

  /* Насыщенность заголовков бренда (600): Preflight Tailwind сбрасывает её до inherit. */
  h1,
  h2,
  h3 {
    font-weight: var(--mn-font-weight-heading);
  }
```

Блок после правки:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background font-sans text-foreground;
    /* текст 500 (спека §5), как body в @mednet/css */
    font-weight: var(--mn-font-weight-body);
  }

  /* Насыщенность заголовков бренда (600): Preflight Tailwind сбрасывает её до inherit. */
  h1,
  h2,
  h3 {
    font-weight: var(--mn-font-weight-heading);
  }
}
```

Run: `pnpm --filter @mednet/ui test -- src/__tests__/styles.test.ts`

Expected: `Tests  4 passed (4)`.

- [ ] **Step 3: docs-сайт — без своего правила**

`apps/docs/app/globals.css` целиком:

```css
@import '@mednet/ui/styles.css';
```

- [ ] **Step 4: docs собирается, правило в CSS ровно одно**

Run (одна `next build` docs-сайта):

```bash
pnpm turbo run build --filter=docs...
node -e "
const fs = require('fs'), path = require('path');
const dir = 'apps/docs/out/_next/static';
const css = fs.readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
console.log('правил насыщенности заголовков:', (css.match(/font-weight:var\(--mn-font-weight-heading\)/g) || []).length);
"
```

Expected: сборка зелёная, затем `правил насыщенности заголовков: 1` (правило из пакета есть, дубля из `globals.css` больше нет). Если вывод `0`, проверьте, что правило стоит внутри `@layer base` в `packages/ui/src/styles.css` и пакет пересобран.

- [ ] **Step 5: Changeset и спека**

`.changeset/ui-heading-weight.md`:

```markdown
---
'@mednet/ui': patch
---

`styles.css` задаёт заголовкам `h1`–`h3` насыщенность бренда (`--mn-font-weight-heading`, 600). Раньше Preflight Tailwind сбрасывал её, и правило приходилось добавлять в `globals.css` проекта; теперь `globals.css` — одна строка `@import '@mednet/ui/styles.css';`.
```

В спеке пилота (`docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md`) сделать две правки.

1. В таблицу «Решения пилота» после последней строки (П14 или П15, если Task 3 уже слит) добавить:

```markdown
| П16 | Насыщенность заголовков `h1`–`h3` (600, `--mn-font-weight-heading`) задаёт `@mednet/ui/styles.css`; `globals.css` проекта — одна строка `@import '@mednet/ui/styles.css';` | Preflight Tailwind сбрасывает насыщенность, и docs-сайт и шаблон латали это каждый у себя (решение владельца 2026-10-15) |
```

2. В разделе «3. Шаблон `templates/next`», пункт «Основа», заменить «`globals.css` = `tailwindcss` + `@mednet/ui/styles.css`» на «`globals.css` — одна строка `@import '@mednet/ui/styles.css';` (Tailwind и насыщенность заголовков — внутри, П16)».

- [ ] **Step 6: Все тесты пакета, формат, commit**

```bash
pnpm turbo run build test --filter=@mednet/ui
pnpm exec prettier --write packages/ui/src/styles.css packages/ui/src/__tests__/styles.test.ts apps/docs/app/globals.css
pnpm format:check
git add packages/ui/src apps/docs/app/globals.css .changeset/ui-heading-weight.md docs/superpowers/specs/2026-10-14-pilot-ui-template-cli-design.md
git commit -m "feat(ui): brand heading weight in styles.css; docs globals.css is a single import (P16)"
```

После push убедиться, что job CI `visual` зелёный: скриншоты docs не изменились.

---

### Task 7: Песочница шаблона и `package.json` базы

**Files:**
- Create: `scripts/lib/kit-tarballs.mjs`, `scripts/lib/kit-tarballs.test.mjs`, `scripts/sandbox.mjs`, `templates/next/base/package.json`, `templates/next/base/.nvmrc`, `templates/next/base/_gitignore`, `templates/next/base/.gitattributes`
- Modify: `package.json` (корень: скрипт `sandbox`)

**Interfaces:**
- Consumes:
  - из Task 1 — `generate(input: GenerateInput): void` из `packages/create-app/src/generate.ts`. Модуль импортируется из `.mjs`, типы снимает Node 24 (решение плана 10);
  - версия кита из `packages/create-app/package.json`.
- Produces:
  - `scripts/lib/kit-tarballs.mjs` (его использует и пилот, Task 15):
    - `KIT_ROOT: string`;
    - `TARBALL_DIR = '.mednet-tarballs'`;
    - `sh(command: string, cwd?: string): void` — бросает исключение на ненулевой код;
    - `packKit(packageDirs: string[], destDir: string): void`;
    - `readPacked(tarballDir: string): Record<string, string>`, например `{ '@mednet/ui': 'mednet-ui-0.2.0.tgz' }`;
    - `linkTarballs(projectDir: string, packed: Record<string, string>): void`.
  - Команда `node scripts/sandbox.mjs [--preset <пресет>] [--sync] [--print-dir]` (для людей — `pnpm sandbox`). Песочница лежит в `<os.tmpdir()>/mednet-sandbox-<пресет | base>`.
    - Без флагов: собрать и упаковать кит, создать проект с нуля, выполнить `npm install`.
    - `--sync`: только заново скопировать файлы шаблона. `node_modules`, `package-lock.json`, `.next` и тарболы остаются.
    - `--print-dir`: напечатать путь к песочнице с прямыми слешами.
  - Скрипты базы: `dev`, `build`, `start`, `lint`, `lint:css`, `typecheck`, `test`, `check`, `format`, `format:check`. Task 10 добавляет `test:e2e`.

Проверено:
- `pnpm pack` пакует и private-пакеты, а `workspace:*` переписывает в версии (facts-1 §0, facts-3 §0).
- `@mednet/ui` из тарбола требует **точную** версию `@mednet/tokens`, и эта версия опубликована в npm. Без `overrides` npm поставит опубликованные токены, а не собранные сейчас.
- Схема «прямые зависимости — `file:.mednet-tarballs/…`, транзитивный `@mednet/tokens` — `overrides`» работает с npm 11.19 (facts-1 §7, «Pilot recipe»).
- Первый `npm install` на этой машине занимает 6–12 минут (сеть). Повторный, с кэшем npm, — около 25 секунд (facts-2 §0.2).
- Помощники и скрипты извлечены из плана и проверены: 2 теста `node --test` проходят, `node --check` чистый, импорт `generate.ts` через снятие типов работает, `--print-dir` печатает путь.

- [ ] **Step 1: Падающий тест помощников**

`scripts/lib/kit-tarballs.test.mjs`:

```js
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { linkTarballs, readPacked } from './kit-tarballs.mjs';

let dir;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'kit-tarballs-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('readPacked', () => {
  it('имя пакета — из имени тарбола, в том числе с дефисом и пререлизом', () => {
    for (const file of [
      'mednet-ui-0.2.0.tgz',
      'mednet-lint-config-0.2.0.tgz',
      'mednet-tokens-1.0.0-rc.1.tgz',
      'notes.txt',
    ]) {
      writeFileSync(join(dir, file), '');
    }
    assert.deepEqual(readPacked(dir), {
      '@mednet/ui': 'mednet-ui-0.2.0.tgz',
      '@mednet/lint-config': 'mednet-lint-config-0.2.0.tgz',
      '@mednet/tokens': 'mednet-tokens-1.0.0-rc.1.tgz',
    });
  });
});

describe('linkTarballs', () => {
  it('прямые зависимости — file:-спеки, остальные пакеты кита — overrides', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'app',
        dependencies: { '@mednet/ui': '^0.2.0', next: '16.4.1' },
        devDependencies: { '@mednet/lint-config': '^0.2.0' },
        overrides: { foo: '1.0.0' },
      }),
    );
    linkTarballs(dir, {
      '@mednet/ui': 'mednet-ui-0.2.0.tgz',
      '@mednet/lint-config': 'mednet-lint-config-0.2.0.tgz',
      '@mednet/tokens': 'mednet-tokens-0.2.0.tgz',
    });
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    assert.equal(pkg.dependencies['@mednet/ui'], 'file:.mednet-tarballs/mednet-ui-0.2.0.tgz');
    assert.equal(pkg.dependencies.next, '16.4.1');
    assert.equal(
      pkg.devDependencies['@mednet/lint-config'],
      'file:.mednet-tarballs/mednet-lint-config-0.2.0.tgz',
    );
    assert.deepEqual(pkg.overrides, {
      foo: '1.0.0',
      '@mednet/tokens': 'file:.mednet-tarballs/mednet-tokens-0.2.0.tgz',
    });
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `node --test scripts/lib/kit-tarballs.test.mjs`

Expected: FAIL — `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…\scripts\lib\kit-tarballs.mjs'`

- [ ] **Step 3: Помощники**

`scripts/lib/kit-tarballs.mjs`:

```js
// Тарболы пакетов кита для проектов вне workspace: песочница шаблона (scripts/sandbox.mjs)
// и пилотный прогон (scripts/pilot.mjs).
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Корень репозитория кита. */
export const KIT_ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Папка тарболов внутри проекта: относительные file:-пути, внутри контекста Docker-сборки. */
export const TARBALL_DIR = '.mednet-tarballs';

/** Команда с выводом в консоль; ненулевой код — исключение. */
export function sh(command, cwd = KIT_ROOT) {
  console.log(`\n$ ${command}   (в ${cwd})`);
  // shell: true — pnpm/npm на Windows это .cmd; команда строкой, а не массивом (DEP0190 в Node 24)
  const result = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    throw new Error(`Команда завершилась с кодом ${result.status}: ${command}`);
  }
}

/** pnpm pack пакетов packages/<папка> в destDir: workspace:* → версии; private тоже пакуются. */
export function packKit(packageDirs, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const dir of packageDirs) {
    sh(`pnpm pack --pack-destination "${destDir}"`, join(KIT_ROOT, 'packages', dir));
  }
}

/** { '@mednet/ui': 'mednet-ui-0.2.0.tgz', … } по файлам mednet-<имя>-<версия>.tgz в папке. */
export function readPacked(tarballDir) {
  const packed = {};
  for (const file of readdirSync(tarballDir)) {
    const match = /^mednet-(.+)-\d+\.\d+\.\d+.*\.tgz$/.exec(file);
    if (match) packed[`@mednet/${match[1]}`] = file;
  }
  return packed;
}

/**
 * Переключает @mednet/* проекта на тарболы из <projectDir>/.mednet-tarballs.
 * Прямые зависимости — file:-спеки. Остальные пакеты кита (транзитивный @mednet/tokens у
 * @mednet/ui) — через overrides: иначе npm возьмёт опубликованную версию, а не собранную.
 */
export function linkTarballs(projectDir, packed) {
  const file = join(projectDir, 'package.json');
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  const spec = (name) => `file:${TARBALL_DIR}/${packed[name]}`;
  const direct = new Set();
  for (const key of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(pkg[key] ?? {})) {
      if (name in packed) {
        pkg[key][name] = spec(name);
        direct.add(name);
      }
    }
  }
  const overrides = { ...pkg.overrides };
  for (const name of Object.keys(packed)) {
    if (!direct.has(name)) overrides[name] = spec(name);
  }
  pkg.overrides = overrides;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}
```

- [ ] **Step 4: Тест проходит**

Run: `node --test scripts/lib/kit-tarballs.test.mjs`

Expected: `ℹ tests 2`, `ℹ pass 2`, `ℹ fail 0` (формат вывода `node --test` в Node 24).

- [ ] **Step 5: Скрипт песочницы**

`scripts/sandbox.mjs`:

```js
#!/usr/bin/env node
// Песочница шаблона templates/next: проект из шаблона на только что собранных пакетах кита
// (тарболы, а не реестр npm) во временной папке вне репозитория. Инструмент разработки шаблона;
// полный прогон с e2e и Docker — scripts/pilot.mjs в CI.
//
//   node scripts/sandbox.mjs [--preset <пресет>]            сборка и упаковка кита, проект с нуля, npm install
//   node scripts/sandbox.mjs [--preset <пресет>] --sync     только заново скопировать файлы шаблона
//   node scripts/sandbox.mjs [--preset <пресет>] --print-dir   путь к песочнице
//
// Правки — в templates/next, а не в песочнице: --sync и полный запуск их перезапишут.
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { generate } from '../packages/create-app/src/generate.ts';
import {
  KIT_ROOT,
  TARBALL_DIR,
  linkTarballs,
  packKit,
  readPacked,
  sh,
} from './lib/kit-tarballs.mjs';

const { values } = parseArgs({
  options: {
    preset: { type: 'string' },
    sync: { type: 'boolean', default: false },
    'print-dir': { type: 'boolean', default: false },
  },
});
const preset = values.preset ?? null;
const name = `mednet-sandbox-${preset ?? 'base'}`;
const dir = join(tmpdir(), name);
/** Что --sync не трогает: зависимости, кэш сборки Next, тарболы. */
const KEEP = new Set(['node_modules', 'package-lock.json', '.next', TARBALL_DIR]);

if (values['print-dir']) {
  console.log(dir.replaceAll('\\', '/'));
} else {
  build();
}

function build() {
  const packageFile = join(dir, 'package.json');
  const { version: kitVersion } = JSON.parse(
    readFileSync(join(KIT_ROOT, 'packages/create-app/package.json'), 'utf8'),
  );
  let previousPackageJson = null;

  if (values.sync) {
    if (!existsSync(join(dir, 'node_modules'))) {
      throw new Error(`Песочницы ${dir} ещё нет — запустите команду без --sync`);
    }
    previousPackageJson = readFileSync(packageFile, 'utf8');
    for (const entry of readdirSync(dir)) {
      if (!KEEP.has(entry)) rmSync(join(dir, entry), { recursive: true, force: true });
    }
  } else {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    sh('pnpm turbo run build --filter=@mednet/ui...');
    packKit(['tokens', 'ui', 'lint-config'], join(dir, TARBALL_DIR));
  }

  generate({
    templateRoot: join(KIT_ROOT, 'templates/next'),
    dest: dir,
    name,
    preset,
    ci: 'none',
    kitVersion,
  });
  linkTarballs(dir, readPacked(join(dir, TARBALL_DIR)));

  if (!values.sync) {
    sh('npm install --no-audit --no-fund', dir);
  } else if (readFileSync(packageFile, 'utf8') !== previousPackageJson) {
    console.warn(
      'package.json шаблона изменился — запустите песочницу без --sync (переустановка).',
    );
  }
  console.log(`\nПесочница: ${dir}`);
}
```

В корневом `package.json` в блок `scripts`, после строки `"test:chrome109": …`, добавить:

```json
    "sandbox": "node scripts/sandbox.mjs",
```

- [ ] **Step 6: Файлы базы шаблона**

`templates/next/base/package.json`:
- версии — по facts-1 §1, §9, диапазон `^{{kitVersion}}` — решение владельца 8;
- `recharts` в базе нет: его ставит только пресет `dashboard`, потому что на peer, установленный автоматически, нельзя опираться в собственных импортах (facts-1 §2);
- Playwright и axe добавляет Task 10.

```json
{
  "name": "{{name}}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --max-warnings=0",
    "lint:css": "stylelint \"**/*.css\" --allow-empty-input",
    "typecheck": "next typegen && tsc --noEmit",
    "test": "vitest run",
    "check": "npm run lint && npm run lint:css && npm run typecheck && npm run test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@mednet/ui": "^{{kitVersion}}",
    "@tanstack/react-query": "^5.104.2",
    "lucide-react": "^1.57.0",
    "next": "16.4.1",
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  },
  "devDependencies": {
    "@mednet/lint-config": "^{{kitVersion}}",
    "@tailwindcss/postcss": "^4.3.3",
    "@testing-library/dom": "^10.4.2",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.8",
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "eslint": "^9.39.5",
    "eslint-config-next": "16.4.1",
    "jsdom": "^30.1.2",
    "prettier": "^3.9.10",
    "prettier-plugin-tailwindcss": "^0.8.1",
    "stylelint": "^17.16.0",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.3",
    "vitest": "^5.0.4"
  }
}
```

`templates/next/base/.nvmrc`:

```
24
```

`templates/next/base/_gitignore` (facts-1 §9, дословно; CLI переименует его в `.gitignore`):

```gitignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

`templates/next/base/.gitattributes` (решение плана 11; файл переживает упаковку, facts-3 §3):

```gitattributes
# Переводы строк — LF на всех ОС: Prettier (endOfLine: lf) не зависит от core.autocrlf
* text=auto eol=lf
```

- [ ] **Step 7: Песочница поднимается**

Run: `node scripts/sandbox.mjs`

Expected:
- по порядку: `pnpm turbo run build --filter=@mednet/ui...` (из кэша — `FULL TURBO`), три `pnpm pack` (`mednet-tokens-0.2.0.tgz`, `mednet-ui-0.2.0.tgz`, `mednet-lint-config-0.2.0.tgz`), затем `npm install`;
- в конце: `Песочница: C:\Users\…\Temp\mednet-sandbox-base`;
- предупреждения `npm warn deprecated eslint@9.39.5` (решение владельца 1) и `install-scripts … unrs-resolver` ожидаемы и безвредны (facts-1 §2).

- [ ] **Step 8: Пакеты кита пришли из тарболов**

Run:

```bash
cd "$(node scripts/sandbox.mjs --print-dir)" && node -p "const p = require('./package-lock.json').packages; ['ui', 'lint-config', 'tokens'].map((n) => n + ' <- ' + p['node_modules/@mednet/' + n].resolved).join('\n')"
```

Expected:

```
ui <- file:.mednet-tarballs/mednet-ui-0.2.0.tgz
lint-config <- file:.mednet-tarballs/mednet-lint-config-0.2.0.tgz
tokens <- file:.mednet-tarballs/mednet-tokens-0.2.0.tgz
```

- [ ] **Step 9: Синхронизация без переустановки**

Run: `node scripts/sandbox.mjs --sync && ls -a "$(node scripts/sandbox.mjs --print-dir)"`

Expected:
- без сборки и без `npm install`;
- без предупреждения про `package.json`;
- в папке: `.gitattributes`, `.gitignore`, `.mednet-tarballs`, `.nvmrc`, `node_modules`, `package-lock.json`, `package.json`.

- [ ] **Step 10: Формат и commit**

```bash
pnpm exec prettier --write scripts package.json
pnpm format:check
git add scripts package.json templates/next/base
git commit -m "feat(templates): template sandbox on packed kit tarballs; base package.json, gitignore, nvmrc"
```

---

### Task 8: Шаблон — каркас Next: конфиги, корневой layout, провайдеры, `/api/health`

**Files:**
- Create (всё в `templates/next/base/`):
  - конфиги: `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `stylelint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `vitest.config.ts`, `vitest.setup.ts`;
  - приложение: `app/globals.css`, `app/layout.tsx`, `app/providers.tsx`, `app/api/health/route.ts`;
  - тесты: `tests/health.test.ts`, `tests/providers.test.tsx`

**Interfaces:**
- Consumes:
  - из Task 7 — песочница (`node scripts/sandbox.mjs [--sync] [--print-dir]`) и скрипты `package.json`;
  - из `@mednet/ui` — `@mednet/ui/styles.css`, PostCSS-плагин `@mednet/ui/postcss`, `Toaster` из `@mednet/ui/toast`, `TooltipProvider` из `@mednet/ui/tooltip`;
  - из `@mednet/lint-config` — `@mednet/lint-config/eslint` (по умолчанию экспортирует массив flat-конфигов) и `@mednet/lint-config/stylelint`.
- Produces:
  - `RootLayout` (`app/layout.tsx`) с `metadata.title = { default: '{{name}}', template: '%s — {{name}}' }`. Пресеты задают свой `export const metadata = { title: '…' }`.
  - `Providers({ children })` (`app/providers.tsx`) — `QueryClient` со `staleTime: 60_000`.
  - `GET(): Response` в `app/api/health/route.ts` возвращает `{ status: 'ok', version: process.env.APP_VERSION }`.
  - `next.config.ts`: `output: 'standalone'` и `env.APP_VERSION` из `package.json`.
  - Vitest:
    - `include: ['**/*.test.{ts,tsx}']`;
    - алиас `@/*` (`resolve.tsconfigPaths`);
    - заглушки `matchMedia` и `ResizeObserver`;
    - снятие `vi.stubGlobal` и `vi.stubEnv` после каждого теста.

Проверено:
- **Конфиги** — дословно из facts-1 §9. Отличия:
  - в `tsconfig.json` добавлено `noUncheckedSideEffectImports: false` (решение 14);
  - в `layout.tsx` заголовок `{{name}}` (решение 6);
  - `vitest.setup.ts` — вариант B1 плюс `ResizeObserver` для графиков (proto-b2) и `vi.unstubAll*`.
- **`globals.css`** — одна строка (решение владельца 2): правило заголовков даёт `@mednet/ui/styles.css` (Task 6). `@import 'tailwindcss'` **не** добавлять: `styles.css` подключает Tailwind сам.
- **`postcss.config.mjs`**: `@mednet/ui/postcss` идёт после `@tailwindcss/postcss`, и Next 16.4.1 с Turbopack его выполняет: `var(--x,)` = 0 (facts-1 §2, §8).
- **При написании плана** файлы этой задачи и Task 9 извлечены из плана и прогнаны на `node_modules` прототипа B1: `eslint --max-warnings=0`, `stylelint`, `next typegen && tsc --noEmit` и `prettier --check` — exit 0. `vitest run` — 3 файла, 6 тестов: под нагрузкой первая попытка упала по таймауту старта, вторая прошла с `--maxWorkers=1`.

Порядок работы во всех шагах: файл правится в `templates/next/base/`, затем `node scripts/sandbox.mjs --sync` переносит его в песочницу. Если песочницы на машине ещё нет (`Песочницы … ещё нет`), один раз выполните `node scripts/sandbox.mjs` без флагов.

- [ ] **Step 1: Конфиги**

`templates/next/base/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedSideEffectImports": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

`templates/next/base/next.config.ts`:

```ts
import type { NextConfig } from 'next';
import packageJson from './package.json' with { type: 'json' };

const nextConfig: NextConfig = {
  // Docker: .next/standalone + server.js (см. Dockerfile)
  output: 'standalone',
  // Версия для /api/health: в standalone-сервере npm_package_version не задан
  env: { APP_VERSION: packageJson.version },
};

export default nextConfig;
```

`templates/next/base/postcss.config.mjs`:

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    // Chrome/Edge 109 (Windows 7/8.1): статические копии цветов — строго после Tailwind.
    '@mednet/ui/postcss': {},
  },
};

export default config;
```

`templates/next/base/eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import mednet from '@mednet/lint-config/eslint';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Защита бренда — после конфигов Next. Свои запреты дополняйте через restrictedImports/restrictedSyntax.
  ...mednet,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
```

`templates/next/base/stylelint.config.mjs`:

```js
/** @type {import('stylelint').Config} */
const config = {
  extends: ['@mednet/lint-config/stylelint'],
  ignoreFiles: ['.next/**', 'out/**', 'build/**', 'playwright-report/**', 'test-results/**'],
};

export default config;
```

`templates/next/base/.prettierrc.json`. Без `tailwindStylesheet` плагин не знает классов бренда (`text-h1`, `bg-field`) и выносит их в начало списка вместо сортировки (facts-1 §4):

```json
{
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./app/globals.css",
  "tailwindFunctions": ["cn", "cva"]
}
```

`templates/next/base/.prettierignore`:

```
.next
out
build
node_modules
package-lock.json
next-env.d.ts
playwright-report
test-results
.mednet-tarballs
```

`templates/next/base/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Алиас @/* из tsconfig.json
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    // threads: пул forks зависает на части Windows-машин; на Linux работает так же
    pool: 'threads',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
});
```

`templates/next/base/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// После каждого теста: размонтировать компоненты, вернуть fetch и переменные окружения
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// jsdom не реализует matchMedia и ResizeObserver: их вызывают Sidebar (useIsMobile) и графики recharts
if (!window.matchMedia) {
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
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
```

- [ ] **Step 2: Падающий тест `/api/health`**

`templates/next/base/tests/health.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('200, status ok и версия сборки', async () => {
    vi.stubEnv('APP_VERSION', '1.2.3');
    const response = GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok', version: '1.2.3' });
  });
});
```

Run:

```bash
node scripts/sandbox.mjs --sync
cd "$(node scripts/sandbox.mjs --print-dir)" && npx vitest run tests/health.test.ts
```

Expected: FAIL — `Failed to resolve import "@/app/api/health/route" from "tests/health.test.ts". Does the file exist?`

- [ ] **Step 3: Обработчик `/api/health`**

`templates/next/base/app/api/health/route.ts`:

```ts
// Проверка живости для Docker HEALTHCHECK и балансировщика.
// version встраивается при сборке: next.config.ts → env.APP_VERSION (из package.json).
export function GET() {
  return Response.json({ status: 'ok', version: process.env.APP_VERSION });
}
```

Run: те же две команды, что в Step 2.

Expected: `Tests  1 passed (1)`.

- [ ] **Step 4: Падающий тест провайдеров**

`templates/next/base/tests/providers.test.tsx`:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Providers } from '@/app/providers';

function StaleTime() {
  const client = useQueryClient();
  return <p>{String(client.getDefaultOptions().queries?.staleTime)}</p>;
}

describe('Providers', () => {
  it('даёт приложению QueryClient: данные считаются свежими 60 с', () => {
    render(
      <Providers>
        <StaleTime />
      </Providers>,
    );
    expect(screen.getByText('60000')).toBeInTheDocument();
  });
});
```

Run:

```bash
node scripts/sandbox.mjs --sync
cd "$(node scripts/sandbox.mjs --print-dir)" && npx vitest run tests/providers.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/app/providers"`.

- [ ] **Step 5: Провайдеры**

`templates/next/base/app/providers.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Один клиент на вкладку; useState — чтобы не пересоздавать при перерисовке.
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Run: те же две команды, что в Step 4.

Expected: `Tests  1 passed (1)`.

- [ ] **Step 6: Стили и корневой layout**

`templates/next/base/app/globals.css`:

```css
@import '@mednet/ui/styles.css';
```

`templates/next/base/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from '@mednet/ui/toast';
import { TooltipProvider } from '@mednet/ui/tooltip';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '{{name}}', template: '%s — {{name}}' },
  description: 'Проект ЦНИИОИЗ',
};

// Обвязка Base UI (node_modules/@mednet/ui/llms.md): relative — бэкдропы в Safari iOS 26+,
// isolate — порталы поверх страницы, Toaster — один на приложение.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="relative">
        <Providers>
          <div className="isolate">
            <TooltipProvider>{children}</TooltipProvider>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: `npm run check` в песочнице**

Run:

```bash
node scripts/sandbox.mjs --sync
cd "$(node scripts/sandbox.mjs --print-dir)" && npm run check
```

Expected: последовательно проходят:
- `lint` — exit 0, замечаний нет;
- `lint:css` — exit 0;
- `typecheck` — `✓ Types generated successfully`, затем `tsc` с exit 0;
- `test` — `Test Files  2 passed (2)`, `Tests  2 passed (2)`.

- [ ] **Step 8: Одна `next build` и проверка CSS для Chrome 109**

Run (около 4 минут на этой машине, facts-1 §2):

```bash
cd "$(node scripts/sandbox.mjs --print-dir)" && npx next build
```

Expected: `✓ Compiled successfully`, в списке маршрутов `○ /_not-found` и `ƒ /api/health`. Страницы `/` нет: её даёт пресет (решение 3).

Run:

```bash
cd "$(node scripts/sandbox.mjs --print-dir)" && node --input-type=module -e '
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const dir = ".next/static";
const files = readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith(".css"));
const css = files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
const count = (re) => (css.match(re) ?? []).length;
console.log("css-файлов:", files.length);
console.log("var(--x,) без пробела:", count(/var\(--[\w-]+,\)/g));
console.log("var(--x, ) с пробелом:", count(/var\(--[\w-]+, \)/g));
console.log("@supports color-mix:", count(/@supports \(color:color-mix\(in lab, ?red, ?red\)\)/g));
console.log("Montserrat @font-face:", count(/@font-face\{font-family:Montserrat/g));
'
```

Expected (как в B1, facts-1 §2):
- `css-файлов` ≥ 1;
- `var(--x,) без пробела: 0`;
- `var(--x, ) с пробелом` > 0;
- `@supports color-mix` > 0;
- `Montserrat @font-face` > 0.

Что делать, если результат другой:
- `css-файлов: 0` — Next не выпустил глобальные стили для `/_not-found`. Отметьте это в отчёте: та же проверка CSS повторится в пилоте на пресетах (Task 20).
- `var(--x,) без пробела` больше нуля — плагин `@mednet/ui/postcss` не сработал. Проверьте порядок плагинов.

- [ ] **Step 9: Формат файлов шаблона**

Run: `cd "$(node scripts/sandbox.mjs --print-dir)" && npm run format:check`

Expected: `All matched files use Prettier code style!`

Если Prettier нашёл расхождения:
1. В песочнице выполните `npx prettier --write <файл>`.
2. Перенесите исправленный файл в `templates/next/base/<тот же путь>`.
3. Для файлов с подстановками (`package.json`, `app/layout.tsx`) перенесите правку вручную, не трогая `{{name}}` и `{{kitVersion}}`.

- [ ] **Step 10: Commit**

```bash
git add templates/next/base
git commit -m "feat(templates): next base — configs, root layout with Base UI wiring, query provider, health route"
```

---

### Task 9: Шаблон — данные: `lib/api.ts` и помощники тестов

**Files:**
- Create: `templates/next/base/lib/api.ts`, `templates/next/base/tests/render.tsx`, `templates/next/base/tests/api.test.ts`

**Interfaces:**
- Consumes: из Task 8 — Vitest-конфиг (алиас `@/*`, снятие подмен после каждого теста); из Task 7 — песочница.
- Produces. На это API опираются пресеты фазы 2 (proto-b2: `tool`, `cabinet`, `dashboard`):
  - **`lib/api.ts`**:
    - `class ApiError extends Error { readonly status: number; constructor(status: number, message: string) }`;
    - `apiGet<T>(path: string): Promise<T>`;
    - `apiPost<T>(path: string, body: unknown): Promise<T>`;
    - `apiPut<T>(path: string, body: unknown): Promise<T>`;
    - префикс адреса — `process.env.NEXT_PUBLIC_API_URL ?? ''`;
    - заголовки: всегда `Accept: application/json`, при теле — ещё `Content-Type: application/json`.
  - **`tests/render.tsx`**:
    - `renderWithQuery(ui: ReactElement)` — то же, что `render` из Testing Library, но внутри `QueryClientProvider`;
    - `mockFetch(handler: (path: string, init?: RequestInit) => unknown)` — подменяет `fetch`: отвечает 200 с JSON `handler(...)` и возвращает `vi.fn`;
    - пресеты импортируют помощники так: `import { mockFetch, renderWithQuery } from './render';`.

Проверено:
- `apiGet`, `ApiError` и `NEXT_PUBLIC_API_URL` — facts-1 §6.
- `apiPost`, `apiPut` и помощники — proto-b2 (`tpl/base/lib/api.ts`, `tpl/base/tests/render.tsx`).
- Объединённый вариант прошёл проверки на `node_modules` B1 (см. Task 8).

- [ ] **Step 1: Падающий тест**

`templates/next/base/tests/api.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet, apiPost, apiPut } from '@/lib/api';
import { mockFetch } from './render';

describe('lib/api', () => {
  it('apiGet: GET с Accept, ответ — разобранный JSON', async () => {
    const fetchMock = mockFetch(() => [{ id: 1 }]);
    await expect(apiGet<{ id: number }[]>('/api/items')).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } }),
    );
  });

  it('apiPost и apiPut: JSON-тело с Content-Type', async () => {
    const fetchMock = mockFetch((_path, init) => JSON.parse(String(init?.body)));
    await expect(apiPost('/api/items', { title: 'Отчёт' })).resolves.toEqual({ title: 'Отчёт' });
    await expect(apiPut('/api/profile', { email: 'a@b.ru' })).resolves.toEqual({ email: 'a@b.ru' });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/items',
      expect.objectContaining({
        method: 'POST',
        body: '{"title":"Отчёт"}',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/profile',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('ответ вне 2xx — ApiError со статусом и понятным текстом', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('нет', { status: 404, statusText: 'Not Found' })),
    );
    const request = apiGet('/api/missing');
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toThrow('GET /api/missing: 404 Not Found');
    await expect(request).rejects.toHaveProperty('status', 404);
  });

  it('NEXT_PUBLIC_API_URL — префикс адреса внешнего API', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.ru');
    vi.resetModules();
    const api = await import('@/lib/api');
    const fetchMock = mockFetch(() => ({}));
    await api.apiGet('/v1/items');
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.ru/v1/items', expect.anything());
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run:

```bash
node scripts/sandbox.mjs --sync
cd "$(node scripts/sandbox.mjs --print-dir)" && npx vitest run tests/api.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/api" from "tests/api.test.ts". Does the file exist?`

- [ ] **Step 3: Реализация**

`templates/next/base/tests/render.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

/** Рендер с TanStack Query: свой QueryClient на каждый тест, без повторов запросов. */
export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

/**
 * Подменяет глобальный fetch: handler получает путь и init запроса и возвращает тело JSON-ответа 200.
 * Подмена снимается после теста (vitest.setup.ts → vi.unstubAllGlobals).
 */
export function mockFetch(handler: (path: string, init?: RequestInit) => unknown) {
  const fetchMock = vi.fn(async (path: string, init?: RequestInit) =>
    Response.json(handler(path, init)),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
```

`templates/next/base/lib/api.ts`:

```ts
/** Ошибка HTTP: статус ответа — для экрана ошибки и логов. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Адрес API. Пусто — тот же origin (route handlers app/api/*); иначе — внешний бэкенд. */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers:
      body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      `${method} ${path}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

/** GET JSON. Бросает ApiError на любой ответ вне 2xx. */
export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

/** POST с JSON-телом, ответ — JSON. Бросает ApiError на любой ответ вне 2xx. */
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

/** PUT с JSON-телом, ответ — JSON. Бросает ApiError на любой ответ вне 2xx. */
export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}
```

- [ ] **Step 4: Тест проходит**

Run: те же две команды, что в Step 2.

Expected: `Tests  4 passed (4)`.

- [ ] **Step 5: Все проверки и формат**

Run: `cd "$(node scripts/sandbox.mjs --print-dir)" && npm run check && npm run format:check`

Expected:
- `check` проходит: `Test Files  3 passed (3)`, `Tests  6 passed (6)`;
- `All matched files use Prettier code style!`

Если формат разошёлся: в песочнице `npx prettier --write lib/api.ts tests/render.tsx tests/api.test.ts`, затем перенесите эти файлы в `templates/next/base/<тот же путь>` — подстановок в них нет, копировать можно целиком. `next build` здесь не нужен.

- [ ] **Step 6: Commit**

```bash
git add templates/next/base
git commit -m "feat(templates): typed fetch wrapper (apiGet/apiPost/apiPut, ApiError) and test helpers"
```

---

### Task 10: Шаблон — e2e: Playwright, здоровье и корневой layout

**Files:**
- Create: `templates/next/base/playwright.config.ts`, `templates/next/base/e2e/health.spec.ts`
- Modify: `templates/next/base/package.json` (`test:e2e`, Playwright и axe)

**Interfaces:**
- Consumes: из Task 8 — `/api/health` и корневой layout (`<html lang="ru">`); из Task 7 — песочница.
- Produces:
  - `npm run test:e2e` = `playwright test`:
    - `webServer` запускает `npm run build && npm run start -- -p <порт>`;
    - порт берётся из `E2E_PORT`, по умолчанию 4321;
    - `baseURL` — `http://127.0.0.1:<порт>`.
  - Каталог `e2e/`: базе — `health.spec.ts`, пресетам — `smoke.spec.ts`.
  - В базе для e2e пресетов стоят `@axe-core/playwright` `4.13.0`, `@playwright/test` и `playwright-core` точно `1.64.0`.
  - Задачи пресетов (Tasks 16–19) импортируют `import AxeBuilder from '@axe-core/playwright';` и `import { expect, test } from '@playwright/test';`.

Проверено:
- **Образ Playwright** (facts-1 §5): `playwright.config.ts` дословно, прогон в образе `mcr.microsoft.com/playwright:v1.64.0-noble` — `2 passed (6.5m)`, отчёт `github` работает.
- **Предупреждение `next start`.** Под `output: standalone` команда предупреждает `"next start" does not work with "output: standalone"`, но страницы отдаёт.
- **GitHub Actions** не проверены прототипом. Их проверит пилот (Task 20).
- **Закрепление версий.** Точные `1.64.0` у `@playwright/test` и `playwright-core` — по facts-1 §5 и facts-2 §0.2: иначе типы `AxeBuilder` расходятся.

Локально e2e **не запускается** (Global Constraints): тесты проверяют `typecheck` и `playwright test --list`, а прогон идёт в CI.

- [ ] **Step 1: Конфиг и тест**

`templates/next/base/playwright.config.ts` (facts-1 §5, дословно):

```ts
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 4321);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Production-сборка, как в Docker; локально переиспользует уже запущенный сервер
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
```

`templates/next/base/e2e/health.spec.ts`. Первый тест взят из facts-1 §5 дословно. Второй проверяет корневой layout на странице 404, потому что своей страницы у базы нет:

```ts
import { expect, test } from '@playwright/test';

test('/api/health отвечает ok и версию', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({ status: 'ok', version: expect.any(String) });
});

test('корневой layout: русский язык страницы', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});
```

- [ ] **Step 2: `package.json` базы**

`templates/next/base/package.json` целиком. Добавлены `test:e2e`, `@axe-core/playwright`, `@playwright/test` и `playwright-core`:

```json
{
  "name": "{{name}}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --max-warnings=0",
    "lint:css": "stylelint \"**/*.css\" --allow-empty-input",
    "typecheck": "next typegen && tsc --noEmit",
    "test": "vitest run",
    "check": "npm run lint && npm run lint:css && npm run typecheck && npm run test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@mednet/ui": "^{{kitVersion}}",
    "@tanstack/react-query": "^5.104.2",
    "lucide-react": "^1.57.0",
    "next": "16.4.1",
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@mednet/lint-config": "^{{kitVersion}}",
    "@playwright/test": "1.64.0",
    "@tailwindcss/postcss": "^4.3.3",
    "@testing-library/dom": "^10.4.2",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.8",
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "eslint": "^9.39.5",
    "eslint-config-next": "16.4.1",
    "jsdom": "^30.1.2",
    "playwright-core": "1.64.0",
    "prettier": "^3.9.10",
    "prettier-plugin-tailwindcss": "^0.8.1",
    "stylelint": "^17.16.0",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.3",
    "vitest": "^5.0.4"
  }
}
```

- [ ] **Step 3: Песочница с новыми зависимостями**

Run: `node scripts/sandbox.mjs`

Expected: полный прогон заканчивается строкой `Песочница: …`. Здесь нужна именно полная пересборка: `--sync` предупредил бы, что `package.json` изменился. Браузеры `npm install` не скачивает.

- [ ] **Step 4: Проверки без браузера**

Run:

```bash
cd "$(node scripts/sandbox.mjs --print-dir)" \
  && npm run check \
  && npx playwright test --list \
  && npm ls playwright-core @playwright/test \
  && npm run format:check
```

Expected:
- `check` проходит: typecheck теперь проверяет и `playwright.config.ts`, и `e2e/health.spec.ts`;
- `--list` перечисляет 2 теста в `health.spec.ts` (`Total: 2 tests in 1 file`) и сервер не запускает;
- `npm ls` показывает одну копию `playwright-core@1.64.0` (`deduped`);
- `All matched files use Prettier code style!`

- [ ] **Step 5: Commit**

```bash
git add templates/next/base
git commit -m "feat(templates): Playwright e2e (health, root layout), pinned 1.64.0 with playwright-core, axe for presets"
```

---

### Task 11: Шаблон — Docker

**Files:**
- Create: `templates/next/base/Dockerfile`, `templates/next/base/.dockerignore`, `templates/next/base/docker-compose.yml`, `templates/next/base/public/.gitkeep`

**Interfaces:**
- Consumes:
  - из Task 8 — `output: 'standalone'` и `/api/health`;
  - из Task 7 — `package.json`, а `package-lock.json` появляется после `npm install`.
- Produces:
  - **Образ.** Порт 3000, `HEALTHCHECK` по `/api/health`, пользователь `node`.
  - **Якорь для пилота.** Строка `COPY package.json package-lock.json ./`: Task 15 вставляет перед ней `COPY .mednet-tarballs ./.mednet-tarballs`.
  - **Build-arg `NEXT_PUBLIC_API_URL`.**
  - **`docker-compose.yml`** с сервисом `app` и проверкой здоровья.

Проверено (facts-1 §7):
- Сборка, запуск, `200` на `/api/health` и статус `healthy` в `docker inspect` — проверены, как и compose (`(healthy)`).
- Размер образа — около 75 МБ в сжатом виде.
- **Пользователь и сеть.** `USER node` уже есть в `node:24-alpine`. `HOSTNAME=0.0.0.0` обязателен. `wget` берётся из busybox.
- **`public/`** не должен быть пустым.
- **`FROM deps AS build`** вместо копирования `node_modules` экономит 265 с.

Отличия от дословного Dockerfile facts-1 §7:
- нет строки `COPY .mednet-tarball[s]` (решение 13);
- есть `ARG`/`ENV NEXT_PUBLIC_API_URL` (решение 15);
- в compose нет ключа `image:` (решение 6).

Сборку образа проверяет пилот в CI (Tasks 15, 20). Локально проверяется только `docker compose config`: эта команда не собирает образ.

- [ ] **Step 1: Файлы**

`templates/next/base/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

# ---- deps: зависимости по lockfile ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Кэш npm между сборками (BuildKit); при обрыве сети повторная сборка докачивает только недостающее
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---- build: next build → .next/standalone ----
# Продолжение deps: node_modules не копируются между стадиями (на Docker Desktop это минуты)
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
# Адрес внешнего API встраивается в клиентский код при сборке:
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.ru .
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN npm run build

# ---- runner: только standalone-сервер, не от root ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "server.js"]
```

`templates/next/base/.dockerignore` (facts-1 §7, дословно). `.mednet-tarballs` здесь **нет** — так нужно для пилота:

```
node_modules
.next
out
build
.git
.github
.gitlab-ci.yml
coverage
playwright-report
test-results
blob-report
*.tsbuildinfo
next-env.d.ts
npm-debug.log*
.env*
!.env.example
Dockerfile
docker-compose.yml
.dockerignore
README.md
AGENTS.md
CLAUDE.md
```

`templates/next/base/docker-compose.yml`:

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - '${PORT:-3000}:3000'
    environment:
      NODE_ENV: production
    healthcheck:
      test: ['CMD', 'wget', '-q', '-O', '/dev/null', 'http://127.0.0.1:3000/api/health']
      interval: 30s
      timeout: 5s
      start_period: 20s
      retries: 3
```

`templates/next/base/public/.gitkeep` — пустой файл. Runner копирует `public/`, а git пустые папки не хранит (facts-1 §7):

```bash
mkdir -p templates/next/base/public && : > templates/next/base/public/.gitkeep
```

- [ ] **Step 2: Проверки без сборки**

Run:

```bash
node scripts/sandbox.mjs --sync
cd "$(node scripts/sandbox.mjs --print-dir)" \
  && docker compose config --quiet && echo "compose: ok" \
  && grep -c '^COPY package.json package-lock.json ./$' Dockerfile \
  && ! grep -q 'mednet-tarballs' .dockerignore && echo ".dockerignore не прячет тарболы" \
  && test -f public/.gitkeep && echo "public/ на месте" \
  && npm run format:check
```

Expected:
- `compose: ok`;
- `1` — якорь для пилота на месте;
- `.dockerignore не прячет тарболы`;
- `public/ на месте`;
- `All matched files use Prettier code style!` (Prettier проверяет и `docker-compose.yml`).

Docker CLI нужен, но демон для `compose config` не нужен.

- [ ] **Step 3: Commit**

```bash
git add templates/next/base
git commit -m "feat(templates): Docker — standalone image, non-root, healthcheck, compose, API URL build arg"
```

---

### Task 12: Шаблон — заглушки `components/ui/*` и блоки shadcn

**Files:**
- Create: `templates/next/base/components.json`, `templates/next/base/scripts/gen-ui-stubs.mjs`, `templates/next/base/scripts/ui-add.mjs`, `scripts/lib/template-scripts.test.mjs`
- Create (генератором, Step 5): `templates/next/base/components/ui/*.tsx` (61 файл), `templates/next/base/hooks/use-mobile.ts`, `templates/next/base/lib/utils.ts`
- Modify: `templates/next/base/package.json` (`ui:stubs`, `ui:add`)

**Interfaces:**
- Consumes:
  - из Task 5 — подпуть `@mednet/ui/use-mobile`. Перед этой задачей влейте `main` с Task 5 в `plan-b-tpl`;
  - из Task 7 — песочница и `KIT_ROOT` из `scripts/lib/kit-tarballs.mjs`;
  - из `@mednet/ui` — компоненты `packages/ui/src/components/*.tsx` (61) и `@mednet/ui/utils` (`cn`).
- Produces:
  - **`scripts/gen-ui-stubs.mjs`** проекта:
    - `HEADER: string`;
    - `componentNames(dir: string): string[]` — файлы `.js` или `.tsx`, отсортированы;
    - `stubFiles(names: string[]): Record<string, string>` — путь → содержимое;
    - без аргумента читает `node_modules/@mednet/ui/dist/components`, с аргументом — указанную папку.
  - **`scripts/ui-add.mjs`** проекта: `rewriteCnImports(source: string): string`. Команда `npm run ui:add -- <блок…>`.
  - **Заглушки:**
    - `components/ui/<модуль>.tsx` = `export * from '@mednet/ui/<модуль>'`;
    - `hooks/use-mobile.ts` = `export * from '@mednet/ui/use-mobile'`;
    - `lib/utils.ts` = `export { cn } from '@mednet/ui/utils'`.
  - **Скрипты проекта:** `ui:stubs`, `ui:add`.
  - Раздел «Блоки shadcn» в `AGENTS.md` пишет Task 13.

Проверено прототипом B2 (facts-2 Q1, Q1.1–Q1.3, §7.1):
- **Генерация и `components.json`.** Генератор пишет 61 заглушку. `components.json` с `base-maia` взят дословно.
- **Блоки на заглушках.** `login-01`, `sidebar-07` и `dashboard-01` собираются: `tsc` 0 ошибок, `next build` проходит, блоки выглядят в бренде.
- **`ui:add`.** Скрипт отвечает «n» в Windows без `yes`. После него заглушки и хук остаются нетронутыми.
- **Заглушки коммитятся:** при `--no-install` генерировать их из `node_modules` в CLI нельзя.
- **Отличия от B2** — правка импорта `cn`, удаление зависимости `cn` и команда одной строкой (решения владельца 6–7). Их проверяет Step 8 этой задачи.
- **При написании плана** генератор и тест кита проверены: на `packages/ui/src/components` выходит 61 заглушка, тесты зелёные. Если запустить `ui:add` без блока, скрипт печатает подсказку и завершается с кодом 1.

- [ ] **Step 1: Падающий тест кита**

`scripts/lib/template-scripts.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { componentNames, stubFiles } from '../../templates/next/base/scripts/gen-ui-stubs.mjs';
import { rewriteCnImports } from '../../templates/next/base/scripts/ui-add.mjs';
import { KIT_ROOT } from './kit-tarballs.mjs';

const BASE = join(KIT_ROOT, 'templates/next/base');

describe('заглушки шаблона для блоков shadcn', () => {
  it('на каждый компонент @mednet/ui — заглушка, лишних нет, содержимое как у генератора', () => {
    const names = componentNames(join(KIT_ROOT, 'packages/ui/src/components'));
    assert.ok(names.includes('button') && names.includes('sidebar'));
    assert.deepEqual(componentNames(join(BASE, 'components/ui')), names);
    for (const [path, text] of Object.entries(stubFiles(names))) {
      assert.equal(readFileSync(join(BASE, path), 'utf8'), text, path);
    }
  });
});

describe('ui:add', () => {
  it('импорт cn из npm-пакета «cn» заменяется на cn бренда, остальное не трогается', () => {
    assert.equal(
      rewriteCnImports('import { cn } from "cn"\n'),
      "import { cn } from '@/lib/utils'\n",
    );
    assert.equal(rewriteCnImports("import { cn } from 'cn';"), "import { cn } from '@/lib/utils';");
    const untouched = "import { clsx } from 'clsx';\nimport x from 'cnx';\nimport y from 'cn/z';\n";
    assert.equal(rewriteCnImports(untouched), untouched);
  });
});
```

Run: `node --test scripts/lib/template-scripts.test.mjs`

Expected: FAIL — `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…\templates\next\base\scripts\gen-ui-stubs.mjs'`.

- [ ] **Step 2: Генератор заглушек**

`templates/next/base/scripts/gen-ui-stubs.mjs` (на основе B2 §7.1). Главное отличие: функции экспортируются для теста кита, а работа начинается, только когда файл запущен как скрипт:

```js
// Заглушки для блоков shadcn: components/ui/*.tsx, hooks/use-mobile.ts и lib/utils.ts реэкспортируют
// @mednet/ui, поэтому блоки (npm run ui:add -- login-01) собираются на компонентах кита, а не на копиях.
// Запуск: npm run ui:stubs — после обновления @mednet/ui (у новых компонентов появятся заглушки).
// Существующие файлы перезаписываются, лишние не удаляются.
// Необязательный аргумент — папка с модулями компонентов (по умолчанию dist/components пакета).
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const HEADER =
  '// Сгенерировано scripts/gen-ui-stubs.mjs: модуль из @mednet/ui. Не редактируйте.\n';

/** Имена модулей компонентов: файлы .js (dist пакета) или .tsx (исходники кита, заглушки). */
export function componentNames(dir) {
  return readdirSync(dir)
    .filter((file) => /\.(js|tsx)$/.test(file))
    .map((file) => file.replace(/\.(js|tsx)$/, ''))
    .sort();
}

/** Файлы заглушек: путь от корня проекта → содержимое. */
export function stubFiles(names) {
  const files = {
    'lib/utils.ts': `${HEADER}export { cn } from '@mednet/ui/utils';\n`,
    'hooks/use-mobile.ts': `${HEADER}export * from '@mednet/ui/use-mobile';\n`,
  };
  for (const name of names) {
    files[`components/ui/${name}.tsx`] = `${HEADER}export * from '@mednet/ui/${name}';\n`;
  }
  return files;
}

function main() {
  const require = createRequire(import.meta.url);
  const dir =
    process.argv[2] ?? join(dirname(require.resolve('@mednet/ui/package.json')), 'dist/components');
  const names = componentNames(dir);
  for (const [path, text] of Object.entries(stubFiles(names))) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  console.log(`components/ui: ${names.length} заглушек, hooks/use-mobile.ts, lib/utils.ts`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

- [ ] **Step 3: Добавление блоков**

`templates/next/base/scripts/ui-add.mjs` (на основе B2 §7.1) плюс правка `cn` и удаление зависимости `cn`:

```js
// npm run ui:add -- <блок…>   например: npm run ui:add -- login-01
// shadcn add, который на вопрос «перезаписать?» отвечает «нет»: заглушки components/ui/*,
// hooks/use-mobile.ts и lib/utils.ts остаются, и блок собирается на компонентах @mednet/ui.
// После добавления импорт cn из npm-пакета «cn» меняется на '@/lib/utils' (cn бренда знает
// размеры text-h1…h4), а зависимость «cn», которую добавил shadcn, удаляется. Работает в Windows.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SHADCN = 'shadcn@4.21.4';
/** Папки, в которые shadcn пишет файлы блоков. */
const DIRS = ['app', 'components', 'hooks', 'lib'];

/** import … from "cn" → import … from '@/lib/utils'. */
export function rewriteCnImports(source) {
  return source.replace(/from\s+(['"])cn\1/g, "from '@/lib/utils'");
}

function sourceFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

function fixCnImports() {
  let changed = 0;
  for (const file of DIRS.filter((dir) => existsSync(dir)).flatMap(sourceFiles)) {
    const source = readFileSync(file, 'utf8');
    const fixed = rewriteCnImports(source);
    if (fixed !== source) {
      writeFileSync(file, fixed);
      changed += 1;
    }
  }
  return changed;
}

function dropCnDependency() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (!pkg.dependencies?.cn) return false;
  // cn остаётся в node_modules как зависимость @mednet/ui; uninstall правит package.json и lockfile
  return (
    spawnSync('npm uninstall cn --no-audit --no-fund', { stdio: 'inherit', shell: true }).status ===
    0
  );
}

function main() {
  const blocks = process.argv.slice(2);
  if (blocks.length === 0) {
    console.error('Укажите блок: npm run ui:add -- login-01');
    process.exit(1);
  }
  // Команда строкой (shell): так npx находится в Windows, и Node 24 не печатает DEP0190
  const child = spawn(['npx', '--yes', SHADCN, 'add', '--yes', ...blocks].join(' '), {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });
  child.stdin.on('error', () => {}); // процесс мог завершиться раньше
  const answerNo = setInterval(() => child.stdin.write('n\n'), 300);
  child.on('exit', (code) => {
    clearInterval(answerNo);
    if (code !== 0) process.exit(code ?? 1);
    const changed = fixCnImports();
    if (changed > 0) console.log(`cn бренда: импорт заменён на '@/lib/utils' в файлах: ${changed}`);
    if (dropCnDependency()) console.log('Зависимость cn удалена: cn бренда приходит из @mednet/ui');
    console.log('Дальше: npm run check — ошибки в коде блока исправляйте в самом блоке.');
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

- [ ] **Step 4: `components.json`**

`templates/next/base/components.json` (facts-2 §7.1, дословно):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-maia",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle"
}
```

- [ ] **Step 5: Заглушки — генератором из исходников кита**

Run:

```bash
cd templates/next/base && node scripts/gen-ui-stubs.mjs ../../../packages/ui/src/components && cd ../../..
ls templates/next/base/components/ui | wc -l
cat templates/next/base/components/ui/button.tsx templates/next/base/hooks/use-mobile.ts templates/next/base/lib/utils.ts
```

Expected: `components/ui: 61 заглушек, hooks/use-mobile.ts, lib/utils.ts`, затем `61` и:

```
// Сгенерировано scripts/gen-ui-stubs.mjs: модуль из @mednet/ui. Не редактируйте.
export * from '@mednet/ui/button';
// Сгенерировано scripts/gen-ui-stubs.mjs: модуль из @mednet/ui. Не редактируйте.
export * from '@mednet/ui/use-mobile';
// Сгенерировано scripts/gen-ui-stubs.mjs: модуль из @mednet/ui. Не редактируйте.
export { cn } from '@mednet/ui/utils';
```

Run: `node --test "scripts/**/*.test.mjs"`

Expected: `ℹ tests 4`, `ℹ pass 4`, `ℹ fail 0` — 2 в `kit-tarballs.test.mjs` (Task 7) и 2 в `template-scripts.test.mjs`.

- [ ] **Step 6: Скрипты проекта**

`templates/next/base/package.json` целиком: в `scripts` добавлены `ui:stubs` и `ui:add`.

```json
{
  "name": "{{name}}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --max-warnings=0",
    "lint:css": "stylelint \"**/*.css\" --allow-empty-input",
    "typecheck": "next typegen && tsc --noEmit",
    "test": "vitest run",
    "check": "npm run lint && npm run lint:css && npm run typecheck && npm run test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:e2e": "playwright test",
    "ui:stubs": "node scripts/gen-ui-stubs.mjs",
    "ui:add": "node scripts/ui-add.mjs"
  },
  "dependencies": {
    "@mednet/ui": "^{{kitVersion}}",
    "@tanstack/react-query": "^5.104.2",
    "lucide-react": "^1.57.0",
    "next": "16.4.1",
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@mednet/lint-config": "^{{kitVersion}}",
    "@playwright/test": "1.64.0",
    "@tailwindcss/postcss": "^4.3.3",
    "@testing-library/dom": "^10.4.2",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.8",
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "eslint": "^9.39.5",
    "eslint-config-next": "16.4.1",
    "jsdom": "^30.1.2",
    "playwright-core": "1.64.0",
    "prettier": "^3.9.10",
    "prettier-plugin-tailwindcss": "^0.8.1",
    "stylelint": "^17.16.0",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.3",
    "vitest": "^5.0.4"
  }
}
```

- [ ] **Step 7: Проверки в песочнице**

Песочница пересобирается целиком: изменился `package.json`, и в тарболе `@mednet/ui` должен оказаться подпуть `use-mobile` из Task 5.

Run:

```bash
node scripts/sandbox.mjs
cd "$(node scripts/sandbox.mjs --print-dir)" && npm run check && npm run format:check
```

Expected:
- `check` проходит: ESLint и `tsc` видят 61 заглушку, `hooks/use-mobile.ts` и `scripts/*.mjs`, тесты — `Test Files  3 passed (3)`, `Tests  6 passed (6)`;
- `All matched files use Prettier code style!`

Если `tsc` пишет `Cannot find module '@mednet/ui/use-mobile'`, значит в `plan-b-tpl` нет Task 5: влейте `main`.

- [ ] **Step 8: Блок shadcn через `ui:add` (нужна сеть)**

Проверка в песочнице; в git ничего не попадает. Около 2–4 минут.

Run:

```bash
cd "$(node scripts/sandbox.mjs --print-dir)" \
  && npm run ui:add -- login-01 \
  && grep -rn 'from "cn"' app components hooks lib; \
  node -p "require('./package.json').dependencies.cn ?? 'cn нет в dependencies'" \
  && head -n 3 components/login-form.tsx \
  && npm run check
```

Expected:
- shadcn пишет `Created 2 files: app/login/page.tsx, components/login-form.tsx` и `Skipped …` — заглушки не перезаписаны;
- затем `cn бренда: импорт заменён на '@/lib/utils' в файлах: 1` и `Зависимость cn удалена …`;
- `grep` ничего не находит;
- `cn нет в dependencies`;
- в `components/login-form.tsx` — `import { cn } from '@/lib/utils'`;
- `npm run check` проходит.

Потом верните песочницу к шаблону: `node scripts/sandbox.mjs --sync`.

- [ ] **Step 9: Формат и commit**

```bash
pnpm exec prettier --write scripts/lib/template-scripts.test.mjs
pnpm format:check
git add templates/next/base scripts/lib/template-scripts.test.mjs
git commit -m "feat(templates): committed shadcn stubs over @mednet/ui, ui:stubs and cross-platform ui:add (brand cn)"
```

---

### Task 13: Шаблон — AI-слой и README

**Files:**
- Create: `templates/next/base/AGENTS.md`, `templates/next/base/CLAUDE.md`, `templates/next/base/README.md`, `scripts/lib/template-docs.test.mjs`

**Interfaces:**
- Consumes:
  - из Tasks 7–11: имена скриптов (`dev`, `build`, `check`, `format`, `format:check`, `test:e2e`), пути `app/layout.tsx`, `lib/api.ts` и `tests/render.tsx` (`renderWithQuery`, `mockFetch`), `e2e/`, Docker (`Dockerfile`, `docker-compose.yml`, `GET /api/health`);
  - из Task 12: скрипты `ui:stubs` и `ui:add`, закоммиченные заглушки `components/ui/*`, `hooks/use-mobile.ts`, `lib/utils.ts`;
  - из `@mednet/ui`: `node_modules/@mednet/ui/llms.md`, `@mednet/ui/toast`, `@mednet/ui/utils`;
  - из Task 7: `KIT_ROOT` (`scripts/lib/kit-tarballs.mjs`) и `node scripts/sandbox.mjs --sync` / `--print-dir`;
  - из CLI (Task 1): подстановки `{{name}}` и `{{kitVersion}}`.
- Produces:
  - **`AGENTS.md`** (около 100 строк, спека §12):
    - разделы: «Прежде чем писать код», «Компоненты», «Цвета, шрифт, оформление», «Данные», «Формы», «Таблицы», «Блоки shadcn», «Тексты», «Доступность», «Безопасность и данные», «Браузеры», «Структура и команды»;
    - ссылается на `node_modules/@mednet/ui/llms.md`;
    - в самом конце — управляемый блок Next, который `next dev` 16.4 вставляет сам (факт facts-1 §2), дословно.
  - **`CLAUDE.md`** = `@AGENTS.md`.
  - **`README.md`**:
    - разделы: «Начало работы», «Команды», «Структура», «Данные», «CI», «Деплой», «Дизайн-система»;
    - в «Деплое» — подразделы «Docker», «Проверка живости», «Переменные окружения»;
    - в «Дизайн-системе» — подраздел «Блоки shadcn»;
    - прямо сказано: проект только на npm; GitLab CI проверен только по синтаксису, первый настоящий прогон делает DevOps.
  - **Тест кита `scripts/lib/template-docs.test.mjs`**: держит эти три файла в форме, которую ждут Tasks 14, 15 и 20 (блок Next, размер `AGENTS.md`, существующие скрипты в командах).

Проверено:
- **Содержание `AGENTS.md`** следует спеке §12: какие компоненты брать, семантические цвета, паттерны форм и таблиц, тон «научпоп», доступность, «запусти `npm run check`». Источники правил — `packages/ui/llms/intro.md` и `brand.md`; особенности zod и TanStack Table v9 — facts-2 (`cabinet`, `tool`, находки 1 и 8).
- **Раздел «Блоки shadcn»** следует решению владельца 7 и facts-2 (находки 3–6): заглушки закоммичены, `npm run ui:stubs` — для обновлений кита, блоки добавляются только `npm run ui:add -- <блок>`; блокам нужны `sonner`, `next-themes`, `@dnd-kit/*`, которых нет в ките; каждый блок обязан пройти `npm run check`.
- **Блок Next** взят дословно из Next 16.4.1 (facts-1 §2). Сравнение идёт без учёта окончаний строк, поэтому пустые строки внутри блока должны совпасть до единой. Проверка при написании плана: `hasCurrentAgentRules` из `next/dist/server/lib/generate-agent-files.js` (16.4.1) на предыдущей редакции `AGENTS.md` вернула `true`. Блок в этой редакции не менялся, но Step 5 проверяет его заново на живом пакете `next` песочницы.
- **Без таблиц в Markdown.** Prettier выравнивает таблицы по-своему.
- **Сноски Docker в README** — из facts-1 §5 и §7: нужен BuildKit, закоммиченный lockfile, доступ к реестру и к загрузке SWC.
- **`npm create` и флаги.** npm забирает `--yes` и `--no-*` себе, поэтому флаги CLI идут после `--`: `npm create @mednet/app <имя> -- --preset tool` (facts-3 §1).
- **GitLab.** Единственная проверка GitLab CI шаблона — синтаксис (решение владельца 10, facts-3 §6): ни один job на настоящем раннере не запускался.

- [ ] **Step 1: Падающий тест кита**

Тест читает файлы шаблона напрямую: он не нужен ни песочнице, ни `node_modules`. Блок Next записан в нём строками, чтобы любая правка блока в `AGENTS.md` была видна как падение теста.

`scripts/lib/template-docs.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { KIT_ROOT } from './kit-tarballs.mjs';

const BASE = join(KIT_ROOT, 'templates/next/base');
const read = (file) => readFileSync(join(BASE, file), 'utf8').replace(/\r\n/g, '\n');

// Блок, который `next dev` 16.4.1 вставляет в AGENTS.md сам (facts-1 §2). Расходится хоть одна
// строка, включая пустые, — next dev перепишет файл, и в дереве появится незакоммиченная правка.
const NEXT_BLOCK = [
  '<!-- BEGIN:nextjs-agent-rules -->',
  '',
  '## This is NOT the Next.js you know',
  '',
  "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.",
  '',
  'This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.',
  '',
  '<!-- END:nextjs-agent-rules -->',
  '',
].join('\n');

const agents = read('AGENTS.md');
const readme = read('README.md');

describe('AGENTS.md и CLAUDE.md шаблона', () => {
  it('CLAUDE.md — одна строка @AGENTS.md', () => {
    assert.equal(read('CLAUDE.md').trim(), '@AGENTS.md');
  });

  it('управляемый блок Next стоит в самом конце, дословно', () => {
    assert.ok(agents.endsWith(`\n${NEXT_BLOCK}`), 'блок Next не совпал или не в конце файла');
    assert.equal(agents.split('BEGIN:nextjs-agent-rules').length, 2, 'блок должен быть один');
  });

  it('размер около 100 строк, заголовок и подстановки', () => {
    const lines = agents.trimEnd().split('\n').length;
    assert.ok(lines >= 90 && lines <= 115, `строк в AGENTS.md: ${lines}`);
    assert.ok(agents.startsWith('# {{name}}: правила для AI-агентов\n'));
    const placeholders = new Set(agents.match(/\{\{[^}]*\}\}/g));
    assert.deepEqual([...placeholders].sort(), ['{{kitVersion}}', '{{name}}']);
  });

  it('есть все разделы, ссылка на llms.md и правила блоков shadcn', () => {
    const headings = [...agents.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    assert.deepEqual(headings.slice(0, 12), [
      'Прежде чем писать код',
      'Компоненты',
      'Цвета, шрифт, оформление',
      'Данные',
      'Формы',
      'Таблицы',
      'Блоки shadcn',
      'Тексты',
      'Доступность',
      'Безопасность и данные',
      'Браузеры',
      'Структура и команды',
    ]);
    for (const needle of [
      'node_modules/@mednet/ui/llms.md',
      'npm run check',
      'npm run ui:add -- login-01',
      'npm run ui:stubs',
      '`sonner`',
      '`next-themes`',
      '`@dnd-kit/*`',
      '@mednet/ui/toast',
      '`@tanstack/react-table` версии 9',
      'from "cn"',
      '@/lib/utils',
    ]) {
      assert.ok(agents.includes(needle), `в AGENTS.md нет: ${needle}`);
    }
  });
});

describe('README.md шаблона', () => {
  it('разделы, команда создания с «--», npm-only и честная заметка про GitLab', () => {
    const headings = [...readme.matchAll(/^##+ (.+)$/gm)].map((m) => m[1]);
    assert.deepEqual(headings, [
      'Начало работы',
      'Команды',
      'Структура',
      'Данные',
      'CI',
      'Деплой',
      'Docker',
      'Проверка живости',
      'Переменные окружения',
      'Дизайн-система',
      'Блоки shadcn',
    ]);
    assert.ok(readme.startsWith('# {{name}}\n'));
    assert.ok(readme.includes('npm create @mednet/app <имя> -- --preset tool'));
    assert.ok(readme.includes('npm ci') && readme.includes('package-lock.json'));
    assert.match(readme, /GitLab CI[^\n]*только по синтаксису/);
    assert.match(readme, /первый настоящий прогон[^\n]*DevOps/);
    assert.ok(readme.includes('npm run ui:add -- login-01'));
  });
});

describe('оба файла', () => {
  it('без таблиц Markdown', () => {
    for (const [name, text] of [
      ['AGENTS.md', agents],
      ['README.md', readme],
    ]) {
      assert.doesNotMatch(text, /^\|.*\|\s*$/m, name);
    }
  });

  it('каждая «npm run X» из текста есть среди scripts базы', () => {
    const { scripts } = JSON.parse(read('package.json'));
    const used = new Set();
    for (const text of [agents, readme]) {
      for (const m of text.matchAll(/npm run ([\w:-]+)/g)) used.add(m[1]);
    }
    assert.ok(used.has('check') && used.has('ui:add') && used.has('test:e2e'));
    for (const name of used) assert.ok(name in scripts, `нет скрипта «${name}» в package.json`);
  });
});
```

Run: `node --test scripts/lib/template-docs.test.mjs`

Expected: FAIL — файл падает уже при загрузке (`read('AGENTS.md')` на верхнем уровне): `Error: ENOENT: no such file or directory, open '…\templates\next\base\AGENTS.md'`, `ℹ fail 1`.

- [ ] **Step 2: `AGENTS.md`**

Блок Next скопирован дословно из facts-1 §2; тест Step 1 сверяет его построчно. Остальной текст сжат до спекового объёма (около 100 строк): правила прежней редакции сохранены, добавлен раздел «Блоки shadcn», а уточнения про состояния запроса, таблицы и структуру проекта слиты в короткие пункты.

`templates/next/base/AGENTS.md`:

````markdown
# {{name}}: правила для AI-агентов

Проект ЦНИИОИЗ на Next.js 16 (App Router) и дизайн-системе `@mednet/*` {{kitVersion}}. Интерфейс собирается из компонентов `@mednet/ui` в бренде ЦНИИОИЗ; отступления от бренда ловят ESLint и stylelint (`@mednet/lint-config`).

## Прежде чем писать код

1. Прочитайте `node_modules/@mednet/ui/llms.md` — справку по установленной версии кита: модули, пути импорта, пропсы фирменных блоков и каркасов. Её правила обязательны.
2. Посмотрите `app/layout.tsx`, `lib/api.ts` и тесты в `tests/`: новые страницы и запросы делайте так же.
3. Работа готова, только когда `npm run check` (ESLint, stylelint, типы, тесты) и `npm run build` проходят без ошибок. Не отключайте правила и не ставьте `eslint-disable`: нарушение исправляют в коде.

## Компоненты

- Всё берите из `@mednet/ui` по подпутям: `import { Button } from '@mednet/ui/button';`. Список модулей — в `llms.md`.
- Каркас страницы: лендинг и другие публичные страницы — `PublicLayout` (`@mednet/ui/public-layout`); инструмент, кабинет, дашборд — `AppShell` (`@mednet/ui/app-shell`) в `app/(app)/layout.tsx`.
- Логотип — только `Logo` (`@mednet/ui/logo`), шапка и подвал — `SiteHeader` и `SiteFooter`. Не рисуйте логотип сами.
- Основа компонентов — Base UI: другой элемент задаёт проп `render`, а не `asChild`: `<DialogTrigger render={<Button variant="outline" />}>`. Ссылка-кнопка — `<Link href="…" className={buttonVariants()}>`.
- Иконки — только `lucide-react`. Линтер запрещает другие UI-библиотеки (antd, MUI, Mantine, Chakra, Bootstrap) и прямые импорты `@radix-ui/*`, `radix-ui`, `@base-ui/react`.
- Нужного компонента нет — соберите его из компонентов кита в `components/`. Не копируйте код кита и не перекрашивайте его классами.
- Классы склеивайте через `cn` из `@mednet/ui/utils`, а не через clsx или tailwind-merge: они не знают размеров шрифта бренда.
- Уведомления — `toast.add({ title, type: 'success' })` из `@mednet/ui/toast`. `<Toaster />` уже стоит в `app/layout.tsx`, второй не добавляйте.

## Цвета, шрифт, оформление

- Цвета — только семантические классы: `bg-background`, `text-foreground`, `bg-card`, `bg-popover`, `bg-primary` с `text-primary-foreground`, `bg-secondary`, `bg-muted`, `text-muted-foreground`, `border-border`, `border-input`, `ring-ring`, `bg-field` (заливка полей), `bg-destructive`, `text-destructive`, для графиков `chart-1`…`chart-8`.
- Hex, `rgb()`, `hsl()`, `oklch()` и `bg-[#…]` запрещены. Полупрозрачность — модификатором: `bg-primary/10`.
- Стандартной палитры Tailwind (`slate-100`, `zinc-500`) нет, а шкалы `red-500`, `blue-700` — брендовые: в интерфейсе берите семантику, шкалы оставьте для графиков и иллюстраций.
- Заголовки — `text-h1`…`text-h4`, вводный абзац — `text-lead`, текст — `text-base`, `text-sm`, `text-xs`. Montserrat и насыщенность заголовков уже подключены.
- Оформление — классами Tailwind. Свой CSS — только на переменных токенов: `var(--primary)`, `color-mix(in oklab, var(--primary) 30%, transparent)`.

## Данные

- Запросы — TanStack Query (`useQuery`, `useMutation`) в клиентских компонентах (`'use client'`); HTTP — `apiGet`, `apiPost`, `apiPut` из `lib/api.ts`. На ответ вне 2xx они бросают `ApiError` со `status`.
- Пока бэкенда нет, данные отдают route handlers `app/api/*`; тестовые данные и типы лежат в `lib/`. Внешний API подключается переменной `NEXT_PUBLIC_API_URL` при сборке (README, «Деплой») или заменой обработчика.
- У запроса три состояния — загрузка (`Skeleton` или «Загрузка…»), ошибка (что случилось и что делать), данные. Пустой список — отдельное состояние с понятным текстом.

## Формы

- react-hook-form и zod: схема в `lib/`, `zodResolver` из `@hookform/resolvers/zod`, поля — `Field`, `FieldLabel`, `FieldError` из `@mednet/ui/field`, контролы через `Controller`. Пакетов нет — `npm i react-hook-form zod @hookform/resolvers`.
- Сообщения проверки — по-русски и конкретно: «Укажите электронную почту», а не «Invalid input».
- Обязательная галочка — `z.boolean().refine((value) => value, { error: '…' })`, а не `z.literal(true)`: иначе не сходятся типы формы.

## Таблицы

- Разметка — `Table` из `@mednet/ui/table`, логика — `@tanstack/react-table` версии 9. Примеры shadcn и статьи в интернете чаще написаны для версии 8 (`useReactTable`).
- В версии 9 возможности подключаются через `tableFeatures({ … })` и `useTable`; например, `row.getVisibleCells()` работает с `columnVisibilityFeature`. Сверяйтесь с типами пакета, а не с примерами.
- Поиск — `Input` над таблицей; пустой результат — строка «Ничего не найдено».

## Блоки shadcn

- `components/ui/*`, `hooks/use-mobile.ts` и `lib/utils.ts` — закоммиченные заглушки, реэкспорт `@mednet/ui`. Не редактируйте их. После обновления кита выполните `npm run ui:stubs`: появятся заглушки новых компонентов.
- Блок добавляйте только так: `npm run ui:add -- login-01`. Команда отвечает «n» на вопросы о перезаписи (заглушки остаются), заменяет `from "cn"` на `@/lib/utils` и убирает зависимость `cn`. Голый `npx shadcn add` затрёт заглушки копиями.
- Блоку могут быть нужны `sonner`, `next-themes`, `@dnd-kit/*`: в ките их нет. Вместо `sonner` — `toast` из `@mednet/ui/toast`; остальное перепишите на компоненты кита, не добавляя пакеты.
- Блок должен пройти `npm run check`. Ошибки линтера исправляйте в коде блока, а не в правилах.

## Тексты

- Интерфейс — на русском, тон «научпоп»: на фактах, но понятно, без канцелярита и восклицательных знаков.
- Кнопка называет действие глаголом: «Сохранить», «Создать отчёт». Ошибка говорит, что случилось и что делать дальше.
- Даты и числа — по-русски: `toLocaleDateString('ru-RU')`, `Intl.NumberFormat('ru-RU')`. Календарь — `<Calendar locale={ru} />`, `import { ru } from 'react-day-picker/locale';`.

## Доступность

- На странице один `h1`; заголовки идут по порядку. У каждого поля есть подпись (`FieldLabel` или `aria-label`), у кнопки-иконки — `aria-label`, у картинок — `alt` (у декоративных `alt=""`).
- Смысл не передаётся только цветом. Всё работает с клавиатуры: действие — `button`, переход — ссылка, а не `div` с `onClick`; кольца фокуса не убирайте.
- e2e-тест новой страницы проверяет её axe (`@axe-core/playwright`): нарушения `serious` и `critical` недопустимы.

## Безопасность и данные

- Секреты — только в переменных окружения; `.env*` не коммитятся (кроме `.env.example` без секретов).
- В тестовых данных и моках — вымышленные люди и организации. Не выводите в консоль и логи ответы API с персональными данными.

## Браузеры

Chrome и Edge 109+ (последние для Windows 7/8.1), Firefox 128+, Safari 16.4+. Не убирайте `@mednet/ui/postcss` из `postcss.config.mjs`. Компонент `bubble` и эффект `shimmer` в Chrome 109 не работают: не используйте их на публичных страницах.

## Структура и команды

- `app/` — страницы и route handlers; `components/` — компоненты проекта; `lib/` — API, схемы, данные; `tests/` — Vitest (помощники `renderWithQuery` и `mockFetch` — в `tests/render.tsx`); `e2e/` — Playwright.
- Новая страница — новый тест в `tests/` (рендер, ключевые тексты, роли) и проверка в `e2e/`.
- Команды: `npm run dev`; `npm run check` — все проверки; `npm run build`; `npm run test:e2e` (первый раз: `npx playwright install chromium`); `npm run format` — Prettier, он же сортирует классы Tailwind.
- Зависимости — только через npm (`npm i …`): `Dockerfile` и CI собирают проект по `package-lock.json`. Пакеты `@mednet/*` обновляйте вместе и до одной версии, затем `npm run ui:stubs` и перечитайте `llms.md`.
- Правило мешает задаче — спросите владельцев кита (репозиторий mednet-kit), а не обходите его.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
````

- [ ] **Step 3: `CLAUDE.md`**

`templates/next/base/CLAUDE.md`:

```markdown
@AGENTS.md
```

- [ ] **Step 4: `README.md`**

`templates/next/base/README.md`:

````markdown
# {{name}}

Проект ЦНИИОИЗ на Next.js 16 и дизайн-системе `@mednet/*` {{kitVersion}}. В нём уже настроены:

- компоненты и каркасы страниц `@mednet/ui`;
- защита бренда `@mednet/lint-config`;
- данные через TanStack Query;
- тесты Vitest и Playwright;
- Docker-образ и CI.

Проект создан командой вида `npm create @mednet/app <имя> -- --preset tool` (пресеты: `landing`, `tool`, `cabinet`, `dashboard`; флаги после `--`, иначе их заберёт сам npm). Пакетный менеджер — только npm: `Dockerfile` и CI собирают проект по `package-lock.json`, а CLI ставит зависимости через npm, даже если его запустили через `pnpm create` или `yarn create`.

## Начало работы

```bash
npm install   # если проект создан с --no-install
npm run dev   # http://localhost:3000
```

## Команды

- `npm run dev` — разработка с горячей перезагрузкой.
- `npm run check` — ESLint, stylelint, проверка типов и тесты Vitest. Запускайте перед каждым коммитом.
- `npm run build` — production-сборка (`.next/standalone`).
- `npm run test:e2e` — e2e в Chromium: собирает проект и запускает его на порту 4321 (другой — `E2E_PORT`). Первый раз скачайте браузер: `npx playwright install chromium`.
- `npm run format` — Prettier, в том числе сортировка классов Tailwind; `npm run format:check` — только проверка.
- `npm run ui:stubs` и `npm run ui:add -- <блок>` — заглушки и блоки shadcn (см. «Дизайн-система»).

## Структура

- `app/` — страницы, `layout.tsx` и route handlers `app/api/*`.
- `components/` — компоненты проекта, собранные из `@mednet/ui`; `components/ui/` — заглушки для блоков shadcn.
- `lib/` — `api.ts` (запросы к API), схемы форм, тестовые данные.
- `tests/` — тесты Vitest; помощники `renderWithQuery` и `mockFetch` — в `tests/render.tsx`.
- `e2e/` — тесты Playwright.
- `AGENTS.md` — правила для AI-агентов (Claude Code читает его через `CLAUDE.md`). Справочник компонентов — `node_modules/@mednet/ui/llms.md`.

## Данные

Запросы идут через TanStack Query и `lib/api.ts`. Пока бэкенда нет, данные отдают route handlers `app/api/*` с тестовыми данными из `lib/`. Внешний API подключается переменной `NEXT_PUBLIC_API_URL` (см. «Деплой») или заменой обработчика.

## CI

Если проект создан с `--ci github` (по умолчанию) или `--ci gitlab`, CI (`.github/workflows/ci.yml` или `.gitlab-ci.yml`) выполняет `npm ci`, `npm run check`, `npm run build`, e2e-тесты и сборку Docker-образа.

- `npm ci` требует `package-lock.json` в репозитории. Он появляется при первом `npm install`; закоммитьте его.
- GitLab: для сборки образа нужен раннер с Docker-in-Docker (`docker:28-dind`, privileged).
- GitLab CI проверен только по синтаксису; первый настоящий прогон на вашем раннере делает DevOps. Если job упал, это ожидаемая наладка, а не поломка проекта: пришлите лог владельцам кита.

## Деплой

Площадку и конфигурацию готовит DevOps заказчика.

### Docker

Нужен Docker 23+ (BuildKit): `Dockerfile` держит кэш npm через `RUN --mount=type=cache`.

```bash
docker build -t {{name}} .
docker run -d --name {{name}} -p 3000:3000 {{name}}
# или
docker compose up -d --build   # другой порт хоста: PORT=8080 docker compose up -d --build
```

- Образ на `node:24-alpine`, многоступенчатый; в итоговом образе только `.next/standalone`, статика и `public/`. Процесс работает от пользователя `node`, не от root.
- Порт — 3000, сервер слушает `0.0.0.0` (`HOSTNAME` задан в образе).
- Проверка живости встроена в образ (`HEALTHCHECK` раз в 30 с) и продублирована в `docker-compose.yml`.
- Зависимости ставятся `npm ci` по `package-lock.json` — он должен быть в репозитории.
- Сборке нужен доступ к реестру npm. Если npm не поставил бинарник SWC (бывает на нестабильной сети), `next build` скачивает его сам. За прокси задайте `HTTPS_PROXY` и `npm_config_proxy` на этапе сборки.

### Проверка живости

`GET /api/health` → `200` и `{"status":"ok","version":"0.1.0"}`, где `version` — версия из `package.json` на момент сборки.

### Переменные окружения

- `NEXT_PUBLIC_API_URL` — адрес внешнего API. Пусто — запросы идут в route handlers этого же приложения. Значение встраивается в клиентский код при сборке: `docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.ru -t {{name}} .`. При запуске его уже не поменять.
- `PORT` — порт сервера внутри контейнера, по умолчанию 3000.

## Дизайн-система

Компоненты, токены и правила — [mednet-kit](https://github.com/hpnssflw/mednet-kit). Обновление: `npm i @mednet/ui@latest @mednet/lint-config@latest`, затем `npm run ui:stubs` (заглушки новых компонентов).

### Блоки shadcn

Готовые блоки shadcn (`login-01`, `sidebar-07`, `dashboard-01` и другие) собираются на компонентах кита: `components/ui/*`, `hooks/use-mobile.ts` и `lib/utils.ts` — закоммиченные заглушки-реэкспорты `@mednet/ui`.

```bash
npm run ui:add -- login-01
npm run check
```

- Добавляйте блоки только через `npm run ui:add`: он оставляет заглушки на месте, меняет `from "cn"` на `@/lib/utils` и убирает зависимость `cn`. Первый запуск скачивает CLI shadcn, для него нужна сеть.
- Блоку могут быть нужны пакеты, которых нет в ките: `sonner`, `next-themes`, `@dnd-kit/*`. Вместо `sonner` берите `toast` из `@mednet/ui/toast`; остальные места перепишите на компоненты кита.
- Блок должен пройти `npm run check`. Если линтер или типы находят ошибки в коде блока, правьте блок.
- Таблицы в блоках и в проекте написаны на TanStack Table v9 (`tableFeatures`, `useTable`): примеры для версии 8 из интернета не подойдут.
````

- [ ] **Step 5: Тест кита и проверки в песочнице**

Сначала тест кита без песочницы.

Run: `node --test scripts/lib/template-docs.test.mjs`

Expected: PASS — `ℹ tests 7`, `ℹ pass 7`, `ℹ fail 0` (4 теста про `AGENTS.md` и `CLAUDE.md`, 1 — про `README.md`, 2 — про оба файла). Если упал «размер около 100 строк», сократите `AGENTS.md`: границы 90–115 строк (без пустых строк в конце) — часть контракта плана. Если упал блок Next, сверьте его с facts-1 §2 построчно.

Потом файлы в собранном проекте. Подстановки идут в `AGENTS.md` и `README.md` (Task 1), а блок Next проверяется живым пакетом `next`.

Run:

```bash
node scripts/sandbox.mjs --sync
cd "$(node scripts/sandbox.mjs --print-dir)" \
  && head -n 1 AGENTS.md \
  && grep -c '{{' AGENTS.md README.md; \
  wc -l AGENTS.md \
  && test -f node_modules/@mednet/ui/llms.md && echo "llms.md на месте" \
  && node -e "console.log('блок Next актуален:', require('next/dist/server/lib/generate-agent-files.js').hasCurrentAgentRules('.'))" \
  && cat CLAUDE.md \
  && npm run format:check
```

Expected:
- `# mednet-sandbox-base: правила для AI-агентов`;
- `AGENTS.md:0` и `README.md:0` — плейсхолдеров не осталось;
- в `AGENTS.md` от 90 до 115 строк (при написании плана — 92);
- `llms.md на месте`;
- `блок Next актуален: true`;
- `@AGENTS.md`;
- `All matched files use Prettier code style!`

Если вместо этого `блок Next актуален: false`, сравните блок в `AGENTS.md` с функцией `buildAgentRulesBlock` в `node_modules/next/dist/server/lib/generate-agent-files.js` песочницы: обычно расходится пустая строка. Тогда поправьте и блок в `scripts/lib/template-docs.test.mjs`. Если `format:check` ругается на Markdown, запустите в песочнице `npx prettier --write AGENTS.md README.md`, перенесите результат в шаблон и повторите.

Проверки, которым здесь не место, идут в CI (Task 20): сборка Docker-образа, e2e и пилот пресетов. Лёгкая проверка команд README (`docker build`, `docker compose`) уже сделана в Task 11.

- [ ] **Step 6: Формат и commit**

```bash
pnpm exec prettier --write scripts/lib/template-docs.test.mjs
pnpm format:check
node --test "scripts/**/*.test.mjs"
git add templates/next/base/AGENTS.md templates/next/base/CLAUDE.md templates/next/base/README.md scripts/lib/template-docs.test.mjs
git commit -m "feat(templates): AGENTS.md with shadcn-blocks rules and the Next.js managed block, CLAUDE.md, README with deploy, Docker and GitLab caveat"
```

Expected: `ℹ tests 11` (4 прежних — Tasks 7 и 12 — и 7 новых), `ℹ fail 0`.

---

### Task 14: CLI — шаблон внутри пакета при сборке

**Files:**
- Create: `packages/create-app/scripts/copy-template.mjs`, `packages/create-app/scripts/check-dist.mjs`, `packages/create-app/turbo.json`, `packages/create-app/test/template.test.ts`
- Modify: `packages/create-app/package.json` (`build`, `prepublishOnly`)

**Interfaces:**
- Consumes:
  - из Task 3 — `dist/index.js`;
  - из Task 2 — `PRESETS` (`dist/args.js` в `check-dist`, `src/args.ts` в тесте);
  - `templates/next/**` — из Tasks 4–13; списки файлов пресетов — из Tasks 16–19.
- Produces:
  - сборка `pnpm --filter @mednet/create-app build` даёт `dist/` и `template/` — копию `templates/next` без `node_modules`, `.next`, `.mednet-tarballs`, `dist`, `test-results` и `playwright-report`;
  - turbo пересобирает пакет при правке `templates/next/**`;
  - тест состава шаблона `test/template.test.ts`: база — ровно 36 своих файлов плюс заглушки `components/ui/*`; у каждого пресета — ровно файлы его задачи (`landing` — 3, `tool` — 11, `cabinet` — 8, `dashboard` — 8, с фрагментом `package.json`); пресеты только добавляют файлы; фрагмент `package.json` — только `dependencies`. Новый файл в базе или пресете — правка списка в этом тесте;
  - `prepublishOnly` не даст опубликовать пакет, если в нём нет хотя бы одного из файлов:
    - `dist/index.js` с первой строкой `#!/usr/bin/env node`;
    - база шаблона с `Dockerfile` и `AGENTS.md`;
    - оба CI-варианта;
    - папки всех пресетов из `PRESETS`.

Выполняется в `main` после слияния потоков.

Проверено:
- **Прототип B3** (facts-3 §3): без `packages/create-app/turbo.json` turbo не кэширует `template/` и не замечает правок шаблона. Без `"!template/**"` в `inputs` каждый повторный запуск — промах кэша.
- **Фильтр копирования и `check-dist`** — проверены при написании плана. Из копии уходят `node_modules/` и `.next/`, а файл `app/distribution.ts` остаётся: фильтр сравнивает только части пути внутри шаблона.
- **Тест копии** проверен в трёх состояниях: проходит на чистом шаблоне, пропускается без `template/`, падает при расхождении. Тесты состава шаблона проверены на макете дерева (Step 1).

- [ ] **Step 1: Падающий тест копии и тест состава шаблона**

Тест держит два контракта. Первый — копия `template/` совпадает с `templates/next`. Второй — состав самого шаблона: база (Tasks 7–13) — ровно перечисленные файлы, у каждого пресета (Tasks 16–19) — ровно файлы его задачи, ни один путь пресета не совпадает с путём базы (кроме фрагмента `package.json`, который сливается, а не копируется), фрагмент — только `dependencies` (решение плана 2). Списки пресетов закреплены здесь заранее: пресеты идут параллельно с этой задачей, и тест пресета, которого ещё нет в ветке, пропускается (`it.skipIf`). Сами задачи пресетов этот файл не правят — их наборы файлов не пересекаются.

`packages/create-app/test/template.test.ts`:

```ts
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRESETS } from '../src/args.ts';

const packageDir = join(import.meta.dirname, '..');
const source = join(packageDir, '..', '..', 'templates', 'next');
const copy = join(packageDir, 'template');

function files(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .sort();
}

/**
 * Файлы базы (Tasks 7–13), кроме заглушек components/ui/*: заглушки сверяет с компонентами
 * @mednet/ui тест кита scripts/lib/template-scripts.test.mjs (Task 12).
 */
const BASE_FILES = [
  '.dockerignore',
  '.gitattributes',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc.json',
  'AGENTS.md',
  'CLAUDE.md',
  'Dockerfile',
  'README.md',
  '_gitignore',
  'app/api/health/route.ts',
  'app/globals.css',
  'app/layout.tsx',
  'app/providers.tsx',
  'components.json',
  'docker-compose.yml',
  'e2e/health.spec.ts',
  'eslint.config.mjs',
  'hooks/use-mobile.ts',
  'lib/api.ts',
  'lib/utils.ts',
  'next.config.ts',
  'package.json',
  'playwright.config.ts',
  'postcss.config.mjs',
  'public/.gitkeep',
  'scripts/gen-ui-stubs.mjs',
  'scripts/ui-add.mjs',
  'stylelint.config.mjs',
  'tests/api.test.ts',
  'tests/health.test.ts',
  'tests/providers.test.tsx',
  'tests/render.tsx',
  'tsconfig.json',
  'vitest.config.ts',
  'vitest.setup.ts',
];

/** Файлы пресетов (Tasks 16–19). package.json пресета — фрагмент: generate() сливает его с базовым. */
const PRESET_FILES: Record<(typeof PRESETS)[number], string[]> = {
  landing: ['app/page.tsx', 'e2e/smoke.spec.ts', 'tests/page.test.tsx'],
  tool: [
    'app/(app)/layout.tsx',
    'app/(app)/page.tsx',
    'app/api/items/route.ts',
    'components/create-item-dialog.tsx',
    'components/items-table.tsx',
    'e2e/smoke.spec.ts',
    'lib/items.ts',
    'package.json',
    'tests/dialog.test.tsx',
    'tests/items-route.test.ts',
    'tests/page.test.tsx',
  ],
  cabinet: [
    'app/(app)/layout.tsx',
    'app/(app)/page.tsx',
    'app/api/profile/route.ts',
    'components/profile-form.tsx',
    'e2e/smoke.spec.ts',
    'lib/profile.ts',
    'package.json',
    'tests/page.test.tsx',
  ],
  dashboard: [
    'app/(app)/layout.tsx',
    'app/(app)/page.tsx',
    'app/api/stats/route.ts',
    'components/dashboard.tsx',
    'e2e/smoke.spec.ts',
    'lib/stats.ts',
    'package.json',
    'tests/page.test.tsx',
  ],
};

const presetDir = (preset: string) => join(source, 'presets', preset);
// Пресеты (Tasks 16–19) вливаются параллельно с этой задачей: проверяются те, что уже есть
const presentPresets = PRESETS.filter((preset) => existsSync(presetDir(preset)));

// template/ появляется при сборке; через turbo (test зависит от build) тест выполняется всегда
describe.skipIf(!existsSync(copy))('template/ — копия templates/next при сборке', () => {
  it('совпадает с templates/next, включая dot-файлы и _gitignore', () => {
    expect(files(copy)).toEqual(files(source));
    expect(files(copy)).toEqual(
      expect.arrayContaining([
        'base/_gitignore',
        'base/.gitattributes',
        'base/.dockerignore',
        'base/.nvmrc',
        'base/.prettierrc.json',
        'base/public/.gitkeep',
        'base/package.json',
        'ci/github/.github/workflows/ci.yml',
      ]),
    );
  });
});

describe('templates/next — состав файлов', () => {
  it('база — ровно эти файлы (заглушки components/ui/* — отдельно)', () => {
    const own = files(join(source, 'base')).filter((file) => !file.startsWith('components/ui/'));
    expect(own).toEqual([...BASE_FILES].sort());
  });

  for (const preset of PRESETS) {
    it.skipIf(!existsSync(presetDir(preset)))(`пресет ${preset} — ровно эти файлы`, () => {
      expect(files(presetDir(preset))).toEqual([...PRESET_FILES[preset]].sort());
    });
  }

  it('пресеты только добавляют файлы: ни один путь пресета не совпадает с путём базы', () => {
    const base = new Set(files(join(source, 'base')));
    for (const preset of presentPresets) {
      // package.json пресета не копируется, а сливается с базовым (Task 1)
      const overlaps = files(presetDir(preset)).filter(
        (file) => file !== 'package.json' && base.has(file),
      );
      expect(overlaps, preset).toEqual([]);
    }
  });

  it('фрагмент package.json пресета — только dependencies', () => {
    for (const preset of presentPresets) {
      const fragment = join(presetDir(preset), 'package.json');
      if (!existsSync(fragment)) continue;
      const json = JSON.parse(readFileSync(fragment, 'utf8')) as Record<string, unknown>;
      expect(Object.keys(json), preset).toEqual(['dependencies']);
    }
  });
});
```

Run: `mkdir -p packages/create-app/template && pnpm --filter @mednet/create-app test; rmdir packages/create-app/template`

Expected: FAIL — один упавший тест, `template/ — копия templates/next при сборке > совпадает с templates/next…`: `expected [] to deeply equal [ …(n) ]`. Пустая папка `template/` изображает сборку без копирования. Тесты состава базы, непересечения и фрагментов проходят сразу: база готова (Tasks 7–13). Тесты пресетов, которых ещё нет в ветке, пропущены (`skipped`).

Проверка теста при написании плана (Vitest 5.0.4, дерево-макет с файлами из списков): 5 passed и 3 skipped (нет `template/`, `cabinet`, `dashboard`); с лишним файлом `presets/tool/tests/render.tsx` и полем `name` во фрагменте `tool` падают ровно три теста — состав `tool`, непересечение (`tool: expected [ 'tests/render.tsx' ] to deeply equal []`) и фрагмент.

- [ ] **Step 2: Копирование при сборке**

`packages/create-app/scripts/copy-template.mjs`:

```js
// templates/next → template/ пакета: шаблон вшивается в npm-пакет (спека пилота П6).
// Только исходники: без зависимостей, сборок, тарболов и отчётов тестов.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../../templates/next', import.meta.url));
const target = fileURLToPath(new URL('../template', import.meta.url));
const SKIP =
  /[\\/](node_modules|\.next|\.mednet-tarballs|dist|test-results|playwright-report)([\\/]|$)/;

if (!existsSync(source)) throw new Error(`Шаблон не найден: ${source}`);
rmSync(target, { recursive: true, force: true });
// путь проверяется относительно шаблона, чтобы папки выше (например, …/dist/…) не мешали
cpSync(source, target, {
  recursive: true,
  filter: (path) => !SKIP.test(path.slice(source.length)),
});
console.log(`template/ ← ${source}`);
```

`packages/create-app/scripts/check-dist.mjs`:

```js
// Защита публикации: без сборки в npm уедет CLI без dist/ или без шаблона.
import { existsSync, readFileSync } from 'node:fs';

const here = (file) => new URL(`../${file}`, import.meta.url);

if (!existsSync(here('dist/args.js'))) {
  console.error('@mednet/create-app: нет dist/ — выполните «pnpm build».');
  process.exit(1);
}
const { PRESETS } = await import('../dist/args.js');
const required = [
  'dist/index.js',
  'template/base/package.json',
  'template/base/_gitignore',
  'template/base/AGENTS.md',
  'template/base/Dockerfile',
  'template/ci/github/.github/workflows/ci.yml',
  'template/ci/gitlab/.gitlab-ci.yml',
  ...PRESETS.map((preset) => `template/presets/${preset}`),
];
const missing = required.filter((file) => !existsSync(here(file)));
if (missing.length > 0) {
  console.error(
    `@mednet/create-app: нельзя публиковать — нет ${missing.join(', ')}. Выполните «pnpm build».`,
  );
  process.exit(1);
}
if (!readFileSync(here('dist/index.js'), 'utf8').startsWith('#!/usr/bin/env node')) {
  console.error(
    '@mednet/create-app: dist/index.js без строки #!/usr/bin/env node — npm не запустит CLI.',
  );
  process.exit(1);
}
```

`packages/create-app/turbo.json` (facts-3 §3, дословно):

```json
{
  "$schema": "https://turbo.build/schema.json",
  "extends": ["//"],
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "!template/**", "!dist/**", "../../templates/next/**"],
      "outputs": ["dist/**", "template/**"]
    }
  }
}
```

`packages/create-app/package.json` целиком — изменены `build` и добавлен `prepublishOnly`:

```json
{
  "name": "@mednet/create-app",
  "version": "0.2.0",
  "private": true,
  "description": "Создаёт проект ЦНИИОИЗ на Next.js и @mednet/ui: npm create @mednet/app <имя>",
  "license": "MIT",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hpnssflw/mednet-kit.git",
    "directory": "packages/create-app"
  },
  "bin": {
    "create-app": "dist/index.js"
  },
  "files": [
    "dist",
    "template",
    "README.md"
  ],
  "engines": {
    "node": ">=22.12"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "node scripts/clean.mjs && tsc -p tsconfig.build.json && node scripts/copy-template.mjs",
    "prepublishOnly": "node scripts/check-dist.mjs",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@clack/prompts": "^1.8.1"
  },
  "devDependencies": {
    "@types/node": "^24",
    "typescript": "~6.0.3",
    "vitest": "^5.0.4"
  }
}
```

- [ ] **Step 3: Сборка с кэшем и тесты**

Run:

```bash
pnpm turbo run build --filter=@mednet/create-app
pnpm turbo run build --filter=@mednet/create-app
pnpm turbo run test --filter=@mednet/create-app
```

Expected:
- первая сборка: `cache miss, executing` и `template/ ← …templates\next`;
- вторая: `cache hit, replaying logs` и `FULL TURBO`;
- тесты: `Test Files  6 passed (6)`; всего 52 теста (44 из Tasks 1–3 и 8 в `template.test.ts`). Тест копии **выполнен**, а не пропущен. Если ни один пресет ещё не влит в `main` — `Tests  48 passed | 4 skipped (52)`; каждый влитый пресет переводит свой тест из `skipped` в `passed`; после Tasks 16–19 — `Tests  52 passed (52)` (это проверяют Tasks 20 и 22).

- [ ] **Step 4: Состав тарбола и защита публикации**

Run:

```bash
D="$(mktemp -d)" && (cd packages/create-app && pnpm pack --pack-destination "$D") \
  && tar -tzf "$D"/mednet-create-app-0.2.0.tgz \
  | grep -E 'package/(dist/index\.js|template/base/(_gitignore|\.gitattributes|\.dockerignore|\.nvmrc|\.prettierrc\.json|AGENTS\.md|Dockerfile|public/\.gitkeep)|template/ci/github/\.github/workflows/ci\.yml)$'
node packages/create-app/scripts/check-dist.mjs; echo "exit=$?"
```

Expected:
- `grep` печатает 10 строк: dot-файлы и `_gitignore` пережили упаковку (facts-3 §3);
- `check-dist` печатает `@mednet/create-app: нельзя публиковать — нет template/presets/landing, template/presets/tool, template/presets/cabinet, template/presets/dashboard. …` и `exit=1`.

До Tasks 16–19 так и должно быть. После пресетов эта же команда даёт `exit=0` — это проверяет Task 22.

- [ ] **Step 5: Формат и commit**

```bash
pnpm exec prettier --write packages/create-app
pnpm format:check
git add packages/create-app
git commit -m "build(create-app): embed templates/next into the package at build time, turbo inputs, publish guard"
```

---

### Task 15: Пилотный прогон `scripts/pilot.mjs`

**Files:**
- Create: `scripts/pilot.mjs`
- Modify: `scripts/lib/kit-tarballs.mjs` (`DOCKERFILE_ANCHOR`, `dockerfileForPilot`), `scripts/lib/kit-tarballs.test.mjs`, `package.json` (корень: скрипт `pilot`)

**Interfaces:**
- Consumes:
  - из Task 7 — `sh`, `packKit`, `readPacked`, `linkTarballs`, `TARBALL_DIR`;
  - из Task 11 — якорь `COPY package.json package-lock.json ./` в `Dockerfile` и `/api/health`;
  - из Task 14 — собираемый пакет CLI с `template/`;
  - из Task 13 — `AGENTS.md` с блоком Next.
- Produces:
  - `DOCKERFILE_ANCHOR = 'COPY package.json package-lock.json ./'`;
  - `dockerfileForPilot(dockerfile: string): string` — бросает `Error`, если якоря нет;
  - команда `pnpm pilot --preset <пресет> [--ci github|gitlab|none] [--port 4328] [--skip-docker] [--keep]`:
    - код 0 — пресет прошёл всё: генерацию собранным CLI, `npm install`, `check`, `build`, `test:e2e`, проверку блока Next, Docker и 200 от `/api/health`;
    - код 1 — ошибка, в конце печатаются логи контейнера;
    - временная папка и образ удаляются в любом случае.
  - Task 20 вызывает `pnpm pilot --preset ${{ matrix.preset }}` с `CI=true`.

Проверено прототипом B3 (facts-3 §5) по частям:
- генерация собранным CLI через `npm exec --package=<tgz>`;
- переключение `@mednet/*` на тарболы;
- `npm install`, `check`, `build`, e2e;
- `docker build -f Dockerfile.pilot`, ответ 200 и статус `healthy`.

Единой командой от начала до конца прогон в прототипе не шёл: мешали 12-минутные установки и ошибка `check` в прототипе-заглушке. Поэтому:
- **локально** проверяются юнит-тесты помощников и синтаксис;
- **целиком** прогон впервые идёт в CI (Task 20), когда готовы пресеты;
- в `CI` браузеры ставятся в проекте: `npx playwright install --with-deps chromium` (facts-3 §5, п. 6).

- [ ] **Step 1: Падающие тесты `dockerfileForPilot`**

В `scripts/lib/kit-tarballs.test.mjs` добавить импорт и блок тестов. Импорт заменить на:

```js
import {
  DOCKERFILE_ANCHOR,
  KIT_ROOT,
  dockerfileForPilot,
  linkTarballs,
  readPacked,
} from './kit-tarballs.mjs';
```

В конец файла:

```js
describe('dockerfileForPilot', () => {
  it('копирует тарболы кита в контекст перед npm ci — строкой перед якорем', () => {
    const dockerfile = `FROM node:24-alpine AS deps\nWORKDIR /app\n${DOCKERFILE_ANCHOR}\nRUN npm ci\n`;
    assert.equal(
      dockerfileForPilot(dockerfile),
      `FROM node:24-alpine AS deps\nWORKDIR /app\nCOPY .mednet-tarballs ./.mednet-tarballs\n${DOCKERFILE_ANCHOR}\nRUN npm ci\n`,
    );
  });

  it('без якоря — понятная ошибка', () => {
    assert.throws(
      () => dockerfileForPilot('FROM node:24-alpine\n'),
      /нет строки «COPY package\.json/,
    );
  });

  it('Dockerfile шаблона содержит якорь', () => {
    const dockerfile = readFileSync(join(KIT_ROOT, 'templates/next/base/Dockerfile'), 'utf8');
    assert.match(
      dockerfileForPilot(dockerfile),
      /COPY \.mednet-tarballs \.\/\.mednet-tarballs\nCOPY package\.json/,
    );
  });
});
```

Run: `node --test scripts/lib/kit-tarballs.test.mjs`

Expected: FAIL — `SyntaxError: The requested module './kit-tarballs.mjs' does not provide an export named 'DOCKERFILE_ANCHOR'`.

- [ ] **Step 2: Реализация**

В конец `scripts/lib/kit-tarballs.mjs` добавить:

```js
/** Строка Dockerfile шаблона, перед которой пилот копирует тарболы кита (Task 11). */
export const DOCKERFILE_ANCHOR = 'COPY package.json package-lock.json ./';

/**
 * Dockerfile пилота: тарболы кита попадают в образ до npm ci, иначе file:-зависимости из
 * package-lock.json не найдутся. Dockerfile шаблона для пользователей остаётся чистым.
 */
export function dockerfileForPilot(dockerfile) {
  if (!dockerfile.includes(DOCKERFILE_ANCHOR)) {
    throw new Error(
      `В Dockerfile нет строки «${DOCKERFILE_ANCHOR}» — не к чему привязать тарболы кита`,
    );
  }
  return dockerfile.replace(
    DOCKERFILE_ANCHOR,
    `COPY ${TARBALL_DIR} ./${TARBALL_DIR}\n${DOCKERFILE_ANCHOR}`,
  );
}
```

Run: `node --test scripts/lib/kit-tarballs.test.mjs`

Expected: `ℹ tests 5`, `ℹ pass 5`, `ℹ fail 0`.

- [ ] **Step 3: Скрипт пилота**

`scripts/pilot.mjs`:

```js
#!/usr/bin/env node
// Пилотный прогон шаблона (спека пилота §5): собранные пакеты кита → проект собранным CLI →
// check, build, e2e, блок Next в AGENTS.md, Docker-образ, 200 от /api/health.
//
//   pnpm pilot --preset landing|tool|cabinet|dashboard   (по умолчанию landing)
//              [--ci github|gitlab|none]  CI-вариант проекта (по умолчанию none)
//              [--port 4328]              порт контейнера на хосте
//              [--skip-docker]            без сборки и запуска образа
//              [--keep]                   не удалять временную папку
//
// В CI (переменная CI задана) браузеры для e2e ставятся в проекте: npx playwright install --with-deps.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import {
  TARBALL_DIR,
  dockerfileForPilot,
  linkTarballs,
  packKit,
  readPacked,
  sh,
} from './lib/kit-tarballs.mjs';

const { values: options } = parseArgs({
  options: {
    preset: { type: 'string', default: 'landing' },
    ci: { type: 'string', default: 'none' },
    port: { type: 'string', default: '4328' },
    'skip-docker': { type: 'boolean', default: false },
    keep: { type: 'boolean', default: false },
  },
});
const work = mkdtempSync(join(tmpdir(), 'mednet-pilot-'));
const tarballs = join(work, 'tarballs');
const project = join(work, 'app');
const tag = `mednet-pilot-${options.preset}-${process.pid}`;
let imageBuilt = false;
let containerStarted = false;

function cleanup() {
  if (containerStarted) spawnSync(`docker rm -f ${tag}`, { shell: true, stdio: 'ignore' });
  if (imageBuilt) spawnSync(`docker rmi -f ${tag}`, { shell: true, stdio: 'ignore' });
  if (options.keep) console.log(`\nВременная папка сохранена: ${work}`);
  else rmSync(work, { recursive: true, force: true, maxRetries: 3 });
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

async function waitForHealth(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === 200) return await response.json();
    } catch {
      // контейнер ещё стартует
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Нет ответа 200 от ${url} за ${timeoutMs / 1000} с`);
}

try {
  // 1. Сборка и упаковка кита; CLI — с вшитым шаблоном (prepublishOnly на pnpm pack не запускается)
  sh('pnpm turbo run build --filter=@mednet/ui... --filter=@mednet/create-app');
  packKit(['tokens', 'ui', 'lint-config', 'create-app'], tarballs);
  const { '@mednet/create-app': cli, ...kit } = readPacked(tarballs);
  if (!cli) throw new Error('Нет тарбола @mednet/create-app');

  // 2. Генерация собранным CLI — как у пользователя (npm create = npm exec)
  sh(
    `npm exec --yes --package="${join(tarballs, cli)}" -- create-app app --yes --no-install --no-git --preset ${options.preset} --ci ${options.ci}`,
    work,
  );

  // 3. @mednet/* проекта — из тарболов кита, а не из реестра
  mkdirSync(join(project, TARBALL_DIR));
  for (const file of Object.values(kit)) {
    cpSync(join(tarballs, file), join(project, TARBALL_DIR, file));
  }
  linkTarballs(project, kit);

  // 4. Проверки проекта
  sh('npm install --no-audit --no-fund', project);
  if (process.env.CI) sh('npx playwright install --with-deps chromium', project);
  sh('npm run check', project);
  sh('npm run build', project);
  sh('npm run test:e2e', project);
  // Блок Next в AGENTS.md совпадает с установленной версией next: иначе next dev перепишет файл
  sh(
    `node -e "process.exit(require('next/dist/server/lib/generate-agent-files.js').hasCurrentAgentRules('.') ? 0 : 1)"`,
    project,
  );

  // 5. Docker: тарболы в контексте сборки (Dockerfile.pilot), запуск, проверка здоровья
  if (!options['skip-docker']) {
    const dockerfile = readFileSync(join(project, 'Dockerfile'), 'utf8');
    writeFileSync(join(project, 'Dockerfile.pilot'), dockerfileForPilot(dockerfile));
    sh(`docker build -f Dockerfile.pilot -t ${tag} .`, project);
    imageBuilt = true;
    sh(`docker run -d --name ${tag} -p ${options.port}:3000 ${tag}`, project);
    containerStarted = true;
    const health = await waitForHealth(`http://127.0.0.1:${options.port}/api/health`);
    console.log(`/api/health: ${JSON.stringify(health)}`);
  }
  console.log(`\nПилот «${options.preset}»: OK`);
} catch (error) {
  console.error(`\nПилот «${options.preset}»: ОШИБКА — ${error.message}`);
  if (containerStarted)
    spawnSync(`docker logs --tail 40 ${tag}`, { shell: true, stdio: 'inherit' });
  process.exitCode = 1;
} finally {
  cleanup();
}
```

В корневом `package.json` в блок `scripts`, после `"sandbox": …`, добавить:

```json
    "pilot": "node scripts/pilot.mjs",
```

- [ ] **Step 4: Синтаксис и формат**

Run:

```bash
node --check scripts/pilot.mjs && echo "pilot.mjs: синтаксис ok"
node --test scripts/lib/kit-tarballs.test.mjs
pnpm exec prettier --write scripts package.json
pnpm format:check
```

Expected: `pilot.mjs: синтаксис ok`, `ℹ pass 5`, `All matched files use Prettier code style!`.

Полный прогон `pnpm pilot` до пресетов невозможен: CLI сгенерирует проект только из существующего пресета. Первый полный прогон — job CI в Task 20. Если хочется проверить вручную после Task 16 (`landing`) и есть свободное время, сделайте это на свободной машине: `pnpm pilot --preset landing --skip-docker --keep`. Понадобится около 15–20 минут и браузер Playwright 1.64.0 (`npx playwright install chromium` в сохранённой папке).

- [ ] **Step 5: Commit**

```bash
git add scripts package.json
git commit -m "feat: pilot run script — packed kit and CLI, check/build/e2e, Next agent block, Docker health"
```

---

### Task 16: Шаблон — пресет `landing`

**Files:**
- Create (всё в `templates/next/presets/landing/`): `app/page.tsx`, `tests/page.test.tsx`, `e2e/smoke.spec.ts`
- Файла `package.json` у пресета нет: дополнительных зависимостей `landing` не требует, а CLI фрагмент не обязателен (Task 1: «фрагмент `package.json` необязателен»; решение плана 2).

**Interfaces:**
- Consumes:
  - из Task 7 — песочница `node scripts/sandbox.mjs --preset landing [--sync] [--print-dir]` (папка `<tmpdir>/mednet-sandbox-landing`);
  - из Task 8 — корневой `app/layout.tsx` (`<html lang="ru">`, `Providers`, `TooltipProvider`, `Toaster`), конфиги ESLint/Vitest/TypeScript, `vitest.setup.ts` (заглушка `matchMedia`, снятие подмен после теста), алиас `@/*`;
  - из Task 10 — `playwright.config.ts` (порт `E2E_PORT`, по умолчанию 4321; `webServer` ждёт `/api/health`), `@axe-core/playwright` 4.13.0 и `@playwright/test` в базе;
  - из Task 12 — ничего: код пресета импортирует `@mednet/ui/<модуль>` напрямую, а не заглушки `components/ui/*`;
  - из `@mednet/ui` — `@mednet/ui/public-layout` (`PublicLayout` с пропсами `nav`, `actions`, `children`), `@mednet/ui/button` (`buttonVariants`), `@mednet/ui/card` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`); из `lucide-react` — иконки.
- Produces (на это опираются e2e пилота, Task 20, и Task 21):
  - маршрут `/` — `app/page.tsx`, серверный компонент без собственного JS, статическая страница (`○ /` в выводе `next build`). Пресет **добавляет** `app/page.tsx`: в базе его нет (решение плана 3), поэтому конфликта с `app/(app)/page.tsx` других пресетов нет;
  - содержимое, на которое смотрят тесты:
    - единственный `<h1>` с текстом `Название проекта`;
    - ссылки `Подробнее` → `#features` и `Начать работу` → `#contacts`;
    - секция `id="features"` с четырьмя карточками (`<h3>`), секция `id="contacts"` — полоса с призывом к действию (`<h2>` `Готовы подключиться?`);
    - `PublicLayout` даёт `<main>` и шапку/подвал ЦНИИОИЗ;
  - API-обработчиков у пресета нет: `/api/health` остаётся в базе;
  - `tests/page.test.tsx` — 1 тест; вместе с тестами базы в проекте `landing` 4 файла и 7 тестов (в базе 3 файла, 6 тестов — Task 9);
  - `e2e/smoke.spec.ts` — 1 тест с axe; вместе с `e2e/health.spec.ts` базы в проекте 3 теста (`playwright test --list` → `Total: 3 tests in 2 files`).

Проверено:
- **facts-2 Q2 «Preset `landing` — VERIFIED»**: `tsc` — 0 ошибок; ESLint — 0 ошибок и нет литеральных цветов (`@mednet/lint-config` проходит); Vitest — `1 passed`; `next build` — `○ /` статическая; e2e на Chromium 1248 с `@axe-core/playwright` 4.13.0 — `2 passed (21.3s)`: h1, переход по якорю `#features`, axe без `serious`/`critical`.
- При написании плана четыре пресета собраны поверх базы плана и прогнаны (решение плана 17): `landing` — `next typegen && tsc --noEmit`, `eslint --max-warnings=0` и `prettier --check` чистые, Vitest 7 тестов зелёные. `next build` и e2e на базе плана проверяет пилот в CI (Task 20).
- Исходники (facts-2 §7.2) взяты дословно; единственное изменение — перенос длинной строки `<p className="text-muted-foreground">…</p>` в полосе призыва (в §7.2 она длиннее 100 символов, Prettier проекта её переносит; решение плана 17, правка 1). Остальные классы Tailwind уже в порядке плагина `prettier-plugin-tailwindcss`.
- Ограничение прототипа: axe в B2 ходил на хостовом Chromium, а не в Docker-образе Playwright. Локально e2e **не запускается** (Global Constraints), в CI он идёт в образе `v1.64.0-noble` (Task 20).

Порядок работы: файл правится в `templates/next/presets/landing/`, затем `node scripts/sandbox.mjs --preset landing --sync` переносит его в песочницу. Если песочницы `mednet-sandbox-landing` ещё нет (`Песочницы … ещё нет`), один раз выполните `node scripts/sandbox.mjs --preset landing` без флагов (первая установка — 6–12 минут, Task 7). У пресета своя песочница, с песочницами других пресетов и базы она не пересекается.

- [ ] **Step 1: Падающий тест Vitest**

`templates/next/presets/landing/tests/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from '@/app/page';

describe('Главная (landing)', () => {
  it('hero, карточки возможностей и призыв к действию', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Название проекта');
    expect(screen.getByRole('link', { name: 'Начать работу' })).toHaveAttribute(
      'href',
      '#contacts',
    );
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'Готовы подключиться?' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run:

```bash
node scripts/sandbox.mjs --preset landing --sync
cd "$(node scripts/sandbox.mjs --preset landing --print-dir)" && npx vitest run tests/page.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/app/page" from "tests/page.test.tsx". Does the file exist?`

- [ ] **Step 3: Страница**

`templates/next/presets/landing/app/page.tsx`:

```tsx
import { BarChart3, FileText, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@mednet/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@mednet/ui/card';
import { PublicLayout } from '@mednet/ui/public-layout';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Показатели в одном месте',
    text: 'Ключевые данные по регионам и учреждениям обновляются каждый день.',
  },
  {
    icon: FileText,
    title: 'Отчёты без ручной работы',
    text: 'Формы отчётности собираются автоматически и выгружаются в нужном формате.',
  },
  {
    icon: Users,
    title: 'Совместная работа',
    text: 'Роли и права доступа для специалистов, руководителей и экспертов.',
  },
  {
    icon: ShieldCheck,
    title: 'Защита данных',
    text: 'Хранение и обработка данных по требованиям законодательства РФ.',
  },
];

export default function HomePage() {
  return (
    <PublicLayout
      nav={
        <>
          <Link href="#features">Возможности</Link>
          <Link href="#contacts">Контакты</Link>
        </>
      }
      actions={
        <Link href="#contacts" className={buttonVariants({ size: 'sm' })}>
          Оставить заявку
        </Link>
      }
    >
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-h1">Название проекта</h1>
          <p className="text-lead text-muted-foreground">
            Коротко о том, какую задачу решает сервис и для кого он сделан. Один-два предложения без
            канцелярита.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#contacts" className={buttonVariants({ size: 'lg' })}>
              Начать работу
            </Link>
            <Link href="#features" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Подробнее
            </Link>
          </div>
        </div>
      </section>

      <section
        id="features"
        aria-labelledby="features-title"
        className="mx-auto max-w-7xl space-y-8 px-4 pb-16 sm:px-6"
      >
        <h2 id="features-title" className="text-h2">
          Возможности
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader>
                <Icon aria-hidden className="mb-2 size-8 text-primary" />
                <CardTitle>
                  <h3>{title}</h3>
                </CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="contacts" aria-labelledby="cta-title" className="bg-muted">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 id="cta-title" className="text-h3">
              Готовы подключиться?
            </h2>
            <p className="text-muted-foreground">
              Оставьте заявку — мы свяжемся в течение рабочего дня.
            </p>
          </div>
          <a href="mailto:info@example.ru" className={buttonVariants({ size: 'lg' })}>
            Написать нам
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
```

Что в странице сделано намеренно (это же должно остаться в проекте заказчика):
- ссылки, оформленные как кнопки, — `Link` с `buttonVariants`, а не `<Button>` внутри `<a>` (правило 3 из `node_modules/@mednet/ui/llms.md`);
- заголовки идут по порядку `h1` → `h2` → `h3` (требование axe), а `CardTitle` оборачивает `<h3>`;
- цвета — только семантические классы токенов (`text-primary`, `text-muted-foreground`, `bg-muted`); `@mednet/lint-config` ловит литеральные цвета;
- иконки `aria-hidden`: они декоративные.

- [ ] **Step 4: Тест проходит**

Run: те же две команды, что в Step 2.

Expected: `Tests  1 passed (1)`.

Если запуск падает с `[vitest-pool-runner]: Timeout waiting for worker to respond` — это не ошибка теста (Global Constraints): повторите с `npx vitest run tests/page.test.tsx --maxWorkers=1 --no-file-parallelism` и отметьте повтор в отчёте.

- [ ] **Step 5: e2e-тест (не запускается локально)**

`templates/next/presets/landing/e2e/smoke.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('главная открывается и доступна', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Название проекта');
  await page.getByRole('link', { name: 'Подробнее' }).click();
  await expect(page).toHaveURL(/#features$/);

  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});
```

Playwright и сборку Next локально не запускаем: на машине автора CPU занят, а e2e идут в CI (Task 20) в образе `mcr.microsoft.com/playwright:v1.64.0-noble`. Здесь проверяется только, что тест виден раннеру и проходит `typecheck` (Step 6).

- [ ] **Step 6: Локальные проверки пресета в песочнице**

Run:

```bash
node scripts/sandbox.mjs --preset landing --sync
cd "$(node scripts/sandbox.mjs --preset landing --print-dir)" \
  && npm run check \
  && npx playwright test --list \
  && npm run format:check
```

Expected:
- `check` проходит: `lint` (замечаний нет, `--max-warnings=0`), `lint:css`, `typecheck` (`✓ Types generated successfully`, затем `tsc` с exit 0; он проверяет и `app/page.tsx`, и `e2e/smoke.spec.ts` — типы `AxeBuilder` не расходятся благодаря `playwright-core` 1.64.0 в базе), `test` — `Test Files  4 passed (4)`, `Tests  7 passed (7)`;
- `playwright test --list` — `Total: 3 tests in 2 files` (2 в `health.spec.ts`, 1 в `smoke.spec.ts`), сервер не стартует;
- `All matched files use Prettier code style!`

Если Prettier нашёл расхождения (порядок классов `prettier-plugin-tailwindcss`, перенос строк):
1. В песочнице выполните `npx prettier --write app/page.tsx tests/page.test.tsx e2e/smoke.spec.ts`.
2. Перенесите исправленные файлы обратно в `templates/next/presets/landing/<тот же путь>` (в этих трёх файлах нет подстановок `{{…}}`, копировать можно целиком).
3. Повторите этот шаг.

Состав файлов пресета сверяет тест Task 14 — запустите его из корня worktree, если он уже есть в ветке (иначе его выполнит Task 20):

```bash
test -f packages/create-app/test/template.test.ts && pnpm --filter @mednet/create-app exec vitest run test/template.test.ts
```

Expected: проходят `пресет landing — ровно эти файлы`, проверка непересечения с базой и проверка фрагмента `package.json`; тест копии пропущен (без сборки нет `template/`), тесты пресетов, которых ещё нет в ветке, тоже пропущены. Если тест нашёл лишний или недостающий файл, исправьте пресет, а не список в тесте: список — контракт задачи.

Одна проверка сборки — по желанию, когда машина свободнее (около 4 минут):

```bash
cd "$(node scripts/sandbox.mjs --preset landing --print-dir)" && npx next build
```

Expected: `✓ Compiled successfully`; в списке маршрутов `○ /` (статическая) и `ƒ /api/health`. Строки `ƒ /` быть не должно: страница не читает `cookies()` и не вызывает динамических API. Полную сборку проекта, e2e с axe, Docker и ответ `/api/health` проверяет пилот для пресета `landing` в CI (Task 20); локально их не запускаем.

- [ ] **Step 7: Commit**

```bash
git add templates/next/presets/landing
git commit -m "feat(templates): landing preset — PublicLayout hero, feature cards and CTA band with unit and axe e2e tests"
```

---

### Task 17: Пресет `tool` — реестр: `AppShell`, таблица TanStack Table v9 с поиском, диалог «Создать», мок `/api/items`

**Files:**
- Create (всё в `templates/next/presets/tool/`):
  - зависимости пресета: `package.json` (фрагмент, только `dependencies`);
  - страницы: `app/(app)/layout.tsx`, `app/(app)/page.tsx`;
  - мок API: `app/api/items/route.ts`, `lib/items.ts`;
  - компоненты: `components/items-table.tsx`, `components/create-item-dialog.tsx`;
  - тесты: `tests/page.test.tsx`, `tests/dialog.test.tsx`, `tests/items-route.test.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes:
  - из Task 7 — песочница `node scripts/sandbox.mjs --preset tool [--sync] [--print-dir]` (папка `<tmp>/mednet-sandbox-tool`);
  - из Task 8 — корневой layout (`Providers`, `TooltipProvider`, `Toaster`), Vitest-конфиг (алиас `@/*`, `jsdom`, заглушки `matchMedia` и `ResizeObserver`, снятие подмен после теста), `metadata.title.template = '%s — {{name}}'`;
  - из Task 9 — `apiGet`, `apiPost` из `@/lib/api`; `renderWithQuery`, `mockFetch` из `tests/render.tsx` (импорт `./render`);
  - из Task 10 — `@axe-core/playwright`, `@playwright/test`, `playwright.config.ts` (порт `E2E_PORT`, по умолчанию 4321);
  - из Task 12 — заглушки `components/ui/*` не нужны: пресет импортирует компоненты напрямую из `@mednet/ui/<модуль>`; `AppShell` — из `@mednet/ui/app-shell`;
  - из Task 1 — `generate()` кладёт файлы пресета поверх базы и сливает `presets/tool/package.json` в `package.json` проекта (сам фрагмент в проект не копируется).
- Produces (на это опираются Task 14 — тест «пресеты только добавляют файлы», Task 15 — пилот, Task 20 — CI):
  - **Маршруты:** `/` — страница `app/(app)/page.tsx` (динамическая: `(app)/layout` читает `cookies()`), `/api/items` — `GET` и `POST`. Файла `app/page.tsx` у пресета нет (решение плана 3).
  - **Контракт `/api/items`:** `GET` → `200`, массив `Item[]` из 12 записей; `POST` с `{ name, category }` → `201` и созданный `Item` (первым в списке, статус `draft`); пустое название или категория не из `CATEGORIES` → `422` и `{ error }`. Данные хранятся в памяти процесса.
  - **Типы** (`lib/items.ts`): `Item`, `NewItem`, `ItemStatus`, `STATUS_LABELS`, `CATEGORIES`.
  - **Что видно на странице (опора e2e):** заголовок `h1` «Документы»; поле `textbox` «Поиск по названию»; кнопка «Создать»; диалог с именем «Новый документ» (поле «Название», `combobox` «Категория» со значениями «Отчёт», «Заявка», «Справка»); текст «Записей: N»; уведомление «Документ создан».
  - **Файлы пресета:** путь каждого из них отсутствует в базе (проверяет тест Task 14). Пути `tests/page.test.tsx` и `e2e/smoke.spec.ts` фиксированы для всех пресетов (facts-2 Q6).
  - **Тесты:** Vitest — 1 + 1 + 3 = 5 новых тестов (вместе с 6 тестами базы — 11 в 6 файлах); Playwright — 1 тест, вместе с `health.spec.ts` — 3.

Проверено (facts-2 Q3, раздел 7.3, и сборка проекта при написании плана):
- **Исходники** — дословно из facts-2 §7.3 с тремя правками плана (решение 17):
  1. код отформатирован Prettier проекта (с `prettier-plugin-tailwindcss`);
  2. из `app/api/items/route.ts` убрана строка `export const dynamic = 'force-dynamic'` (GET-обработчики Next 16 и так динамические, facts-1 §2);
  3. в `tests/page.test.tsx` убран `afterEach(() => vi.unstubAllGlobals())`: подмены снимает `vitest.setup.ts` (Task 8).
- **Что добавлено сверх прототипа:** `tests/dialog.test.tsx` и `tests/items-route.test.ts`. Прототип проверял диалог и `POST` только в e2e, а e2e локально не запускается. Оба файла прогнаны при написании плана на сборке проекта плана поверх `node_modules` прототипа B2: `vitest run` — зелёный; `eslint --max-warnings=0` и `tsc --noEmit` — exit 0.
- **TanStack Table v9** (facts-2 Q3): `tableFeatures`, `createColumnHelper<typeof features, Item>()`, `useTable`, `<table.FlexRender>`. `row.getVisibleCells()` существует только при `columnVisibilityFeature` в `tableFeatures`: без неё `TS2339`.
- **Закрытие диалога в jsdom не проверяется:** выходная анимация Base UI в jsdom не завершается, диалог остаётся в DOM. Закрытие проверяет e2e (`expect(dialog).toBeHidden()`).
- `(app)/layout.tsx` — асинхронный серверный компонент с `cookies()`: в jsdom его не отрендерить. Каркас страницы (`AppShell`, навигация) и axe проверяет e2e.
- Серверное состояние мока живёт до перезапуска сервера, а повтор упавшего теста (`retries: 1` в CI) идёт на том же сервере. Поэтому e2e создаёт документ с уникальным названием `Проверочный документ <Date.now()>` и проверяет именно его: повтор после успешного `POST` первой попытки не увидит двух одинаковых строк. Остальные проверки от лишнего документа не зависят: он встаёт первым, «Отчёт о заболеваемости №1» остаётся на первой странице, поиск «обучение» по-прежнему даёт 2 записи. Это правка плана к e2e прототипа (там название постоянное).

Порядок работы: файл правится в `templates/next/presets/tool/`, затем `node scripts/sandbox.mjs --preset tool --sync` переносит его в песочницу `mednet-sandbox-tool`. Фрагмент `package.json` меняет зависимости, поэтому после его создания нужен полный запуск без `--sync` (Step 2). Локально — только Vitest, typecheck, lint, format; `next build` один раз; Playwright e2e, Docker и пилот — в CI (Task 20).

- [ ] **Step 1: Фрагмент зависимостей и падающие тесты**

`templates/next/presets/tool/package.json` (facts-2 Q6, дословно; Task 1 сольёт его с `package.json` базы, а сам он в проект не попадёт):

```json
{
  "dependencies": {
    "@tanstack/react-table": "^9.3.1"
  }
}
```

`templates/next/presets/tool/tests/page.test.tsx`:

```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/items/route';
import { ItemsTable } from '@/components/items-table';
import { mockFetch, renderWithQuery } from './render';

describe('Реестр (tool)', () => {
  it('таблица из /api/items, поиск и страницы', async () => {
    const items = await GET().json();
    mockFetch(() => items);
    const user = userEvent.setup();
    renderWithQuery(<ItemsTable />);

    expect(await screen.findByText('Отчёт о заболеваемости №1')).toBeInTheDocument();
    const body = screen.getAllByRole('rowgroup')[1]!;
    expect(within(body).getAllByRole('row')).toHaveLength(10); // первая страница
    expect(screen.getByText('Записей: 12')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Поиск по названию' }), 'обучение');
    expect(within(body).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('Записей: 2')).toBeInTheDocument();
  });
});
```

`templates/next/presets/tool/tests/dialog.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Toaster } from '@mednet/ui/toast';
import { CreateItemDialog } from '@/components/create-item-dialog';
import { mockFetch, renderWithQuery } from './render';

describe('Диалог «Создать» (tool)', () => {
  it('отправляет POST /api/items и показывает уведомление', async () => {
    const fetchMock = mockFetch((_path, init) => ({ id: 13, ...JSON.parse(String(init?.body)) }));
    const user = userEvent.setup();
    renderWithQuery(
      <>
        <CreateItemDialog />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Создать' }));
    const dialog = await screen.findByRole('dialog', { name: 'Новый документ' });
    await user.type(within(dialog).getByLabelText('Название'), 'Проверочный документ');
    await user.click(within(dialog).getByRole('button', { name: 'Создать' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Проверочный документ', category: 'Отчёт' }),
      }),
    );
    expect(await screen.findByText('Документ создан')).toBeInTheDocument();
  });
});
```

`templates/next/presets/tool/tests/items-route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '@/lib/items';

// Данные мока лежат в памяти модуля: на каждый тест берём свежий экземпляр
async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/items/route');
}

function post(body: unknown) {
  return new Request('http://localhost/api/items', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/items (мок)', () => {
  beforeEach(() => vi.resetModules());

  it('GET: 12 документов', async () => {
    const { GET } = await loadRoute();
    const items = (await GET().json()) as Item[];
    expect(items).toHaveLength(12);
    expect(items[0]).toMatchObject({ id: 1, status: 'draft' });
  });

  it('POST: 201, новый документ в начале списка со статусом «Черновик»', async () => {
    const { GET, POST } = await loadRoute();
    const response = await POST(post({ name: '  Новая справка ', category: 'Справка' }));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: 13,
      name: 'Новая справка',
      category: 'Справка',
      status: 'draft',
    });
    const items = (await GET().json()) as Item[];
    expect(items).toHaveLength(13);
    expect(items[0]!.name).toBe('Новая справка');
  });

  it('POST: 422 без названия или с неизвестной категорией', async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ name: ' ', category: 'Отчёт' }))).status).toBe(422);
    expect((await POST(post({ name: 'Документ', category: 'Прочее' }))).status).toBe(422);
  });
});
```

- [ ] **Step 2: Песочница пресета и падающий прогон**

Run:

```bash
node scripts/sandbox.mjs --preset tool
cd "$(node scripts/sandbox.mjs --preset tool --print-dir)" && npx vitest run tests/page.test.tsx tests/dialog.test.tsx tests/items-route.test.ts
```

Expected:
- первая команда — полный запуск (фрагмент добавил зависимость), заканчивается строкой `Песочница: …\mednet-sandbox-tool`; в `package.json` проекта появился `@tanstack/react-table` `^9.3.1`;
- вторая — FAIL: три файла упали с `Failed to resolve import "@/app/api/items/route"` (в `tests/dialog.test.tsx` — `"@/components/create-item-dialog"`). Базовые тесты не запускались.

- [ ] **Step 3: Типы и мок API**

`templates/next/presets/tool/lib/items.ts`:

```ts
export type ItemStatus = 'draft' | 'review' | 'done';

export interface Item {
  id: number;
  name: string;
  category: string;
  status: ItemStatus;
  createdAt: string;
}

export type NewItem = Pick<Item, 'name' | 'category'>;

export const STATUS_LABELS: Record<ItemStatus, string> = {
  draft: 'Черновик',
  review: 'На проверке',
  done: 'Готово',
};

export const CATEGORIES = ['Отчёт', 'Заявка', 'Справка'];
```

`templates/next/presets/tool/app/api/items/route.ts` (правка плана: нет строки `export const dynamic = 'force-dynamic'`):

```ts
import { CATEGORIES, type Item, type NewItem } from '@/lib/items';

// Мок: данные в памяти процесса. Замените обработчик на запрос к реальному бэкенду.
const NAMES = [
  'Отчёт о заболеваемости',
  'Заявка на оборудование',
  'Справка о кадрах',
  'Отчёт о диспансеризации',
  'Заявка на обучение',
  'Справка о коечном фонде',
];
const items: Item[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `${NAMES[i % NAMES.length]} №${i + 1}`,
  category: CATEGORIES[i % CATEGORIES.length]!,
  status: (['draft', 'review', 'done'] as const)[i % 3]!,
  createdAt: new Date(Date.UTC(2026, 8, 1 + i * 2)).toISOString(),
}));

export function GET() {
  return Response.json(items);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<NewItem>;
  const name = body.name?.trim();
  if (!name || !body.category || !CATEGORIES.includes(body.category)) {
    return Response.json({ error: 'Укажите название и категорию' }, { status: 422 });
  }
  const item: Item = {
    id: Math.max(0, ...items.map((i) => i.id)) + 1,
    name,
    category: body.category,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  return Response.json(item, { status: 201 });
}
```

- [ ] **Step 4: Таблица**

`templates/next/presets/tool/components/items-table.tsx`. `columnVisibilityFeature` обязательна: без неё нет `row.getVisibleCells()`.

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@mednet/ui/badge';
import { Button } from '@mednet/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@mednet/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mednet/ui/table';
import { apiGet } from '@/lib/api';
import { STATUS_LABELS, type Item } from '@/lib/items';
import { CreateItemDialog } from './create-item-dialog';

// TanStack Table v9: подключаем только нужные возможности (остальное не попадает в бандл)
const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
});

const columnHelper = createColumnHelper<typeof features, Item>();
const date = new Intl.DateTimeFormat('ru-RU');

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>
        Название
        <ArrowUpDown aria-hidden />
      </Button>
    ),
    filterFn: 'includesString',
    sortFn: 'alphanumeric',
  }),
  columnHelper.accessor('category', { header: 'Категория' }),
  columnHelper.accessor('status', {
    header: 'Статус',
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge
          variant={status === 'done' ? 'default' : status === 'review' ? 'secondary' : 'outline'}
        >
          {STATUS_LABELS[status]}
        </Badge>
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Создан',
    cell: ({ getValue }) => date.format(new Date(getValue())),
    sortFn: 'datetime',
  }),
]);

export function ItemsTable() {
  const {
    data = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['items'],
    queryFn: () => apiGet<Item[]>('/api/items'),
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useTable({
    features,
    data,
    columns,
    getRowId: (row) => String(row.id),
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });

  const nameColumn = table.getColumn('name');
  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="max-w-sm">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Поиск по названию"
            placeholder="Поиск по названию"
            value={(nameColumn?.getFilterValue() as string | undefined) ?? ''}
            onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
          />
        </InputGroup>
        <div className="ml-auto">
          <CreateItemDialog />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isPending
                    ? 'Загрузка…'
                    : isError
                      ? 'Не удалось загрузить данные'
                      : 'Ничего не найдено'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Записей: {table.getFilteredRowModel().rows.length}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Диалог «Создать»**

`templates/next/presets/tool/components/create-item-dialog.tsx`. Поле `Select` с `name="category"` уходит в `FormData` через скрытый input (проверено POST-телом, facts-2 Q3).

```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@mednet/ui/button';
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
import { Field, FieldGroup, FieldLabel } from '@mednet/ui/field';
import { Input } from '@mednet/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mednet/ui/select';
import { toast } from '@mednet/ui/toast';
import { apiPost } from '@/lib/api';
import { CATEGORIES, type Item, type NewItem } from '@/lib/items';

const CATEGORY_ITEMS = CATEGORIES.map((c) => ({ value: c, label: c }));

export function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (item: NewItem) => apiPost<Item>('/api/items', item),
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      setOpen(false);
      toast.add({ title: 'Документ создан', description: item.name, type: 'success' });
    },
    onError: () => toast.add({ title: 'Не удалось создать документ', type: 'error' }),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      name: String(form.get('name') ?? ''),
      category: String(form.get('category') ?? ''),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus aria-hidden />
        Создать
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>Новый документ</DialogTitle>
            <DialogDescription>
              Документ появится в реестре со статусом «Черновик».
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="item-name">Название</FieldLabel>
              <Input id="item-name" name="name" required minLength={3} autoComplete="off" />
            </Field>
            <Field>
              <FieldLabel htmlFor="item-category">Категория</FieldLabel>
              <Select name="category" items={CATEGORY_ITEMS} defaultValue={CATEGORIES[0]}>
                <SelectTrigger id="item-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" disabled={create.isPending}>
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Каркас и страница (`AppShell`)**

`templates/next/presets/tool/app/(app)/layout.tsx`. Группа маршрутов `(app)` не меняет адрес: страница отвечает на `/`. Читает `cookies()` (состояние сайдбара), поэтому `/` динамический.

```tsx
import { ListChecks, Settings } from 'lucide-react';
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
      title="Реестр документов"
      nav={
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />} tooltip="Документы" isActive>
                <ListChecks />
                <span>Документы</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />} tooltip="Настройки">
                <Settings />
                <span>Настройки</span>
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

`templates/next/presets/tool/app/(app)/page.tsx`:

```tsx
import { ItemsTable } from '@/components/items-table';

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h2">Документы</h1>
      <ItemsTable />
    </div>
  );
}
```

- [ ] **Step 7: Тесты проходят**

Run:

```bash
node scripts/sandbox.mjs --preset tool --sync
cd "$(node scripts/sandbox.mjs --preset tool --print-dir)" && npx vitest run tests/page.test.tsx tests/dialog.test.tsx tests/items-route.test.ts
```

Expected: `Test Files  3 passed (3)`, `Tests  5 passed (5)`. Если запуск под нагрузкой упал с `[vitest-pool-runner]: Timeout waiting for worker to respond` — это не ошибка теста (Global Constraints): повторите с `--maxWorkers=1 --no-file-parallelism` и отметьте повтор в отчёте.

- [ ] **Step 8: E2E-тест (в CI)**

`templates/next/presets/tool/e2e/smoke.spec.ts`. Прогон — только в пилоте (Task 20); локально проверяются типы и список тестов. Прототип прошёл этот тест: `2 passed (44.0s)`, axe — 0 serious/critical, `POST /api/items` → 201.

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('реестр: поиск, создание документа, уведомление', async ({ page }) => {
  // Мок хранит документы в памяти сервера, а повтор теста в CI (retries: 1) идёт на том же
  // сервере: название уникально для каждой попытки
  const title = `Проверочный документ ${Date.now()}`;
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Документы');
  await expect(
    page.getByRole('cell', { name: 'Отчёт о заболеваемости №1', exact: true }),
  ).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);

  await page.getByRole('textbox', { name: 'Поиск по названию' }).fill('обучение');
  await expect(page.getByText('Записей: 2')).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск по названию' }).fill('');

  await page.getByRole('button', { name: 'Создать' }).click();
  const dialog = page.getByRole('dialog', { name: 'Новый документ' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Название').fill(title);
  await dialog.getByRole('combobox', { name: 'Категория' }).click();
  await page.getByRole('option', { name: 'Заявка' }).click();
  const created = page.waitForResponse(
    (r) => r.url().endsWith('/api/items') && r.request().method() === 'POST',
  );
  await dialog.getByRole('button', { name: 'Создать' }).click();
  const res = await created;
  expect(res.status()).toBe(201);
  expect(await res.json()).toMatchObject({ name: title, category: 'Заявка' });

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Документ создан')).toBeVisible();
  await expect(page.getByRole('cell', { name: title, exact: true })).toBeVisible();
});
```

- [ ] **Step 9: Локальные проверки пресета**

Run:

```bash
node scripts/sandbox.mjs --preset tool --sync
cd "$(node scripts/sandbox.mjs --preset tool --print-dir)" \
  && npm run check \
  && npx playwright test --list \
  && npm ls @tanstack/react-table playwright-core \
  && npm run format:check
```

Expected:
- `check` проходит: `lint` без замечаний (`--max-warnings=0`), `lint:css`, `typecheck` (`next typegen && tsc --noEmit`, exit 0), `test` — `Test Files  6 passed (6)`, `Tests  11 passed (11)` (6 тестов базы + 5 пресета);
- `playwright test --list` — `Total: 3 tests in 2 files` (`health.spec.ts` — 2, `smoke.spec.ts` — 1), сервер не запускается;
- `npm ls` — `@tanstack/react-table@9.x` и одна копия `playwright-core@1.64.0`;
- `All matched files use Prettier code style!` Если Prettier нашёл расхождения: `npx prettier --write <файл>` в песочнице и перенос файла обратно в `templates/next/presets/tool/<тот же путь>` (подстановок в файлах пресета нет, копировать можно целиком).

Состав файлов пресета сверяет тест Task 14 — запустите его из корня worktree, если он уже есть в ветке (иначе его выполнит Task 20):

```bash
test -f packages/create-app/test/template.test.ts && pnpm --filter @mednet/create-app exec vitest run test/template.test.ts
```

Expected: проходят `пресет tool — ровно эти файлы`, проверка непересечения с базой и проверка фрагмента `package.json`; тест копии пропущен (без сборки нет `template/`), тесты пресетов, которых ещё нет в ветке, тоже пропущены. Если тест нашёл лишний или недостающий файл, исправьте пресет, а не список в тесте: список — контракт задачи.

Один раз, перед коммитом (около 1–5 минут на нагруженной машине; факты прототипа — `next build` OK, маршруты `ƒ /`, `ƒ /api/health`, `ƒ /api/items`):

```bash
cd "$(node scripts/sandbox.mjs --preset tool --print-dir)" && npx next build
```

Expected: `✓ Compiled successfully`; в списке маршрутов `ƒ /`, `ƒ /api/health`, `ƒ /api/items`.
- `ƒ /` — страница динамическая из-за `cookies()` в `(app)/layout`; `○ /` означало бы, что layout не читает куки.
- **`ƒ /api/items` обязательно.** GET-обработчик без динамических API в Next 16 и так `ƒ`, без `export const dynamic` (facts-1 §2: в B1 `/api/items` без этой строки — `ƒ /api/items`; `cacheComponents` в шаблоне выключен, facts-1 §0). Если в выводе `○ /api/items`, GET пререндерился при сборке и отдаёт снимок данных: документы, созданные через `POST`, после обновления списка не появятся, и e2e пилота упадёт. Тогда добавьте первой строкой `app/api/items/route.ts` строку `export const dynamic = 'force-dynamic';` (без `cacheComponents` она допустима, facts-1 §2), пересоберите, убедитесь, что стало `ƒ /api/items`, и отметьте это в отчёте.

Не запускать локально: Playwright e2e, Docker-сборку и пилот — они идут в CI (Task 20, `pnpm pilot --preset tool`).

- [ ] **Step 10: Commit**

```bash
git add templates/next/presets/tool
git commit -m "feat(templates): tool preset — AppShell registry, TanStack Table v9 with search, create dialog with toast, items mock route"
```

---

### Task 18: Пресет `cabinet` — анкета профиля на react-hook-form и zod

**Files:**
- Create (всё в `templates/next/presets/cabinet/`):
  - `package.json` (фрагмент: только `dependencies`);
  - `lib/profile.ts`, `app/api/profile/route.ts`;
  - `app/(app)/layout.tsx`, `app/(app)/page.tsx`;
  - `components/profile-form.tsx`;
  - `tests/page.test.tsx`, `e2e/smoke.spec.ts`

Ни один путь не совпадает с путями базы (правило «пресеты только добавляют», тест Task 14): в базе нет `app/page.tsx`, `lib/profile.ts` и `components/profile-form.tsx`.

**Interfaces:**
- Consumes:
  - из Task 7 — `node scripts/sandbox.mjs --preset cabinet [--sync] [--print-dir]`; песочница `mednet-sandbox-cabinet`; слияние фрагмента `package.json` с базовым делает `generate()` (Task 1);
  - из Task 8 — корневой layout (`Providers`, `Toaster`, `TooltipProvider`) и Vitest (алиас `@/*`, снятие `vi.stubGlobal` после каждого теста, заглушки `matchMedia` и `ResizeObserver`);
  - из Task 9 — `apiGet<T>` и `apiPut<T>` из `@/lib/api`, помощники `renderWithQuery` и `mockFetch` из `tests/render.tsx` (импорт `./render`);
  - из Task 10 — `@axe-core/playwright`, `@playwright/test` и `playwright-core` в базе; `webServer` на `E2E_PORT` (по умолчанию 4321);
  - из `@mednet/ui` — подпути `app-shell`, `sidebar`, `button`, `card`, `checkbox`, `field`, `input`, `select`, `skeleton`, `toast` (по одному на компонент);
  - из `@mednet/ui/styles.css` — классы `text-h2` и `text-muted-foreground`.
- Produces (на это опираются Task 20 и e2e):
  - маршрут `/` — страница «Профиль» в `AppShell` с заголовком «Личный кабинет». `/` динамический: `(app)/layout` читает `cookies()`;
  - `GET /api/profile` — профиль из памяти процесса; `PUT /api/profile` — 200 с сохранённым профилем или 422 с `{ errors }` при неверных данных;
  - `lib/profile.ts`: `profileSchema`, `Profile`, `REGIONS` — общие для сервера и клиента;
  - доступные имена для e2e: `h1` «Профиль»; поля «ФИО», «Эл. почта»; combobox «Регион»; чекбокс «Согласен на обработку персональных данных»; кнопка «Сохранить»; тост «Профиль сохранён»;
  - `e2e/smoke.spec.ts` — один тест с axe (0 нарушений уровня serious и critical на странице с показанными ошибками). Его запускает пилот в CI вместе с `e2e/health.spec.ts` базы: всего 3 e2e-теста;
  - Vitest: `tests/page.test.tsx` — 2 теста; вместе с базой `Test Files  4 passed (4)`, `Tests  8 passed (8)`.

Проверено (facts-2, Q4 и §7.4; сводка плана, решение 17):
- Версии zod 4.6.7, react-hook-form 7.90.0 и `@hookform/resolvers` 5.9.1 совместимы: `zodResolver(profileSchema)` проходит `tsc` без приведений типов.
- `consent: z.boolean().refine(...)`, а не `z.literal(true)`: с `literal(true)` тип входа становится `true`, и `defaultValues: { consent: false }` не компилируется (`TS2322`).
- Чекбокс Base UI кладёт `id` на скрытый `<input aria-hidden>`, поэтому `getByLabel` находит два элемента. Чекбокс ищется только через `getByRole('checkbox', { name })` — и в Testing Library, и в Playwright.
- `Select` Base UI принимает `items=[{ value: null, label }, …]` и `<SelectValue />`; `aria-invalid` ставится на `SelectTrigger`. Компонент `form` не нужен.
- Прогон B2: e2e `2 passed` (axe 0 serious/critical, `PUT /api/profile` → 200, значение переживает перезагрузку), `next build` прошла.
- Сводка плана: на базе плана `next typegen && tsc --noEmit`, `eslint --max-warnings=0` и `prettier --check` — exit 0, Vitest у `cabinet` — 8 тестов, зелёные. `next build` и e2e на базе плана проверяет пилот в CI (Task 20).

Отличия от facts-2 §7.4 (из решения плана 17):
1. Код отформатирован Prettier проекта (`prettier-plugin-tailwindcss`): другие переносы строк, поведение то же.
2. В `app/api/profile/route.ts` нет `export const dynamic = 'force-dynamic'`: GET-обработчики Next 16 и так динамические, а вместе с `cacheComponents` эта строка — ошибка (facts-1 §2).
3. Помощники и `apiGet`/`apiPut` — из базы плана (Task 9), а не из базы B2. Пути и сигнатуры те же.

Локально e2e и Docker **не запускаются** (Global Constraints): `playwright test`, сборку образа и axe выполняет пилот в CI (Task 20). Локально — юнит-тесты, typecheck, lint, формат и одна `next build`.

Порядок работы: файлы правятся в `templates/next/presets/cabinet/`, затем `node scripts/sandbox.mjs --preset cabinet --sync` переносит их в песочницу. Фрагмент `package.json` пресета в проект не копируется, а сливается с базовым, поэтому его изменение требует полного запуска (без `--sync`).

- [ ] **Step 1: Фрагмент `package.json` и песочница пресета**

`templates/next/presets/cabinet/package.json` — фрагмент (facts-2 §6 и §7.4 дословно; только `dependencies`, версии — Global Constraints). Task 1 сольёт его с `package.json` базы, а сам он в проект не попадёт:

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.9.1",
    "react-hook-form": "^7.90.0",
    "zod": "^4.6.7"
  }
}
```

Run: `node scripts/sandbox.mjs --preset cabinet`

Expected:
- полная сборка и установка заканчиваются строкой `Песочница: C:\Users\…\Temp\mednet-sandbox-cabinet`;
- первая установка может занять 6–12 минут (сеть), повторная с кэшем npm — около 25 секунд.

Run: `cd "$(node scripts/sandbox.mjs --preset cabinet --print-dir)" && npm ls zod react-hook-form @hookform/resolvers`

Expected: по одной копии `zod@4.6.x`, `react-hook-form@7.90.x`, `@hookform/resolvers@5.9.x`.

- [ ] **Step 2: Падающий тест страницы**

`templates/next/presets/cabinet/tests/page.test.tsx` (facts-2 §7.4; сервер не нужен, `fetch` подменён). Как в `tool`, убран `afterEach(() => vi.unstubAllGlobals())` прототипа: подмены после каждого теста снимает `vitest.setup.ts` (Task 8):

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileForm } from '@/components/profile-form';
import { mockFetch, renderWithQuery } from './render';

const PROFILE = {
  fullName: 'Иванова Мария Петровна',
  email: 'ivanova@example.ru',
  region: 'msk',
  notifications: true,
};

describe('Профиль (cabinet)', () => {
  it('неверные данные — ошибки по-русски, запрос не уходит', async () => {
    const fetch = mockFetch(() => PROFILE);
    const user = userEvent.setup();
    renderWithQuery(<ProfileForm />);

    const email = await screen.findByLabelText('Эл. почта');
    await user.clear(email);
    await user.type(email, 'не-почта');
    await user.clear(screen.getByLabelText('ФИО'));
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText('Укажите фамилию, имя и отчество')).toBeInTheDocument();
    expect(
      screen.getByText('Введите адрес эл. почты в формате name@example.ru'),
    ).toBeInTheDocument();
    expect(screen.getByText('Нужно согласие на обработку персональных данных')).toBeInTheDocument();
    expect(screen.getByLabelText('ФИО')).toHaveAttribute('aria-invalid', 'true');
    expect(fetch).toHaveBeenCalledTimes(1); // только загрузка профиля
  });

  it('верные данные — PUT /api/profile', async () => {
    const fetch = mockFetch((_path, init) =>
      init?.body ? JSON.parse(String(init.body)) : PROFILE,
    );
    const user = userEvent.setup();
    renderWithQuery(<ProfileForm />);

    await user.click(
      await screen.findByRole('checkbox', { name: 'Согласен на обработку персональных данных' }),
    );
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const [path, init] = fetch.mock.calls[1]!;
    expect(path).toBe('/api/profile');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toMatchObject({ ...PROFILE, consent: true });
  });
});
```

Что проверяют тесты:
- Первый: пустое ФИО, неверная почта и нет согласия — три русских сообщения на экране, у поля ФИО `aria-invalid="true"`, а `fetch` вызван один раз (только загрузка профиля, `PUT` не ушёл).
- Второй: после отметки согласия `PUT /api/profile` уходит с телом `{ …профиль, consent: true }`.

- [ ] **Step 3: Убедиться, что тест падает**

Run:

```bash
node scripts/sandbox.mjs --preset cabinet --sync
cd "$(node scripts/sandbox.mjs --preset cabinet --print-dir)" && npx vitest run tests/page.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/components/profile-form" from "tests/page.test.tsx". Does the file exist?`

- [ ] **Step 4: Реализация**

Схема и константы — `templates/next/presets/cabinet/lib/profile.ts`. `z.config(z.locales.ru())` задаёт русские сообщения zod по умолчанию, а явные `{ error: '…' }` на каждом правиле важнее их:

```ts
import { z } from 'zod';

// Сообщения zod по умолчанию — по-русски (свои тексты ниже важнее)
z.config(z.locales.ru());

export const REGIONS = [
  { value: 'msk', label: 'Москва' },
  { value: 'spb', label: 'Санкт-Петербург' },
  { value: 'nsk', label: 'Новосибирская область' },
  { value: 'svr', label: 'Свердловская область' },
];

export const profileSchema = z.object({
  fullName: z.string().trim().min(5, { error: 'Укажите фамилию, имя и отчество' }),
  email: z.email({ error: 'Введите адрес эл. почты в формате name@example.ru' }),
  region: z.string({ error: 'Выберите регион' }).min(1, { error: 'Выберите регион' }),
  notifications: z.boolean(),
  consent: z
    .boolean()
    .refine((v) => v, { error: 'Нужно согласие на обработку персональных данных' }),
});

export type Profile = z.infer<typeof profileSchema>;
```

Мок API — `templates/next/presets/cabinet/app/api/profile/route.ts`. Данные лежат в памяти процесса. Сервер проверяет ту же схему, что и клиент, и при ошибке отвечает 422 с ошибками по полям. Согласие (`consent`) в профиле не хранится: его подтверждают при каждой отправке.

```ts
import { z } from 'zod';
import { profileSchema, type Profile } from '@/lib/profile';

// Мок: профиль в памяти процесса. Замените обработчик на запрос к реальному бэкенду.
let profile: Omit<Profile, 'consent'> = {
  fullName: 'Иванова Мария Петровна',
  email: 'ivanova@example.ru',
  region: 'msk',
  notifications: true,
};

export function GET() {
  return Response.json(profile);
}

export async function PUT(request: Request) {
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ errors: z.flattenError(parsed.error).fieldErrors }, { status: 422 });
  }
  const { fullName, email, region, notifications } = parsed.data;
  profile = { fullName, email, region, notifications };
  return Response.json(profile);
}
```

Форма — `templates/next/presets/cabinet/components/profile-form.tsx`. Это вариант shadcn «Forms → React Hook Form» для base-maia: `Controller` с `Field`, `FieldLabel` и `FieldError`. `Input` получает `{...field}`, `Select` и `Checkbox` управляются через `value`/`onValueChange` и `checked`/`onCheckedChange`. Профиль грузит `useQuery`, поэтому форма с `defaultValues` монтируется уже после загрузки (`ProfileFormFields`); сохранение — `useMutation` с тостом.

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@mednet/ui/button';
import { Card, CardContent, CardFooter } from '@mednet/ui/card';
import { Checkbox } from '@mednet/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@mednet/ui/field';
import { Input } from '@mednet/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mednet/ui/select';
import { Skeleton } from '@mednet/ui/skeleton';
import { toast } from '@mednet/ui/toast';
import { apiGet, apiPut } from '@/lib/api';
import { profileSchema, REGIONS, type Profile } from '@/lib/profile';

type ProfileData = Omit<Profile, 'consent'>;

const REGION_ITEMS = [{ value: null, label: 'Выберите регион' }, ...REGIONS];

export function ProfileForm() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<ProfileData>('/api/profile'),
  });
  if (isPending) return <Skeleton className="h-96 w-full max-w-2xl" />;
  if (isError) return <p className="text-destructive">Не удалось загрузить профиль.</p>;
  return <ProfileFormFields defaults={data} />;
}

function ProfileFormFields({ defaults }: { defaults: ProfileData }) {
  const queryClient = useQueryClient();
  const form = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: { ...defaults, consent: false },
  });
  const save = useMutation({
    mutationFn: (values: Profile) => apiPut<ProfileData>('/api/profile', values),
    onSuccess: (saved) => {
      queryClient.setQueryData(['profile'], saved);
      toast.add({ title: 'Профиль сохранён', type: 'success' });
    },
    onError: () => toast.add({ title: 'Не удалось сохранить профиль', type: 'error' }),
  });

  return (
    <Card className="max-w-2xl">
      <form
        id="profile-form"
        noValidate
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        <CardContent>
          <FieldGroup>
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-fullName">ФИО</FieldLabel>
                  <Input
                    {...field}
                    id="profile-fullName"
                    autoComplete="name"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-email">Эл. почта</FieldLabel>
                  <Input
                    {...field}
                    id="profile-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="region"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-region">Регион</FieldLabel>
                  <Select
                    name={field.name}
                    items={REGION_ITEMS}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? '')}
                  >
                    <SelectTrigger
                      id="profile-region"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      onBlur={field.onBlur}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_ITEMS.map((item) => (
                        <SelectItem key={item.label} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="notifications"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="profile-notifications"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="profile-notifications" className="font-normal">
                    Получать уведомления на почту
                  </FieldLabel>
                </Field>
              )}
            />
            <Controller
              name="consent"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                  <Checkbox
                    id="profile-consent"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  <div className="grid gap-1">
                    <FieldLabel htmlFor="profile-consent" className="font-normal">
                      Согласен на обработку персональных данных
                    </FieldLabel>
                    <FieldDescription>По 152-ФЗ «О персональных данных».</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 gap-3">
          <Button type="submit" disabled={save.isPending}>
            Сохранить
          </Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Отменить
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

Страница — `templates/next/presets/cabinet/app/(app)/page.tsx`:

```tsx
import { ProfileForm } from '@/components/profile-form';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h2">Профиль</h1>
        <p className="text-muted-foreground">Данные для связи и рассылок.</p>
      </div>
      <ProfileForm />
    </div>
  );
}
```

Каркас — `templates/next/presets/cabinet/app/(app)/layout.tsx`. `defaultOpen` читается из cookie `sidebar_state`, которую пишет `Sidebar` кита; из-за `cookies()` страница `/` динамическая. Обе ссылки навигации ведут на `/`: другие разделы кабинета проект добавит сам.

```tsx
import { Bell, UserRound } from 'lucide-react';
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
      title="Личный кабинет"
      nav={
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />} tooltip="Профиль" isActive>
                <UserRound />
                <span>Профиль</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />} tooltip="Уведомления">
                <Bell />
                <span>Уведомления</span>
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

- [ ] **Step 5: Тест проходит**

Run: те же две команды, что в Step 3.

Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`.

Если запуск падает с `[vitest-pool-runner]: Timeout waiting for worker to respond`, это нагрузка машины, а не тест (Global Constraints). Повторите с `--maxWorkers=1 --no-file-parallelism` и отметьте повтор в отчёте.

- [ ] **Step 6: e2e-тест (локально не запускается)**

`templates/next/presets/cabinet/e2e/smoke.spec.ts` (facts-2 §7.4; Prettier проекта перенёс одну длинную строку). Правка плана: в прототипе тест сравнивал начальное ФИО с данными мока и сохранял постоянное «Петров Пётр Петрович». Мок хранит профиль в памяти сервера, а повтор упавшего теста (`retries: 1` в CI) идёт на том же сервере: после успешного `PUT` первой попытки повтор упал бы на первой же проверке. Поэтому тест проверяет только, что ФИО загрузилось, и сохраняет уникальное ФИО:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('профиль: ошибки валидации, затем сохранение', async ({ page }) => {
  // Мок хранит профиль в памяти сервера, а повтор теста в CI (retries: 1) идёт на том же
  // сервере: начальное ФИО может быть уже изменено первой попыткой, новое — уникально
  const newName = `Петров Пётр ${Date.now()}`;
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Профиль');
  const fullName = page.getByLabel('ФИО');
  await expect(fullName).not.toHaveValue('');

  await fullName.fill('');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByText('Укажите фамилию, имя и отчество')).toBeVisible();
  await expect(page.getByText('Нужно согласие на обработку персональных данных')).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);

  await fullName.fill(newName);
  await page.getByRole('combobox', { name: 'Регион' }).click();
  await page.getByRole('option', { name: 'Санкт-Петербург' }).click();
  await page.getByRole('checkbox', { name: 'Согласен на обработку персональных данных' }).click();
  const saved = page.waitForResponse(
    (r) => r.url().endsWith('/api/profile') && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Сохранить' }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByText('Профиль сохранён')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('ФИО')).toHaveValue(newName);
});
```

Тест идёт по реальному маршруту:
1. Ошибки валидации и axe на странице с ошибками.
2. Заполнение, выбор региона через Base UI (`combobox` → `option`).
3. `PUT /api/profile` → 200, тост.
4. Перезагрузка: значение сохранилось (мок хранит его в памяти процесса).

Прогон — в CI (Task 20). Здесь только листинг, без браузера и без сервера.

Run:

```bash
node scripts/sandbox.mjs --preset cabinet --sync
cd "$(node scripts/sandbox.mjs --preset cabinet --print-dir)" && npx playwright test --list
```

Expected: `health.spec.ts` (2 теста) и `smoke.spec.ts` (1 тест), `Total: 3 tests in 2 files`; сервер не запускается.

- [ ] **Step 7: Проверки пресета в песочнице**

Run:

```bash
cd "$(node scripts/sandbox.mjs --preset cabinet --print-dir)" \
  && npm run check \
  && npm run format:check
```

Expected:
- `lint` — exit 0 без замечаний (`--max-warnings=0`); литеральных цветов в пресете нет, `@mednet/lint-config` проходит;
- `lint:css` — exit 0;
- `typecheck` — `✓ Types generated successfully`, затем `tsc` с exit 0. Он проверяет форму, мок и `e2e/smoke.spec.ts`, в том числе `new AxeBuilder({ page })` (одна копия `playwright-core`);
- `test` — `Test Files  4 passed (4)`, `Tests  8 passed (8)`;
- `All matched files use Prettier code style!`

Если Prettier нашёл расхождения: `npx prettier --write <файл>` в песочнице, затем перенесите исправленный файл в `templates/next/presets/cabinet/<тот же путь>`. Подстановок в файлах пресета нет, копировать можно целиком.

Состав файлов пресета сверяет тест Task 14 — запустите его из корня worktree, если он уже есть в ветке (иначе его выполнит Task 20):

```bash
test -f packages/create-app/test/template.test.ts && pnpm --filter @mednet/create-app exec vitest run test/template.test.ts
```

Expected: проходят `пресет cabinet — ровно эти файлы`, проверка непересечения с базой и проверка фрагмента `package.json`; тест копии пропущен (без сборки нет `template/`), тесты пресетов, которых ещё нет в ветке, тоже пропущены. Если тест нашёл лишний или недостающий файл, исправьте пресет, а не список в тесте: список — контракт задачи.

Затем одна сборка (в Task 8 она тоже одна; под нагрузкой около 5 минут, facts-2 Q4):

Run: `cd "$(node scripts/sandbox.mjs --preset cabinet --print-dir)" && npx next build`

Expected:
- `✓ Compiled successfully`;
- маршруты `ƒ /`, `ƒ /api/health`, `ƒ /api/profile` (и `○ /_not-found`);
- если `/` показан как `○` (статический), значит `(app)/layout` потерял вызов `cookies()`;
- `ƒ /api/profile` обязательно, как `ƒ /api/items` в Task 17: при `○ /api/profile` GET отдаёт снимок со сборки, и сохранённый через `PUT` профиль после перезагрузки не виден (e2e пилота упадёт). Исправление то же: первой строкой `app/api/profile/route.ts` — `export const dynamic = 'force-dynamic';`, пересборка, отметка в отчёте.

e2e с axe и Docker-образ для `--preset cabinet` проверяет пилот в CI (Task 20); локально их не запускайте.

- [ ] **Step 8: Commit**

```bash
git add templates/next/presets/cabinet
git commit -m "feat(templates): cabinet preset — profile form (react-hook-form + zod), mock /api/profile, vitest and e2e"
```

---

### Task 19: Пресет `dashboard` — KPI и графики `chart-1…8`, мок `/api/stats`

**Files:**
- Create (всё в `templates/next/presets/dashboard/`):
  - `package.json` (фрагмент: только `dependencies`);
  - `app/(app)/layout.tsx`, `app/(app)/page.tsx`;
  - `app/api/stats/route.ts`, `lib/stats.ts`;
  - `components/dashboard.tsx`;
  - `tests/page.test.tsx`, `e2e/smoke.spec.ts`

Другие файлы не трогаем: пресет только добавляет файлы, ни один его путь не совпадает с путём базы (Task 14 проверяет это тестом).

**Interfaces:**
- Consumes:
  - из Task 7 — песочница `node scripts/sandbox.mjs --preset dashboard [--sync] [--print-dir]` (каталог `mednet-sandbox-dashboard`) и скрипты `package.json` базы (`check`, `format:check`);
  - из Task 8 — корневой `RootLayout` (`Providers` с `QueryClient`, `TooltipProvider`, `Toaster`), заглушка `ResizeObserver` в `vitest.setup.ts` (нужна `recharts` в jsdom), алиас `@/*`, снятие `vi.stubGlobal` после каждого теста;
  - из Task 9 — `apiGet` из `@/lib/api`; `renderWithQuery` и `mockFetch` из `tests/render.tsx` (импорт `./render`);
  - из Task 10 — `@axe-core/playwright`, `@playwright/test`, `playwright-core` в devDependencies базы; `playwright.config.ts` (порт `E2E_PORT`, по умолчанию 4321), `/api/health` как проба готовности сервера;
  - из `@mednet/ui` — `@mednet/ui/app-shell` (`AppShell`: пропсы `nav`, `title`, `defaultOpen`), `@mednet/ui/sidebar`, `@mednet/ui/card`, `@mednet/ui/badge`, `@mednet/ui/skeleton`, `@mednet/ui/chart` (`ChartContainer`, `ChartConfig`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`);
  - палитра `--chart-1…8` из `@mednet/tokens` (подключена через `@mednet/ui/styles.css`); `recharts` — peer-зависимость `@mednet/ui` (`^3.8.0`).
- Produces (на это опираются Task 15, Task 20 и e2e пилота):
  - **Маршрут `/`** — страница дашборда внутри группы `(app)`. Корневой `/` в других местах не определён (в базе нет `app/page.tsx`). Он динамический: `(app)/layout` читает `cookies()`.
  - **API `GET /api/stats`** → `Stats` (`lib/stats.ts`): `kpis` (4 карточки), `monthly` (6 месяцев: `visits`, `appointments`), `waitTrend` (6 недель: `waitDays`).
  - **Для e2e Task 15/20**: `h1` «Дашборд»; текст «Посещения за месяц»; классы recharts `.recharts-bar-rectangle` (ровно 12 = 6 месяцев × 2 серии) и `.recharts-line-curve`; `fill` первого столбца = `var(--color-visits)`. Графики появляются только после гидратации (клиентский `useQuery` и рисование `recharts` в браузере), поэтому тест сначала ждёт `.recharts-bar-rectangle`, потом считает.
  - **Заголовки для Vitest**: `h2` «Посещения и записи» и «Срок ожидания приёма».
  - **Фрагмент `package.json`**: только `"recharts": "^3.8.0"`. Он нужен явно: на peer, который npm поставил сам, нельзя опираться в собственных импортах (facts-1 §2). Один экземпляр `recharts` на `ChartContainer` и на приложение.

Проверено (facts-2 Q5, §7.5; при написании плана — на базе плана):
- **Прототип B2**: `tsc` 0 ошибок, `eslint` 0 ошибок, Vitest — зелёный, `next build` — `ƒ /`, `ƒ /api/health`, `ƒ /api/stats`; e2e на Chromium хоста: `2 passed`, 12 столбцов, линия, `fill="var(--color-visits)"`, axe — 0 serious/critical. В Docker-образе Playwright e2e не гонялся: это проверит пилот (Task 20).
- **База плана** (при написании плана): пресет собран поверх неё, общий `node_modules` прототипа B2 без записи в него. `next typegen && tsc --noEmit` — exit 0; `eslint --max-warnings=0` — exit 0; Vitest — 7 тестов (6 базовых + 1 пресета), зелёные; `prettier --check` — чисто. `next build` и e2e на базе плана проверяет пилот.
- **Палитра**: `--chart-1…8` — это `--mn-blue-500, red-500, green-500, orange-500, violet-500, yellow-500, peach-500, beige-500`; в конфигах графиков стоят `var(--chart-N)`, а не литеральные цвета, поэтому `@mednet/lint-config` их пропускает.

Отличия от facts-2 §7.5 (только форматирование Prettier проекта, решение плана 17): импорт `@mednet/ui/sidebar` в `layout.tsx` в одну строку, `<section …>` в `dashboard.tsx` разбит на строки. Смысл кода тот же.

Локально e2e **не запускается** (Global Constraints): ни Playwright, ни Docker. Здесь — `playwright test --list`, `typecheck` и Vitest. Прогон e2e с axe и сборку образа делает пилот в CI (Task 20).

- [ ] **Step 1: Фрагмент зависимостей и падающий тест**

`templates/next/presets/dashboard/package.json`:

```json
{
  "dependencies": {
    "recharts": "^3.8.0"
  }
}
```

`templates/next/presets/dashboard/tests/page.test.tsx`. Тест берёт данные у самого обработчика `GET`, поэтому проверяет и мок, и компонент. Строка `12 840`: `Intl.NumberFormat('ru-RU')` ставит неразрывный пробел, а Testing Library сжимает любые пробельные символы до обычного пробела. Как в `tool`, убран `afterEach(() => vi.unstubAllGlobals())` прототипа: подмены снимает `vitest.setup.ts` (Task 8):

```tsx
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/stats/route';
import { Dashboard } from '@/components/dashboard';
import { mockFetch, renderWithQuery } from './render';

describe('Дашборд (dashboard)', () => {
  it('KPI-карточки и заголовки графиков из /api/stats', async () => {
    const stats = await GET().json();
    mockFetch(() => stats);
    renderWithQuery(<Dashboard />);

    expect(await screen.findByText('Посещения за месяц')).toBeInTheDocument();
    expect(screen.getByText('12 840')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Посещения и записи' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Срок ожидания приёма' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Фрагмент меняет зависимости, поэтому нужна полная пересборка песочницы пресета (около 25 секунд с тёплым кэшем npm, 6–12 минут при первом запуске на машине). `--sync` предупредил бы, что `package.json` изменился.

Run:

```bash
node scripts/sandbox.mjs --preset dashboard
cd "$(node scripts/sandbox.mjs --preset dashboard --print-dir)" && npx vitest run tests/page.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/app/api/stats/route" from "tests/page.test.tsx". Does the file exist?`

Если запуск падает с `[vitest-pool-runner]: Timeout waiting for worker to respond`, это нагрузка на машину, а не ошибка теста: повторите с `--maxWorkers=1 --no-file-parallelism` и отметьте повтор в отчёте.

- [ ] **Step 3: Типы и мок `/api/stats`**

`templates/next/presets/dashboard/lib/stats.ts`:

```ts
export interface Kpi {
  id: string;
  label: string;
  value: number;
  /** Изменение к прошлому периоду, % */
  delta: number;
}

export interface MonthStat {
  month: string;
  visits: number;
  appointments: number;
}

export interface WeekStat {
  week: string;
  waitDays: number;
}

export interface Stats {
  kpis: Kpi[];
  monthly: MonthStat[];
  waitTrend: WeekStat[];
}
```

`templates/next/presets/dashboard/app/api/stats/route.ts`. Строки `export const dynamic = 'force-dynamic'` здесь нет: GET-обработчики Next 16 и так динамические (решение плана 17, п. 2):

```ts
import type { Stats } from '@/lib/stats';

// Мок: тестовые данные. Замените обработчик на запрос к реальному бэкенду.
const STATS: Stats = {
  kpis: [
    { id: 'visits', label: 'Посещения за месяц', value: 12840, delta: 4.2 },
    { id: 'appointments', label: 'Записи на приём', value: 3215, delta: -1.8 },
    { id: 'doctors', label: 'Врачей на смене', value: 184, delta: 0.6 },
    { id: 'satisfaction', label: 'Довольны приёмом, %', value: 87, delta: 2.1 },
  ],
  monthly: [
    { month: 'Май', visits: 10210, appointments: 2840 },
    { month: 'Июнь', visits: 9870, appointments: 2710 },
    { month: 'Июль', visits: 9120, appointments: 2550 },
    { month: 'Август', visits: 10540, appointments: 2930 },
    { month: 'Сентябрь', visits: 12320, appointments: 3270 },
    { month: 'Октябрь', visits: 12840, appointments: 3215 },
  ],
  waitTrend: [
    { week: '1 нед.', waitDays: 6.1 },
    { week: '2 нед.', waitDays: 5.8 },
    { week: '3 нед.', waitDays: 5.9 },
    { week: '4 нед.', waitDays: 5.2 },
    { week: '5 нед.', waitDays: 4.7 },
    { week: '6 нед.', waitDays: 4.4 },
  ],
};

export function GET() {
  return Response.json(STATS);
}
```

- [ ] **Step 4: Компонент `Dashboard`**

`templates/next/presets/dashboard/components/dashboard.tsx`. Цвета графиков — только `var(--chart-N)` через `ChartConfig`; серии берут `var(--color-<ключ>)`, которые определяет `ChartContainer`. Графики отрисуются в браузере после загрузки данных, а в jsdom `ResponsiveContainer` не имеет размера и рисует пустой контейнер: поэтому Vitest проверяет тексты и заголовки, а сами фигуры — e2e:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@mednet/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mednet/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@mednet/ui/chart';
import { Skeleton } from '@mednet/ui/skeleton';
import { apiGet } from '@/lib/api';
import type { Kpi, Stats } from '@/lib/stats';

// Цвета графиков — только палитра бренда chart-1…chart-8 из @mednet/tokens
const MONTHLY_CONFIG = {
  visits: { label: 'Посещения', color: 'var(--chart-1)' },
  appointments: { label: 'Записи', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const WAIT_CONFIG = {
  waitDays: { label: 'Ожидание, дней', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const number = new Intl.NumberFormat('ru-RU');

export function Dashboard() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiGet<Stats>('/api/stats'),
  });
  if (isPending) return <Skeleton className="h-[30rem] w-full" />;
  if (isError) return <p className="text-destructive">Не удалось загрузить данные.</p>;

  return (
    <div className="space-y-6">
      <section
        aria-label="Ключевые показатели"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Посещения и записи</h2>
            </CardTitle>
            <CardDescription>По месяцам, последние полгода</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={MONTHLY_CONFIG} className="h-72 w-full">
              <BarChart data={data.monthly} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="visits" fill="var(--color-visits)" radius={6} />
                <Bar dataKey="appointments" fill="var(--color-appointments)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Срок ожидания приёма</h2>
            </CardTitle>
            <CardDescription>Среднее по неделям, дней</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={WAIT_CONFIG} className="h-72 w-full">
              <LineChart data={data.waitTrend} accessibilityLayer margin={{ left: 0, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis width={32} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="waitDays"
                  type="monotone"
                  stroke="var(--color-waitDays)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const up = kpi.delta >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{kpi.label}</CardDescription>
        <CardTitle className="text-h3 tabular-nums">{number.format(kpi.value)}</CardTitle>
        <CardAction>
          <Badge variant={up ? 'secondary' : 'destructive'}>
            <Icon aria-hidden />
            {up ? '+' : '−'}
            {Math.abs(kpi.delta).toLocaleString('ru-RU')}%
          </Badge>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
```

- [ ] **Step 5: Страница и каркас `AppShell`**

Страница `/` и её layout. Layout читает cookie `sidebar_state`, чтобы панель помнила своё состояние; поэтому `/` динамический (ожидаемо: в `next build` он `ƒ`, не `○`). Второй пункт меню «Отчёты» — пример для замены, он ведёт на ту же страницу.

`templates/next/presets/dashboard/app/(app)/layout.tsx`:

```tsx
import { FileText, LayoutDashboard } from 'lucide-react';
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
              <SidebarMenuButton render={<Link href="/" />} tooltip="Дашборд" isActive>
                <LayoutDashboard />
                <span>Дашборд</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />} tooltip="Отчёты">
                <FileText />
                <span>Отчёты</span>
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

`templates/next/presets/dashboard/app/(app)/page.tsx`:

```tsx
import { Dashboard } from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h2">Дашборд</h1>
      <Dashboard />
    </div>
  );
}
```

- [ ] **Step 6: Тест проходит**

Run:

```bash
node scripts/sandbox.mjs --preset dashboard --sync
cd "$(node scripts/sandbox.mjs --preset dashboard --print-dir)" && npx vitest run tests/page.test.tsx
```

Expected: `Test Files  1 passed (1)`, `Tests  1 passed (1)`. Предупреждение про `package.json` от `--sync` не должно появиться: фрагмент не менялся с Step 2.

- [ ] **Step 7: e2e-тест (локально только список и типы)**

`templates/next/presets/dashboard/e2e/smoke.spec.ts`. Ждём `.recharts-bar-rectangle` до подсчёта: график рисуется после гидратации, и счёт без ожидания дал бы 0. Axe проверяет страницу целиком, блокируют только `serious` и `critical`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('дашборд: KPI и графики после гидратации', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Дашборд');
  await expect(page.getByText('Посещения за месяц')).toBeVisible();
  // recharts рисует SVG только на клиенте: ждём столбцы и линию
  await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible();
  expect(await page.locator('.recharts-bar-rectangle').count()).toBe(12);
  await expect(page.locator('.recharts-line-curve')).toBeVisible();
  // цвет столбцов — из палитры бренда
  const fill = await page.locator('.recharts-bar-rectangle path').first().getAttribute('fill');
  expect(fill).toBe('var(--color-visits)');

  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});
```

Run:

```bash
node scripts/sandbox.mjs --preset dashboard --sync
cd "$(node scripts/sandbox.mjs --preset dashboard --print-dir)" && npx playwright test --list
```

Expected: сервер не стартует; перечислены 3 теста в 2 файлах — `health.spec.ts` (2) и `smoke.spec.ts` (1, «дашборд: KPI и графики после гидратации»); `Total: 3 tests in 2 files`. Сам прогон — в CI (Task 20).

- [ ] **Step 8: Локальные проверки пресета**

Run:

```bash
cd "$(node scripts/sandbox.mjs --preset dashboard --print-dir)" \
  && npm run check \
  && npm run format:check \
  && npm ls recharts
```

Expected:
- `lint` и `lint:css` — exit 0 без замечаний;
- `typecheck` — `✓ Types generated successfully`, затем `tsc` exit 0 (проверяет и `e2e/smoke.spec.ts` с `AxeBuilder`);
- `test` — `Test Files  4 passed (4)`, `Tests  7 passed (7)` (health, providers, api — база; page — пресет);
- `All matched files use Prettier code style!`;
- `npm ls recharts` — одна запись `recharts@3.x` верхнего уровня, у `@mednet/ui` она с пометкой `deduped`.

Если `format:check` нашёл расхождения, выполните в песочнице `npx prettier --write <файл>` и перенесите результат в `templates/next/presets/dashboard/<тот же путь>`: в файлах пресета подстановок `{{…}}` нет, копировать можно целиком. Если `eslint` ругается на цвет в `dashboard.tsx` — вы заменили `var(--chart-N)` литералом; верните `var(--chart-N)`.

Состав файлов пресета сверяет тест Task 14 — запустите его из корня worktree, если он уже есть в ветке (иначе его выполнит Task 20):

```bash
test -f packages/create-app/test/template.test.ts && pnpm --filter @mednet/create-app exec vitest run test/template.test.ts
```

Expected: проходят `пресет dashboard — ровно эти файлы`, проверка непересечения с базой и проверка фрагмента `package.json`; тест копии пропущен (без сборки нет `template/`), тесты пресетов, которых ещё нет в ветке, тоже пропущены. Если тест нашёл лишний или недостающий файл, исправьте пресет, а не список в тесте: список — контракт задачи.

Одна сборка (около 2–5 минут на этой машине; пропустите, если машина под нагрузкой: сборку каждого пресета делает пилот, Task 20):

```bash
cd "$(node scripts/sandbox.mjs --preset dashboard --print-dir)" && npx next build
```

Expected: `✓ Compiled successfully`; маршруты `ƒ /`, `ƒ /api/health`, `ƒ /api/stats`. Если `/` показан как `○` (статический) — это не ошибка сборки, но значит, что `(app)/layout` перестал читать `cookies()`; верните чтение cookie.

- [ ] **Step 9: Commit**

```bash
git add templates/next/presets/dashboard
git commit -m "feat(templates): dashboard preset — AppShell, KPI cards, bar and line charts on chart-1..8, /api/stats mock"
```

---

### Task 20: CI кита — job `pilot` (матрица пресетов) и `pilot-gitlab`

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes:
  - из Task 15 — `pnpm pilot --preset <пресет>` с `CI=true`;
  - из Task 14 — `packages/create-app/dist/index.js` с `template/`;
  - из Tasks 16–19 — все четыре пресета;
  - из Tasks 7, 12, 13 и 15 — тесты кита `scripts/lib/*.test.mjs` (14 тестов);
  - из Task 14 — тест состава шаблона `packages/create-app/test/template.test.ts`: его гоняет уже существующий job `check` (`pnpm turbo run build typecheck test`).
- Produces: CI на каждый push и PR, три новые проверки:
  - тесты скриптов кита;
  - пилот каждого пресета: `check`, `build`, e2e, блок Next, Docker и 200 от `/api/health`. Это критерий готовности спеки пилота;
  - генерация с `--ci gitlab`.

Мержить в `main` **только после Tasks 16–19**: без пресетов job `pilot` красный.

Проверено (facts-3 §6): YAML обоих job прошёл actionlint (`proto-3-sources/ci/kit-pilot-job.yml`). Отличие от прототипа: `pilot-gitlab` запускает CLI из `runner.temp` с коротким именем `gl`. Абсолютный путь не пройдёт `validateName`, а в прототипе этот job не запускали. Оценка времени — 6–10 минут на пресет, раннеры идут параллельно (facts-3 §6, не проверено на раннере).

- [ ] **Step 1: Тесты скриптов в job `check`**

В `.github/workflows/ci.yml`, в job `check`, после шага `- run: pnpm format:check` добавить:

```yaml
      - run: node --test "scripts/**/*.test.mjs"
```

- [ ] **Step 2: Job пилота**

В конец `.github/workflows/ci.yml`, после job `chrome109`, добавить:

```yaml

  pilot:
    name: Пилот (${{ matrix.preset }})
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        preset: [landing, tool, cabinet, dashboard]
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # скрипт ставит браузеры в проекте (npx playwright install --with-deps chromium), если задан CI
      - run: pnpm pilot --preset ${{ matrix.preset }}
        env:
          CI: 'true'

  pilot-gitlab:
    name: Пилот (--ci gitlab, только файлы)
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=@mednet/create-app
      # имя проекта — без пути: validateName не принимает «/»
      - run: node "$GITHUB_WORKSPACE/packages/create-app/dist/index.js" gl --yes --no-install --no-git --ci gitlab
        working-directory: ${{ runner.temp }}
      - run: test -f gl/.gitlab-ci.yml && test ! -e gl/.github && test -f gl/Dockerfile
        working-directory: ${{ runner.temp }}
```

- [ ] **Step 3: actionlint**

Run (Git Bash; на Linux вместо `pwd -W` — `pwd`):

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/repo" -w /repo rhysd/actionlint:latest .github/workflows/ci.yml; echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 4: Тесты скриптов локально и формат**

Run:

```bash
node --test "scripts/**/*.test.mjs"
pnpm turbo run test --filter=@mednet/create-app
pnpm format:check
```

Expected:
- `ℹ tests 14`, `ℹ pass 14`, `ℹ fail 0`: `kit-tarballs.test.mjs` — 5 (Tasks 7 и 15), `template-scripts.test.mjs` — 2 (Task 12), `template-docs.test.mjs` — 7 (Task 13);
- `Test Files  6 passed (6)`, `Tests  52 passed (52)` — без `skipped`: все четыре пресета в ветке, и их состав совпал со списками Task 14;
- `All matched files use Prettier code style!`.

- [ ] **Step 5: Commit, push и проверка в Actions**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: pilot run per preset (check, build, e2e, Docker health) and --ci gitlab generation"
git push
```

После push откройте GitHub Actions и дождитесь, пока станут зелёными:
- `check`;
- `visual`;
- `chrome109`;
- четыре `Пилот (<пресет>)`;
- `Пилот (--ci gitlab, только файлы)`.

Если пилот упал, отчёт Playwright и логи контейнера есть в выводе шага. Исправлять надо в шаблоне или пресете, а не в job. Это первая полная проверка Tasks 10, 11 и 15 на Linux.

---

### Task 21: Docs-сайт — раздел «Новый проект»

**Files:**
- Create: `apps/docs/app/(site)/new-project/page.tsx`
- Modify: `apps/docs/app/(site)/layout.tsx` (навигация), `apps/docs/tests/pages.ts`, `apps/docs/tests/__screenshots__/*.png` (эталоны)

**Interfaces:**
- Consumes:
  - из Task 3 — команды и флаги CLI;
  - из спеки пилота — описания пресетов;
  - из `apps/docs` — образец страницы `app/(site)/recipes/page.tsx` и тесты `tests/visual.spec.ts`, `tests/a11y.spec.ts` по списку `PAGES`.
- Produces: страница `/new-project/` в навигации docs; скриншот- и axe-тесты её проверяют.

Пункт навигации меняет шапку всех страниц группы `(site)`. Поэтому эталоны `overview`, `tokens`, `css`, `recipes` и `ui` обновляются, и появляется эталон `new-project`. Эталоны коммитятся, а снимает их штатная команда кита `pnpm test:visual:update`: Docker-образ Playwright, тяжело, но это единственный способ получить эталоны (Global Constraints).

- [ ] **Step 1: Страница**

`apps/docs/app/(site)/new-project/page.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Новый проект' };

const CREATE = `npm create @mednet/app my-app
# у npm флаги — после «--»
npm create @mednet/app my-app -- --preset tool --ci gitlab`;

const OTHER = `pnpm create @mednet/app my-app --preset tool
yarn create @mednet/app my-app --preset tool`;

const NEXT_STEPS = `cd my-app
npm run dev      # http://localhost:3000
npm run check    # ESLint, stylelint, типы, тесты — перед каждым коммитом`;

const PRESETS = [
  [
    'landing',
    'Лендинг или отчёт',
    'PublicLayout: шапка и подвал ЦНИИОИЗ, hero, карточки, призыв к действию.',
  ],
  [
    'tool',
    'Внутренний инструмент',
    'AppShell с боковой панелью, таблица с поиском, диалог «Создать», уведомления.',
  ],
  ['cabinet', 'Кабинет', 'AppShell, анкета на react-hook-form и zod с сообщениями по-русски.'],
  ['dashboard', 'Дашборд', 'AppShell, KPI-карточки и графики в палитре бренда.'],
] as const;

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm">
      <code>{children}</code>
    </pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      <div className="mt-3 max-w-3xl text-muted-foreground">{children}</div>
    </section>
  );
}

export default function NewProjectPage() {
  return (
    <>
      <h1 className="text-h1">Новый проект</h1>
      <p className="mt-4 max-w-3xl text-lead text-muted-foreground">
        Одна команда создаёт проект на Next.js в бренде ЦНИИОИЗ: компоненты <code>@mednet/ui</code>,
        защита бренда линтерами, правила для AI-агентов, тесты, Docker и CI.
      </p>

      <Section id="create" title="Создать">
        <p>Нужен Node.js 22.12 или новее; проекту — Node.js 24.</p>
        <Code>{CREATE}</Code>
        <p className="mt-4">
          pnpm и yarn тоже запускают CLI, флаги у них — без «--». Зависимости проекта всё равно
          ставит npm, потому что <code>Dockerfile</code> и CI собирают проект по файлу{' '}
          <code>package-lock.json</code>.
        </p>
        <Code>{OTHER}</Code>
      </Section>

      <Section id="presets" title="Стартовая страница">
        <p>
          Флаг <code>--preset</code>, по умолчанию <code>landing</code>.
        </p>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          {PRESETS.map(([name, title, text]) => (
            <div key={name} className="rounded-xl border border-border p-6">
              <dt className="font-semibold text-foreground">
                {title} — <code>{name}</code>
              </dt>
              <dd className="mt-2">{text}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="flags" title="Остальные флаги">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <code>--ci github|gitlab|none</code> — CI проекта, по умолчанию <code>github</code>.
          </li>
          <li>
            <code>--yes</code> — без вопросов: так CLI запускают AI-агенты и скрипты.
          </li>
          <li>
            <code>--no-install</code>, <code>--no-git</code> — без установки зависимостей и без
            git-репозитория.
          </li>
        </ul>
      </Section>

      <Section id="inside" title="Что внутри">
        <ul className="list-disc space-y-2 pl-6">
          <li>Next.js 16, TypeScript, Tailwind CSS v4 и тема бренда одной строкой CSS.</li>
          <li>
            <code>npm run check</code>: ESLint и stylelint с защитой бренда, типы, тесты Vitest.
          </li>
          <li>e2e на Playwright с проверкой доступности.</li>
          <li>
            <code>AGENTS.md</code> — правила для AI-агентов, справочник компонентов в{' '}
            <code>node_modules/@mednet/ui/llms.md</code>.
          </li>
          <li>
            <code>Dockerfile</code> и <code>docker-compose.yml</code>, проверка живости{' '}
            <code>/api/health</code>; развёртывание — по разделу «Деплой» в README проекта.
          </li>
        </ul>
        <Code>{NEXT_STEPS}</Code>
      </Section>
    </>
  );
}
```

- [ ] **Step 2: Навигация и список страниц для тестов**

В `apps/docs/app/(site)/layout.tsx` в массиве `NAV` после `{ href: '/recipes/', label: 'Внедрение' },` добавить:

```tsx
  { href: '/new-project/', label: 'Новый проект' },
```

В `apps/docs/tests/pages.ts` после строки `['recipes', '/recipes/'],` добавить:

```ts
  ['new-project', '/new-project/'],
```

- [ ] **Step 3: Типы, сборка, формат**

Run:

```bash
pnpm exec prettier --write "apps/docs/app/(site)/new-project/page.tsx" "apps/docs/app/(site)/layout.tsx" apps/docs/tests/pages.ts
pnpm --filter docs typecheck
pnpm turbo run build --filter=docs...
test -f apps/docs/out/new-project/index.html && echo "страница собрана"
pnpm format:check
```

Expected: typecheck — exit 0, сборка зелёная, `страница собрана`, `All matched files use Prettier code style!`.

- [ ] **Step 4: Эталоны скриншотов**

Run: `pnpm --filter docs test:visual:update`

Expected:
- Docker-образ Playwright (`scripts/visual-docker.mjs --update`) завершается без ошибок;
- в `apps/docs/tests/__screenshots__/` появился `new-project.png`;
- изменились `overview.png`, `tokens.png`, `css.png`, `recipes.png` и `ui.png` (новый пункт в шапке);
- `ui-app-shell.png`, `ui-public-layout.png` и `static-demo.png` не изменились.

Как проверить:
1. Посмотрите `git status apps/docs/tests/__screenshots__`.
2. Откройте `new-project.png` (Read PNG): заголовок «Новый проект», блоки кода, четыре карточки пресетов.

Затем Run: `pnpm --filter docs test:visual:docker`

Expected: все скриншот-, axe- и parity-тесты проходят, включая `доступность: new-project`.

- [ ] **Step 5: Commit**

```bash
git add "apps/docs/app/(site)" apps/docs/tests
git commit -m "feat(docs): «Новый проект» — npm create @mednet/app, presets, what is inside"
```

---

### Task 22: Подготовка релиза

**Files:**
- Create: `.changeset/pilot-b-create-app.md`
- Modify: `README.md` (корень), `docs/releasing.md`

**Interfaces:**
- Consumes: всё из Tasks 1–21. Перед этой задачей CI зелёный, включая пилот.
- Produces:
  - запись для Version PR: минорный релиз кита, например 0.3.0 (спека пилота §5);
  - README кита со строкой `@mednet/create-app`;
  - правила первой публикации пакетов, зависящих друг от друга;
  - чек-лист владельца.

Агент **ничего не публикует**: не снимает `private` и не мержит Version PR (`AGENTS.md`, решение владельца 11).

Факты (facts-3 §7):
- С `fixed: [["@mednet/*"]]` и `privatePackages.version: true` все пять пакетов поднимаются до одной версии.
- Trusted publishing настраивается только для уже существующего пакета, поэтому первая версия каждого нового пакета публикуется вручную.
- `@mednet/ui` требует точную версию `@mednet/tokens`, поэтому `tokens` должен быть в npm раньше.
- Как `release.yml` поведёт себя, если снять `private` до ручной публикации, **не проверено**. Поэтому `private` снимается только в момент ручной публикации.

- [ ] **Step 1: Changeset**

`.changeset/pilot-b-create-app.md`:

```markdown
---
'@mednet/create-app': minor
---

Новый пакет `@mednet/create-app` (до первой публикации помечен `private`): `npm create @mednet/app <имя>` создаёт проект ЦНИИОИЗ на Next.js 16 — `@mednet/ui`, защита бренда `@mednet/lint-config`, `AGENTS.md` для AI-агентов, тесты Vitest и Playwright, Docker-образ и CI (GitHub или GitLab); стартовые страницы `landing`, `tool`, `cabinet`, `dashboard`.
```

- [ ] **Step 2: README кита**

В таблицу пакетов `README.md` после строки `@mednet/lint-config` добавить:

```markdown
| [`@mednet/create-app`](packages/create-app)   | `npm create @mednet/app`: новый проект на Next.js в бренде — компоненты, линтеры, `AGENTS.md`, тесты, Docker, CI — **ещё не опубликован** |
```

После таблицы, перед разделом «Разработка», добавить:

````markdown
## Новый проект

```bash
npm create @mednet/app my-app
```

Флаги, пресеты и что внутри — [packages/create-app](packages/create-app/README.md).
````

В блок кода раздела «Разработка» после строки `pnpm format       # Prettier` добавить:

```bash
pnpm sandbox      # проект из templates/next на собранных пакетах — во временной папке
pnpm pilot --preset tool   # полный пилотный прогон пресета: check, build, e2e, Docker (нужен Docker)
```

Затем выполните `pnpm exec prettier --write README.md`: Prettier выровняет таблицу.

- [ ] **Step 3: Правила первой публикации**

В `docs/releasing.md`, в конец раздела «Новый пакет `@mednet/*`» (после пункта 4), добавить:

```markdown

Новый пакет до первой публикации помечен `"private": true`: Version PR его версионирует, `changeset publish` пропускает. `private` снимается только при ручной публикации, после того как Version PR опубликовал остальные пакеты: trusted publishing для несуществующего пакета не работает.

Порядок, если новые пакеты зависят друг от друга: сначала то, от чего зависят. `@mednet/ui` требует точную версию `@mednet/tokens` (она публикуется автоматически), затем `@mednet/lint-config`, последним — `@mednet/create-app` (его проекты ставят `ui` и `lint-config` той же версии).
```

- [ ] **Step 4: Итоговая проверка — как в CI**

Run:

```bash
pnpm install --frozen-lockfile
pnpm exec prettier --write .changeset/pilot-b-create-app.md README.md docs/releasing.md
pnpm format:check
pnpm turbo run build typecheck test
node --test "scripts/**/*.test.mjs"
node packages/create-app/scripts/check-dist.mjs; echo "exit=$?"
```

Expected:
- всё зелёное; у `@mednet/create-app` — `Tests  52 passed (52)` без `skipped`, `node --test` — `ℹ pass 14`;
- `check-dist` теперь `exit=0`: все четыре пресета в `template/`;
- `git status` чистый, кроме файлов этой задачи.

- [ ] **Step 5: Commit и push**

```bash
git add .changeset/pilot-b-create-app.md README.md docs/releasing.md
git commit -m "docs: changeset, README and first-publish rules for @mednet/create-app"
git push
```

После push проверьте две вещи:
1. CI на `main` зелёный: все jobs, включая пилот.
2. Release обновил Version PR «Релиз пакетов @mednet/\*»: в нём `@mednet/create-app`, `@mednet/ui` и `@mednet/lint-config` с новой версией, публикации нет.

**Version PR не мержить** — это решение владельца.

- [ ] **Step 6: Чек-лист владельцу (агент не выполняет — только передаёт в отчёте)**

1. Смержить Version PR. `release.yml` публикует `@mednet/tokens` и `@mednet/css` новой версии и ставит им теги. Проверить: `npm view @mednet/tokens version`.
2. Ветка-коммит: убрать `"private": true` из `packages/ui/package.json`, `packages/lint-config/package.json` и `packages/create-app/package.json`.
3. Для каждого пакета, строго по одному и в порядке `ui` → `lint-config` → `create-app`:
   1. `pnpm build`;
   2. `pnpm pack`;
   3. убедиться, что в `package/package.json` нет `workspace:`;
   4. `npm publish <tgz> --json`;
   5. подтвердить 2FA через web (`docs/releasing.md`, «Ручная публикация»).
4. Для каждого из трёх пакетов:
   - `npm trust github @mednet/<имя> --file release.yml --repo hpnssflw/mednet-kit --allow-publish -y`;
   - `npm access set mfa=publish @mednet/<имя>`.
5. Теги `@mednet/<пакет>@<версия>` и GitHub Releases для трёх пакетов; строка в «Истории» `docs/releasing.md`.
6. Проверка: `npm create @mednet/app pilot-check -- --yes --no-git` в пустой папке, затем `cd pilot-check && npm run check && npm run build`.
7. По отдельному решению: пилотный проект в приватном репозитории для DevOps (спека пилота §5).

---

## Покрытие спеки пилота (разделы 3–5) и решений владельца

**§3, шаблон `templates/next`**
- Основа (Next 16, TS strict, Tailwind v4, `lang="ru"`, Montserrat через `@mednet/ui/styles.css`, `globals.css` одной строкой) — Tasks 8 и 6.
- Пресеты — Tasks 16–19: `landing` (`PublicLayout`, hero, карточки, призыв к действию) — 16; `tool` (`AppShell`, таблица с поиском, диалог «создать», `toast`) — 17; `cabinet` (`AppShell`, анкета на react-hook-form и zod) — 18; `dashboard` (`AppShell`, KPI, shadcn Chart на `chart-1…8`) — 19. CLI кладёт только выбранный пресет — Task 1; состав пресетов закреплён тестом Task 14.
- Данные (TanStack Query, типизированная обёртка над `fetch`, моки — route handlers, П5) — Tasks 8, 9 и пресеты.
- Docker (`output: 'standalone'`, многоступенчатый `Dockerfile` на `node:24-alpine`, не от root, `HEALTHCHECK`, `docker-compose.yml`, `.dockerignore`) — Task 11; `/api/health` (статус и версия) — Task 8; README «Деплой» (порт, переменные окружения, проверка живости) — Task 13.
- Проверки: `npm run check` (ESLint с `@mednet/lint-config`, stylelint, typecheck, Vitest с тестом страницы пресета) — Tasks 7–9 и пресеты; `npm run test:e2e` вне `check` — Task 10; Prettier с `prettier-plugin-tailwindcss` — Task 8.
- CI (`--ci github|gitlab|none`) — Task 4, наложение — Task 1.
- AI-слой (`AGENTS.md` около 100 строк со ссылкой на `llms.md`, `CLAUDE.md` = `@AGENTS.md`) — Task 13.
- `.nvmrc` (24), `_gitignore` → `.gitignore`, README на русском — Tasks 7, 1 и 13.

**§4, CLI**
- Запуск `npm create @mednet/app` (и `pnpm create`/`yarn create`), bin `create-app`, у npm флаги после `--` — Tasks 2–3.
- Флаги (`--template`, `--deploy` с «появится позже», `--preset`, `--ci`, `--yes`, `--no-install`, `--no-git`) — Task 2.
- Вопросы `@clack/prompts` и работа без TTY — Task 3.
- Шаги: имя и папка — Task 2; база → пресет и CI → подстановки → `.gitignore` — Task 1; установка (только npm) и `git init` с первым коммитом — Task 2; следующие шаги — Task 3.
- Шаблон вшивается при сборке, версии `@mednet/*` = версия CLI — Tasks 14 и 1 (`^{{kitVersion}}`).
- Тесты Vitest во временных папках — Tasks 1–3 и 14.
- Правка текста спеки §4 и README CLI под «только npm» — Task 3.

**§5, пилот, docs, релиз**
- Скрипт `scripts/pilot.mjs` (`pnpm pilot --preset <p>`): сборка и `pnpm pack` → генерация собранным CLI → тарболы → `npm install` → `check` → `build` → `test:e2e` → Docker → 200 от `/api/health` → остановка — Task 15.
- CI: матрица четырёх пресетов и генерация с `--ci gitlab` — Task 20.
- Страница «Новый проект» — Task 21; страница `/ui` сделана в плане A.
- Релиз: changeset, README, правила первой публикации — Task 22; публикация, `npm trust`, `mfa=publish`, пилотный репозиторий для DevOps — чек-лист владельца в Task 22.

**Критерий готовности** — каждый пресет проходит `check`, `build`, `test:e2e`, а его Docker-образ отвечает 200: Tasks 15 и 20. Публикацию делает владелец по Task 22.

**Решения владельца** (`owner-decisions.md`)
- `Command` (cmdk) остаётся в ките — изменений не требует.
- Кит 0.2.0, `@mednet/create-app` 0.2.0 `private` — Tasks 1 и 22.
- ESLint 9 в шаблоне — Task 7 (Global Constraints).
- Насыщенность заголовков в `@mednet/ui/styles.css`, правило убрано из docs, шаблон его не повторяет, changeset `patch` (Р4) — Tasks 6 и 8.
- Только npm: `Dockerfile` с `npm ci` — Task 11; CLI всегда `npm install` с пояснением — Tasks 2–3; спека §4 и README CLI — Task 3.
- `npm create … -- --preset` — Tasks 2, 3, 13, 21; bin `create-app` — Task 3; управляемый блок Next в `AGENTS.md` — Task 13, проверка в пилоте — Task 15.
- `@mednet/ui/use-mobile` и заглушка `hooks/use-mobile.ts` — Tasks 5 и 12.
- Заглушки закоммичены, `ui:stubs`, `ui:add` с правкой `cn` — Task 12; предупреждение про `sonner`/`next-themes`/`@dnd-kit/*` и `npm run check` для блоков — Task 13; TanStack Table v9 — Tasks 13 и 17; `playwright-core` 1.64.0 — Task 10.
- Р1 `^{{kitVersion}}` — Tasks 7, 10, 12; Р2 SHA в actions шаблона — Task 4; Р3 GitLab только по синтаксису, README — Tasks 4 и 13; Р5 чек-лист владельца — Task 22.

**Спека §12, AI-слой**
- Технические запреты — `@mednet/lint-config` в Task 8.
- Инструкции и каталог `llms.md` — Task 13.
- MCP и registry — вне пилота.
