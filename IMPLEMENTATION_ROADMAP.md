# Дорожная карта: формализация и агентная интеграция mednet-kit

Дата: 4 ноября 2026 года.

Основание: [DESIGN_SYSTEM_AUDIT.md](DESIGN_SYSTEM_AUDIT.md), [DESIGN_SYSTEM_PROPOSAL.md](DESIGN_SYSTEM_PROPOSAL.md), [AGENT_INTEGRATION_PLAN.md](AGENT_INTEGRATION_PLAN.md).

Статус: **план будущих изменений, не разрешение на их выполнение**. Текущая задача заканчивается аудитом и четырьмя документами. Исходные компоненты, токены, стили, dependencies, CLI, инструкции агентов и release pipeline в этой фазе не меняются.

## 1. Цель, подход и ограничения

Цель — сохранить текущую идентичность, сделать её правила точными и проверяемыми и поставлять implementation knowledge вместе с соответствующей версией кита. Сначала воспроизводимые исходники/артефакты и правила, затем metadata и loader, затем installer; независимые визуальные решения не должны блокировать полезный knowledge MVP.

Текущий стек: pnpm 10.34.6, Node >=22.12, TS/ESM, Tailwind 4, shadcn base-maia/Base UI, Basecoat 1.0.2, Vitest, Changesets и Turborepo. Новые зависимости разрешать по конкретному техническому основанию, не по стандартному шаблону дизайн-системы.

Общие ограничения будущей реализации:

- Учитывать действующие AGENTS.md и чужие изменения на момент старта. Субагенты — только по отдельному прямому поручению; этот roadmap делегирование не разрешает.
- Изоляцию выбирать по фактическому состоянию репозитория. План не требует автоматически нового worktree, commit, push или PR.
- Generated `ui/src/components/**`, hooks/logo/index/shadcn-tailwind руками не править. Изменять источник генерации/разрешённый CSS слой и проверять regeneration.
- Любая правка вида — обе стороны `ui/src/brand.css` и `css/src/overrides.css`; паритет оценивать по виду/поведению, не по совпадению DOM.
- Не восстанавливать apps/docs. Изменения playground требуют отдельного поручения и разрешённого доступа к `C:/A/mednet-playground/react`.
- Сохранять Chrome/Edge 109 contract и PostCSS integration, отдельно проверять документированные исключения.
- Правила потребителей менять в канонических guide sources, не только в root-документах. Затем генерировать llms, проверять и добавлять соответствующий changeset.
- Внешний вид бренда меняется только после принятого визуального решения и release impact review; действующие правила требуют major для изменения существующего вида бренда.
- Публикации, изменения серверов, merge Version PR и изменения release.yml — отдельное разрешение владельца. Агенты не публикуют пакеты и не создают npm tokens.

## 2. Review focus

Эти пять классов риска должны получить явную проверку в указанных этапах:

1. **Старая сборка при новых исходниках:** metadata, types, CSS и llms должны происходить из одного build/release. Владелец: R0/R3.
2. **Monorepo с разными версиями:** resolver выбирает target workspace и не смешивает соседние node_modules/kit releases. Владелец: R4/R5.
3. **Чужие инструкции и локальные изменения skill:** install/sync сохраняют bytes вне своей области и не обходят symlinks/junctions. Владелец: R5.
4. **CSS-only/CDN-only проект без React/tokens package:** получение знаний не требует установки React; точная версия задаётся проверяемо. Владелец: R3/R4/R7.
5. **Неверные a11y/composition выводы из metadata:** существующий primitive/тип/контраст токена не подменяет реальные имена, состояния, focus и график. Владелец: R1/R2/R6.

## 3. Приоритеты, зависимости, сложность

Оценки — инженерные дни одного исполнителя, ориентир, не обязательство по срокам. Включают реализацию и локальную проверку; не включают ожидание решений, релиза, доступа к соседнему репозиторию и полноценного исследования пользователей. S — до дня, M — 1–3 дня, L — 3–5 дней.

