---
'@mednet/css': patch
'@mednet/ui': minor
---

Chrome/Edge 109 (Windows 7/8.1): в `mednet.css` и `mednet.min.css` вернулись кольца фокуса (в минифицированной версии Chrome 109 их терял), полупрозрачные заливки (деструктивные кнопки и бейджи больше не сплошь красные), иконки select и checkbox и затемнение под диалогом. В современных браузерах вид не меняется. Для React-проектов — PostCSS-плагин `@mednet/ui/postcss` (после `@tailwindcss/postcss`).
