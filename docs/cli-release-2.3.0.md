# Подготовка первого публичного CLI и релиза 2.3.0

## Выполненные проверки (2026-11-08)

- Windows, Node 24.20.0: `turbo run build typecheck test` — 14 успешных задач, в CLI 70 тестов.
- `format:check` и `git diff --check` — без ошибок.
- npm и pnpm: реальная установка опубликованного @mednet/css@2.2.0, переход на локальный tarball source-версии 2.2.1 и theme set solid/graphite. Обновлены lock-файлы; postinstall, завершающийся кодом 99, не исполняется. Локальные версии пакетов не поднимались.
- Chrome: 40 комбинаций React/HTML × desktop/mobile × light/dark × brand/четыре палитры; проверены портал, геометрия контролов, отсутствие горизонтального переполнения. Осмотрены восемь PNG Graphite.
- 150 проверок контраста фактически собранного CSS: текстовые пары ≥4.5, границы полей и фокус ≥3.
- Документация: 60 тестов, check/lint/build; production-страница /docs/cli при 1440/390/320 px и увеличении текста до 200%. У lint/build остаются прежние предупреждения демо и размера bundle.

Настоящий Chrome 109 и опубликованные npm/OIDC-артефакты 2.3.0 на этом этапе не проверялись. Проверка source tarballs не заменяет smoke после выпуска.

Состав рассчитан `changeset status`: @mednet/cli, tokens, ui, css и lint-config → 2.3.0. Версии локально не поднимались: это делает Version PR.

Пользовательский сценарий после публикации:

```sh
npx @mednet/cli@latest update --dry-run
npx @mednet/cli@latest update
npx @mednet/cli@latest theme set solid --palette graphite --dry-run
npx @mednet/cli@latest theme set solid --palette graphite
```

Если loader установлен, после обновления выполнить agent sync. Тема подключается из установленного каталога; package.json и CSS/HTML/TSX не пересобираются целиком. CSS-only пакет не требует React/tokens в runtime.

## Перед выпуском

1. Зелёные форматирование, сборка, типы и тесты feature PR.
2. Tarball smoke: реальные npm/pnpm install/update через локальный registry, затем theme set; lifecycle scripts отключены.
3. React/HTML: desktop/mobile, светлый/тёмный режимы, четыре палитры, размеры контролов и наследование темы порталом; PNG осмотрены. Build target chrome109 и legacy PostCSS проверены; запуск настоящего Chrome 109 отдельно.
4. До merge Version PR владельцу нужно подготовить новый npm-пакет @mednet/cli и издателя `hpnssflw/mednet-kit`, workflow `release.yml`. На момент проверки имени публичного пакета ещё нет.
5. Feature PR → main создаёт Version PR; его merge и выпуск — в рамках явного согласия владельца по AGENTS.md. release.yml не изменён.

## Граница первой публикации

У нового @mednet/cli ещё нет настроенного trusted publisher. Простой merge Version PR без подготовки npm может привести к частичному выпуску fixed-группы. Настройки npm, токены и ручные publish агент не выполняет: это прямо запрещено AGENTS.md.

Вариант первоначальной подготовки определяет владелец npm. В актуальной [справке npm о staged publishing](https://docs.npmjs.com/staged-publishing/) описано создание нового пакета через staging: registry создаёт публичную placeholder-версию 0.0.0-stage, а содержимое ждёт одобрения владельца. Это внешнее действие, не локальная проверка. Требования npm CLI ≥11.15.0 и Node ≥22.14.0 относятся к издателю, не к runtime CLI потребителя. Затем используется [trusted publishing](https://docs.npmjs.com/trusted-publishers/) с существующим release.yml.

Подготовленный manifest CLI имеет public publishConfig и соответствует общей fixed-группе. Новая тема opt-in, поэтому changeset minor. Импорты и внешний вид существующих страниц не меняются сами.

## Документация и следующая проверка

Страница /docs/cli в C:/A/mednet-playground/react дополнена update/theme set и отмечает, что npx станет доступен после публикации. Пакеты playground пока остаются на опубликованном релизе; переход самого сайта с прототипного CSS на официальный импорт следует выполнять после появления 2.3.0 в npm.

После релиза проверить `npm view @mednet/cli@2.3.0 version`, bin через `npx @mednet/cli@2.3.0 --help`, provenance и переход потребителя из registry. Локальные tarballs проверяют состав и команды, но не доступность опубликованной версии и OIDC.
