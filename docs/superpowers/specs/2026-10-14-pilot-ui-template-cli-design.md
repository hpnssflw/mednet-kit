# Пилот: `@mednet/ui` + шаблон `next` + CLI — дизайн

- **Дата:** 2026-10-14
- **Статус:** согласовано в брейншторме, ожидает ревью
- **Основа:** [основная спецификация](2026-10-13-mednet-design-system-design.md) (дальше — «спека»). Этот документ — срез этапов 3 и 5 спеки §17 для пилота и отступления от неё. Всё, что здесь не сказано, — как в спеке.

## Цель и критерий готовности

Команда (люди и AI-агенты) поднимает брендированный Next-проект одной командой, и в репозитории проекта сразу есть всё: компоненты, фирменные блоки, защита бренда, инструкции для агентов, Docker и CI. Развёртывание делает DevOps заказчика по готовому `Dockerfile`/`docker-compose.yml`; мы ничего не хостим.

Готово, когда для **каждого** из четырёх пресетов `npm create @mednet/app <имя> --preset <p> --yes` даёт проект, который проходит `npm run check`, `npm run build`, `npm run test:e2e`, а его Docker-образ запускается и отвечает 200 на `/api/health`. Прогон автоматизирован (скрипт + CI), новые пакеты опубликованы в npm.

## Объём

| Входит | Не входит (позже) |
|---|---|
| `@mednet/ui`: весь набор shadcn (Maia), `Logo`, `SiteHeader`, `SiteFooter`, `PublicLayout`, `AppShell`, `llms.md` | HTML-версии фирменных блоков и тест совпадения React/HTML (этап 4) |
| `@mednet/lint-config` (ESLint + stylelint) | `@mednet/charts`, `@mednet/validators`, `DataTable` и прочие недостающие компоненты (этапы 6–7) |
| `templates/next` с деплоем `docker`, 4 пресета, AI-слой, CI github/gitlab | шаблон `html`, деплой `static` (CLI отвечает «появится позже») |
| `@mednet/create-app` | registry блоков и `.mcp.json` (этап 8) |
| пилотный прогон: скрипт + job в CI; страница `/ui` на docs-сайте | MSW (заменён route handlers, см. П5) |

## Решения пилота

| # | Решение | Почему |
|---|---|---|
| П1 | Деплой с нашей стороны не делаем; шаблон несёт `Dockerfile`, `docker-compose.yml`, healthcheck и раздел «Деплой» в README | Площадку и правку конфигов делает DevOps заказчика |
| П2 | В `@mednet/ui` — весь набор shadcn | Код генерируется; агентам сразу есть из чего собирать все четыре типа приложений |
| П3 | `@mednet/ui` собирается `tsc` пофайлово, без бандлера | `"use client"` сохраняется сам (риск спеки §19), подпути получаются естественно, на один инструмент меньше |
| П4 | `@mednet/lint-config` — только встроенные правила ESLint/stylelint | Без своего плагина: меньше кода, правила читаются как конфиг |
| П5 | Моки данных — route handlers `app/api/*` с тестовыми данными вместо MSW (отступление от спеки §11) | Работают и в dev, и в Docker; реальный бэкенд заменяет обработчики; MSW можно вернуть позже |
| П6 | Шаблон вшивается в пакет CLI при сборке; версии `@mednet/*` в проекте = версия CLI | Как в спеке §11; единое версионирование гарантирует существование версии |
| П7 | Фирменные блоки и график (shadcn Chart) входят в пилот, `@mednet/charts` — нет | Проект «в бренде» не только по цветам; dashboard без отдельного пакета |
| П8 | Основа примитивов — **Base UI**, стиль shadcn `base-maia` (не `radix-maia`); смена элемента — проп `render`, не `asChild` | shadcn сам рекомендует Base UI; вид Maia одинаковый; одна библиотека примитивов вместо двух (radix-стиль всё равно тянет Base UI для combobox); нет `vaul`, `sonner`, `next-themes`; есть `toast` |
| П9 | Код shadcn не правится руками: импорт `cn` и русские подписи — скрипт `postgen`, цвета бренда — `brand.css` поверх сгенерированных классов | Повторная генерация воспроизводима, `shadcn add --diff` показывает только апстрим |
| П10 | Примитивы — только npm-пакет `@mednet/ui`; блоки shadcn в проекте собираются на них через заглушки `components/ui/*` (реэкспорт) в шаблоне | CLI shadcn не умеет брать примитивы из npm-пакета (проверено); свой registry отдал бы каждому проекту копию примитивов |
| П11 | Montserrat подключает `@mednet/ui/styles.css` (`@fontsource/montserrat`) | `@mednet/tokens` только называет шрифт; без `@font-face` React-страницы шли системным шрифтом |
| П12 | Поддерживаемые браузеры: Chrome/Edge **109+** (последние для Windows 7/8.1), Firefox 128+, Safari 16.4+. Chrome 109 — ниже базовой линии Tailwind/Next/Base UI (111), поэтому: статические копии цветов и `var(--x, )` (плагин `@mednet/ui/postcss`, он же в сборке `@mednet/css`) и smoke-тест в Chromium 109 | В Chrome 109 без этого исчезали кольца фокуса (в т. ч. в опубликованном `mednet.min.css`), деструктивные кнопки становились сплошь красными, фон под диалогом — чёрным; JS работает |
| П13 | Эталон стиля Maia — сгенерированный shadcn; `@mednet/css` (Basecoat) выравнивается под него; совпадение React и статики проверяет тест паритета по вычисленным стилям (не по пикселям) | Пиксели расходятся на 3–12 % на тексте даже при совпадении всех стилей |
| П14 | `@mednet/lint-config`: ESLint 9 в шаблоне (пакет допускает 9 и 10), stylelint — только наши 3 правила, без `stylelint-config-standard`; пакет экспортирует `restrictedImports`/`restrictedSyntax` для расширения | Плагины `eslint-config-next` объявляют только ESLint 9; `standard` даёт ложные ошибки на Tailwind v4; своё правило проекта молча заменяет наше |

