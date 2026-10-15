# @mednet/css

## 0.2.0

### Minor Changes

- 08da2d7: Компоненты статики выровнены под shadcn Maia (как в `@mednet/ui`): синяя граница контурной кнопки в фокусе и красная — с ошибкой, текст триггера select 500, межстрочный заголовка карточки 1.5, вкладки без тени у активной и с контуром в фокусе. Наведение на основную кнопку — токен `--primary-hover` (контраст белого текста 5.23:1 вместо 3.20:1). Неактивная вкладка — `--muted-foreground`: контраст 5.16:1 вместо 3.58:1 (у Maia — `foreground` 60 % на `--muted`).
- d3b0b99: Новые пути экспорта: `@import "@mednet/css"` (корень пакета отдаёт `mednet.css`) и `@mednet/*/dist/*` (работает путь CDN вида `@mednet/css/dist/mednet.min.css`). Добавлен токен радиуса `--mn-radius` (`--radius` теперь ссылается на него). Уменьшение движения доходит до компонентов: Tailwind-переходы идут через `--mn-duration-fast`, а анимации и переходы Basecoat гасятся при `prefers-reduced-motion`. `prepublishOnly` не даёт опубликовать пакет без сборки; `tokensObject` отвергает некорректные имена примитивов.

### Patch Changes

- 31d380e: Chrome/Edge 109 (Windows 7/8.1): в `mednet.css` и `mednet.min.css` вернулись кольца фокуса (в минифицированной версии Chrome 109 их терял), полупрозрачные заливки (деструктивные кнопки и бейджи больше не сплошь красные), иконки select и checkbox и затемнение под диалогом. В современных браузерах вид не меняется. Для React-проектов — PostCSS-плагин `@mednet/ui/postcss` (после `@tailwindcss/postcss`).

## 0.1.1

### Patch Changes

- f34425a: Проверка автоматической публикации из GitHub Actions (trusted publishing, provenance).

## 0.1.0

### Minor Changes

- 61ee112: Первый релиз: токены бренда ЦНИИОИЗ (палитра брендбука, семантика shadcn, тема Tailwind v4) и CSS-слой для сайтов без React (Basecoat Maia + Montserrat).
