# @mednet/css

Готовый CSS для сайтов без React (статика, MODX, любые шаблонизаторы): компоненты [Basecoat](https://basecoatui.com) (стиль Maia) в теме ЦНИИОИЗ, шрифт Montserrat и токены бренда.

## Подключение

Без сборки — с CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mednet/css@0/dist/mednet.min.css" />
<script src="https://cdn.jsdelivr.net/npm/@mednet/css@0/dist/mednet.js" defer></script>
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

- **Tailwind-утилит (`flex`, `p-4`, `gap-2`) в файле нет** — только компоненты. Для раскладки пишите свой CSS на переменных `--mn-*` или используйте HTML-шаблон со сборкой.
- На существующем сайте подключайте `mednet.css` **после** CSS сайта и в своём CSS используйте только переменные `--mn-*` (Bootstrap 4 объявляет свой `--primary`).
- Цвета — только через переменные: `color: var(--mn-primary)`, не HEX.

## Лицензии

Код — MIT. Montserrat — SIL Open Font License 1.1 (`dist/fonts/OFL.txt`). Basecoat и Tailwind CSS — MIT.
