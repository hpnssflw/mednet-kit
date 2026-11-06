# @mednet/cli

Пока private, не опубликован. Node >=22.12, bin mednet после отдельной локальной установки tarball.

- mednet doctor [--project path] [--surface react|html|tokens] [--json] [--chrome109] — только чтение.
- mednet agent install codex [--project path] [--scope repo|project] [--instructions snippet|managed-block] [--dry-run] [--json].
- mednet agent sync [--project path] [--dry-run] [--json].

CLI работает с уже установленными llms.md/exports. Новый metadata contract, Yarn PnP и CDN-only не поддержаны. Не исполняет конфиги/scripts и не устанавливает зависимости.

По умолчанию устанавливает repo skill и ownership lock, а для AGENTS печатает snippet. managed-block меняет только свой блок. Не заменять чужой skill, изменённые человеком own files/блок или lock. Не использовать --force и не удалять пользовательские файлы для обхода конфликта.

При root install нескольких приложений выбери --project. Для ui→tokens используются package context и одинаковый релиз; разные приложения могут иметь разные версии. Статические CSS/fonts/lint свидетельства не доказывают фактическое подключение; unknown требует проверки.

Установленный skill содержит самостоятельный resolver; последующие вызовы не требуют CLI или сети. Нейтральные правила и API принадлежат установленным пакетам кита, а не loader.

Полные команды, пределы и ручная проверка незавершённого journal: README.md этого пакета.