| Этап                                                      | Приоритет                   | Оценка                    | Зависимости                         | Проверяемый результат                                                                     |
| --------------------------------------------------------- | --------------------------- | ------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| R0. Согласованный baseline и актуальность docs            | P0                          | S, 0.5–1                  | Разрешение на следующую фазу сборки | Свежая проверяемая сборка, источник локальных failures отделён от package defects         |
| R1. Семантические роли и правила применения               | P1                          | M, 1–2                    | R0; A3/A4 только при изменении вида | Точные foundations и recipes без изменения внешнего вида                                  |
| R2. Browser/a11y/parity baseline и подтверждённые разрывы | P1                          | L, 2–4                    | R0/R1, A6 для playground            | Воспроизводимая матрица, решения по motion/charts и реальная проверка                     |
| R3. Versioned knowledge artifacts                         | P1                          | L, 2–4                    | R1, A1/A6                           | Manifest и metadata из существующих источников; exports проверены                         |
| R4. Resolver и Codex loader                               | P1                          | M, 1–2                    | R3, A1                              | Agent читает установленный kit; monorepo/legacy/CSS-only поддержаны в заявленных пределах |
| R5. Install/sync/doctor CLI                               | P2                          | L, 3–5                    | R4, A1                              | Безопасная идемпотентная установка и read-only диагностика                                |
| R6. Director integration и agent acceptance               | P2                          | M, 1–3                    | R3/R4; R5 для полного DX; A7        | Один source of truth, проверка с Director и без него                                      |
| R7. Registry/plugin/другие agents                         | P3, условный                | M, 1–3 на выбранный канал | R5/R6, A8 и владелец канала         | Тот же versioned artifact через дополнительный канал                                      |
| R8. Density/geometry/типографический пилот                | Отдельный продуктовый поток | M–L, 2–5 на пилот         | R1/R2, решения A2–A5                | Проверенное визуальное решение, при необходимости отдельная миграция/release              |

Реалистичный диапазон основного package-based потока R0–R6 — примерно **11–21 инженерный день** при доступных исходниках и быстро принятых решениях. Это сумма оценок, не дата релиза. R2 и часть R3 могут идти независимо после R1, но этот факт не является поручением запустить параллельных агентов.

Критическая цепочка для agent-ready MVP: **R0 → R1 → R3 → R4 → R5 → R6**. R2 обязателен для честных заявлений о visual/accessibility baseline; принятые визуальные исправления выпускаются по своим gates. R7/R8 не являются условием чтения kit knowledge без Director.

## 4. R0 — воспроизводимый baseline

Связанные находки: F01, F09, F10.

**Файлы/области:** текущие package build/test scripts; `README.md`, `docs/releasing.md`, `docs/backlog.md`; `packages/*/dist`, `packages/ui/llms.md` как generated outputs. Не менять release.yml. Перед изменением Turbo config/commands прочитать docs установленного turbo, как требует AGENTS.

**Шаги:**

- [ ] Зафиксировать HEAD, working tree, версии Node/pnpm и исходные source/manifest версии; не стирать чужие изменения.
- [ ] В разрешённой изолированной/временной рабочей области выполнить текущую цепочку сборки зависимостей в правильном порядке; не публиковать и не запускать version-packages.
- [ ] Сопоставить старые локальные failures с новой сборкой: semanticDark, 105 primitives, актуальный dark select override, llms stack/UX.
- [ ] Сверить исходные выводы `310 passed` ui с актуальным составом tests/artifacts; не считать старый pass доказательством всех новых release artifacts.
- [ ] Привести сведения о docs app, CLI/templates и screenshot/axe/Chrome109 CI к текущему дереву. Исторические планы сохранить с явным статусом, не переписывать их как будто реализация завершена.

**Проверки:** текущие build/typecheck/test для четырёх пакетов, guide `--check`, проверка package exports/check-dist без публикации. Полная сборка теперь разрешается отдельной следующей задачей; она намеренно не была выполнена аудитом.

**Acceptance:** чистая воспроизводимая сборка объясняет или выявляет каждый baseline failure; отчёт различает source, local dist, packed artifact и npm release. В git нет непреднамеренных изменений generated source. Документы не обещают отсутствующие jobs/apps/CLI. Если свежая сборка оставляет failures, они становятся отдельными подтверждёнными дефектами с минимальным воспроизведением.

**Release impact:** repo-only docs — без changeset; исправление потребительских build artifacts/knowledge — по docs/releasing.md, не автоматически major.

## 5. R1 — точные foundations и usage knowledge

Связанные находки: F03–F05, F07–F09.

