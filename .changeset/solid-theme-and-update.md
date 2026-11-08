---
"@mednet/tokens": minor
"@mednet/ui": minor
"@mednet/css": minor
"@mednet/lint-config": patch
"@mednet/cli": minor
---

Официальная opt-in тема «Солид» с четырьмя палитрами и каталогом themes.json. Новые CSS exports для React, HTML и tokens-only; обновлены инструкции агентов. Исходная тема существующих страниц сохраняется, новая тема включается явно.

CLI готов к первой публичной публикации: update согласует версии пакетов через npm/pnpm, theme set подключает официальный stylesheet и корневые атрибуты. Обе команды поддерживают dry-run, сохраняют посторонние исходники и останавливаются на конфликте. Runtime Node 22.12+.
