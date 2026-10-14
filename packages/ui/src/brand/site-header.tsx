import type { ComponentProps, ReactNode } from 'react';
import { cn } from '#lib/utils';
import { Logo } from './logo.js';

export interface SiteHeaderProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** Адрес главной страницы — ссылка на логотипе. */
  homeHref?: string;
  /** Пункты основной навигации: ссылки (`<a>` или `next/link`). */
  nav?: ReactNode;
  /** Действия справа: кнопки, вход, профиль. */
  actions?: ReactNode;
}

/** Шапка сайта: логотип ЦНИИОИЗ, основная навигация, действия. */
export function SiteHeader({ homeHref = '/', nav, actions, className, ...props }: SiteHeaderProps) {
  return (
    <header
      data-slot="site-header"
      className={cn('border-b border-border bg-background', className)}
      {...props}
    >
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
        <a
          href={homeHref}
          aria-label="ЦНИИОИЗ — на главную"
          className="shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Logo variant="horizontal" className="hidden h-11 w-auto sm:block" />
          <Logo variant="mark" className="h-9 w-auto sm:hidden" />
        </a>
        {nav ? (
          <nav
            aria-label="Основная навигация"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium"
          >
            {nav}
          </nav>
        ) : null}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
