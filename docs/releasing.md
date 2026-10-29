# Релизы `@mednet/*`

Пакеты `@mednet/tokens` и `@mednet/css` публикуются **только из GitHub Actions** (`.github/workflows/release.yml`) через npm trusted publishing (OIDC): без npm-токенов, без ручного 2FA, с provenance (SLSA v1). Все пакеты `@mednet/*` выходят с одной версией (fixed versioning в `.changeset/config.json`). Человек принимает одно решение — мержить ли Version PR.

## Конвейер

```
изменение в packages/*  ──►  changeset в том же PR (pnpm changeset)
          │
          ▼  merge / push в main
  Release workflow: changesets есть
          │  открывает или обновляет PR «Релиз пакетов @mednet/*»
          │  (ветка changeset-release/main: версии в package.json, CHANGELOG.md)
          ▼
  человек мержит Version PR  ◄── единственная ручная точка контроля
          │
          ▼  push в main
  Release workflow: changesets нет, версия не опубликована
          │  pnpm release = сборка и тесты пакетов + changeset publish (OIDC, provenance)
          │  шаг «Теги и GitHub Releases»: теги @mednet/<пакет>@<версия> + релизы из CHANGELOG
          ▼
  npm  ──►  jsDelivr (`@2` подхватывает новую версию в рамках мажора)
```

На каждый push в `main` параллельно идёт CI (`.github/workflows/ci.yml`): формат, сборка, типы, тесты, скриншоты и axe.

## Правила

1. **Каждое изменение в `packages/*`, видимое потребителю, сопровождается changeset** (`pnpm changeset` → файл в `.changeset/`). Правки только тестов, CI и документации репозитория changeset не требуют.
2. **Тип изменения:**
   - `patch` — исправление без изменения внешнего вида и API (опечатка, сборка, метаданные пакета);
   - `minor` — новое и обратно совместимое: токен, компонент, экспорт, утилита;
   - `major` — ломающее: удаление или переименование токена/экспорта, **изменение бренда, которое меняет внешний вид** существующих страниц (значение цвета, шрифт, радиусы). Из `0.x` это переход на `1.0.0` — сайты на CDN `@0` его не получат автоматически, это и нужно.
   - **Исключение (разово):** статическое выравнивание с Maia в 0.2.0 (`.changeset/css-maia-parity.md`) поменяло hover основного цвета, цвет неактивной вкладки и line-height заголовка карточки, но вышло как `minor` по решению владельца (2026-10-14): это доалайнмент до 1.0, до публикации React-пакета. Это не прецедент: видимые изменения бренда — `major`.
3. **Никаких ручных публикаций и npm-токенов.** Единственный путь в npm — merge Version PR. Исключения — первая публикация нового пакета и авария (см. ниже), каждый раз с записью в «Истории».
4. **Не мержить Version PR, если CI на последнем коммите `main` красный.** Сам Version PR CI не запускает (PR создан `GITHUB_TOKEN`) — смотрите статус `main`.
5. **Опубликованная версия неизменна.** Ошибку исправляет следующий `patch`. Сломанную версию помечают `npm deprecate @mednet/<пакет>@<версия> "причина"`, а не удаляют.
6. **`release.yml` — доверенный издатель.** Любой, кто может менять этот файл в `main`, может публиковать от имени `@mednet`. Изменения в нём — только через ревью; рекомендуется защита ветки `main`.
7. **Агенты** не публикуют, не создают npm-токены и не мержат Version PR без явного согласия владельца (см. `AGENTS.md`).

## Настройки (сделаны 2026-10-13)

| Где                                   | Что                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| npm, организация `mednet`             | владелец — `plzv92`, 2FA «Authorization and writes»                                                                                                                            |
| npm, оба пакета → Trusted Publisher   | GitHub Actions, `hpnssflw/mednet-kit`, workflow `release.yml`, права publish (+ stage publish)                                                                                 |
| npm, оба пакета → Publishing access   | `mfa=publish`: 2FA обязательна, токены запрещены (OIDC продолжает работать)                                                                                                    |
| GitHub → Settings → Actions → General | «Allow GitHub Actions to create and approve pull requests» включено, права по умолчанию — read; `release.yml` сам просит `contents`/`pull-requests: write` и `id-token: write` |

Проверка доверенных издателей (требует 2FA): `npm trust list @mednet/tokens`. Режим 2FA пакета виден на npmjs.com → пакет → Settings → Publishing access.

## Новый пакет `@mednet/*`

Trusted publisher настраивается только для уже существующего пакета, поэтому первая версия публикуется вручную.

Private-пакеты версионируются Version PR вместе с остальными (`privatePackages.version: true` в `.changeset/config.json`), но не публикуются и не получают тегов, пока не снят `private`.