## 1. `@mednet/ui`

- **Состав** (`packages/ui/src/`): `components/` — `shadcn add --all` по `components.json` пакета, стиль Maia; правятся только формы, цвета из токенов, внутренности стандартные. `brand/` — `Logo` (`horizontal` / `vertical` / `mark`; TSX генерируется скриптом из `assets/brand/logo/*.svg` и коммитится), `SiteHeader` (логотип, слоты навигации и действий), `SiteFooter` (полное наименование ФГБУ «ЦНИИОИЗ» Минздрава России, год; реквизиты — пропсы, значения по умолчанию сверяются с подвалом mednet.ru при реализации). `layouts/` — `PublicLayout`, `AppShell` (shadcn Sidebar). `lib/utils.ts` (`cn`), хуки shadcn.
- **Импорт:** подпути `@mednet/ui/<модуль>` (`button`, `logo`, `app-shell`…) + корневой индекс. CSS проекта — одна строка `@import "@mednet/ui/styles.css";` (внутри: `@mednet/tokens/theme.css`, `tw-animate-css`, `@source` на `dist` пакета). Плагин для Chrome 109 — `@mednet/ui/postcss`.
- **Сборка:** `tsc` → `dist` (ESM + `.d.ts`), `"use client"` остаётся первой строкой клиентских модулей.
- **Зависимости:** peer — `react`/`react-dom` 19, `tailwindcss` 4; обычные — то, что ставит shadcn для `base-maia`: `@base-ui/react`, `cn`, `class-variance-authority`, `lucide-react`, `recharts` (для Chart), `cmdk`, `date-fns`, `react-day-picker`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `@shadcn/react`; плюс `@fontsource/montserrat`, `tw-animate-css`, `@mednet/tokens`.
- **`llms.md`** — генерируется при сборке, публикуется в пакете: модуль → путь импорта → экспорты; для фирменных блоков и каркасов ещё пропсы и короткий пример; для стандартных компонентов — «API как у shadcn» + ссылка.
- **Проверки:** typecheck; Vitest + Testing Library для фирменных блоков и каркасов; тест «все модули импортируются, у клиентских есть `"use client"`»; страница `/ui` docs-сайта (витрина ключевых компонентов, Logo, шапка, подвал, оба каркаса) входит в скриншот- и axe-тесты и проверяет RSC-сборку Next на собранном пакете.

## 2. `@mednet/lint-config`

- Экспорты: `@mednet/lint-config/eslint` (flat config), `@mednet/lint-config/stylelint`. В проекте: `export default [...next, ...mednet]`.
- **ESLint:** `no-restricted-imports` — `antd`, `@mui/*`, `@mantine/*`, `@chakra-ui/*`, `bootstrap`, `react-bootstrap`; `@radix-ui/*` («через `@mednet/ui`»); чужие иконки `react-icons`, `@heroicons/*`, `@tabler/icons-react`, `@fortawesome/*`, `@phosphor-icons/*` («только `lucide-react`»). `no-restricted-syntax` — строки и шаблонные строки в `className`, `style` и аргументах `cn()`/`cva()`/`clsx()`: hex-цвета, произвольные цвета Tailwind (`bg-[#…]`, `text-[rgb(…)]`), `rgb()`/`hsl()`/`oklch()`. Сообщения по-русски с подсказкой семантического класса.
- **stylelint:** `color-no-hex`, `color-named: never`, `function-disallowed-list` на литеральные цветовые функции; `var(--…)` и `color-mix()` от переменных разрешены.
- **Тесты:** программный прогон на «плохих» и «хороших» образцах; в том числе отсутствие ложных срабатываний (`href="#section"`).

## 3. Шаблон `templates/next`

