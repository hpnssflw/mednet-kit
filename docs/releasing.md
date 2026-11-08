# Релизы `@mednet/*`

Пакеты `@mednet/*` публикуются **только из GitHub Actions** (`.github/workflows/release.yml`) через npm trusted publishing (OIDC): без npm-токенов, без ручного 2FA, с provenance (SLSA v1). Все пакеты `@mednet/*` выходят с одной версией (fixed versioning в `.changeset/config.json`). Человек принимает одно решение — мержить ли Version PR.

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
3. **Никаких ручных релизных publish и npm-токенов.** Пакеты публикует release.yml после merge Version PR. Для нового имени нужен отдельно разрешённый bootstrap через staging и настройка trusted publisher; целевая версия выпуска при этом не публикуется вручную.
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

Trusted publisher требует существующего npm-пакета. Bootstrap нового имени и настройки npm выполняются только после явного разрешения владельца; основной релиз остаётся в release.yml.

Private-пакеты Version PR версионирует вместе с остальными, но не публикует. До выпуска проверить name, public publishConfig, repository.directory, bin/exports/files, LICENSE, packed состав и согласованный changeset.

1. Проверить стандартную npm-сессию: `npm whoami`. При 401 владелец проходит `npm login`; токены не копируются в репозиторий и не создаются вручную.
2. Для резервирования нового имени использовать отдельный временный bootstrap tarball через `npm stage publish ./mednet-cli-bootstrap.tgz --access public`. npm создаёт публичный placeholder 0.0.0-stage; содержимое stage не становится публичным без approval. Требуются npm ≥11.15 и Node ≥22.14.
3. Bootstrap имеет отдельную prerelease-версию, например 0.0.1-bootstrap.0, **не целевую 2.3.0**. Staged и published версии делят один semver index: занятая stage-версия помешает штатной публикации той же версии. Исходные package.json кита локально не поднимаются.
4. Настроить издателя, например `npm trust github @mednet/cli --file release.yml --repo hpnssflw/mednet-kit --allow-publish -y`. Владелец подтверждает необходимые npm 2FA-действия штатным интерфейсом. Проверить repo/workflow и право publish через `npm trust list @mednet/cli`.
5. После зелёного CI main и проверки Version PR слить его в рамках данного разрешения. CI публикует настоящий пакет, provenance, теги и GitHub Releases.
6. Проверить registry/bin/exports и provenance. Временный bootstrap stage отклонить по его точному stage ID; не затрагивать другие staged версии. Не утверждать bootstrap как публичную рабочую версию CLI.

[Официальная справка stage](https://docs.npmjs.com/cli/v11/commands/npm-stage/), [trusted publisher](https://docs.npmjs.com/cli/v11/commands/npm-trust/). Исторические ручные публикации в таблице ниже описывают прошлые события и не являются текущей процедурой.

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
- Job chrome109 удалён вместе с apps/docs. Поддержка Chrome/Edge 109 проверяется вручную с реальным браузером, fresh build и @mednet/ui/postcss; современный Chrome и один build target этого не доказывают. Браузерные проверки живут во внешнем playground.

## История

| Версия | Дата       | Как                                                                                                                                                                                                                                  |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.1.0  | 2026-10-13 | первая публикация вручную (web-подтверждение 2FA), затем настроены trusted publishing и `mfa=publish`; теги и релизы досланы вручную                                                                                                 |
| 0.1.1  | 2026-10-13 | первая автоматическая публикация через Version PR #1 (проверка конвейера), provenance SLSA v1; теги и релизы досланы вручную, после чего добавлен шаг в `release.yml`                                                                |
| 1.0.0  | 2026-10-26 | tokens и css — Version PR #4 (веб-шкала шрифтов, major); `@mednet/ui` и `@mednet/lint-config` — первая публикация вручную (web-подтверждение 2FA), затем trusted publishing и `mfa=publish`; теги и релизы для них добавлены вручную |
