import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'Обзор' },
  { href: '/tokens/', label: 'Токены' },
  { href: '/css/', label: 'CSS для статики' },
  { href: '/ui/', label: 'React' },
  { href: '/recipes/', label: 'Внедрение' },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <nav
          aria-label="Разделы"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-4"
        >
          <span className="font-bold">mednet-kit</span>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}
