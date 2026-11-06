# Агентный CLI mednet-kit: первая реализация

Дата: 2026-11-06. Разработка разрешена пользователем в отдельной рабочей копии и ветке feat/agent-cli.
Исходный checkout и его незакоммиченные файлы не меняются. Публикация, push, merge и настройки npm не входят.

## Цель

Разработчик устанавливает локальный Codex loader для уже установленного кита, синхронизирует принадлежащие CLI файлы и получает диагностику без исполнения проектных конфигов.

## Подход

Небольшой Node ESM пакет packages/cli, предварительное имя @mednet/cli, bin mednet. Node >=22.12.
В первой реализации пакет private: true: имя и первая публикация требуют отдельного release решения.
Существующие llms.md и package exports — рабочий legacy источник. Новый knowledge contract R3 и генератор приложений не входят.
Альтернатива — сначала полный metadata pipeline — отложена: не нужна для проверки установщика и требует отдельной работы с публичными exports.

## Команды

- mednet doctor [--project path] [--json] [--chrome109]
- mednet agent install codex [--project path] [--scope repo|project] [--instructions snippet|managed-block] [--dry-run] [--json]
- mednet agent sync [--project path] [--dry-run] [--json]
- --help и --version; ошибки аргументов возвращают 2; blocking diagnosis/conflict возвращает 1; успех и предупреждения — 0.

## Обнаружение

Читать package.json относительно выбранного приложения через Node resolution, не импортировать UI и не исполнять config/scripts.
Поддержать npm и pnpm node_modules, корневой и leaf запуск, несколько приложений, CSS-only и tokens-only.
Учитывать только явно объявленную surface; ui→tokens разрешать из контекста ui. Разные приложения могут использовать разные версии.
Два явно объявленных UI/CSS surface в одном приложении требуют --surface react|html; root install при нескольких проектах требует --project.
Doctor из root может диагностировать несколько проектов. Отсутствующий kit — not applicable для doctor, ошибка для install.
Поддержка metadata manifests пока не заявляется: присутствующий новый contract требует поддерживающий CLI.
Разные версии ui и его tokens — неподдержанная комбинация первой реализации, без автоматического обновления.

## Установка и ownership

Repo scope устанавливает .agents/skills/mednet-kit и .mednet/agent-lock.json в корне репозитория; project scope — в выбранном проекте.
Helper и его модули копируются вместе с SKILL.md и работают без CLI, сети и дополнительных npm dependencies.
Lock schemaVersion=1 содержит относительные project roots, surface, версии, loader version и SHA-256 своих файлов.
Чужой одноимённый skill без lock, изменённые свои файлы/блок, повреждённый lock — конфликт до записи.
Повторный запуск — no-op без timestamp churn; удалённый owned файл показывается как восстановление.
Default AGENTS integration — snippet в выводе. managed-block — явный выбор; вне блока сохраняются исходные bytes, CRLF и Unicode.
AGENTS.override диагностируется; файл не заменяется. Ручная ссылка на kit instructions учитывается без дублирования.
Все назначения проверяются на traversal и symlink/junction. Другие файлы skill каталога не удаляются.
Staged apply использует временный journal; при обычном сбое откатывает собственные записи. Неудалённый journal блокирует дальнейшую запись и виден doctor.
Нет обещания атомарной замены нескольких файлов или защиты от произвольного конкурентного злоумышленника.

## Doctor

JSON: schemaVersion, status pass|warn|fail, projects, checks с id/status/evidence/message/remediation.
Проверять installed versions/exports/guides, ownership/drift, scope/duplicate skills/override.
Подключение CSS/fonts/lint/PostCSS — только статические свидетельства; unknown не превращается в pass.
Не читать env/секреты, не запускать lint/build/scripts и не обращаться в сеть.
Doctor не доказывает визуальное качество, WCAG или Chrome109. Они требуют отдельных проверок.
Yarn PnP, CDN-only registry packs и другие агенты пока не поддерживаются.

## Приёмка

Black-box команды во временных npm/pnpm/monorepo fixtures, включая два release набора, CSS-only, legacy и no-kit.
Хэши дерева неизменны после doctor/dry-run; no-op не меняет bytes/mtime.
Проверить чужие и изменённые файлы, CRLF, override, ссылки, повреждённый lock, interrupted journal и rollback сбоя записи.
Упакованный пакет запускается вне репозитория; установленный helper работает после удаления доступа к CLI.
Полный обязательный набор проекта после изменений: format:check и turbo build/typecheck/test. Отдельно указать baseline failures.
