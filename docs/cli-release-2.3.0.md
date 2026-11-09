# Итог выпуска 2.3.0 — 2026-11-09

Релиз завершён через Version PR #25 и release.yml. Все пять пакетов проверены в registry с provenance. Playground обновлён публичным CLI, переведён на официальный CSS и опубликован; подробности и отдельный остаток bootstrap cleanup — в [current-status.md](current-status.md).

## Историческая сверка подготовки от 2026-11-08

Сверка 2026-11-08. Владелец поручил завершить текущие задачи, включая выпуск. Повторного разрешения на эту цепочку не требуется; фактический блокер — npm-сессия с ответом 401.

## Проверено

- Windows, Node 24.20.0: build/typecheck/test — 14 успешных задач, 319 тестов UI и 70 CLI; format:check и git diff --check.
- Реальные npm/pnpm consumers: опубликованный CSS 2.2.0 → локальные tarballs source-версии 2.2.1, обновление lock, отключённый postinstall и theme set solid/graphite. Локальных подъёмов версий не было.
- Свежие source tarballs: Chrome 156.0.8078.80 и Chromium 109.0.5414.46 — по 40 состояний React/HTML и 120 проверок прозрачности. Проверены реальные цвета, размеры, темы, портал и desktop/mobile; PNG осмотрены.
- Reduced motion: восемь проверок в каждом браузере, сохранены видимость/ARIA, одна короткая итерация и animationend; popup закрывается по Escape с возвратом фокуса.
- 150 проверок семантического контраста: текстовые пары ≥4.5, границы полей и фокус ≥3.
- Playground на опубликованном 2.2.1: check, 60 тестов, lint/build; Chrome 156 — оформление 39/39 и восемь примеров, чат/дашборд 56/56. Chromium 109 — 57 компонентов и восемь примеров, 64 открытия оверлеев и ввод OTP.
- Отдельная сборка playground с исправленным source PostCSS прошла оформление Chromium 109 39/39. В обычной установленной 2.2.1 ещё нет этих исправлений и публичного экспорта Солида.

Ни source tarballs, ни отдельная сборка не заменяют smoke опубликованных npm/OIDC-артефактов 2.3.0. Весь fixed-релиз пяти пакетов готовит Version PR #25; целевые package.json поднимает только бот.

## Первый пакет и выпуск

Актуальная процедура — [releasing.md](releasing.md#новый-пакет-mednet).

1. Восстановить обычную npm-сессию владельца: npm login, затем npm whoami. Последняя проверка дала 401; CLI 2.3.0 в публичном registry отсутствует.
2. Зарезервировать новое имя CLI отдельным bootstrap tarball через staged publishing. Bootstrap использует отдельную версию, например 0.0.1-bootstrap.0, **не 2.3.0**: staged и published версии делят один semver index.
3. Настроить и проверить trusted publisher для hpnssflw/mednet-kit, release.yml, право publish. Не утверждать bootstrap как рабочий CLI.
4. После зелёного CI последнего main слить Version PR #25. Настоящий релиз выполняет существующий release.yml; npm-токены, ручной релизный publish и локальный version-packages не используются.
5. Проверить registry/bin/exports, provenance и реального npm-потребителя. Отклонить только собственный временный bootstrap stage по точному ID.

[Официальный npm stage](https://docs.npmjs.com/cli/v11/commands/npm-stage/), [npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

## Потребитель после публикации

```sh
npx @mednet/cli@2.3.0 update --dry-run
npx @mednet/cli@2.3.0 update
npx @mednet/cli@2.3.0 theme set solid --palette graphite --dry-run
npx @mednet/cli@2.3.0 theme set solid --palette graphite
```

Если loader установлен, после обновления выполнить agent sync. CLI использует каталог установленного пакета и сохраняет bytes вне своих диапазонов; CSS-only канал не требует React/tokens в runtime.

Playground пока остаётся на npm 2.2.1 с локальным прототипом. После выпуска обновить его через CLI, заменить прототипные значения импортом @mednet/ui/themes/solid.css, выполнить gen:api/gen:stack, обязательные проверки и целевой browser/motion smoke. Страница CLI уже интегрирована; npx до публикации отмечен как будущий сценарий.
