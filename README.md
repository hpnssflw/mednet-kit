# mednet-kit

Дизайн-система ЦНИИОИЗ (mednet.ru): токены бренда, CSS для статических сайтов, React-компоненты и шаблоны проектов.

Спецификация: [docs/superpowers/specs/2026-10-13-mednet-design-system-design.md](docs/superpowers/specs/2026-10-13-mednet-design-system-design.md).

| Пакет                               | Что это                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| [`@mednet/tokens`](packages/tokens) | Цвета, шрифты, размеры — CSS-переменные, тема Tailwind v4, JS, JSON          |
| [`@mednet/css`](packages/css)       | Готовый CSS для сайтов без React: компоненты Basecoat в теме бренда + шрифты |

## Разработка

Нужны Node 22.12+ (рекомендуется 24 LTS), pnpm 10, Docker (для скриншот-тестов).

```bash
pnpm install
pnpm build        # собрать все пакеты и docs-сайт
pnpm test         # тесты
pnpm typecheck
pnpm format       # Prettier
```

## Лицензия

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России — см. [LICENSE](LICENSE). Сторонние компоненты в `@mednet/css` — [THIRD_PARTY_NOTICES.md](packages/css/THIRD_PARTY_NOTICES.md).
