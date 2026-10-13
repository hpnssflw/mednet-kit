# @mednet/tokens

Дизайн-токены ЦНИИОИЗ: палитра брендбука v8, семантика shadcn/ui, тема Tailwind CSS v4.

## Tailwind v4 (Next.js, Vite)

```css
@import 'tailwindcss';
@import '@mednet/tokens/theme.css';
```

Стандартная палитра Tailwind удалена — доступны только цвета бренда (`bg-red-500`, `text-blue-700`, шаги 50–950, базовый цвет — 500) и семантика (`bg-primary`, `text-muted-foreground`, `border-border`). Шрифт по умолчанию — Montserrat (файлы шрифта подключайте отдельно, например из `@mednet/css/fonts.css` или `@fontsource/montserrat`).

## Обычный CSS

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mednet/tokens@0/dist/tokens.css" />
```

```css
.notice {
  background: var(--mn-info-muted);
  color: var(--mn-info);
}
```

На существующих сайтах используйте только переменные с префиксом `--mn-*`: имена без префикса (`--primary`, `--accent`, `--muted`) конфликтуют с Bootstrap 4 и самописными темами.

## JS

```ts
import { color, semantic, font } from '@mednet/tokens';

color.red['500']; // '#d6867f' — базовый красный бренда
semantic.primary; // '#b55c57' — кнопки и ссылки
```

## Как устроено

- `tokens/primitives.json` — примитивы в формате DTCG, **генерируются** из `src/brand.ts` (`pnpm generate`).
- `tokens/semantic.json` — семантика: только алиасы на примитивы.
- `pnpm build` → `dist/tokens.css`, `dist/theme.css`, `dist/tokens.json`, `dist/index.js`.
- `pnpm test` проверяет контраст всех семантических пар (WCAG 2.1 AA). Если пара не проходит — меняйте ступень в `semantic.json`, а не порог.

## Лицензия

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России (`LICENSE`).
