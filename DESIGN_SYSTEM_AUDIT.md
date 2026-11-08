# Аудит дизайн-системы mednet-kit

Дата: 4 ноября 2026 года. Срез исходников: `c40e02a98d7a6cbf772cd0710febaf8f30faa10f`.

Это аудит существующей реализации, а не новая нормативная справка потребителя. Предложения вынесены в [DESIGN_SYSTEM_PROPOSAL.md](DESIGN_SYSTEM_PROPOSAL.md), агентная архитектура — в [AGENT_INTEGRATION_PLAN.md](AGENT_INTEGRATION_PLAN.md), этапы — в [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).

## 1. Вывод

В mednet-kit уже есть дизайн-система: брендовая палитра с семантикой двух тем, веб-шкала Montserrat, компоненты shadcn Maia на Base UI, HTML-слой Basecoat, фирменные каркасы, защита бренда линтерами и поставляемая с пакетами справка для агентов. Создавать эту основу заново не требуется.

Главный недостаток — несовпадение уровня формализации разных частей. Цвета хорошо структурированы и проверяются; размеры, геометрия, плотность и композиция преимущественно зашиты в компоненты. Справка местами обещает больше, чем проверяет реализация. Машиночитаемая информация уже есть, но ещё не образует версионированный контракт для внешнего агента.

Montserrat сохраняется. Проверка реального шрифта подтвердила поддержку табличных цифр. Доказательств, что его нужно заменить для основного текста или таблиц, не получено.

## 2. Метод и границы доказательств

- Прочитаны манифесты всех четырёх пакетов, исходники и генераторы токенов/CSS, конфигурация shadcn, все 61 файла модулей компонентов при инвентаризации, ключевые составные компоненты, каркасы, линтеры, тесты, CI и генераторы справки.
- История и старые планы использованы как контекст. Упоминание CLI, шаблона или проверки в плане не считается реализованной возможностью.
- Соседний `C:/A/mednet-playground/react` изучен только на чтение: README, package.json, реестр страниц и генератор API. Это внешний потребитель npm-пакетов, не часть текущей сборки кита. Его сайт не сертифицировался данным аудитом.
- Выполнены проверки типов, существующие тесты и `node scripts/build-agent-guides.mjs --check`. Результаты и ограничения — в §9.
- Выполнена выборочная браузерная проверка в Chrome `155.0.8059.84`: HTML-демо и временная SSR-выборка `Button`, `Input`, `Card`, `Table`, `Spinner`, `Skeleton`. Для выборки компоненты транспилированы из текущих TSX в памяти; CSS скомпилирован из текущих источников с токенами, вычисленными из исходных JSON/TS. Существующий `dist` не перезаписывался. Внутренние импорты SSR используют установленное окружение пакета; это не проверка полного приложения с гидратацией.
- Временные сценарий, JSON замеров и скриншоты находятся в системном Temp: `mednet-design-audit-20261104.mjs`, `mednet-design-audit-evidence.json`, `mednet-design-audit-light.png`, `mednet-design-audit-dark.png`. Существенные результаты перенесены в этот документ; Temp не является постоянным контрактом системы.
- Полный прогон интерактивных состояний 61 модуля, экранных дикторов, реальных мобильных устройств, Chrome 109, forced colors и zoom 200/400% не выполнен. По выборке нельзя заявить соответствие всей библиотеки WCAG.
- Исходный брендбук PDF не проверялся: происхождение цветов из векторных заливок подтверждается комментариями и исторической спецификацией проекта, а не повторным исследованием PDF.

Метки далее: **реализация** — наблюдаемый код/рендер; **документированное правило** — требование существующей справки, которое не обязательно обеспечивается автоматически; **риск** — возможное следствие, нуждающееся в контекстной проверке.

## 3. Архитектура и поставка

### 3.1. Пакеты

Корень — приватный pnpm workspace, ESM, Node `>=22.12`, `pnpm@10.34.6`. Задачи сборки/типов/тестов оркестрирует Turborepo. Рабочая локальная версия Node при аудите — `24.20.0`.

| Пакет, версия в исходниках  | Поставка и назначение                                                                         | Существенные особенности                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@mednet/tokens` 2.1.0      | ESM + `.d.ts`, CSS variables, Tailwind v4 theme, разрешённый JSON, исходные color JSON        | Не зависит от React; основа обоих визуальных слоёв                                                |
| `@mednet/css` 2.1.0         | Готовые `mednet.css`, min CSS, `mednet.js`, шрифты и демо; npm и CDN                          | Basecoat 1.0.2 Maia; самостоятельная сборка для новых HTML-сайтов, без Tailwind utilities         |
| `@mednet/ui` 2.1.0          | React ESM и `.d.ts`, публичные подпути, исходные CSS, `llms.md`, `stack.json`, PostCSS plugin | Компоненты потребитель устанавливает пакетом; генерация shadcn выполняется у сопровождающего кита |
| `@mednet/lint-config` 2.1.0 | Flat ESLint config, stylelint config, типы и справка                                          | Ограничения на импорты и цветовые литералы; не универсальный аудит UX/a11y                        |

Источники: [package.json](package.json), [pnpm-workspace.yaml](pnpm-workspace.yaml), [turbo.json](turbo.json), манифесты в `packages/{tokens,css,ui,lint-config}/package.json`.

Версии объединены `fixed: [["@mednet/*"]]` в [.changeset/config.json](.changeset/config.json). Релизы — Changesets и GitHub trusted publishing, не локальный publish. Изменение существующего внешнего вида бренда требует major по [docs/releasing.md](docs/releasing.md). Номера выше — состояние репозитория; фактическая последняя версия npm/CDN не проверялась.

### 3.2. shadcn, Base UI и registry

[packages/ui/components.json](packages/ui/components.json): `base-maia`, `rsc: true`, TSX, neutral baseColor, CSS variables, lucide, без Tailwind JS config. Внутренние aliases — `#components`, `#hooks`, `#lib`.

