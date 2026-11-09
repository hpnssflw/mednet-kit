# Текущее состояние Mednet

Сверка: 2026-11-09. Этот список отделяет выполненные текущие работы от исторических планов и предложений. Перенос на другой компьютер пока не выполняется.

## Завершено в коде

- CLI doctor, agent install/sync, update и theme set: dry-run, ownership, сохранение пользовательских файлов и legacy Codex loader.
- Официальный opt-in Солид: четыре палитры, themes.json и CSS exports для React/HTML.
- Исправлены reduced motion React Spinner/Skeleton и полупрозрачные цвета Chrome/Edge 109 при смене темы/палитры. Учитываются внешние алиасы отдельного HTML stylesheet.
- Финальный build/typecheck/test: 14 задач, 319 тестов UI и 70 CLI. Четыре новых регрессионных теста PostCSS прошли RED → GREEN; всего в файле 12 тестов.
- Свежие source tarballs: Chrome 156.0.8078.80 и Chromium 109.0.5414.46 прошли по 40 состояний React/HTML, 120 проверок динамической прозрачности и восемь проверок reduced motion; popup закрывается по Escape с возвратом фокуса. Desktop/mobile PNG осмотрены.
- Восемь примеров, общее оформление и документация CLI интегрированы в main playground: [PR #5](https://github.com/hpnssflw/mednet-kit-doc/pull/5). Check, 60 тестов, lint и build прошли; сохраняются прежние предупреждения демо и размера bundle.
- Playground: Chrome 156 — 39 проверок оформления, полный проход восьми примеров и 56 сценариев чата/дашборда. Chromium 109 — 57 компонентов, восемь примеров и 64 открытия оверлеев. Ввод/очистка OTP и WebKit autofill fallback проверены; ровно одно известное предупреждение неподдерживаемого :autofill учитывается отдельно. Самопроверка harness продолжает ловить ошибки.
- Отдельная сборка playground с исправленным source-плагином прошла 39/39 проверок оформления Chromium 109. Это не проверка опубликованного 2.3.0: обычный playground пока устанавливает npm-пакеты 2.2.1.

## Выпуск и потребитель завершены

- Version PR #25 слит; Release [42615354060](https://github.com/hpnssflw/mednet-kit/actions/runs/42615354060) и CI успешны. Все пять пакетов @mednet опубликованы как 2.3.0 через OIDC; registry и provenance SLSA v1 проверены для каждого.
- Публичный npx CLI проверен; его update обновил реальный playground с 2.2.1 на 2.3.0 и установил зависимости без lifecycle scripts.
- Playground использует официальный @mednet/ui/themes/solid.css, справка CLI переведена на npx, API/stack пересобраны. Check, 60 тестов, lint и production build прошли. Оформление: 39/39 проверок Chrome, desktop/mobile PNG осмотрены; reduced motion: четыре проверки настоящего Chromium 109 без ошибок.
- Документация опубликована коммитом a6cff5c; Vercel success, живая /docs/cli проверена в браузере. Предупреждения lint демо и размера bundle остаются прежними.

## Технический остаток npm

Временный bootstrap stage ecb44d00-e32c-4986-89c3-7531288cb623 не утверждён и не используется. Его отклонение после релиза вернуло EOTP; очистка требует подтверждения владельца на сайте npm. Рабочие пакеты 2.3.0 и сайт от этого не зависят. Одноразовые ссылки CLI возвращали 404; издатель успешно настроен владельцем через страницу пакета. Новые npm-токены не создавались, release.yml не менялся.

Процедура: [releasing.md](releasing.md), [сверка релиза 2.3.0](cli-release-2.3.0.md). План закрытия: [2026-11-08-close-current-tasks.md](superpowers/plans/2026-11-08-close-current-tasks.md).

## Сохранённые материалы

- Исходники текущих задач, аудит и планы сохранены в Git. Четыре корневых документа от 04.11 содержат отдельные актуальные примечания.
- design-director-export сохраняется побайтно как проверенный snapshot **2.2.1**, contract draft; он не является metadata API текущего npm-пакета.
- Локальные artifacts, браузерные снимки и настройки сохраняются на месте и исключены из Git. Evidence кита — artifacts/agent-cli в изолированном worktree; playground — artifacts/close-current и artifacts/close-109.

## Отложено

Structured metadata R3, Director backend/R6, дополнительные каналы и агенты, генератор приложений и Astro/Next templates остаются предложениями. [Backlog](backlog.md) не является списком текущих обязательств.
