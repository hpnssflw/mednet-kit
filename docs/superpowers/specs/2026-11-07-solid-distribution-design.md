# Темы кита и переход потребителей через CLI

Дата: 2026-11-07. Пользователь разрешил реализацию распространения тем и CLI, с последующим релизом.
Работа продолжается в feat/agent-cli, native worktree 884b; основной checkout не меняется.

## Результат

Потребитель обновляет пакеты через mednet update, затем выбирает mednet theme set solid --palette graphite.
Команды имеют --dry-run/--json и явный выбор --project. Обычный Бренд остаётся исходным оформлением.
Солид сохраняет согласованные в playground плотность, геометрию, четыре палитры и light/dark; новый дизайн не создаётся.

## Пакеты

Канонические определения Солида переносятся из playground в packages/tokens/tokens/themes/solid.json.
Сборка генерирует публичные themes/solid.css и themes.json. React и HTML получают public themes/solid.css и themes.json своей surface.
Компонентная геометрия стоит на обеих сторонах: ui/src/brand.css и css/src/overrides.css, под html[data-kit-theme=solid].
Без подключения файла темы и выбора атрибутов исходный Бренд не меняется. CSS-only theme artifact самодостаточен, без runtime tokens/UI.
Публичная схема themes.json v1 содержит package/version, theme ids/palettes, stylesheet exports и имена data-атрибутов; это не agent manifest R3.
Существующие llms sources обновляются; пакеты собираются и проверяются из tarball.

## CLI

- update [--to X.Y.Z] [--project path] [--package-manager npm|pnpm] [--no-install] [--dry-run] [--json].
- theme set brand|solid [--palette graphite] [--project path] [--css path] [--html path] [--dry-run] [--json].
- Если --to не дан, используется точная версия запущенного CLI (пакеты выпускаются fixed group).
- Update меняет только уже объявленные известные @mednet пакеты, сохраняет разделы/прочие bytes package.json, не переписывает workspace/file/link dependencies.
- Выбранный npm/pnpm выполняет install с отключёнными lifecycle scripts. Запуск менеджера и изменения lock/node_modules явно видны в плане.
- При неудаче package-manager CLI возвращает ошибку и сообщает, что manifest уже обновлён; install можно повторить. Атомарность node_modules не обещается.
- --no-install оставляет явное указание выполнить install; theme set до появления exports нужной темы не выдаёт ложный успех.
- Theme set читает установленный themes.json и public stylesheet, добавляет собственный блок @import в CSS и data-атрибуты на html.
- Vite/HTML использует index.html; Next использует app/layout.tsx или src/app/layout.tsx. Неоднозначные точки входа требуют --css/--html.
- Изменения CSS/HTML/TSX делаются по AST source ranges с сохранением bytes вне вставок/изменённых атрибутов.
- Динамические root theme attributes, JSX spread, чужой/изменённый managed block, symlink/junction и путь вне проекта — отказ до записи.
- Brand удаляет только собственный theme import block и сбрасывает атрибуты темы; dark class сохраняется.
- Старые agent commands сохраняют своё назначение и read-only гарантии doctor.

## Инструменты и ограничения

Node >=22.12; runtime parsers @babel/parser (TSX/JSON), parse5 (HTML), postcss (CSS), semver (версии) оправданы безопасным редактированием пользовательских файлов.
Никаких сгенерированных shadcn source edits, глобальных пользовательских конфигов, auto --force или замены инструкций потребителя.
Реальное приложение потребителя не меняется при проверках: отдельные fixtures для npm/pnpm, Vite, Next и HTML.
Управление состоянием темы, которое приложение само перезаписывает, не переписывается автоматически.

## Приёмка и выпуск

Тесты RED→GREEN на сохранность, dry-run/no-op, конфликты, package managers, AST transforms и paths.
Packed consumers проверяются в браузере desktop/mobile, light/dark, palette graphite; React/HTML сравниваются по computed styles.
Проверяется Chrome109 CSS fallback; недоступный целевой браузер указывается отдельно.
Полный format/build/typecheck/test и package check-dist, обновлённые guides, changesets, self-review без субагентов.
Релиз — только действующим release.yml. npm publish/changeset publish вручную, npm settings/tokens и изменение workflow не выполняются.
Version PR не мержится без явного согласия владельца на конкретный PR. Первая публикация CLI должна быть подготовлена без нарушения этой границы.
