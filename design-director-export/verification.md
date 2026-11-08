# Проверка экспорта Mednet Kit 2.2.1

Дата: 2026-11-05. Все четыре пакета `@mednet/*` версии 2.2.1 опубликованы штатным GitHub Actions через trusted publishing. Исправления вошли через [PR #22](https://github.com/hpnssflw/mednet-kit/pull/22), версии подготовлены и выпущены через [Version PR #23](https://github.com/hpnssflw/mednet-kit/pull/23). Точный релизный коммит `7262bdbc13fafd43b537a1c399cb0630eae53893` записан в `source.revision` в [manifest.json](manifest.json).

## Выпуск и npm

- [Release workflow](https://github.com/hpnssflw/mednet-kit/actions/runs/42000361643) и [CI релизного коммита](https://github.com/hpnssflw/mednet-kit/actions/runs/42000361644) завершились успешно. GitHub Releases и теги созданы штатным workflow.
- В npm у tokens, css, ui, lint-config версия и `latest` — 2.2.1. Скачаны четыре tarball, проверен их registry integrity.
- Побайтно совпали 190 файлов опубликованных пакетов с исходниками и свежей локальной сборкой: tokens 11, css 16, ui 156, lint-config 7. `package.json` проверен отдельно: имена, версии, разрешённые внутренние зависимости и отсутствие `workspace:`; проверено наличие всех целей `exports`.
- Для всех четырёх пакетов получены SLSA v1 provenance statements. Digest subject совпадает с tarball, исходный коммит соответствует релизу. Криптографическая проверка подписей provenance отдельно не выполнялась.
- [CSS на jsDelivr](https://cdn.jsdelivr.net/npm/@mednet/css@2.2.1/dist/mednet.min.css) возвращает HTTP 200 и побайтно совпадает с релизной сборкой.

Подробные результаты и скачанные npm-архивы сохранены в рабочем проекте в `artifacts/kit-2.2.1-verification/`: `npm-release.json`, каталог `npm/` с tarballs и provenance. Переносимый экспорт не зависит от этих файлов для чтения и проверки schemas/hashes.

## Исходники и сборка

- `pnpm exec turbo run build typecheck test` — 11 задач выполнены, 568 тестов прошли: tokens 206, css 45, ui 313, lint-config 4.
- Регрессия сначала воспроизведена: SidebarRail внутри формы отправлял её, область Toaster называлась `Notifications`. После исправления проходят три проверки поведения: переключение без submit, русская область и закрытие уведомления, сохранение собственного имени ToastViewport.
- Исправления внесены в `postgen.mjs`, компоненты обновлены его запуском. Повторный запуск — 0 изменённых файлов. Полная загрузка свежих шаблонов shadcn не выполнялась.
- `pnpm build:agent-guides`, `node scripts/build-agent-guides.mjs --check`, `node packages/ui/scripts/check-dist.mjs`, `pnpm format:check` — выполнены. Исходная справка Toaster и generated llms обновлены.
- Patch changeset использован Version PR; версии локально вручную не поднимались. Changeset UX-справки, уже выпущенной в 2.2.0, удалён.

При запуске внутри sandbox tsx завершался ошибкой системного вызова `uv_os_get_passwd`; полный успешный запуск выполнен вне sandbox. Тест интеграции ESLint/Next выводит предупреждение об отсутствии каталога Pages в библиотеке, все четыре теста lint-config проходят.

## Браузер

Проверен свежий локальный `dist`, импортированный по публичным подпутям `@mednet/ui`, со штатными стилями, Montserrat и PostCSS-плагином совместимости. Изолированный сценарий формы, реальные действия; это не проверка приложения playground.

- Chrome 155.0.8059.84, Windows; светлая и тёмная темы.
- Ширины 320, 390, 767, 768 и 1440 px — 10 сценариев. На desktop Rail сворачивает меню без submit; на mobile открывается и закрывается Sheet. Явное сохранение отправляет форму ровно один раз.
- Область Toaster — «Уведомления», кнопка — «Закрыть уведомление»; F6 переводит фокус в область, Enter закрывает уведомление. Уведомление остаётся внутри viewport, горизонтального overflow нет, ошибок страницы нет.
- Full-page и viewport PNG для 390/1440 px в обеих темах сохранены и осмотрены основным агентом. В проверенном сценарии обрезаний и перекрытий не обнаружено.
- Четыре axe-сканирования области Toaster, WCAG 2 A/AA, 2.1 AA, 2.2 AA — 0 нарушений. Это ограниченная автоматическая проверка области, не сертификация библиотеки.

Браузерные JSON, ARIA, axe и PNG хранятся в рабочем проекте в `artifacts/kit-2.2.1-verification/`. Экспорт переносим и не требует этих файлов для чтения или проверки schemas/hashes.

## Контракт и переносимость

Проверяются три локальные JSON Schema draft-07, SHA-256 всех артефактов, source digests и соответствие исходников записанному Git-коммиту, версии всех четырёх пакетов, JSON pointers, source/rule refs, anchors и локальные ссылки Markdown. Значения токенов сверяются со штатным emitter и свежим `dist/tokens.json`; перечень React-модулей и экспорты — с исходниками и свежим dist.

Проверка повторяется на полной копии каталога вне репозитория: данные, schemas, hashes и внутренние ссылки разрешаются без исходного checkout. Количества и подробный результат сохраняются при подготовке рядом с браузерными материалами в `export-validation.json`.

## Границы

Не проверены Chrome/Edge 109, реальный screen reader и конечные пользовательские устройства. Не выполнена полная матрица всех компонентов, сочетаний props, zoom и reduced motion. Совместимость конкретного runtime Design Director/Codex не подтверждена. Metadata props/defaults/state остаётся частичной; proposals аудита не стали правилами кита. Сам JSON/Markdown-контракт этим релизом не добавляется в npm API пакетов.