Зафиксирован shadcn CLI `4.21.4`; зависимости включают `@base-ui/react ^1.9.0`, `@shadcn/react ^0.3.1`, CVA и `cn`. Публичные peer-диапазоны: React/React DOM `^19.2.0`, Tailwind `^4.3.0`, Lucide `^1.57.0`, DayPicker `^10.0.2`, Recharts `^3.8.0`. Диапазон в package.json не равен точно установленной версии.

`generate` вызывает `shadcn add --all -y --overwrite`, затем [postgen.mjs](packages/ui/scripts/postgen.mjs): собственный `cn` и русские подписи из `ru-labels.json`. SVG логотипов и индекс имеют отдельные генераторы. Это точки сопровождения; `src/components/**` и остальные отмеченные в AGENTS генерируемые файлы не являются местом ручной правки.

Потребитель пользуется `@mednet/ui/button`, `@mednet/ui/dialog` и т. д. Локального публичного shadcn registry mednet, `registry.json` и namespace с поставкой компонентов в проект не найдено. `components.json` кита — конфигурация upstream-генерации, а `stack.json` — карта библиотек; ни один из них не является registry меднет-компонентов. npm registry уже используется как основной канал распространения.

Композиция Base UI — `render`, не Radix `asChild`. Для обычной ссылки справка рекомендует `<a className={buttonVariants(...)}>`; внутренний `PaginationLink` использует контролируемый вариант `Button` с `nativeButton={false}`. Агенту нельзя превращать эту внутреннюю реализацию в универсальную рекомендацию `Button render={<a />}` без проверки семантики.

### 3.3. CSS и совместимость

React [styles.css](packages/ui/src/styles.css) задаёт порядок layers: theme/base/components/utilities; `brand.css` включён в utilities до генерируемых утилит. Дальше подключаются тема токенов, `tw-animate-css`, vendored shadcn CSS и `@source '../dist'`.

HTML [mednet.css](packages/css/src/mednet.css): Tailwind `source(none)` → Basecoat Maia → тема → база → overrides. Полный CSS включает preflight и пересекающиеся с Bootstrap имена классов. Для существующих чужих сайтов документирован безопасный путь через переменные `--mn-*`, а не подключение всего CSS.

Chrome/Edge 109 — требование проекта с PostCSS-плагином [postcss.cjs](packages/ui/postcss.cjs). Он понижает часть современных цветовых выражений, исправляет fallback `var()` и backdrop; не полифиллит относительные цвета, starting-style и field-sizing. `bubble` и `shimmer` имеют документированное ограничение для старых браузеров. Наличие плагина не доказывает совместимость всего приложения.

## 4. Фактические foundations

### 4.1. Цвета, темы и токены

Цепочка источников: [brand.ts](packages/tokens/src/brand.ts) + [scale.ts](packages/tokens/src/scale.ts) → генерируемый `tokens/primitives.json`; ручные aliases — `tokens/semantic.json` и `tokens/semantic.dark.json`; нецветовые значения — [base.ts](packages/tokens/src/base.ts). `load.ts` проверяет ссылки, `emit.ts` создаёт CSS, JS, типы и разрешённый JSON.

Текущее исходное дерево содержит **105 color primitives**, **47 semantic tokens** и полный результат **47 dark semantic tokens**. Восемь брендовых шкал имеют шаги 50–950; отдельно graphite, danger, white/black. Брендовый красный 500 — `#d6867f`, но primary выбран на более контрастной ступени 600.

| Роль                    | Светлая тема                                                        | Тёмная тема                                | Источник             |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------ | -------------------- |
| background / foreground | white / graphite-900                                                | graphite-950 / graphite-100                | semantic JSON        |
| card, popover           | white                                                               | graphite-900                               | semantic JSON        |
| primary                 | red-600 `#b55c57`                                                   | red-400 `#db968f`                          | semantic JSON        |
| primary-hover           | red-700 `#a55551`                                                   | red-300 `#e0a5a0`                          | semantic JSON        |
| primary-foreground      | white                                                               | graphite-950                               | semantic JSON        |
| secondary, muted        | beige-100                                                           | graphite-800 / graphite-900 соответственно | semantic JSON        |
| muted-foreground        | graphite-600                                                        | graphite-300                               | semantic JSON        |
| accent                  | red-100                                                             | red-900                                    | semantic JSON        |
| destructive / muted     | danger-600 / danger-100                                             | danger-300 / danger-900                    | semantic JSON        |
| success                 | green-700                                                           | green-400                                  | semantic JSON        |
| info                    | blue-600                                                            | blue-400                                   | semantic JSON        |
| warning                 | orange-800                                                          | orange-400                                 | semantic JSON        |
| border                  | beige-300                                                           | graphite-700                               | semantic JSON        |
| input / field           | graphite-400 / white                                                | graphite-400 / graphite-900                | semantic JSON        |
| ring                    | blue-600                                                            | blue-400                                   | semantic JSON        |
| chart-1…8               | blue, red, green, orange, violet, yellow, peach, beige, ступень 500 | те же значения                             | dark наследует light |

Есть `*-foreground` и `*-muted` для статусов, а также отдельный набор sidebar. Стандартная цветовая палитра Tailwind сбрасывается; нецветовые namespaces Tailwind целиком не сбрасываются.

JSON исходников использует DTCG-подобное дерево цветовых значений и aliases. `dist/tokens.json` — **разрешённый прикладной формат**, не исходное дерево DTCG. Нецветовые токены уже входят в JS/JSON; отдельный новый token engine не нужен. Комментарий `base.ts`, что тени с прозрачностью нельзя выразить в DTCG без потерь, слишком широк: формат 2025.10 содержит shadow и alpha. `clamp()` требует отдельного представления/расширения. Полная стандартизованная валидация DTCG сейчас не обнаружена. [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/).

