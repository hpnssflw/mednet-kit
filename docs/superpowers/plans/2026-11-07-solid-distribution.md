# План: официальная тема «Солид» и обновление потребителей

Дизайн и границы: [спека](../specs/2026-11-07-solid-distribution-design.md). Работа изолирована в feat/agent-cli.

## Пакеты темы

- [x] Канонический source в tokens; опциональный stylesheet и themes.json.
- [x] Публичные exports для tokens, React и самостоятельного HTML/CSS.
- [x] Зеркальные правила компонентов, мобильные поля и радиокнопки текущего Base UI.
- [x] Тесты генерации, состав tarball и сборка.

## CLI

- [x] theme set: Vite HTML, Next JSX/TSX, CSS-only, brand reset, palette/catalog validation.
- [x] AST-правки сохраняют Unicode/BOM/CRLF и bytes вне выбранных диапазонов.
- [x] Конфликты, dynamic attrs/spread, traversal, symlink/junction и ручные правки останавливают запись.
- [x] update: точные версии известных объявленных пакетов, npm/pnpm, workspace owner, no-install и dry-run.
- [x] Самостоятельный pnpm-проект не подхватывает посторонний ancestor workspace.
- [x] Установка без lifecycle scripts/pnpmfile, контроль фактически установленных версий и ui → tokens.
- [x] Старые agent install/sync/doctor сохранены; release-safe version tests.

## Проверка потребителей

- [x] Полные 14 задач build/typecheck/test; 70 CLI-тестов.
- [x] Настоящие npm и pnpm: опубликованный CSS 2.2.0 → локальный tarball текущей source-версии 2.2.1, установка lock, блокировка postinstall и theme set graphite.
- [x] 40 browser cases: React/HTML, brand + четыре палитры, light/dark, desktop/mobile; портал.
- [x] 150 проверок семантического контраста; восемь PNG Graphite осмотрены.
- [x] /docs/cli в mednet-playground/react: update/theme, 60 тестов, check/lint/build, 1440/390/320 px и текст 200%.
- [x] Changeset и справки агентов пересобраны, самопроверка diff.
- [x] Реальный Chromium 109.0.5414.46: свежие React/HTML tarballs, 40 состояний, 120 проверок динамической прозрачности, motion/interaction smoke. Исправлены дефекты alpha fallback при смене темы и внешних алиасах отдельного HTML stylesheet.

## Выпуск

- [x] Публичный manifest CLI; changeset status рассчитывает 2.3.0 для пяти пакетов без локального подъёма версий.
- [x] Проверена доступность имени: @mednet/cli ещё нет в публичном npm. Требуется одноразовый bootstrap владельцем.
- [x] Коммит, feature PR и зелёный CI: PR #24 и #26 в main; последующие исправления входят в текущую сверку закрытия.
- [ ] Подготовка нового npm-пакета и trusted publisher разрешена текущим поручением владельца; требуется восстановить обычный npm-вход, ответ сессии — 401.
- [ ] Merge Version PR и публикация через штатный release.yml; после выпуска registry/provenance smoke.
- [ ] После появления 2.3.0 в npm перевести сам playground с прототипного CSS на официальный экспорт; до этого его опубликованные зависимости сохраняются.

Порядок выпуска и конкретные настройки издателя: [docs/cli-release-2.3.0.md](../../cli-release-2.3.0.md). release.yml не меняется; ручных publish, npm-токенов и локального version-packages нет.
