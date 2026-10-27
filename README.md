# mednet-kit

Дизайн-система ЦНИИОИЗ (mednet.ru): токены бренда, CSS для статических сайтов, React-компоненты и шаблоны проектов.

Спецификация: [docs/superpowers/specs/2026-10-13-mednet-design-system-design.md](docs/superpowers/specs/2026-10-13-mednet-design-system-design.md).

| Пакет                                         | Что это                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`@mednet/tokens`](packages/tokens)           | Цвета, шрифты, размеры — CSS-переменные, тема Tailwind v4, JS, JSON                                |
| [`@mednet/css`](packages/css)                 | Готовый CSS для сайтов без React: компоненты Basecoat в теме бренда + шрифты                       |
| [`@mednet/ui`](packages/ui)                   | React-компоненты: shadcn/ui (Base UI, Maia) в теме бренда, логотип, шапка, подвал, каркасы страниц |
| [`@mednet/lint-config`](packages/lint-config) | ESLint и stylelint: защита бренда в проектах                                                       |

## Разработка

Нужны Node 22.12+ (рекомендуется 24 LTS), pnpm 10, Docker (для скриншот-тестов).

```bash
pnpm install
pnpm build        # собрать все пакеты и docs-сайт
pnpm test         # тесты
pnpm typecheck
pnpm format       # Prettier
```

## Релизы

Изменение пакета `@mednet/*` → changeset (`pnpm changeset`) → merge в `main` → бот открывает PR «Релиз пакетов @mednet/\*» → его merge публикует пакеты из GitHub Actions (trusted publishing, provenance). Подробно и правила — [docs/releasing.md](docs/releasing.md).

## Лицензия

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России — см. [LICENSE](LICENSE). Сторонние компоненты в `@mednet/css` — [THIRD_PARTY_NOTICES.md](packages/css/THIRD_PARTY_NOTICES.md). Код shadcn/ui в `@mednet/ui` — [THIRD_PARTY_NOTICES.md](packages/ui/THIRD_PARTY_NOTICES.md).