### 4.2. Типографика

Montserrat self-hosted: нормальные начертания 500, 600, 700. React импортирует `@mednet/ui/fonts.css` из кода приложения, отдельно от Tailwind CSS; причина с путями Vite документирована и покрыта тестами. HTML сборка включает latin/cyrillic woff2 с unicode-range и OFL. Курсив и 400 в штатной поставке не подключаются.

| Токен | Точное значение размера                      | Line-height | Вес из роли                                |
| ----- | -------------------------------------------- | ----------- | ------------------------------------------ |
| xs    | `0.8125rem`                                  | 1.4         | body 500, если компонент не переопределяет |
| sm    | `0.875rem`                                   | 1.5         | body 500                                   |
| base  | `1rem`                                       | 1.5         | body 500                                   |
| lead  | `clamp(1.0625rem, 1rem + 0.2vw, 1.125rem)`   | 1.5         | body 500                                   |
| h4    | `clamp(1.25rem, 1.125rem + 0.3vw, 1.375rem)` | 1.3         | 600                                        |
| h3    | `clamp(1.5rem, 1rem + 0.8vw, 1.75rem)`       | 1.25        | 600                                        |
| h2    | `clamp(1.75rem, 1rem + 1.4vw, 2.25rem)`      | 1.2         | 600                                        |
| h1    | `clamp(2rem, 1rem + 2.2vw, 3rem)`            | 1.15        | 700                                        |

При корне 16 px это xs 13, sm 14, base 16; fluid-пределы h1 32–48, h2 28–36, h3 24–28, h4 20–22, lead 17–18 px. Предел не означает точного значения при 1440 px: h1 реально 47.68 px, h3 — 27.52 px. Временная браузерная выборка подтвердила h1 32 px при 390/320, 32.896 px при 768 и 47.68 px при 1440.

`text-h*` задаёт размер, интерлиньяж и вес. В React голые h1–h4 получают вес, но не размер; HTML base.css задаёт им всю шкалу. Это различие надо знать при переносе разметки между слоями.

Исключения: `CardTitle` — div, 16/24 и weight 500, `FieldDescription`/`FieldError` запрашивают `font-normal` 400; calendar использует `text-[0.8rem]` (12.8 px). 400 отсутствует среди подключённых faces: запрос веса не гарантирует отдельного реального начертания 400. Chart tooltip уже применяет системный `font-mono` и `tabular-nums`. В `FONT.display` есть Bebas Neue с fallback Montserrat, но сам Bebas не поставляется. Таким образом, «везде только один font/weight/scale» — упрощение справки, не точное описание всех компонентов.

QuestionnaireProgress также уже применяет `tabular-nums`: формализация числовых ролей обобщает существующее применение, а не создаёт его с нуля.

### 4.3. Размеры, отступы, геометрия

| Объект                       | Реализация при стандартном корне 16 px                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| База spacing Tailwind        | `0.25rem` = 4 px; присутствуют половинные шаги 6/10/14 px и др.                                                                         |
| Button                       | xs 24, sm 32, default 36, lg 40 px; icon-размеры соответствуют этим высотам                                                             |
| Input                        | 36 px; текст 16 px до md, 14 px от md                                                                                                   |
| SelectTrigger / NativeSelect | default 36, sm 32 px                                                                                                                    |
| Textarea                     | минимальная высота и автоподбор размера; отдельного общего density API нет                                                              |
| Table                        | text-sm; TableHead h-12 (48 px), TableCell p-3; высота строки зависит от содержимого                                                    |
| Card                         | padding/gap 24 px; `size="sm"` — 16 px                                                                                                  |
| FieldGroup / FieldSet        | gap-7 (28) / gap-6 (24); вложенные группы и checkbox/radio имеют исключения                                                             |
| Checkbox / Radio             | видимая часть 16 px; `::after` расширяет область попадания, есть композиция с label                                                     |
| Switch                       | видимая часть 32×18.4 или 24×14 px; `::after` расширяет область попадания                                                               |
| Questionnaire actions        | На узком экране Next/Previous/Skip/Submit используют min-h-11 (44px), от sm возвращаются к размеру кнопки; локальное responsive правило |
| Sidebar                      | 16rem desktop, 18rem mobile, 3rem icon; breakpoint hook 768 px                                                                          |

Значения размеров подтверждены исходниками `button`, `input`, `select`, `native-select`, `table`, `card`, `field`, `checkbox`, `radio-group`, `switch`, `sidebar` и `hooks/use-mobile.ts`. Высоты кнопок и Input проверены в браузерной выборке; viewport-отсутствие overflow этой выборки не относится к произвольному приложению.

`RADIUS = 1rem`; генератор темы задаёт sm = radius−4px (12), md = radius−2px (14), lg = radius (16), xl = radius+4px (20). Но остаются стандартные Tailwind 2xl = 16, 3xl = 24, 4xl = 32 px. Получается **xl 20 > 2xl 16**. Card использует 2xl, его части — xl; Button/Input/Dialog — 4xl; checkbox — буквальные 6 px. Это работающая смешанная система, а не единая возрастающая шкала от `--radius`.

Тени бренда определены только для sm/md/lg, тёплые, с RGB 166/153/138 и прозрачностью 0.16/0.22/0.28. `DropdownMenu`, Select и ряд floating-компонентов используют `shadow-2xl`; chart tooltip — `shadow-xl`. Эти ступени остаются стандартными чёрными тенями Tailwind. Не все тени компонентов тёплые.

### 4.4. Layout и responsive

