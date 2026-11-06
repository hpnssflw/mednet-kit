# @mednet/cli

Локальная установка инструкций Codex, синхронизация собственных файлов и диагностика проектов на mednet-kit.

**Пакет пока private и не опубликован.** Команды npx ещё недоступны. Имя npm проверяется перед первым выпуском; release pipeline не изменён.

## Запуск из рабочей копии

Нужен Node 22.12+. Из корня mednet-kit:

    pnpm install --frozen-lockfile
    pnpm --filter @mednet/cli build
    pnpm --filter @mednet/cli test
    pnpm --filter @mednet/cli typecheck

Затем из каталога проекта потребителя:

    node <mednet-kit>/packages/cli/dist/cli.mjs doctor --json
    node <mednet-kit>/packages/cli/dist/cli.mjs agent install codex --dry-run
    node <mednet-kit>/packages/cli/dist/cli.mjs agent install codex
    node <mednet-kit>/packages/cli/dist/cli.mjs agent sync

После локальной установки собранного tarball доступен bin mednet. Установка tarball — отдельное явное действие разработчика.

## Возможности

| Команда                       | Результат                                                           |
| ----------------------------- | ------------------------------------------------------------------- |
| doctor                        | Read-only отчёт о пакетах, exports, llms и установленном loader     |
| agent install codex           | Skill, самостоятельный resolver и .mednet/agent-lock.json           |
| agent sync                    | Обновление только принадлежащих CLI файлов и зафиксированных версий |
| --dry-run                     | План с путями, хэшами и желаемым содержимым; ни одной записи        |
| --json                        | Машиночитаемый отчёт schemaVersion=1                                |
| --project apps/web            | Явный выбор приложения относительно cwd                             |
| --surface react\|html\|tokens | Выбор при нескольких явно объявленных surface                       |
| --scope project               | Установка рядом с выбранным приложением; default — repo             |
| --instructions managed-block  | Явное добавление только блока mednet-kit в AGENTS.md                |
| doctor --chrome109            | Поиск статической ссылки на legacy PostCSS plugin                   |

По умолчанию AGENTS.md не меняется: CLI печатает короткий snippet. В managed-block режиме сохраняются исходные bytes вне блока, UTF-8 BOM и CRLF. UTF-16 требует ручной интеграции. Ручная ссылка на llms учитывается без повторной вставки.

Repo scope размещает skill в .agents/skills/mednet-kit корня Git-репозитория. Codex обнаруживает skills по пути от cwd до корня; project scope доступен при запуске внутри соответствующего приложения. Одноимённые skills не объединяются. [Официальная справка](https://learn.chatgpt.com/docs/build-skills).

AGENTS.override.md имеет приоритет над AGENTS.md в своей директории; CLI сообщает о нём и не меняет override. Он не интерпретирует смысл произвольной проектной политики. [Правила discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## Источники и ограничения

Первая реализация использует **установленные llms.md и package exports**. Structured manifest contract R3 пока не реализован; при явно экспортированном новом manifest CLI блокирует установку. Правила кита, стили и API в пакет CLI не копируются.

Поддерживаются npm/pnpm node_modules, root/leaf monorepo с обычными package.json workspaces или списком packages в pnpm-workspace.yaml, React, HTML/CSS и tokens-only. Учитываются явно объявленные зависимости проекта. Для ui tokens разрешаются из контекста ui; в первой реализации поддержаны одинаковые версии ui и его tokens. Совместимость произвольных npm ranges и других сочетаний не сертифицируется.

Из root doctor показывает все подходящие workspace проекты. Install при неоднозначности требует --project. Root sync проверяет все проекты своего lock до записи; --project ограничивает выбранной записью. Разные приложения могут использовать разные релизы.

Поиск workspaces ограничен 2000 каталогами и глубиной 8; для больших/нестандартных layouts используйте --project. Статический поиск подключения ограничен 500 файлами и глубиной 6; отсутствие свидетельства означает unknown. Конфиги и package scripts не исполняются.

Наличие строки подключения CSS/fonts/lint/PostCSS — свидетельство, а не доказательство фактической работы. Doctor не устанавливает effective lint rules, не проверяет WCAG, качество дизайна, загрузку webfont или работу Chrome109. Нужны соответствующие проверки приложения.

Yarn PnP, CDN-only/registry knowledge packs, другие агенты и генератор приложений пока не поддерживаются. CLI не устанавливает и не обновляет npm-зависимости, не меняет глобальные skills/config и не обращается к сети.

## Ownership и восстановление

В .mednet/agent-lock.json находятся относительные корни проектов, версии, source digest, хэши собственных файлов и своего блока. Lock и skill следует хранить в репозитории потребителя.

Повторный запуск с теми же входами — no-op. Удалённый собственный файл восстанавливается с явным действием restore в плане. Изменённый человеком файл или блок, чужой одноимённый skill, повреждённый lock и symlink/junction в назначениях останавливают весь план до записи. --force не предусмотрен.

Обычный сбой записи откатывает уже заменённые собственные файлы. Прерванный процесс может оставить .mednet/.agent-transaction.json и .agent-stage-*; следующий запуск блокирует запись, doctor сообщает о незавершённой операции. Journal содержит исходные bytes в base64 и желаемые SHA-256. Сначала сохраните его копию и сопоставьте записи с текущими файлами, восстановите исходное либо завершённое согласованное состояние, затем удалите только проверенные временные артефакты. Автоматического reset/recover в первой версии нет. Несколько файлов не меняются одной атомарной операцией.

Коды выхода: 0 — нет blocking failures (предупреждения возможны), 1 — несовместимость/конфликт/ошибка операции, 2 — неверные аргументы или конфигурация проекта.
