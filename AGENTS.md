<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# mednet-kit: правила для агентов

## Релизы

Процесс и правила — [docs/releasing.md](docs/releasing.md). Коротко:

- Изменили что-то в `packages/*`, что видит потребитель, — добавьте changeset в `.changeset/` (`patch` / `minor` / `major` по правилам из docs/releasing.md; изменение бренда, меняющее внешний вид, — `major`).
- Не публикуйте пакеты (`npm publish`, `pnpm publish`, `changeset publish`), не создавайте npm-токены, не меняйте настройки пакетов на npm — публикует только `release.yml` через trusted publishing.
- Не мержите Version PR «Релиз пакетов @mednet/\*» и не меняйте `.github/workflows/release.yml` без явного согласия владельца.
- Не запускайте `pnpm version-packages` локально — версии поднимает Version PR.

## Справка для агентов потребителей

Правила и концепции кита для чужих агентов едут в `llms.md` каждого пакета. Общие разделы (карта пакетов, линтеры, бренд, UX) — в `docs/agent-guide/*.md`; вводные части — `packages/{tokens,css,lint-config}/llms/intro.md` и `packages/ui/llms/*.md`. Изменили правило — правьте там и запустите `pnpm build:agent-guides` (llms.md у tokens/css/lint-config лежат в git, тест сверяет). Новое правило, которое должен знать потребитель, без записи в справке не считается сделанным.

## `@mednet/ui` (пути — от `packages/ui`)

- `src/components/**`, `src/hooks/**`, `src/brand/logo/**`, `src/index.ts`, `src/shadcn-tailwind.css` — сгенерированы; руками не править. Импорт `cn` и подписи — `scripts/postgen.mjs` (+ `scripts/ru-labels.json`), затем `pnpm --filter @mednet/ui generate`; цвета бренда — правилами `src/brand.css` по сгенерированным классам (не по `data-slot`).
- Любое изменение вида компонента — на обеих сторонах (`packages/ui/src/brand.css` и `packages/css/src/overrides.css`). Автотеста паритета больше нет (его вместе с `apps/docs` удалили), сверяйте руками. Эталон — shadcn Maia.
- Chrome/Edge 109 поддерживается (`@mednet/ui/postcss`): не убирайте плагин из сборок. CI-job `chrome109` удалён вместе с `apps/docs`, проверка совместимости теперь ручная.

## Приложение документации

В этом репозитории фронтенд-приложения нет: `apps/docs` удалён (2026-10-28). Живая документация и демо компонентов — `C:\A\mednet-playground\react` (Vite + React, вне этого репозитория). Не воссоздавайте `apps/docs`, правки сайта делайте там.

- Основа — Base UI: проп `render`, не `asChild`; зависимостей `radix-ui`/`@radix-ui/*` в пакете быть не должно.
- Импорты внутри пакета — `#components/…`, `#hooks/…`, `#lib/…`.
- Новый публичный модуль — ключ в `exports` пакета, `pnpm --filter @mednet/ui gen:index`, раздел в `llms/brand.md` и запись в карте `BRAND` в `scripts/build-llms.mjs`, если это фирменный блок (логотип, шапка, каркас); для каркасов и брендовых модулей — ещё путь в списке `required` в `scripts/check-dist.mjs`.
