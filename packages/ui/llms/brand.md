## Фирменные блоки и каркасы

Серверные компоненты: их можно рендерить в `page.tsx`/`layout.tsx` без `"use client"`.

#### `Logo`

`import { Logo } from '@mednet/ui/logo';`

| Проп              | Тип                                                                     | По умолчанию   |
| ----------------- | ----------------------------------------------------------------------- | -------------- |
| `variant`         | `'horizontal' \| 'vertical' \| 'mark'`                                  | `'horizontal'` |
| `title`           | `string` — доступное имя; без него логотип декоративный (`aria-hidden`) | —              |
| `className` и др. | атрибуты `<svg>`; размер — классом высоты                               | —              |

```tsx
<a href="/" aria-label="ЦНИИОИЗ — на главную">
  <Logo className="h-10 w-auto" />
</a>
<Logo variant="mark" title="ЦНИИОИЗ" className="size-12" />
```

#### `SiteHeader`

`import { SiteHeader } from '@mednet/ui/site-header';` — логотип со ссылкой на главную, навигация, действия.

| Проп       | Тип                         | По умолчанию |
| ---------- | --------------------------- | ------------ |
| `homeHref` | `string`                    | `'/'`        |
| `nav`      | `ReactNode` — ссылки        | —            |
| `actions`  | `ReactNode` — кнопки справа | —            |

```tsx
<SiteHeader
  nav={
    <>
      <Link href="/about">О проекте</Link>
      <Link href="/reports">Отчёты</Link>
    </>
  }
  actions={
    <Link href="/login" className={buttonVariants({ size: 'sm' })}>
      Войти
    </Link>
  }
/>
```

#### `SiteFooter`

`import { SiteFooter, CNIIOIZ } from '@mednet/ui/site-footer';` — реквизиты ЦНИИОИЗ по умолчанию (`CNIIOIZ`: `fullName`, `shortName`, `phone`, `email`).

| Проп             | Тип                                | По умолчанию                      |
| ---------------- | ---------------------------------- | --------------------------------- |
| `orgName`        | `string`                           | полное наименование ЦНИИОИЗ       |
| `copyright`      | `string`                           | `ФГБУ «ЦНИИОИЗ» Минздрава России` |
| `phone`, `email` | `string \| null` (`null` — скрыть) | телефон и почта ЦНИИОИЗ           |
| `year`           | `number`                           | текущий                           |
| `links`          | `ReactNode`                        | —                                 |

```tsx
<SiteFooter links={<Link href="/privacy">Политика конфиденциальности</Link>} />
```

#### `PublicLayout`

`import { PublicLayout } from '@mednet/ui/public-layout';` — лендинги и отчёты: ссылка «Перейти к содержанию», `SiteHeader`, `<main id="main">`, `SiteFooter`. Пропсы: `nav`, `actions`, `homeHref` (как у `SiteHeader`), `footer` (замена подвала), `children`.

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="relative">
        <div className="isolate">
          <PublicLayout nav={<Link href="/about">О проекте</Link>}>{children}</PublicLayout>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
```

#### `AppShell`

`import { AppShell } from '@mednet/ui/app-shell';` — инструменты, кабинеты, дашборды: боковая панель (shadcn Sidebar, сворачивается до иконок, Ctrl/⌘+B), верхняя панель, содержимое.

| Проп          | Тип                                                                         | По умолчанию |
| ------------- | --------------------------------------------------------------------------- | ------------ |
| `nav`         | `ReactNode` — `SidebarGroup`/`SidebarMenu` из `@mednet/ui/sidebar`          | обязателен   |
| `title`       | `ReactNode` — заголовок в верхней панели                                    | —            |
| `actions`     | `ReactNode` — правая часть верхней панели                                   | —            |
| `homeHref`    | `string`                                                                    | `'/'`        |
| `defaultOpen` | `boolean` — из cookie `sidebar_state`; при `output: 'export'` не передавать | `true`       |

```tsx
// app/(app)/layout.tsx
import { LayoutDashboard } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppShell } from '@mednet/ui/app-shell';
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@mednet/ui/sidebar';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const defaultOpen = (await cookies()).get('sidebar_state')?.value !== 'false';
  return (
    <AppShell
      defaultOpen={defaultOpen}
      title="Мониторинг"
      nav={
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/dashboard" />} tooltip="Дашборд">
                <LayoutDashboard />
                <span>Дашборд</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      {children}
    </AppShell>
  );
}
```
