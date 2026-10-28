# @mednet/tokens

Дизайн-токены ЦНИИОИЗ: палитра брендбука v8, семантика shadcn/ui, тема Tailwind CSS v4.

## Tailwind v4 (Next.js, Vite)

```css
@import 'tailwindcss';
@import '@mednet/tokens/theme.css';
```

Стандартная палитра Tailwind удалена — доступны только цвета бренда (`bg-red-500`, `text-blue-700`, шаги 50–950, базовый цвет — 500) и семантика (`bg-primary`, `text-muted-foreground`, `border-border`). Шрифт по умолчанию — Montserrat (файлы шрифта подключайте отдельно, например из `@mednet/css/fonts.css` или `@fontsource/montserrat`).

> `theme.css` сбрасывает палитру Tailwind (`--color-*: initial`): в существующем проекте пропадут утилиты `gray`, `slate`, `zinc` и других, а одноимённые `red`, `blue`, `green`, `yellow`, `orange` станут шкалами бренда — проверьте проект перед переходом.

## Обычный CSS

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mednet/tokens@2/dist/tokens.css" />
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

## Тёмная тема

Включается классом `dark` на `<html>` (или на любом предке). По `prefers-color-scheme` кит тему сам не переключает: выбор — за проектом (ключ `mn-theme` в примере — свой). Скрипт без мигания:

```html
<!-- В <head>, до стилей: класс ставится до первой отрисовки, без мигания светлой темы -->
<script>
  try {
    var t = localStorage.getItem('mn-theme');
    if (t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches))
      document.documentElement.classList.add('dark');
  } catch (e) {}
</script>
```

Переключатель — своя кнопка: `document.documentElement.classList.toggle('dark')` и запись выбора в `localStorage`.

Свой цвет в тёмной теме переопределяйте токеном, а не HEX: `.dark { --mn-primary: var(--mn-red-300); }`. Значения тёмной темы в JS — `semanticDark` (имя → hex), рядом с `semantic`.

## Как устроено

- `tokens/primitives.json` — примитивы в формате DTCG, **генерируются** из `src/brand.ts` (`pnpm generate`).
- `tokens/semantic.json` — семантика: только алиасы на примитивы.
- `tokens/semantic.dark.json` — тёмная тема: только отличия от светлой, тоже алиасы (`.dark` в `tokens.css`).
- `pnpm build` → `dist/tokens.css`, `dist/theme.css`, `dist/tokens.json`, `dist/index.js`.
- `pnpm test` проверяет контраст всех семантических пар (WCAG 2.1 AA). Проверяются обе темы. Если пара не проходит — меняйте ступень в `semantic.json` или `semantic.dark.json`, а не порог.

## Лицензия

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России (`LICENSE`).