- `PublicLayout`: skip link, SiteHeader, один main `id="main"`, SiteFooter; не задаёт max-width самому содержимому main.
- SiteHeader/SiteFooter: `max-w-7xl` (80rem), gutter 16/24 px, flex-wrap; логотип меняется с mark на horizontal от sm.
- `AppShell`: Sidebar, header h-14, content p-4/md:p-6; SidebarInset уже main. Заголовок панели — div, не h1 страницы.
- Sidebar: мобильный Sheet ниже 768 px, desktop collapse, клавиатурный shortcut, cookie состояния.
- Tailwind breakpoints наследуются: sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem. Field дополнительно использует container query `@md/field-group`: это не viewport md.
- Table имеет локальный `overflow-x-auto` и nowrap в ячейках. Нет готового DataTable с сортировкой, моделью selection и виртуализацией. Нет зафиксированной обязательной 12-колоночной сетки.

Источники: `src/layouts/*`, `src/brand/site-{header,footer}.tsx`, `src/components/{sidebar,field,table,dialog}.tsx`, установленный `tailwindcss/theme.css`.

## 5. Инвентаризация компонентов, вариантов и состояний

Ниже все **61 исходный модуль** `packages/ui/src/components/<имя>.tsx`. Это число файлов модулей, не число React-компонентов: каждый может экспортировать много частей. Автоматический подсчёт export-блоков даёт 371 имя, включая hooks/values/type-экспорты; это не 371 отдельный визуальный контрол.

«База» в таблице означает API соответствующего primitive/движка; не отсутствие состояний. Ниже перечислены собственные конечные варианты кита, но не все наследуемые props библиотек.

| Модуль           | Собственные варианты / существенное поведение                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accordion        | single/multiple и состояние открытия — Base UI; trigger/content                                                                                             |
| alert-dialog     | Content size default/sm; action/cancel/media, модальное подтверждение                                                                                       |
| alert            | variant default/destructive; title/description/action                                                                                                       |
| aspect-ratio     | ratio; пропорции содержимого                                                                                                                                |
| attachment       | size default/sm/xs; orientation horizontal/vertical; media icon/image; state idle/uploading/processing/error/done                                           |
| avatar           | size default/sm/lg; image/fallback/group/badge                                                                                                              |
| badge            | default/secondary/destructive/outline/ghost/link                                                                                                            |
| breadcrumb       | список, link/page/separator/ellipsis; текущая страница                                                                                                      |
| bubble           | default/secondary/muted/tinted/outline/ghost/destructive; align start/end; reactions top/bottom                                                             |
| button-group     | orientation horizontal/vertical; объединение скруглений                                                                                                     |
| button           | default/outline/secondary/ghost/destructive/link; size default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg                                                        |
| calendar         | DayPicker, single/range/multiple через API движка; locale задаёт потребитель                                                                                |
| card             | size default/sm; header/title/action/content/footer                                                                                                         |
| carousel         | orientation horizontal/vertical; Embla opts/API, previous/next                                                                                              |
| chart            | Container/config/Tooltip/Legend/Style; Recharts, не отдельный chart engine                                                                                  |
| checkbox         | checked/indeterminate/disabled/invalid через Base UI                                                                                                        |
| collapsible      | open/closed; trigger/content                                                                                                                                |
| combobox         | Base UI; single/multiple, list/items/chips/empty; не cmdk                                                                                                   |
| command          | cmdk; поиск, группы, empty, dialog                                                                                                                          |
| context-menu     | Item default/destructive; checkbox/radio/submenu                                                                                                            |
| dialog           | showCloseButton; portal/overlay/header/footer/title/description                                                                                             |
| direction        | DirectionProvider/useDirection; не визуальный компонент                                                                                                     |
| drawer           | Base UI Drawer; swipe handle и составные части                                                                                                              |
| dropdown-menu    | Item default/destructive; checkbox/radio/submenu                                                                                                            |
| empty            | EmptyMedia variant default/icon; title/description/content                                                                                                  |
| field            | orientation vertical/horizontal/responsive; Legend legend/label; ошибки и группы                                                                            |
| hover-card       | позиционирование и открытие — Base UI                                                                                                                       |
| input-group      | Addon align inline-start/inline-end/block-start/block-end; Button xs/sm/icon-xs/icon-sm                                                                     |
| input-otp        | maxLength/pattern и активные slots — input-otp                                                                                                              |
| input            | native input props; собственного size variant нет                                                                                                           |
| item             | default/outline/muted; size default/sm/xs; Media default/icon/image                                                                                         |
| kbd              | Kbd/KbdGroup; подсказка клавиш                                                                                                                              |
| label            | подпись поля и disabled styling                                                                                                                             |
| marker           | default/separator/border; icon/content                                                                                                                      |
| menubar          | trigger, menu, checkbox/radio/submenu — Base UI                                                                                                             |
| message-scroller | provider/viewport/content/item/button и hooks — @shadcn/react                                                                                               |
| message          | align start/end; header/content/footer/avatar                                                                                                               |
| native-select    | size sm/default; native option/optgroup                                                                                                                     |
| navigation-menu  | link/trigger/content/positioner; viewport и позиционирование                                                                                                |
| pagination       | isActive; размеры Button; Previous/Next text и русские имена                                                                                                |
| popover          | side/align/offset; header/title/description                                                                                                                 |
| progress         | value/max и состояние — Base UI; track/indicator/label/value                                                                                                |
| questionnaire    | @shadcn/react; Item/Choice/Choices/Input/Error, Next/Previous/Skip/Submit/Progress; действия используют buttonVariants; Progress уже применяет tabular-nums |
| radio-group      | group/items, checked/disabled/invalid — Base UI                                                                                                             |
| resizable        | group/panel/handle, withHandle; размеры — API react-resizable-panels                                                                                        |
| scroll-area      | viewport/scrollbar; orientation scrollbar                                                                                                                   |
| select           | Trigger size sm/default; positioner, items/groups/value                                                                                                     |
| separator        | orientation; декоративная/семантическая линия — primitive                                                                                                   |
| sheet            | side top/right/bottom/left; modal parts                                                                                                                     |
| sidebar          | side left/right; variant sidebar/floating/inset; collapsible offcanvas/icon/none; MenuButton default/outline, size default/sm/lg                            |
| skeleton         | animate-pulse; собственных density variants нет                                                                                                             |
| slider           | value/range/orientation, track/range/thumb — Base UI                                                                                                        |
| spinner          | SVG role status, русское имя «Загрузка», animate-spin                                                                                                       |
| switch           | size sm/default; checked/disabled/invalid — Base UI                                                                                                         |
| table            | native table parts; row selected/expanded/hover; только примитив таблицы                                                                                    |
| tabs             | List default/line; horizontal/vertical; active/disabled                                                                                                     |
| textarea         | native textarea props; field-sizing-content/min-height                                                                                                      |
| toast            | Base UI manager `toast`, Toaster и parts; success/info/warning/error/loading feedback                                                                       |
| toggle-group     | orientation horizontal/vertical; наследует variant/size Toggle                                                                                              |
| toggle           | default/outline; size default/sm/lg; pressed/disabled/invalid                                                                                               |
| tooltip          | Provider delay default 0; side/align/offset; popup/arrow                                                                                                    |

