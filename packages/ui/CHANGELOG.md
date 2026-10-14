# @mednet/ui

## 0.2.0

### Minor Changes

- 31d380e: Chrome/Edge 109 (Windows 7/8.1): в `mednet.css` и `mednet.min.css` вернулись кольца фокуса (в минифицированной версии Chrome 109 их терял), полупрозрачные заливки (деструктивные кнопки и бейджи больше не сплошь красные), иконки select и checkbox и затемнение под диалогом. В современных браузерах вид не меняется. Для React-проектов — PostCSS-плагин `@mednet/ui/postcss` (после `@tailwindcss/postcss`).
- a3f1f7e: Новые пакеты (до первой публикации помечены `private`): `@mednet/ui` — весь набор shadcn/ui на Base UI в стиле Maia и теме бренда, логотип, шапка и подвал, каркасы `PublicLayout` и `AppShell`, справка `llms.md` для AI-агентов; `@mednet/lint-config` — правила ESLint и stylelint, которые не пускают в проект чужие UI-библиотеки, иконки и цвета вне токенов.

### Patch Changes

- Updated dependencies [d3b0b99]
  - @mednet/tokens@0.2.0