1. `package.json`: `"name": "@mednet/<имя>"`, версия — текущая версия кита, `"license": "MIT"`, `"publishConfig": { "access": "public" }`, `repository.directory`, `files`; файл `LICENSE` в папке пакета.
2. Первая публикация — по разделу «Ручная публикация».
3. `npm trust github @mednet/<имя> --file release.yml --repo hpnssflw/mednet-kit --allow-publish -y`
4. `npm access set mfa=publish @mednet/<имя>`

## Ручная публикация (первая версия нового пакета или авария)

npm требует 2FA на каждую публикацию и настройку. В интерактивном терминале npm спросит сам. В неинтерактивной оболочке (агент, скрипт) работает web-подтверждение:

1. `npm publish --json` (или другая команда с `--json`) возвращает `EOTP` с `authUrl` и `doneUrl`. Без `--json` npm маскирует ссылки (`***`).
2. Владелец открывает `authUrl` и подтверждает.
3. `GET doneUrl` с заголовком `Authorization: Bearer <токен сессии из ~/.npmrc>` → `{"token": "…"}`.
4. Повтор той же команды с `--otp=<token>`.

Подводные камни:

- токен одноразовый, и действует **только последний подтверждённый** — подтверждать строго по одному: запрос → подтверждение → выполнение → следующий запрос;
- пакеты с зависимостями `workspace:*` (например, `@mednet/css`) публиковать через pnpm (`pnpm pack` → проверить, что в `package/package.json` нет `workspace:` → `npm publish <tgz>`), а не голым `npm publish` в папке пакета;
- после ручной публикации поставить тег `@mednet/<пакет>@<версия>`, запушить его и создать GitHub Release.

## Проверка после релиза

```bash
npm view @mednet/tokens version
npm view @mednet/tokens@<версия> dist.attestations.provenance.predicateType   # https://slsa.dev/provenance/v1
curl -sI https://cdn.jsdelivr.net/npm/@mednet/css@<версия>/dist/mednet.min.css | head -1
```

- Новая версия 1–2 минуты может отдавать 404 в `npm view` — это задержка реестра.
- jsDelivr кэширует диапазон `@2`; если новая версия не видна, сбросьте кэш: `https://purge.jsdelivr.net/npm/@mednet/css@2/dist/mednet.min.css`.

## Известные особенности

- Ссылки jsDelivr привязаны к мажору (`@mednet/css@2`) и после мажорного релиза остаются на старом диапазоне навсегда. При каждом мажоре обновляйте их: `grep -rn "@mednet/[a-z]*@[0-9]"` по README пакетов и сайту `mednet-playground/react`.
- `changesets/action@v1` не распознаёт формат вывода `@changesets/cli` 3: теги создаются только в раннере, GitHub Releases не появляются. Поэтому в `release.yml` есть отдельный шаг «Теги и GitHub Releases».
- Version PR не запускает CI (ограничение GitHub для PR от `GITHUB_TOKEN`).
- `npm install -g npm@11` в `release.yml` нужен для trusted publishing (npm 11.5.1+); мажор закреплён, чтобы релиз не ломался от выхода новой версии npm.
- Сторонние actions в обоих workflow закреплены полным SHA коммита с комментарием `# vX.Y.Z`; обновлять — осознанно (SHA через `gh api repos/<owner>/<repo>/git/ref/tags/<tag>`, аннотированный тег разыменовать до коммита).
- `pnpm release` перед публикацией не только собирает пакеты, но и гоняет их тесты (`turbo run build test`); `prepublishOnly` в пакетах дополнительно не даёт опубликовать их без `dist/`.
- Job CI `chrome109` гоняет smoke-тест в Chromium 109 (Docker `mcr.microsoft.com/playwright:v1.29.2-focal`): Tailwind, Next и Base UI официально поддерживают Chrome 111+, и их обновление может молча сломать Windows 7/8.1 — job это поймает.

## История

| Версия | Дата       | Как                                                                                                                                                                                                                                  |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.1.0  | 2026-10-13 | первая публикация вручную (web-подтверждение 2FA), затем настроены trusted publishing и `mfa=publish`; теги и релизы досланы вручную                                                                                                 |
| 0.1.1  | 2026-10-13 | первая автоматическая публикация через Version PR #1 (проверка конвейера), provenance SLSA v1; теги и релизы досланы вручную, после чего добавлен шаг в `release.yml`                                                                |
| 1.0.0  | 2026-10-26 | tokens и css — Version PR #4 (веб-шкала шрифтов, major); `@mednet/ui` и `@mednet/lint-config` — первая публикация вручную (web-подтверждение 2FA), затем trusted publishing и `mfa=publish`; теги и релизы для них добавлены вручную |