Дополнительно пять публичных фирменных модулей: Logo (horizontal/vertical/mark), SiteHeader, SiteFooter, PublicLayout, AppShell. `utils` — отдельный экспорт; SkipLink входит в каркасы, самостоятельного публичного подпути для него нет. Полный индекс экспортов генерируется `gen-index.mjs`, а список в справке — `build-llms.mjs` из `.d.ts`.

Состояния распределены по семействам:

- Контролы: hover, focus-visible, active/pressed, disabled, aria-invalid; некоторые expanded/checked/selected.
- Floating: open/closed, placement, collision/available size, entry/exit animations; focus management обеспечивает primitive, корректную композицию и имена — потребитель.
- Данные: Skeleton/Spinner/Progress/Empty/Alert/Toast существуют, но единого data-state автомата и встроенного pending у Button нет.
- Приложение: loading, empty, filtered-empty, error, success и destructive confirmation описаны как рецепты в общей UX-справке, не встроены автоматически в Table/Card.

## 6. Аудит по десяти категориям

### 6.1. Типографика и иерархия

**Реализация:** §4.2; fluid h1–h4, body 500, component text преимущественно sm. **Сильное:** кириллица, self-hosting, раздельные размеры/веса заголовков, сохранение бренда.

**Несогласованности:** React и HTML по-разному стилизуют голые headings; CardTitle не равен page heading; запросы 400 при поставке 500/600/700; 12.8 px в calendar; mono в chart против упрощённого «один шрифт».

**Недостаёт:** таблицы семантических ролей для UI labels, secondary text, prose, KPI и данных; правил длины строки и числовой типографики. **Риски:** агент увеличит CardTitle до h2 или уменьшит весь интерфейс ради плотности; числовые столбцы будут «прыгать».

**Рекомендация:** сохранить шкалу, описать роли поверх неё и точные исключения; отдельно проверить 400 и курсив, не добавляя их автоматически. Для чисел сначала `tabular-nums`, выравнивание и форматирование. Источники: `tokens/src/base.ts`, `ui/src/{fonts,styles}.css`, `css/src/base.css`, компоненты card/field/calendar/chart.

### 6.2. Отступы и визуальный ритм

**Реализация:** стандартная база Tailwind 4 px с половинными шагами, локальные размеры Maia; Card 24/16, FieldGroup 28, FieldSet 24. **Сильное:** повторяемые интервалы и готовая внутренняя композиция компонентов.

**Несогласованности:** в справке «шкала 4 px» может быть прочитана как запрет 6/10/14; интервалы формы не выражены отдельными token roles. **Недостаёт:** смысловых уровней inline/field/group/section и объяснения исключений.

**Риски:** локальное «исправление» generated padding уничтожит Maia; равные промежутки между несвязанными и связанными блоками ухудшат группировку. **Рекомендация:** документировать существующие интервалы, предложить роли для внешней композиции; не переписывать внутренний spacing ради математической сетки. Источники: card/field/item/input-group, `docs/agent-guide/brand.md`, установленная тема Tailwind.

### 6.3. Layout, сетки и композиция

**Реализация:** два каркаса, header/footer containers, адаптивный Sidebar, локальные flex/grid/container queries. **Сильное:** готовые landmarks и разделение публичного/прикладного интерфейса.

**Несогласованности:** ограничение ширины header/footer не распространяется на PublicLayout main; «заголовок панели» AppShell не создаёт h1. **Недостаёт:** ролей content/prose/form/data canvas, шаблонов toolbar и master-detail с правилами overflow.

**Риски:** main окажется бесконечно широким; появятся два main или пропадёт h1; длинная строка фильтров вытолкнет страницу. **Рекомендация:** несколько документированных оболочек композиции с существующими utilities, без новой обязательной grid-библиотеки. Источники: layouts, site-header/footer, field/table; `docs/agent-guide/ux.md`.

### 6.4. Цветовая семантика и доступность

**Реализация:** 32 пары проверяются тестами в обеих темах; primary отделён от destructive, blue ring от validation error; имеются status roles. **Сильное:** alias-источник, контрастные text pairs и целевые overrides для hover primary и inactive tabs.

**Несогласованности:** эти тесты не покрывают все полупрозрачные состояния, соседние цвета графиков и произвольную композицию; chart palette одинакова в темах. **Недостаёт:** матрицы applied-state contrast, назначения chart colors/series, правил смешения с opacity.

**Риски:** формулировка «всё проверено AA» будет перенесена на любой график или focus ring. **Рекомендация:** сохранить семантику и палитру; добавить проверку реально отрисованных состояний и графиков. Низкий contrast декоративного border сам по себе не равен дефекту всех компонентов. Источники: `tokens/src/pairs.ts`, semantic JSON, token semantic tests, ui brand.css, css overrides.css, chart.tsx; расчёты §7.

