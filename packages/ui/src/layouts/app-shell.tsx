import type { ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '#components/sidebar';
import { TooltipProvider } from '#components/tooltip';
import { Logo } from '../brand/logo.js';
import { SkipLink } from './skip-link.js';

export interface AppShellProps {
  children: ReactNode;
  /** Содержимое боковой панели: SidebarGroup, SidebarMenu… из `@mednet/ui/sidebar`. */
  nav: ReactNode;
  /** Заголовок раздела в верхней панели. */
  title?: ReactNode;
  /** Правая часть верхней панели: поиск, уведомления, профиль. */
  actions?: ReactNode;
  /** Адрес главной — ссылка на логотипе. */
  homeHref?: string;
  /**
   * Открыта ли панель при первой отрисовке. В Next — из cookie `sidebar_state`
   * (`(await cookies()).get('sidebar_state')?.value !== 'false'`); при `output: 'export'` не передавать.
   */
  defaultOpen?: boolean;
}

/** Каркас приложений (инструменты, кабинеты, дашборды): боковая панель + верхняя панель. */
export function AppShell({
  children,
  nav,
  title,
  actions,
  homeHref = '/',
  defaultOpen,
}: AppShellProps) {
  return (
    // TooltipProvider объединяет задержку подсказок пунктов свёрнутого меню (Base UI работает и без него).
    <TooltipProvider>
      <SkipLink />
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <a
              href={homeHref}
              aria-label="ЦНИИОИЗ — на главную"
              className="flex h-12 items-center rounded-md px-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Logo
                variant="horizontal"
                className="h-9 w-auto group-data-[collapsible=icon]:hidden"
              />
              <Logo
                variant="mark"
                className="hidden h-7 w-auto group-data-[collapsible=icon]:block"
              />
            </a>
          </SidebarHeader>
          <SidebarContent>{nav}</SidebarContent>
          <SidebarRail />
        </Sidebar>
        {/* SidebarInset — это <main>: второй <main> внутри не нужен. */}
        <SidebarInset id="main">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger />
            {title ? <div className="text-sm font-semibold">{title}</div> : null}
            {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