- **Основа:** Next 16 App Router, TS strict, Tailwind v4, `<html lang="ru">`, Montserrat из `@fontsource`; `globals.css` = `tailwindcss` + `@mednet/ui/styles.css`.
- **Пресеты** (CLI кладёт только выбранный): `landing` — `PublicLayout`, hero, карточки, призыв к действию; `tool` — `AppShell`, таблица shadcn с поиском, диалог «создать», уведомления `toast`; `cabinet` — `AppShell`, анкета на react-hook-form + zod; `dashboard` — `AppShell`, KPI-карточки, shadcn Chart с палитрой `chart-1…8`.
- **Данные:** TanStack Query + типизированная обёртка над `fetch`; моки — route handlers (П5).
- **Docker:** `output: 'standalone'`; многоступенчатый `Dockerfile` на `node:24-alpine`, запуск не от root, `HEALTHCHECK`; `docker-compose.yml`; `.dockerignore`; `app/api/health` (статус + версия); README «Деплой»: порт, переменные окружения, healthcheck.
- **Проверки:** `npm run check` = ESLint (next + `@mednet/lint-config`) + stylelint + typecheck + Vitest/Testing Library (тест страницы пресета); `npm run test:e2e` — Playwright smoke (вне `check`: нужны браузеры); Prettier + `prettier-plugin-tailwindcss`.
- **CI** (`--ci`): `github` → `.github/workflows/ci.yml` (install, check, build, e2e, сборка Docker-образа); `gitlab` → аналогичный `.gitlab-ci.yml`; `none` — без CI.
- **AI-слой:** `AGENTS.md` (~100 строк по спеке §12) со ссылкой на `node_modules/@mednet/ui/llms.md`; `CLAUDE.md` = `@AGENTS.md`.
- **Прочее:** `.nvmrc` (24), `_gitignore` (→ `.gitignore`), `README.md` на русском.

## 4. `@mednet/create-app`

- Запуск: `npm create @mednet/app <имя>` (а также `pnpm create` / `yarn create`).
- Флаги: `--template next` (`html` → «появится позже»), `--deploy docker` (`static` → «появится позже»), `--preset landing|tool|cabinet|dashboard` (по умолчанию `landing`), `--ci github|gitlab|none` (по умолчанию `github`), `--yes`, `--no-install`, `--no-git`. Интерактивно — `@clack/prompts`; без TTY — флаги и значения по умолчанию, без зависаний.
- Шаги: проверка имени (корректное имя npm-пакета; папки нет или она пуста — иначе понятная ошибка и ненулевой код) → копирование базы → наложение пресета и CI → подстановка `{{name}}`, `{{kitVersion}}` (`package.json`, `README.md`, `AGENTS.md`) → `_gitignore` → `.gitignore` → установка зависимостей менеджером из `npm_config_user_agent` → `git init` + первый коммит → следующие шаги.
- Сборка: `templates/next` копируется в `packages/create-app/template/`; CLI на TS, `tsc` → `dist/index.js` с shebang; пакет в единой версии `@mednet/*`.
- Тесты: Vitest на флаги, проверку имени, наложение пресета, подстановку версий, переименование `_gitignore` во временных папках.

## 5. Пилотный прогон, docs, релиз

- **Скрипт `scripts/pilot.mjs`** (`pnpm pilot --preset <p>`): сборка пакетов и `pnpm pack` `@mednet/*` → генерация проекта собранным CLI во временную папку (`--yes --no-install --no-git`) → зависимости `@mednet/*` переключаются на тарболы → `npm install` → `npm run check` → `npm run build` → `npm run test:e2e` → `docker build` → `docker run` → ожидание 200 от `/api/health` → остановка.
- **CI:** job с матрицей по четырём пресетам + одна генерация с `--ci gitlab` (проверка файлов).
- **Docs-сайт:** страница `/ui`; раздел «Новый проект» с командой `npm create @mednet/app`.
- **Релиз:** минорный релиз кита; первая публикация трёх новых пакетов вручную с подтверждениями 2FA, затем `npm trust` и `mfa=publish` — по `docs/releasing.md`.
- **По отдельному согласию владельца:** сгенерированный пилотный проект в приватный репозиторий (например, `hpnssflw/mednet-pilot`) для DevOps.

## Порядок

1. **План A:** `@mednet/ui` + `@mednet/lint-config` + страница `/ui`.
2. **План B:** `templates/next` + `@mednet/create-app` + пилотный прогон (скрипт и CI) + релиз новых пакетов.

Доработки после 0.1.1 (экспорты, reduced-motion, `--mn-radius`, закрепление версий в CI и т. д.) попадают в `main` до старта плана A.

## Изменения основной спеки

- §11: деплой `static` и шаблон `html` в пилот не входят; моки — route handlers вместо MSW (П5).
- §12: `.mcp.json` и namespace registry — с этапа 8.
- §17: пилот объединяет срезы этапов 3, 4 (только React-версии `Logo`/`SiteHeader`/`SiteFooter`) и 5; этапы 4 (HTML-блоки), 6–8 остаются как есть.