### 6.5. Анатомия и согласованность компонентов

**Реализация:** составные parts, CVA и Base UI render; generated upstream + узкий postgen + CSS overrides. **Сильное:** предсказуемый API и отделение поведения от бренда; `cn` знает размеры шрифта кита.

**Несогласованности:** HTML primary называется `primary` или отсутствием data-variant, React — `default`; size/default зависит от конкретной части; radius xl/2xl не упорядочен, тени не все брендовые. **Недостаёт:** machine metadata по частям, supported/default props и соответствию HTML/React.

**Риски:** несуществующий `Input size="sm"`, неправильный asChild, импорт primitive напрямую, переписывание generated source. **Рекомендация:** генерируемая metadata и небольшое ручное дополнение по смыслу/ограничениям; карта визуального паритета, не требование одинакового DOM/API. Источники: components.json, postgen, lib/utils, brand.css/overrides.css, build-llms.mjs.

### 6.6. Размеры и плотность

**Реализация:** Button 24/32/36/40, часть контролов sm/default, Card sm/default, variable-height Table. **Сильное:** полезные локальные размеры без искусственного единого размера для всех объектов.

**Несогласованности:** глобального compact/comfortable/touch нет; sm означает разное у разных семейств; видимые checkbox/radio не равны hit area. **Недостаёт:** описанного density profile и состава допустимых комбинаций.

**Риски:** агент добавит выдуманный `density` prop или сочтёт 16px checkbox автоматическим нарушением WCAG, не проверив label/after. **Рекомендация:** сначала описать существующие комбинации; новую touch-высоту или глобальное переключение плотности согласовывать отдельно. Источники: button/input/select/card/table/switch/checkbox/radio/sidebar, UX guide.

### 6.7. Состояния, движение и feedback

**Реализация:** контролы и overlays имеют state classes; status primitives и manager toast; motion tokens 150/250 ms и easing. **Сильное:** готовые loading/empty/error building blocks, русские служебные подписи, правила undo/confirmation.

**Несогласованности:** generated overlays используют duration-100, Sidebar — duration-200, NavigationMenu — собственные duration/easing. Уменьшение token durations не отключает все анимации React. HTML overrides имеют более широкий reduced-motion override.

**Недостаёт:** applied motion matrix, правила pending на действии и контракта объявления асинхронных статусов. **Риски:** повторная отправка, недоступное движение, тост как единственное сообщение ошибки. **Рекомендация:** синхронизировать документацию и поведение reduced motion; описать pending/error композиции. Это будущая правка через разрешённые слои, не ручной рефакторинг generated компонентов. Источники: base.ts/emit.ts, spinner/skeleton/dialog/sidebar/navigation-menu/toast, css overrides; замер §7.

### 6.8. Адаптивность

**Реализация:** fluid headings, viewport breakpoints, container-responsive fields, mobile Sheet Sidebar, local table scrolling. **Сильное:** основа mobile-first и сохранение отдельных размеров текста Input на небольшом экране.

**Несогласованности:** hook имеет фиксированные 768 px, CSS md задан rem; при изменении корневого размера возможна граница рассогласования. Header wraps, но готового мобильного меню для длинной публичной навигации нет.

