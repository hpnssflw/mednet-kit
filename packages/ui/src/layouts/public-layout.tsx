import type { ReactNode } from 'react';
import { SiteFooter } from '../brand/site-footer.js';
import { SiteHeader } from '../brand/site-header.js';
import { SkipLink } from './skip-link.js';

export interface PublicLayoutProps {
  children: ReactNode;
  /** Пункты основной навигации в шапке. */
  nav?: ReactNode;
  /** Действия справа в шапке. */
  actions?: ReactNode;
  /** Адрес главной — ссылка на логотипе. */
  homeHref?: string;
  /** Подвал целиком; по умолчанию — `<SiteFooter />` с реквизитами ЦНИИОИЗ. */
  footer?: ReactNode;
}

/** Каркас публичных страниц (лендинги, отчёты): шапка, содержимое, подвал. */
export function PublicLayout({ children, nav, actions, homeHref, footer }: PublicLayoutProps) {
  return (
    <div data-slot="public-layout" className="flex min-h-svh flex-col">
      <SkipLink />
      <SiteHeader nav={nav} actions={actions} homeHref={homeHref} />
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer ?? <SiteFooter />}
    </div>
  );
}