**Существующие источники для изменения:** `docs/agent-guide/{brand,ux,map,lint}.md`, `packages/ui/llms/{intro,brand}.md`, вводные llms остальных пакетов. `tokens/src/base.ts`/`emit.ts` на этом шаге служат источниками фактов; их значения не менять.

**Продукт этапа:** таблицы roles/use/exception и проверяемые patterns из proposal, а не новый CSS framework.

- [ ] Описать различие page headings, CardTitle, UI text, prose и numeric roles, реальные font faces и существующий mono exception.
- [ ] Описать tnum, выравнивание, формат/единицы/нет данных; проверить перенос длинных русских названий.
- [ ] Зафиксировать фактические spacing/size/radius/shadow families, включая xl > 2xl и default Tailwind shadows. Не исправлять внешний вид этой документационной задачей.
- [ ] Описать существующие density combinations и отсутствие глобального/Input density API.
- [ ] Уточнить области гарантии semantic contrast и reduced motion. Не ослаблять M-правила молча; различить известный разрыв и утверждённое исправление.
- [ ] Подготовить проверяемые composition examples: field/error, error summary, searchable list, metric, async action, destructive dialog. Источник текста правила один; ссылки и примеры не создают копию норм Director.
- [ ] Выдать stable IDs выбранным rules/patterns и согласовать место их канонической metadata для R3. ID index содержит ссылки/уровни, а не отдельную ручную копию каждого абзаца.
- [ ] Сгенерировать guides штатными командами и проверить актуальность.

**Acceptance:** инженер может по справке выбрать реальный вариант Button, узнать, что у Input нет sm, собрать Field с явными связями, отличить h1 от CardTitle и узнать пределы Chrome109. Все числовые «существует» значения имеют source reference. Каждый новый M/should rule имеет область применения и способ проверки. Существующие consumer guides и их generated representations согласованы.

**Проверки:** typecheck/compile примеров на текущем kit, guide checks, чтение соответствующих examples в реальном браузере. Не нужны tests, которые только повторяют прозу; нужны проверки значимой семантики и ссылок/доступности артефактов.

**Release impact:** consumer-visible guides требуют changeset; масштаб определить по изменению норм, а не автоматически считать любую документацию patch. Публичное добавление нового knowledge export — R3.

## 6. R2 — browser, accessibility и паритет

Связанные находки: F02, F05, F06; частично F03/F04/F07.

**Владение:** сначала A6. Предпочтительное место visual examples/acceptance — внешний playground; metadata/rules остаются в ките. Не переносить сайт в этот репозиторий.

**Области:** существующие playground `scripts/verify-docs.mjs`, `verify-overlays.mjs`, demos; существующий HTML `packages/css/demo/index.html`; kit tests для token contrast и PostCSS. Новые browser fixtures должны использовать actual package exports, а не самостоятельные копии контролов.

**Шаги:**

- [ ] Определить поддерживаемую матрицу и provenance каждого запуска: package version, source commit при local build, browser version, theme, viewport, motion preference.
- [ ] Покрыть representative families: Button/Input/Select, checkbox/radio/switch/slider, Field с ошибкой, Tabs, Dialog/AlertDialog/Sheet, menu/combobox, Table/Chart, оба layouts, feedback.
- [ ] Проверить темы, default/hover/focus/pressed/disabled/invalid и доступные open/checked/selected states. Протестировать `render`-композицию с реальным Button/Link и русскими именами.
- [ ] Для motion сначала воспроизвести Spinner/Skeleton под reduce; сравнить React/HTML. Выбрать разрешённое исправление, сохраняющее статус и lifecycle, добавить целевую regression check, затем менять только допустимый слой. Согласовать release impact до выпуска.
- [ ] Проверить реальный composite contrast focus/invalid/destructive и chart series encoding. Для слабых pastel fills оценить контуры/маркеры/patterns до переподбора токенов (A5).
- [ ] Проверить 320/390, границу 767/768, 1024/1440, 200% текста и reflow/spacing overrides; длинные labels, URL, числа и единицы; локальный overflow таблиц.
- [ ] Keyboard: Tab/Shift+Tab, arrows по applicable primitive, Escape, focus trap/return, error-summary links, отсутствие перекрытия focus. Дополнить выборочной проверкой screen reader и forced colors.
- [ ] Отдельно проверить Chrome/Edge 109 с PostCSS и без неподдержанных AI effects. Современный Chrome не считать подтверждением старого браузера.
- [ ] Привязать итоговые screenshots/DOM evidence к версии и принятому baseline; не создавать CI job, который лишь записывает картинки без критериев сравнения.

