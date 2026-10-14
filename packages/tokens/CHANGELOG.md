# @mednet/tokens

## 0.2.0

### Minor Changes

- d3b0b99: Новые пути экспорта: `@import "@mednet/css"` (корень пакета отдаёт `mednet.css`) и `@mednet/*/dist/*` (работает путь CDN вида `@mednet/css/dist/mednet.min.css`). Добавлен токен радиуса `--mn-radius` (`--radius` теперь ссылается на него). Уменьшение движения доходит до компонентов: Tailwind-переходы идут через `--mn-duration-fast`, а анимации и переходы Basecoat гасятся при `prefers-reduced-motion`. `prepublishOnly` не даёт опубликовать пакет без сборки; `tokensObject` отвергает некорректные имена примитивов.

## 0.1.1

### Patch Changes

- f34425a: Проверка автоматической публикации из GitHub Actions (trusted publishing, provenance).

## 0.1.0

### Minor Changes

- 61ee112: Первый релиз: токены бренда ЦНИИОИЗ (палитра брендбука, семантика shadcn, тема Tailwind v4) и CSS-слой для сайтов без React (Basecoat Maia + Montserrat).