**Недостаёт:** матрицы длинных русских названий, zoom/reflow, content overflow и touch. **Риски:** потеря действий в header и разрастание фильтров; nowrap данных требует локального scroll. **Рекомендация:** фиксировать поведение по содержимому и отдельно проверять 320 CSS px, 200% текста и эквивалент 400% zoom; исключение для двумерных таблиц не переносить на всю страницу. Источники: use-mobile, Sidebar, SiteHeader, Field, Table, Dialog; [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

### 6.9. UX-семантика и доступность

**Реализация:** Base UI primitives, labels/FieldError, русские default names, skip links/main, UX M/S-рецепты. **Сильное:** не только visual tokens, но и явные правила форм, ошибок, destructive actions и screen states.

**Несогласованности:** `Field` — собственная композиционная обёртка; label/description/error связи должен задать потребитель. CardTitle — div. Наличие primitive не обеспечивает правильного accessible name, chart summary или server validation.

**Недостаёт:** проверенных keyboard/screen-reader сценариев и конкретных примеров `aria-describedby`, summary focus, `aria-busy`, table caption/scope/sort. В собственном lint-config нет полного набора a11y rules: часть может приходить из конфигурации приложения.

**Риски:** неверная семантика ссылки/кнопки, потеря фокуса после ошибки/закрытия, объявление pending отсутствует. **Рекомендация:** сделать проверяемые рецепты форм, dialogs и таблиц; отличать норму WCAG от более строгого локального правила. Например, WCAG 2.5.8 допускает контекстные исключения и spacing для меньших целей; локальное M «24×24» строже. Источники: ux.md, field, pagination, dialog/alert-dialog, layouts, lint configs; [W3C Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### 6.10. Идентичность и целостность

**Реализация:** тёплая нейтральная основа, salmon action, graphite text, pastel chart palette, Montserrat medium, rounded Maia, Lucide outline, фирменные SVG и русская терминология. **Сильное:** узнаваемость, отсутствие конкурирующих UI-библиотек, отдельные правила логотипа и темы.

**Несогласованности:** общие заявления о тёплых тенях, единой шкале и отключении движения не описывают все исключения upstream. Нецветовая идентичность защищается слабее цвета: линтер не обеспечивает правильную иерархию/плотность.

**Недостаёт:** проверенного визуального эталона и визуального change-review после удаления docs app. **Риски:** формально валидный по линтеру экран будет выглядеть чужим; обновление Maia изменит геометрию незаметно.

**Рекомендация:** закрепить текущий эталон в playground и выстроить review вокруг baseline, не заменять Montserrat/палитру «более современными». Источники: docs/agent-guide/brand.md, tokens/brand.ts/base.ts, ui brand/layouts и генераторы logo, .github/workflows/ci.yml.

## 7. Проверки контраста и Montserrat

### 7.1. Контраст из текущих исходных значений

Расчёт выполнен `culori.wcagContrast` на результате `loadTokens`, без изменения порогов. Ниже округление только для отчёта; принимать пороговые решения нужно по неокруглённому значению.

| Пара                                  | Light   | Dark    |
| ------------------------------------- | ------- | ------- |
| foreground / background               | 12.63:1 | 15.12:1 |
| primary-foreground / primary          | 4.53:1  | 6.88:1  |
| primary-foreground / primary-hover    | 5.23:1  | 7.90:1  |
| muted-foreground / muted              | 5.16:1  | 8.52:1  |
| input / field                         | 3.45:1  | 3.66:1  |
| ring / background, непрозрачный токен | 5.12:1  | 6.27:1  |
| border / background                   | 1.39:1  | 2.11:1  |

Для chart-1…8 против light background: **3.11, 2.77, 2.04, 2.32, 2.68, 1.38, 1.66, 1.57**. В dark: **5.30, 5.95, 8.09, 7.10, 6.15, 11.95, 9.90, 10.52**. Соседние серии и подписи этими числами не проверены.

Вывод: текстовые semantic pairs выбраны осмысленно, но пастельные цвета графиков требуют проверки конкретного кодирования информации — контуры, маркеры, patterns, labels/таблица данных. Не следует автоматически затемнять всю палитру: требование зависит от того, какая графическая информация необходима для понимания. [W3C Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

В focus Button отрисовывается синий border и 3px ring с alpha 0.5; проверка непрозрачного ring не проверяет фактический composite. Нужно проверять сочетание всей индикации и фона. Это не утверждение, что все фокусы не соответствуют стандарту.

### 7.2. Пригодность Montserrat

**Подтверждено:** кириллица и latin реально загружаются; body weight 500; в выборке Input 16px на узком viewport и 14px на md+, Button default 14/21, CardTitle 16/24, Table 14/21. В протестированной SSR-выборке при ширинах 320/390/768/1440 px документ не имел горизонтального overflow.

В Chrome при Montserrat 500, 32 px, ширины отдельных цифр `0…9` в обычном режиме были приблизительно **21.359, 11.844, 18.375, 18.313, 21.422, 18.375, 19.750, 19.141, 20.609, 19.750 px**. С `font-variant-numeric: tabular-nums` все десять имели ширину **22.406 px**. Это измерение конкретной поставки и браузера, не обещание идентичных метрик на всех платформах.

**Следствие:** для сравниваемых числовых столбцов и изменяющихся KPI полезен `tabular-nums`, но он расширяет часть цифр. Для длинных ID нужно отдельно оценивать ширину и переносы. `font-mono` не требуется автоматически ради выравнивания цифр; он уже допустим в конкретной реализации chart tooltip.

**Гипотезы для проверки:** широкий набор и weight 500 могут ограничивать плотность длинных русских названий, таблиц и prose. Они не доказывают плохую читаемость. Нужны сравнения в одном и том же Montserrat с изменением размера, leading, ширины колонки и tabular-nums, а не немедленная смена семейства. Официальная страница семейства описывает доступные веса/начертания; она не заменяет исследование читаемости продукта. [Fontsource Montserrat](https://fontsource.org/fonts/montserrat).

**Непроверенное:** скорость чтения, ошибки различения `0/О`, `1/I/l`, знаков минуса/тире и десятичных разделителей; удобство длинного текста; low-vision use; рендер в Chrome 109 и мобильном Safari. Поэтому рекомендация — сохранить шрифт и провести небольшой целевой типографический пилот.

### 7.3. Reduced motion

На CSS из текущих источников при `prefers-reduced-motion: reduce` получено:

| Объект         | Результат                         |
| -------------- | --------------------------------- |
| Button default | transition-duration 0s            |
| Spinner        | animation-name spin, duration 1s  |
| Skeleton       | animation-name pulse, duration 2s |

Причина в наблюдаемом коде: tokens обнуляют `--mn-duration-*`; `animate-spin`/`animate-pulse` используют другие duration. У React нет общего override, аналогичного `packages/css/src/overrides.css`. Для shimmer отдельная reduced-motion обработка уже есть. Это подтверждённый разрыв между общей справкой и проверенной выборкой, а не предположение о поведении всех анимаций.

## 8. Документация, тесты, CLI и знания агентов

### Уже реализовано

- Общие источники: `docs/agent-guide/{map,lint,brand,ux}.md`.
- Вводные источники: `packages/{tokens,css,lint-config}/llms/intro.md`, `packages/ui/llms/{intro,brand}.md`.
- `scripts/build-agent-guides.mjs` собирает и проверяет tracked llms трёх пакетов; ui build собирает игнорируемый в git `packages/ui/llms.md` из текстов, stack.json и собранных `.d.ts`.
- В ui есть явные exports `./llms.md`, `./stack.json`, `./package.json`; остальные пакеты поставляют llms через `files`, но отдельный llms subpath не объявляют.
- README ui содержит snippet для ручного подключения справки через AGENTS.md и предупреждение про путь приложения в monorepo.
- `stack.json` содержит 16 записей с ролями, docs/llms URL и способом употребления; версии добавляет `scripts/stack.mjs` из package.json. Это карта стека, не schema props/variants.
- В `C:/A/mednet-playground/react/scripts/gen-api.mjs` уже есть TypeScript-based извлечение props, собственных defaults, inherited defaults и CVA order; дополнения — `src/api-ru.json`. Есть gen-api/check-api/check-demos и браузерные verify-docs/verify-overlays. README ссылается на генерацию llms для сайта, но фактический актуальный scripts list нужно считать точнее старых формулировок.

### Не найдено в текущем дереве кита

- Исполняемый mednet CLI, поле `bin` в пакетах, команды `agent install`, `agent sync`, `doctor`.
- Поставляемые kit SKILL.md и автоматическая установка в `.agents/skills`.
- Версионированная schema общей knowledge metadata, lock установки, manifest композиционных рецептов и поддерживаемых вариантов.
- Storybook/CSF stories; полнофункциональный DataTable; действующий docs frontend в этом репозитории.
- Действующий shadcn registry mednet. Старые `@mednet/create-app`/Next/Astro планы не дают основания объявлять эти возможности доступными.

Upstream уже имеет skill shadcn, а установленный CLI поддерживает docs/view/search/info/registry/mcp; его `diff` помечен deprecated в пользу `add <component> --diff`. Не нужно создавать копию shadcn discovery или ещё один базовый skill с теми же API. Generic upstream workflow, который устанавливает и кастомизирует исходники, требует ограничения для package-based mednet. [shadcn Skills](https://ui.shadcn.com/docs/skills).

## 9. Состояние проверок и артефактов

| Проверка                                              | Наблюдаемый результат                      | Что она доказывает / не доказывает                                                                              |
| ----------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `pnpm -r --no-bail --filter './packages/*' typecheck` | exit 0 для четырёх пакетов                 | Типы исходников проходят; не визуальная приёмка                                                                 |
| Тесты `@mednet/ui`                                    | 11 test files, 310 passed                  | Успешный выполненный набор; не доказательство свежести всех игнорируемых артефактов и не browser matrix         |
| Тесты `@mednet/lint-config`                           | 1 file, 4 passed                           | Проверены fixtures, включая интеграцию с Next; есть warning про отсутствующий pages directory тестового проекта |
| Тесты `@mednet/tokens`                                | 3 failures в exports.test.ts               | В локальном dist отсутствуют semanticDark и dark CSS; остальные файлы source-проверок отмечены прошедшими       |
| Тесты `@mednet/css`                                   | 2 failed, 43 passed                        | Dist не содержит актуальный набор dark tokens и override native select                                          |
| `node scripts/build-agent-guides.mjs --check`         | exit 0                                     | Три tracked llms соответствуют общим текстам; это не проверка сгенерированного ui llms                          |
| Браузерная выборка из источников                      | выполнена; runtime page errors отсутствуют | Высоты, основные цвета, размеры текста, tnum и reduced-motion выборки; без гидратации/полного keyboard flow     |

Локальный `tokens/dist` содержит 103 примитива и не содержит `semanticDark`, хотя исходники дают 105 и обе темы. Баннер CSS dist — v2.0.1 при source package 2.1.0. Игнорируемый ui llms при прямом чтении не содержал текущих разделов стека и UX. Эти факты требуют свежей согласованной сборки перед дальнейшей реализацией; данные об успешном наборе тестов нельзя превращать в утверждение «все файлы готовы к публикации».

Сборка/генерация существующих артефактов намеренно не запускалась: в этой фазе запрещены изменения токенов и стилей. Отсутствие свежей сборки не доказывает дефект опубликованного npm-пакета. Реестр npm, release workflow и текущий production сайт не проверялись и не изменялись.

В CI реально один job: format, build/typecheck/test. Screenshot/axe/Chrome109 jobs отсутствуют после удаления apps/docs. Упоминания docs build в корневом README и screenshot/axe/Chrome109 CI в releasing.md устарели. `apps/*` в workspace glob не доказывает наличие приложения.

## 10. Приоритетные находки

| ID  | Находка                                                                | Приоритет                  | Первая мера                                                                                              |
| --- | ---------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| F01 | Исходники и ignored dist/llms расходятся                               | P0 для дальнейшей проверки | Получить воспроизводимую свежую сборку в следующей разрешённой фазе; отличать source/package/site версии |
| F02 | Reduced motion React не соответствует общей формулировке справки       | P1                         | Добавить state matrix и согласовать устранение разрыва в обоих слоях                                     |
| F03 | Немонотонные radius aliases и смешанные warm/default shadows           | P1                         | Зафиксировать фактическую карту; менять значения только после визуального решения                        |
| F04 | Типографические роли/исключения и числовые данные недостаточно описаны | P1                         | Сохранить Montserrat, описать роли, tabular-nums, веса и переносы                                        |
| F05 | Тесты semantic pairs не покрывают applied states/charts                | P1                         | Проверять композицию и визуальное кодирование, не обещать blanket AA                                     |
| F06 | Нет общей воспроизводимой browser/a11y/parity matrix                   | P1                         | Использовать внешний playground, не восстанавливать apps/docs                                            |
| F07 | Нет формализованного density/composition profile                       | P2                         | Описать существующие комбинации; новые размеры отдельно согласовать                                      |
| F08 | Частичная metadata и ручное подключение знаний                         | P1                         | Расширить текущие генераторы до небольшого versioned manifest                                            |
| F09 | Устаревшие сведения о CLI/шаблонах/CI                                  | P1                         | Сверить документацию с деревом и действующими командами                                                  |
| F10 | Знания/API частично живут у внешнего потребителя                       | P1                         | Договориться о владельце extractor/schema; не вести два независимых генератора                           |

## 11. Что остаётся неизвестным

Не исследованы реализация и репозиторий Design Director: контракт с ним далее — предложение по заданной пользователем границе ответственности. Не подтверждены реальные профили пользователей, объёмы таблиц и политика устройств конкретных продуктов; из этого аудита нельзя вывести окончательные настройки плотности. Не подтверждены полная accessibility compliance, производительность загрузки шрифтов у потребителей и отсутствие визуального drift в production.

Эти ограничения не мешают стандартизировать роли, provenance, поставку знаний и способы проверки. Они мешают обоснованно менять шрифт, палитру, размеры и геометрию без следующего этапа оценки.
