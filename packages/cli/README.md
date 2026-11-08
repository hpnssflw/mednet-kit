# @mednet/cli

Обновление пакетов mednet-kit, выбор официальной темы, инструкции Codex и диагностика подключения. Node 22.12+.

Опубликованная версия запускается через `npx @mednet/cli@latest` или bin `mednet` после установки пакета. Для проверки ещё не выпущенных изменений используйте собранный `packages/cli/dist/cli.mjs` из рабочей копии либо локальный tarball. Публикацию выполняет release workflow.

## Обновление и тема

После публикации, из каталога потребителя:

```sh
npx @mednet/cli@latest update --dry-run
npx @mednet/cli@latest update
npx @mednet/cli@latest theme set solid --palette graphite --dry-run
npx @mednet/cli@latest theme set solid --palette graphite
```

`update` согласует **уже объявленные** `@mednet/ui`, `@mednet/css`, `@mednet/tokens`, `@mednet/lint-config`, `@mednet/cli` с точной версией CLI. Для другой точной версии есть `--to X.Y.Z`. Секции зависимостей, форматирование и остальные данные package.json сохраняются. Workspace/file/link/npm-alias ссылки и dist-tags требуют ручного решения.

Затем запускается `npm install --ignore-scripts` либо `pnpm install --ignore-scripts --ignore-pnpmfile`. Менеджер определяется по packageManager и lock-файлам; `--package-manager npm|pnpm` разрешает неоднозначность. Установка выполняется в корне владеющего workspace и может обновить общий lock-файл. Для самостоятельного проекта pnpm дополнительно получает --ignore-workspace, чтобы не подхватить посторонний workspace выше по дереву. Сетевой доступ использует настройки registry проекта. Если потребителю нужны lifecycle scripts, запускайте их отдельно после проверки.

`--no-install` только подготавливает package.json и сообщает, что установка ещё нужна. При сбое менеджера package.json остаётся с целевой версией; исправьте причину и повторите `update`. Общей атомарности package.json, lock-файла и node_modules нет.

`theme set solid --palette graphite` читает каталог `themes.json` **установленного** пакета, добавляет импорт официальной темы после базового CSS и статические атрибуты на корневой `<html>`. Доступны terracotta, indigo, graphite, bright; без --palette берётся defaultPalette каталога. `theme set brand` возвращает исходную тему и удаляет принадлежащий CLI импорт. Класс dark сохраняется.

Автоматически распознаются стандартные CSS-файлы в src/, app/, styles/, Vite index.html и Next app/layout.tsx, jsx или js (также src/app). При нескольких кандидатах укажите `--css src/main.css --html index.html`. Пути должны лежать внутри выбранного проекта. Динамические атрибуты темы, JSX spread на html, неоднозначные точки подключения и изменённый вручную блок `mednet:theme` останавливают запись. Произвольные серверные шаблоны и CSS-in-JS подключаются вручную по справке установленного пакета.

## Инструкции агентов и диагностика

```sh
mednet doctor --json
mednet agent install codex --dry-run
mednet agent install codex
mednet agent sync
```

Doctor читает файлы без исполнения конфигов. Agent install устанавливает самостоятельный skill, resolver и `.mednet/agent-lock.json`; npm-зависимости он не меняет. После update выполните agent sync, если loader установлен.

| Флаг                          | Назначение                                                |
| ----------------------------- | --------------------------------------------------------- |
| --dry-run                     | План и хэши без изменения проекта и без запуска менеджера |
| --json                        | Машиночитаемый отчёт schemaVersion=1                      |
| --project apps/web            | Выбор приложения относительно cwd                         |
| --surface react\|html\|tokens | Выбор явно объявленной стороны кита                       |
| --scope project               | Skill рядом с приложением; по умолчанию repo              |
| --instructions managed-block  | Явное добавление собственного блока в AGENTS.md           |
| doctor --chrome109            | Статическое свидетельство legacy PostCSS plugin           |

Без --instructions AGENTS.md не меняется: CLI печатает snippet. В managed-block сохраняются bytes вне собственного блока, UTF-8 BOM и CRLF. UTF-16 требует ручной интеграции.

Repo scope помещает skill в .agents/skills/mednet-kit корня Git. Project scope виден Codex при запуске из соответствующего приложения. Одноимённые skills не объединяются. [Официальная справка](https://learn.chatgpt.com/docs/build-skills). AGENTS.override.md имеет приоритет; CLI сообщает о нём и не меняет. [Правила discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## Источники и ограничения

Loader использует установленные llms.md и package exports; новый structured manifest contract R3 пока не поддержан и блокирует установку loader. Каталог тем schemaVersion=1 — отдельный публичный контракт, а не metadata contract агентов.

Поддерживаются npm/pnpm node_modules, Git/workspaces, React, HTML/CSS и tokens-only. Учитываются явно объявленные зависимости; ui и его tokens должны быть одного релиза. Разные приложения могут использовать разные релизы. Из корня doctor показывает все приложения; install/theme/update при неоднозначности требуют --project. Root sync проверяет все зарегистрированные проекты до записи.

Поиск workspaces ограничен 2000 каталогами и глубиной 8, статическое подключение — 500 файлами и глубиной 6. Для больших проектов задавайте --project. Yarn PnP, CDN-only управление, генерация приложений, глобальные skills/config и другие агенты не поддерживаются.

Doctor не доказывает применение CSS/fonts/lint, качество дизайна, WCAG и работу Chrome109: отсутствие свидетельства — unknown. Нужны проверки самого приложения. Только update запускает менеджер и обращается к registry; doctor/agent/theme конфиги и package scripts не исполняют.

## Ownership и восстановление

Skill и .mednet/agent-lock.json следует хранить в репозитории потребителя. Lock содержит версии источников и хэши собственных файлов. Повторный запуск с теми же входами — no-op; удалённый собственный файл восстанавливается с действием restore в плане. Чужой одноимённый skill, изменённые человеком own files/блок, повреждённый lock, symlink/junction в назначениях останавливают запись. --force не предусмотрен.

План theme/update показывает пути, хэши и назначение изменений без полного содержимого пользовательских файлов. CSS/HTML/TSX/package.json редактируются по диапазонам синтаксического дерева; посторонние bytes сохраняются.

Обычный сбой замены файлов откатывает уже применённые правки. Прерванный процесс может оставить .mednet/.agent-transaction.json и .agent-stage-*; следующий запуск блокирует запись, doctor сообщает о незавершённой операции. Journal содержит исходные bytes в base64 и желаемые SHA-256. Сохраните копию, сопоставьте записи с файлами, восстановите согласованное состояние, затем удалите только проверенные временные артефакты. Автоматического recover нет. Несколько файлов не меняются одной атомарной операцией.

Коды выхода: 0 — нет blocking failures (возможны предупреждения), 1 — конфликт/несовместимость/сбой операции, 2 — неверные аргументы или конфигурация.

## Локальная разработка

Из корня mednet-kit: `pnpm install --frozen-lockfile`, затем `pnpm --filter @mednet/cli build`, `test`, `typecheck`. Из потребителя: `node <mednet-kit>/packages/cli/dist/cli.mjs --help`. Установка локального tarball предоставляет bin mednet.
