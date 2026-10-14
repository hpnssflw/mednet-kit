import type { ComponentProps, ReactNode } from 'react';
import { cn } from '#lib/utils';
import { Logo } from './logo.js';

/** Реквизиты по умолчанию — как в подвале mednet.ru (сверено 2026-10-14). */
export const CNIIOIZ = {
  fullName:
    'Центральный научно-исследовательский институт организации и информатизации здравоохранения Минздрава России',
  shortName: 'ФГБУ «ЦНИИОИЗ» Минздрава России',
  phone: '+7 (495) 618-31-83',
  email: 'mail@mednet.ru',
} as const;

export interface SiteFooterProps extends Omit<ComponentProps<'footer'>, 'children'> {
  /** Полное наименование организации. */
  orgName?: string;
  /** Правообладатель в строке «©». */
  copyright?: string;
  /** Телефон; `null` — не показывать. */
  phone?: string | null;
  /** Электронная почта; `null` — не показывать. */
  email?: string | null;
  /** Год в строке «©»; по умолчанию текущий (при static export — год сборки). */
  year?: number;
  /** Дополнительные ссылки: политика конфиденциальности, карта сайта… */
  links?: ReactNode;
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Подвал сайта с реквизитами ЦНИИОИЗ (переопределяются пропсами). */
export function SiteFooter({
  orgName = CNIIOIZ.fullName,
  copyright = CNIIOIZ.shortName,
  phone = CNIIOIZ.phone,
  email = CNIIOIZ.email,
  year = new Date().getFullYear(),
  links,
  className,
  ...props
}: SiteFooterProps) {
  return (
    <footer
      data-slot="site-footer"
      className={cn('border-t border-border bg-muted text-sm text-muted-foreground', className)}
      {...props}
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr_auto] md:items-start">
        <Logo variant="mark" className="h-10 w-auto" />
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{orgName}</p>
          {phone || email ? (
            <p className="flex flex-wrap gap-x-6 gap-y-1">
              {phone ? (
                <a href={telHref(phone)} className="hover:text-foreground">
                  {phone}
                </a>
              ) : null}
              {email ? (
                <a href={`mailto:${email}`} className="hover:text-foreground">
                  {email}
                </a>
              ) : null}
            </p>
          ) : null}
          <p>
            © {year} {copyright}
          </p>
        </div>
        {links ? (
          <nav aria-label="Дополнительные ссылки" className="flex flex-col gap-2">
            {links}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