**Acceptance:** известные gaps воспроизводятся и имеют решение или явное ограничение; исправленные состояния проходят regression checks; React/HTML aligned в изменённых семействах; есть recorded manual результаты там, где automation недостаточна. Нельзя писать «WCAG compliant», пока проверена лишь выборка.

**Зависимости/complexity:** browser runner должен иметь явную поддерживаемую dev-зависимость в том репозитории, где живёт проверка, если сейчас он доступен только транзитивно. Новую зависимость обосновать и согласовать в реализации; данный аудит её не устанавливает.

## 7. R3 — versioned metadata и package exports

Связанные находки: F08, F10. Gates: A1 и A6; R1.

**Предлагаемые новые файлы:** schema sources в `docs/agent-guide/schema/`; небольшой ручной rule/pattern/component annotation index рядом с каноническими guides; generated `packages/{ui,tokens,css}/dist/agent/*`. Точные source-файлы аннотаций закрепить после A6, не создавать вторую базу норм.

**Существующие места интеграции:** `scripts/build-agent-guides.mjs`, `ui/scripts/build-llms.mjs`, `ui/scripts/stack.mjs`, `tokens/src/emit.ts`, package manifests и check-dist scripts; согласованный extraction code из playground `gen-api.mjs`/`api-ru.json`.

**Интерфейс результата:** `generateKnowledge({ packageRoot, sourceRevision? }) -> ArtifactSet`, где ArtifactSet содержит manifest и referenced JSON/MD/example bytes. Публичный контракт — manifest/components/rules/patterns из integration plan, не эта внутренняя функция.

**Шаги:**

- [ ] Зафиксировать JSON Schema/contract v1 и tests его required fields, refs и version semantics. Source of defaults и unknown значения обязательны.
- [ ] Согласовать extractor reuse: вытащить только общую extraction logic без page routing/render. Playground использует тот же результат; не плодить второй parser с отличающимися defaults.
- [ ] Генерировать component exports/parts и own variants/defaults из actual package build; inherited API отделять. Не выдумывать defaults для динамического/неоднозначного случая.
- [ ] Генерировать rule/pattern indices и topic guides из тех же MD/annotations, что дают llms. Примеры используют actual exports.
- [ ] Добавить ui manifest с token export ref и stack ref; tokens manifest с существующим resolved format; CSS manifest с HTML API и встроенным generated token snapshot при отсутствии runtime tokens dependency.
- [ ] Добавить explicit public exports/files и check-dist coverage; manifest refs обязаны разрешаться в packed package без доступа к source checkout.
- [ ] Зафиксировать reproducible artifact digests, contract/package versions и extraction dependency provenance. Не включать локальные абсолютные пути/timestamps.

**Обязательные тестовые случаи:**

| Случай                                      | Ожидаемое доказательство                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Изменён экспорт/union собственного варианта | Metadata и types меняются согласованно; check обнаруживает старый artifact      |
| Card size default/sm и Input без size       | Реальные props сохранены; ложный Input.size не появляется                       |
| InputGroupButton/Sidebar разные части       | Размеры/defaults привязаны к своей части, не ко всему модулю                    |
| Неизвестный inherited default               | null + source/ref, не случайная догадка                                         |
| CSS-only tarball                            | Guides и token snapshot читаются без @mednet/ui, React и @mednet/tokens         |
| Повторная генерация на тех же входах        | Идентичные bytes/digests                                                        |
| Packed package                              | Все manifest-relative и cross-package export refs доступны по правилам contract |
| Guide rule изменён                          | llms/topic/index остаются представлениями одного источника                      |

**Acceptance:** из установленного tarball можно получить API Button/Field, rules/patterns и tokens нужной surface; нет обращения к live latest для установления фактов версии. Full token JSON остаётся прежним API; новая metadata добавлена рядом. Старый формат llms продолжает работать.

**Release impact:** новые consumer exports — minor; публичная несовместимость metadata — versioned contract/migration. Не выполнять публикацию из этой задачи без отдельно разрешённого release шага.

