# Безопасность mednet-kit

Кит — фронтенд-библиотека: у него нет бэкенда, баз данных и доступов к инфраструктуре. Единственный серьёзный вектор — **цепочка поставки**: если кто-то сможет опубликовать вредоносную версию `@mednet/*`, её JS выполнится на всех сайтах-потребителях (mednet.ru, олимпиада, pmsp-\*).

Процесс релиза — [releasing.md](releasing.md).

## Что защищает от компрометации

| Мера                                                       | Где                             |
| ---------------------------------------------------------- | ------------------------------- |
| Публикация только из CI через trusted publishing (OIDC)    | `.github/workflows/release.yml` |
| Долгоживущего `NPM_TOKEN` нет                              | —                               |
| Публикация ждёт ручного подтверждения (Environment)        | `environment: npm-publish`      |
| Actions закреплены на SHA, `npm` — на точную версию        | `release.yml`, `ci.yml`         |
| `--frozen-lockfile` во всех установках                     | CI, релиз                       |
| Install-скрипты зависимостей выключены, кроме `esbuild`    | `pnpm-workspace.yaml`           |
| Не ставить версии младше 2 суток (`minimumReleaseAge`)     | `pnpm-workspace.yaml`           |
| Аудит prod-зависимостей (high и выше) блокирует CI         | `ci.yml`                        |
| Dependabot: npm и actions, раз в неделю, с задержкой 3 дня | `.github/dependabot.yml`        |
| У пакетов нет `postinstall` и `bin`                        | `packages/*/package.json`       |

## План: что сделать дальше

### 1. Срочно (настройки, 15 минут)

Автоматизировать это нельзя — делает владелец.

- [ ] **GitHub → Settings → Environments → New** `npm-publish`, Required reviewers — владельцы кита. Без этого `environment:` в `release.yml` ничего не защищает.
- [ ] **npmjs.com → каждый пакет `@mednet/*` → Settings → Trusted Publisher**: репозиторий `hpnssflw/mednet-kit`, workflow `release.yml`, Environment `npm-publish`. Иначе публикация упадёт.
- [ ] **2FA** на аккаунтах GitHub и npm у всех, кто может пушить в `main` или публиковать. На npm — «Require two-factor authentication and disallow tokens».
- [ ] **Передеплоить docs-сайт**, если он где-то размещён: в `next` < 16.4.1 были критические RCE (исправлено поднятием до `^16.4.3`).

### 2. На этой неделе

- [ ] **Защита `main`** (Settings → Branches → Rules): запрет прямого пуша, обязательный PR, обязательный зелёный CI, минимум одно ревью, запрет force-push.
- [ ] **Settings → Actions → General**: «Require approval for all outside collaborators» для PR из форков; «Workflow permissions» — Read only по умолчанию.
- [ ] **Settings → Code security**: включить Dependabot alerts, Dependabot security updates, Secret scanning с Push protection.
- [ ] Включить в Actions «Require actions to be pinned to a full-length commit SHA» (сейчас все actions закреплены, настройка не даст регрессировать).
- [ ] Добавить `SECURITY.md` в корень: куда писать об уязвимости (почта или GitHub private vulnerability reporting).

### 3. В ближайший месяц

- [ ] **Разделить job релиза**: Version PR создавать без Environment, а публикацию вынести в отдельный job с `environment: npm-publish`. Сейчас подтверждение нужно на каждый push в `main`.
- [ ] **dev-зависимости с уязвимостями**: `pnpm audit` целиком показывает ещё ~12 (в основном `shadcn>undici`). Это инструменты, не шипятся потребителям; разобрать и обновить или зафиксировать `pnpm.overrides`.
- [ ] **CodeQL** (Security → Code scanning) для JS/TS — бесплатно для публичных репозиториев.
- [ ] **Потребители**: на сайтах держать `@mednet/*` с точной версией и lockfile, обновлять осознанно; добавить CSP (`script-src` без `unsafe-inline`, `connect-src` по списку) — скомпрометированный пакет тогда не сможет отправлять данные наружу.

### 4. Перед выходом CLI/шаблона (plan `pilot-b-template-cli`)

CLI с `bin` запускается на машинах разработчиков — это новый вектор.

- [ ] Без `postinstall`; CLI ничего не скачивает и не исполняет из сети в рантайме.
- [ ] Шаблоны лежат внутри пакета, а не подтягиваются по URL.
- [ ] Публикация с provenance (уже включена `NPM_CONFIG_PROVENANCE`), проверить, что у нового пакета настроен trusted publisher.
- [ ] Ревью такого PR — обязательно двумя людьми.

## Если подозреваете компрометацию

1. `npm deprecate @mednet/<пакет>@<версия> "compromised"` и в течение часа опубликуйте исправленную версию. `npm unpublish` работает только в первые 72 часа и ломает потребителей.
2. Отзовите сессии и ключи GitHub/npm у затронутых людей, смените пароли.
3. В Environment `npm-publish` временно уберите доступ или добавьте правило-запрет.
4. Сообщите владельцам сайтов-потребителей: версии, окно времени, как откатиться (`pnpm install @mednet/<пакет>@<хорошая версия>`).
5. Разберите историю: `git log`, Actions → runs, npm → Access → audit.

## Принципы для агентов и контрибьюторов

- Не добавляйте зависимости без необходимости; новая зависимость — отдельная строка в описании PR.
- Не включайте install-скрипты зависимостей в `onlyBuiltDependencies` без ревью.
- Не добавляйте `NPM_TOKEN` и иные долгоживущие секреты в репозиторий или Actions.
- Не меняйте `release.yml`, настройки пакетов на npm и защиту веток без согласия владельца.
