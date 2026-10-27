# @mednet/css

Готовый CSS для сайтов без React (статика, MODX, любые шаблонизаторы): компоненты [Basecoat](https://basecoatui.com) (стиль Maia) в теме ЦНИИОИЗ, шрифт Montserrat и токены бренда.

## Подключение

Без сборки — с CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mednet/css@1/dist/mednet.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@mednet/css@1/dist/mednet.js" defer></script>
```

Или скопируйте к себе папку `dist/` из пакета (`npm i @mednet/css`) целиком — шрифты лежат в `dist/fonts/` и подключаются относительными путями.

Только шрифты (без компонентов): `dist/fonts.css`.

## Разметка

```html
<button class="btn">Подать заявку</button>
<button class="btn" data-variant="outline" data-size="sm">Отмена</button>

<div class="card">
  <header>
    <h3>Заголовок</h3>
    <p>Описание</p>
  </header>
  <section>Содержимое</section>
  <footer><button class="btn">Действие</button></footer>
</div>

<div class="field">
  <label for="email">Эл. почта</label>
  <input id="email" type="email" />
</div>
```

Все компоненты: [документация Basecoat](https://basecoatui.com). Живой пример — `demo/index.html`.

## Важно

- **`mednet.css` — для новых страниц и сайтов без Bootstrap и других CSS-фреймворков.** В нём есть сброс стилей (Tailwind preflight обнуляет отступы, списки и заголовки) и классы с именами Bootstrap (`btn`, `badge`, `card`, `alert`, `table`…) — на существующем сайте вёрстка сломается. На существующие сайты подключайте только `@mednet/tokens/dist/tokens.css` и `@mednet/css/dist/fonts.css` — **до** CSS сайта — и в своём CSS используйте только переменные `--mn-*` (имена без префикса, например `--primary`, есть и у Bootstrap 4).
- **Tailwind-утилит (`flex`, `p-4`, `gap-2`) в файле нет** — только компоненты. Для раскладки пишите свой CSS на переменных `--mn-*` или используйте HTML-шаблон со сборкой.
- Цвета — только через переменные: `color: var(--mn-primary)`, не HEX.
- Поддерживаются Chrome/Edge 109+ (в том числе Windows 7/8.1), Firefox 128+, Safari 16.4+. В Chrome 109 не работают только анимации открытия и авторазмер textarea.

## Лицензии

Код пакета — MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России (`LICENSE`). В пакет входят сторонние компоненты: Basecoat и Tailwind CSS — MIT, шрифт Montserrat — SIL Open Font License 1.1 (`dist/fonts/OFL.txt`). Их уведомления об авторских правах — в `THIRD_PARTY_NOTICES.md` и в заголовке `dist/mednet.js`; копируя `dist/` к себе, берите и `THIRD_PARTY_NOTICES.md`.
