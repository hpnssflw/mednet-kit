# @mednet/ui

React-компоненты дизайн-системы ЦНИИОИЗ: весь набор [shadcn/ui](https://ui.shadcn.com) на [Base UI](https://base-ui.com) в стиле Maia и теме бренда, логотип, шапка и подвал сайта, каркасы страниц `PublicLayout` и `AppShell`. Для Next.js 16 (App Router, React Server Components) и других React 19-проектов на Tailwind CSS v4.

## Подключение

```bash
npm i @mednet/ui
npm i -D tailwindcss @tailwindcss/postcss
```

`app/globals.css` — одна строка:

```css
@import '@mednet/ui/styles.css';
```

Графики: `recharts` — peer-зависимость, установите его в проект (`npm i recharts`); компоненты графика импортируйте из `recharts`, обёртки — из `@mednet/ui/chart`.

Peer-зависимости (`recharts`, `lucide-react`, `react-day-picker`) npm 7+ и pnpm 8+ ставят сами; в yarn и при отключённом `auto-install-peers` — `npm i recharts lucide-react react-day-picker`.

Компоненты — по подпутям:

```tsx
import { Button } from '@mednet/ui/button';
import { AppShell } from '@mednet/ui/app-shell';
```

Chrome/Edge 109 (Windows 7/8.1): в `postcss.config.mjs` после `@tailwindcss/postcss` добавьте плагин кита, иначе пропадут кольца фокуса и полупрозрачные цвета:

```js
export default {
  plugins: { '@tailwindcss/postcss': {}, '@mednet/ui/postcss': {} },
};
```

Правила для людей и AI-агентов — в `node_modules/@mednet/ui/llms.md` (генерируется под установленную версию). Главное: смена элемента — проп `render`, а не `asChild`; цвета — только семантические классы бренда.

## Разработка пакета

- Компоненты в `src/components` генерирует CLI shadcn по `components.json`; руками их не правят. Обновить из shadcn: `pnpm generate` (≈2–7 минут: `shadcn add --all --overwrite` + `scripts/postgen.mjs`), затем `pnpm build && pnpm test` и просмотр `git diff`.
- Что кит меняет в коде shadcn: импорт `cn` и русские подписи — `scripts/postgen.mjs` и `scripts/ru-labels.json` (скрипт падает, если правку не к чему применить: значит, shadcn поменял исходник); цвета бренда — правилами `src/brand.css` поверх сгенерированных классов, сами файлы не меняются.
- Chrome/Edge 109 (Windows 7/8.1): PostCSS-плагин `@mednet/ui/postcss` ставится в проекте после `@tailwindcss/postcss`.
- Логотип: `pnpm logos` (из `assets/brand/logo/*.svg`). Индекс: `pnpm gen:index`. CSS shadcn: `pnpm vendor-css`.
- Импорты внутри пакета — `#components/…`, `#hooks/…`, `#lib/…` (поле `imports` в `package.json`).

## Лицензии

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России. Код shadcn/ui — MIT, см. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
