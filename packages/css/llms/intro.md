Готовый CSS для страниц без React (статика, MODX, любые шаблонизаторы): компоненты [Basecoat](https://basecoatui.com) в стиле Maia в теме ЦНИИОИЗ, шрифт Montserrat и токены бренда. React-проекты берут `@mednet/ui`, а не этот пакет.

## Правила

1. **Подключение:** `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mednet/css@2/dist/mednet.min.css">` и, если нужны интерактивные компоненты, `<script src="https://cdn.jsdelivr.net/npm/@mednet/css@2/dist/mednet.js" defer></script>`. Либо скопируйте папку `dist/` из пакета целиком (шрифты в `dist/fonts/` подключены относительными путями). Только шрифты — `dist/fonts.css`.
2. **Разметка — классы и `data-`-атрибуты Basecoat:** `<button class="btn" data-variant="outline" data-size="sm">`, `.card` с `header`/`section`/`footer`, `.field` с `label` и полем. Список компонентов — документация Basecoat; живой пример — `demo/index.html` в пакете.
3. **Только для новых страниц и сайтов без Bootstrap и других CSS-фреймворков:** в `mednet.css` есть сброс стилей (отступы, списки, заголовки) и классы с именами Bootstrap (`.btn`, `.card`), они пересекутся. В существующий сайт подключайте не этот файл, а `@mednet/tokens` (`tokens.css`, переменные `--mn-*`).
4. **Tailwind-утилит (`flex`, `p-4`, `gap-2`) в файле нет** — только компоненты. Раскладку пишите своим CSS на переменных `--mn-*`.
5. **Цвета — только `var(--mn-…)`, не HEX** (stylelint из `@mednet/lint-config` это проверяет).
6. Браузеры: Chrome/Edge 109+ (в том числе Windows 7/8.1), Firefox 128+, Safari 16.4+. В Chrome 109 не работают лишь анимации открытия и авторазмер `textarea`.