## 8. R4 — resolver и Codex loader

Gate: R3/A1. Default — project-local skill с обнаружением target workspace, без глобальных записей.

**Предлагаемые области:** будущий `packages/cli/src/discover.mjs` как общий read-only resolver; loader template `packages/cli/agents/codex/mednet-kit/SKILL.md`; пакетируемый helper `scripts/resolve-kit.mjs`. До R5 это можно проверять в fixtures без готового CLI.

**Интерфейсы:** `discoverKit({ projectRoot, surface? }) -> DiscoveryResult`; DiscoveryResult содержит selected project, surface, resolved package versions/roots, manifest refs, warnings и compatibility result. Никаких mutation/network по умолчанию.

- [ ] Реализовать resolution из package context, разделить declared surface и incidental dependencies; не импортировать React root или исполняемый project config.
- [ ] Поддержать npm/pnpm, ui→tokens context, CSS snapshot, tokens-only; объявить ограничения Yarn PnP до его отдельной проверки.
- [ ] Обрабатывать monorepo с отсутствующим root node_modules и с двумя версиями kit; ambiguous target не выбирать молча.
- [ ] Сделать progressive-loading skill: baseline setup/brand/UX + выбранные component/pattern fragments. Не вклеивать весь llms/props в SKILL или AGENTS.
- [ ] Сделать legacy fallback на установленный llms/exports с явным limited capability status; unsupported contract major блокирует соответствующую операцию.
- [ ] Проверить discovery root/leaf, duplicate skill names, active AGENTS.override и отсутствие CLI после npx install.

**Acceptance:** из leaf и root корректно выбранный проект даёт один и тот же manifest; соседняя версия не подмешивается. Skill читает знания offline, не меняет файлы и работает без Director/локально установленного CLI. В кратком SKILL нет hardcoded palette/height tables, источником которых уже является kit.

**Проверки:** fixtures `npm-ui`, `pnpm-isolated-workspace`, `two-kit-versions`, `css-only`, `tokens-only`, `legacy-with-llms`, `unknown-contract`, `no-kit`; ручная discovery проверка в поддерживаемом Codex. Отсутствие kit — корректный not-applicable, не установка зависимостей.

## 9. R5 — install, sync, doctor

Gate: R4/A1; имя пакета и bin утверждены до scaffold.

**Предлагаемые файлы:** `packages/cli/package.json`, `src/cli.mjs`, `src/discover.mjs`, `src/plan.mjs`, `src/apply.mjs`, `src/doctor.mjs`, templates и tests/fixtures. Это предварительная декомпозиция; можно объединять небольшие модули, если ответственности остаются ясными. Не создавать framework для будущих агентов заранее.

**Интерфейсы:**

- `planInstall({ discovery, agent, scope, instructionsMode }) -> InstallPlan` — paths, bytes/digests, ownership checks, conflicts; read-only.
- `applyPlan(plan) -> ApplyResult` — подготовленные записи либо сохранение/восстановление текущего состояния при отказе.
- `planSync({ discovery, lock }) -> InstallPlan` — тот же механизм reconciliation, без второго updater.
- `diagnose({ projectRoot, network: false }) -> DoctorReport` — schemaVersion/status/projects/checks.

**Шаги:**

- [ ] Сначала написать meaningful fixtures на сохранность чужих данных, dry-run/no-op и partial failures; убедиться, что они ловят нарушения до apply implementation.
- [ ] Добавить команды целевого DX: agent install codex, agent sync, doctor и --json/--dry-run; аргументы/exit codes как в integration plan.
- [ ] Проверять совместимость/ownership и весь набор конфликтов до записи. Непринадлежащий файл/изменённый skill не перезаписывать.
- [ ] Реализовать staged apply и recovery: не обещать невозможную multi-file atomicity; lock коммитится после подготовленных файлов.
- [ ] Поддержать default AGENTS snippet и явный managed-block режим. Сохранять bytes вне блока, CRLF/encoding и project-specific guidance.
- [ ] Doctor реализовать read-only, без запуска package scripts и конфигов. Unknown dynamic config обозначать unknown, не pass.
- [ ] Добавить files/exports/bin/license/check-dist для CLI и включить его в штатную release-подготовку только после решения владельца.

