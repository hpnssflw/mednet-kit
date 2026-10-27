---
'@mednet/ui': major
---

Шрифт Montserrat вынесен из `@mednet/ui/styles.css` в отдельный `@mednet/ui/fonts.css`. Раньше `@import '@fontsource/montserrat/*.css'` проходил через Tailwind, который не перебазирует `url()`: в Vite файлы woff2 не попадали в сборку, а запросы шрифтов на хостинге с SPA-rewrite отдавали `index.html` — сайт показывался системным шрифтом.

Миграция: добавьте в код приложения (корневой layout в Next, `main.tsx` в Vite) `import '@mednet/ui/fonts.css';`. Без него шрифт не загрузится.
