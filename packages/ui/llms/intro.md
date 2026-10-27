Справка по установленной версии `@mednet/ui` — React-компонентам дизайн-системы ЦНИИОИЗ. Читайте её перед тем, как писать интерфейс.

## Правила

1. **Стили — одна строка** в `app/globals.css`: `@import '@mednet/ui/styles.css';` (внутри Tailwind v4, тема бренда и классы компонентов). **Шрифт — вторая строка, в коде приложения** (корневой layout, `main.tsx`): `import '@mednet/ui/fonts.css';` — Montserrat (`@fontsource/montserrat`) ставится вместе с пакетом. В CSS через `@import` его не подключайте: Tailwind не перебазирует пути `url()`, и в Vite файлы шрифтов теряются.
2. **Импорт — по подпутям:** `import { Button } from '@mednet/ui/button';`. Корневой `@mednet/ui` тоже работает, но тянет все модули.
3. **Основа — Base UI, а не Radix.** Чтобы отрисовать часть компонента другим элементом, используйте проп `render`, **не** `asChild`:
   ```tsx
   <DialogTrigger render={<Button variant="outline" />}>Открыть</DialogTrigger>
   <SidebarMenuButton render={<Link href="/settings" />}>Настройки</SidebarMenuButton>
   ```
   **Ссылка, которая выглядит как кнопка**, — это ссылка с классами кнопки, а не `Button` с `render={<a />}` (Base UI навязывает кнопке семантику кнопки):
   ```tsx
   import { buttonVariants } from '@mednet/ui/button';
   <Link href="/reports" className={buttonVariants({ variant: 'outline' })}>Отчёты</Link>
   ```
   Примеры из интернета с `asChild` переписывайте на `render`. Не ставьте `@radix-ui/*`, `radix-ui`, `@base-ui/react` напрямую.
4. **Цвета — только семантические классы:** `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `text-muted-foreground`, `border-border`, `border-input`, `bg-field` (заливка полей), `ring-ring`, `bg-destructive`, `text-destructive`, `bg-card`, `bg-popover`, `chart-1…chart-8`. Стандартная палитра Tailwind (`slate-100`, `zinc-500`…) удалена, а `red-500`, `blue-700` и другие шкалы — брендовые (из `@mednet/tokens`); hex, `rgb()`, `oklch()` и `bg-[#…]` запрещены линтером (`@mednet/lint-config`).
5. **Типографика:** заголовки — `text-h1`…`text-h4` (класс задаёт размер, межстрочный и вес: h1 — bold, h2–h4 — semibold; на телефоне размеры меньше), вводный абзац — `text-lead`, остальное — `text-base`/`text-sm`/`text-xs`. Размеры экран/телефон, px: h1 48/32, h2 36/28, h3 28/24, h4 22/20, lead 18/17, base 16, sm 14, xs 13. Шрифт — Montserrat. Своих `text-[…px]` и `font-*` на заголовках не добавляйте.
6. **Иконки — только `lucide-react`** (где искать иконки и API — раздел «Стек и где искать API» ниже).
7. **Корневой layout** (обвязка Base UI):
   ```tsx
   <html lang="ru">
     <body className="relative">
       <div className="isolate">
         <TooltipProvider>{children}</TooltipProvider>
       </div>
       <Toaster />
     </body>
   </html>
   ```
   `isolate` — порталы (диалоги, меню, подсказки, уведомления) всегда поверх страницы; `relative` — бэкдропы в Safari iOS 26+; `Toaster` (из `@mednet/ui/toast`) — один на приложение, вызов `toast.add({ title, description, type: 'success' })` из любого клиентского компонента. `TooltipProvider` (из `@mednet/ui/tooltip`) необязателен, он объединяет задержку подсказок.
8. **Календарь — по-русски:** `<Calendar locale={ru} />`, `import { ru } from 'react-day-picker/locale';`.
9. **Старые браузеры:** Chrome/Edge 109 (Windows 7/8.1) поддерживаются, если в `postcss.config.mjs` после `@tailwindcss/postcss` стоит `'@mednet/ui/postcss': {}`. Не работают там AI-компоненты `bubble` и эффект `shimmer` (относительные цвета, Chrome 119+) — не используйте их на публичных страницах.
10. **Свои компоненты склеивают классы через `cn` из `@mednet/ui/utils`**, а не через clsx/tailwind-merge: обычный tailwind-merge не знает размеров шрифта бренда и роняет `text-h3` рядом с `text-foreground`.
11. Компоненты кита не копируйте в проект и не правьте их стили `className`-ами с цветами: нужен другой вид — спросите у владельцев кита.
12. **Графики:** компоненты графика импортируйте из `recharts` (peer-зависимость, `npm i recharts`), обёртки — из `@mednet/ui/chart`; документация и `llms.txt` — раздел «Стек и где искать API» ниже.
13. **Peer-зависимости ставятся сами** (npm 7+, pnpm 8+): `recharts`, `lucide-react` (иконки), `react-day-picker` (календарь, `locale`). Если менеджер их не поставил (yarn, отключён `auto-install-peers`), установите вручную: `npm i recharts lucide-react react-day-picker`. Импортируйте их напрямую только из своего `package.json`.
14. **Линтеры обязательны:** `@mednet/lint-config` ставится в каждый проект вместе с китом (ESLint и stylelint, Next и Vite) — настройка и список запретов в разделе «Линтеры» ниже. Затем разделы «Карта пакетов» (что подключать в какой ситуации) и «Бренд ЦНИИОИЗ» (все правила и концепции бренда) — читайте их до написания интерфейса.
