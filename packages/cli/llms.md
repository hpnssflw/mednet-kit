# @mednet/cli

Node >=22.12; bin mednet. Пакет готовится к первой публичной публикации release workflow; до выпуска используй локальную сборку/tarball.

- mednet doctor [--project path] [--surface react|html|tokens] [--json] [--chrome109] — только чтение.
- mednet update [--to X.Y.Z] [--project path] [--package-manager npm|pnpm] [--no-install] [--dry-run] [--json] — точные версии уже объявленных пакетов, затем npm/pnpm install без lifecycle scripts и pnpmfile hooks. Default target — версия CLI. После обновления установленного loader выполни agent sync.
- mednet theme set brand|solid [--palette graphite] [--project path] [--surface react|html|tokens] [--css path] [--html path] [--dry-run] [--json] — каталог themes.json установленного пакета, управляемый CSS import и статические root html атрибуты. Класс dark сохраняется. Dynamic JSX/spread и неоднозначность требуют ручного решения.
- mednet agent install codex [--project path] [--scope repo|project] [--instructions snippet|managed-block] [--dry-run] [--json].
- mednet agent sync [--project path] [--dry-run] [--json].

Сначала dry-run. Update --no-install сообщает pending; при ошибке установки manifest уже обновлён, общей атомарности с node_modules/lock нет. Повтори update после устранения причины. Workspace/file/link/npm-alias ranges не заменяй автоматически.

Doctor/agent/theme не исполняют конфиги/scripts и не обращаются к сети. Loader читает llms.md/exports; новый metadata contract R3, Yarn PnP и CDN-only не поддержаны. Для ui→tokens нужен одинаковый релиз.

По умолчанию repo skill и ownership lock; для AGENTS snippet, managed-block меняет только свой блок. Не заменяй чужой skill, ручные изменения own files/блока или lock. Не используй --force и не удаляй данные для обхода конфликта. Symlink/junction в назначениях запрещены.

Установленный skill содержит самостоятельный resolver без runtime-зависимости от CLI/сети. Правила и API принадлежат установленным пакетам. Статические свидетельства не доказывают работу CSS/fonts/lint/Chrome109.

Полные команды, ограничения и восстановление journal: README.md этого пакета.