**Обязательные acceptance fixtures:**

| Fixture                                                  | Ожидаемый результат                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Установка два раза                                       | Второй запуск no-op, одинаковые bytes, нет duplicate blocks                           |
| --dry-run                                                | Никаких project writes, включая lock/cache                                            |
| AGENTS с произвольными инструкциями, CRLF и Unicode      | Все bytes вне собственного блока сохранены                                            |
| AGENTS.override и существующая ручная ссылка llms        | Точная диагностика применимости, без ложного «интеграция активна» и повторной вставки |
| Изменённый пользователем SKILL или managed block         | Конфликт, ноль применённых изменений по плану                                         |
| Одноимённый чужой skill без ownership                    | Не перезаписан/не присвоен                                                            |
| Symlink/junction/path traversal/registry absolute target | Выход за допустимую область отвергнут до записи                                       |
| Сбой записи/прерванный apply                             | Восстановление или распознаваемое partial state; исходные данные сохранены            |
| Sync после package update                                | Только owned files/refs; package.json и lock менеджера неизменны                      |
| Unsupported contract и mixed versions                    | Blocking diagnosis; нет silent latest download/upgrade                                |
| Doctor                                                   | До/после project tree/hash одинаковы; понятный JSON и exit code                       |
| CSS-only/monorepo                                        | Те же поддержанные сценарии resolver, без React install                               |

**Acceptance:** разработчик выполняет три команды target DX и получает воспроизводимый loader/diagnosis. Существующие инструкции и local changes не теряются. CLI не устанавливает зависимости и не публикует пакеты. Unattended sync не изменяет глобальные skills и user config.

## 10. R6 — интеграция Director и agent acceptance

Gates: R3/R4, A7; R5 для полного install flow. Реальный репозиторий Director необходимо изучить перед его изменением: данный контракт не подтверждает наличие у него конкретных transport/API/registry возможностей.

**Области:** kit contract examples/tests; existing Director adapter в его репозитории после discovery. Не добавлять предполагаемый Director runtime в UI Kit.

**Шаги:**

- [ ] Сверить реальную architecture Director с request/response envelope integration plan; адаптировать существующий механизм, если он уже есть.
- [ ] Включить kitRefs с versions/digests, component/rule/pattern refs, capabilityGaps и decisionsRequired; token values не копировать в отдельный editable registry.
- [ ] Сделать cache key от contract/package/artifact, invalidation при update; offline/no-Director path работает локально.
- [ ] Проверить правило конфликтов: установленный API, действующие инструкции проекта, решения владельца и reasoning Director не подменяют друг друга.
- [ ] Провести сравнимые agent tasks после ручного setup и после installer, с Director и без него. Не считать факт чтения SKILL достаточным acceptance.

**Сценарии agent evaluation:**

1. Форма организации с подсказкой и ошибкой: реальные imports, label/describedby, aria-invalid, сохранение значения; полный form recipe по заданному сценарию.
2. Таблица с поиском: loading/empty/filtered-empty/error различаются, числа форматированы/выравнены, локальный scroll сохраняет страницу.
3. Dialog trigger на Button: render, корректные names, focus return и безопасное действие; нет asChild/чужих primitives.
4. Задача numeric KPI: агент использует tnum и единицу, сохраняет Montserrat, не устанавливает другой шрифт.
5. Неподдержанный запрос `Input size="compact"`: capability gap и существующая допустимая альтернатива; API не выдуман.
6. Устаревший Director cache или registry latest: mismatch обнаружен, UI не строится по чужой версии.
7. Director недоступен/не установлен: реализация из local kit knowledge остаётся возможной.
8. Локальные инструкции запрещают предложенную композицию/изменение бренда: существенный конфликт объяснён, инструкция не переписана автоматически.

**Acceptance:** нет самостоятельной копии kit token/API rules в Director; все kit-specific рекомендации ссылаются на совместимые знания. Полученные реализации проходят применимые lint/types/build и реальные сценарии browser/a11y. Не передаётся private application context без разрешения соответствующего объёма. Метрики оценки: корректность API, сохранение бренда, accessibility сценария, обнаружение gaps/конфликтов и объём необходимого контекста; не число вызовов skill само по себе.

## 11. R7 — дополнительные каналы, только при потребности

