import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from '@mednet/ui/toast';
import { TooltipProvider } from '@mednet/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'mednet-kit', template: '%s — mednet-kit' },
  description: 'Дизайн-система ЦНИИОИЗ',
};

// Обвязка Base UI (llms.md @mednet/ui): relative — бэкдропы в Safari iOS 26+,
// isolate — порталы всегда поверх страницы, Toaster — один на приложение.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="relative">
        <div className="isolate">
          <TooltipProvider>{children}</TooltipProvider>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
