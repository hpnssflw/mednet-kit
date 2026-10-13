import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'mednet-kit', template: '%s — mednet-kit' },
  description: 'Дизайн-система ЦНИИОИЗ',
};

const NAV = [
  { href: '/', label: 'Обзор' },
  { href: '/tokens/', label: 'Токены' },
  { href: '/css/', label: 'CSS для статики' },
  { href: '/recipes/', label: 'Внедрение' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-background font-sans text-foreground">
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
      </body>
    </html>
  );
}