Gate A8; R5/R6. Каналы независимы и не все обязательны.

- [ ] Для CDN-only case определить exact-version knowledge source, integrity и explicit обновление; не угадывать patch по `@2` URL.
- [ ] Если выбран shadcn registry, генерировать `registry:file` knowledge items из того же ArtifactSet. Не публиковать `registry:ui` копии компонентов и не писать новый discovery/search server.
- [ ] Проверить, что upstream install сохраняет необходимые boundaries; ownership reconcile выполняет kit installer. Registry не объявляется автоматически безопасным updater AGENTS.
- [ ] Для Codex plugin упаковать тот же loader/refs; не делать MCP обязательным без отдельного use case.
- [ ] Для другого агента добавить один adapter и его discovery/ownership tests; neutral manifest не менять ради имени агента.
- [ ] Публикацию static artifacts/plugin/package выполнить только по отдельно разрешённому release action, с проверкой реального hosting pipeline.

**Acceptance:** package и registry/plugin канал дают тот же kit knowledge/digest на той же версии; offline snapshot читается без React; invalid integrity/path отвергаются; проектные инструкции сохранены. При недоступной сети установленная копия продолжает работать. Есть документированный хозяин обновлений канала.

## 12. R8 — отдельные визуальные решения

Gates A2–A5 и результаты R2; это не условие реализовать всё сразу.

**Возможные пилоты:** tnum/dense table, long-form Montserrat, touch controls, radius/shadow taxonomy, accessible chart encoding. Для каждого отдельный brief: пользователь/задача, текущий пример, сравниваемые варианты и критерий результата.

- [ ] Сначала проверить текущие средства: размеры/leading/ширину, уже существующие Card/Button/Select variants, labels/hit areas и pattern encoding графика.
- [ ] Измерить улучшение на реальных данных и сценариях; зафиксировать tradeoffs. Наличие нового макета не доказывает удобства.
- [ ] Если нужна смена существующих tokens/styles или новый API, представить конкретный diff/варианты и migration impact; получить решение владельца до реализации.
- [ ] После решения менять обе поверхности допустимыми средствами, обновить metadata/guides и проверить visual/parity/accessibility/browser matrix.
- [ ] Классифицировать релиз по действующим правилам, включая major для изменения существующего вида бренда.

**Acceptance:** решение опирается на наблюдаемую проблему, улучшение проверено, текущая идентичность сохранена в согласованных пределах. Нет скрытой замены семейства шрифта/палитры и потребительских обходов запретов ради нового вида.

## 13. Gates решений и граница первого релиза

| Решение из proposal                 | Что блокирует                             | Что можно делать до решения                                   |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| A1: contract/CLI package            | Публичные exports и новый CLI             | Актуализировать факты/примеры, описать schema proposal        |
| A2: density/touch                   | Новый общий density API/новые размеры     | Зафиксировать существующие combinations                       |
| A3: typography faces                | Новый вес/курсив/семейство                | Проверить tnum, ширину/leading и current font loading         |
| A4: radius/shadow values            | Изменение геометрии/теней                 | Документировать смешанную шкалу и реальные роли               |
| A5: chart encoding                  | Смена palette/token API                   | Проверять контраст конкретной композиции и доступность данных |
| A6: extractor/playground ownership  | Перенос кода/правки второго репозитория   | Описать существующую extraction logic и interfaces            |
| A7: Director/UX knowledge ownership | Перенос/удаление общих UX-правил          | Сохранить kit baseline и использовать ссылки                  |
| A8: extra distribution              | Публикация registry/plugin/нового adapter | Package-based MVP и manual fallback                           |

Первый полезный релиз: точные guides, совместимые manifests/metadata, локальный Codex loader и безопасные install/sync/doctor после принятых A1/A6. Он не обязан включать новую плотность, новый шрифт, изменение формы, приложение документации или Director backend. Публичные заявления об исправленной доступности ограничиваются проверенными состояниями, а не всей библиотекой.

## 14. Что выполнено в текущей фазе

Созданы четыре документа из задания; выполнены repository discovery, анализ действующих источников, проверка типов/существующих тестов в пределах §9 аудита, source-based browser выборка и исследования официальных форматов/discovery. Выявленные failures и непроверенные среды явно записаны. Ни один этап R0–R8 не объявляется реализованным данным roadmap.
