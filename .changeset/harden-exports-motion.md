---
'@mednet/tokens': minor
'@mednet/css': minor
---

Новые пути экспорта: `@import "@mednet/css"` (корень пакета отдаёт `mednet.css`) и `@mednet/*/dist/*` (работает путь CDN вида `@mednet/css/dist/mednet.min.css`). Добавлен токен радиуса `--mn-radius` (`--radius` теперь ссылается на него). Уменьшение движения доходит до компонентов: Tailwind-переходы идут через `--mn-duration-fast`, а анимации и переходы Basecoat гасятся при `prefers-reduced-motion`. `prepublishOnly` не даёт опубликовать пакет без сборки; `tokensObject` отвергает некорректные имена примитивов.
