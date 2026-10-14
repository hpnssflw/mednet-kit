import type { Metadata } from 'next';
import { Button } from '@mednet/ui/button';
import { PublicLayout } from '@mednet/ui/public-layout';
import { SiteFooter } from '@mednet/ui/site-footer';

export const metadata: Metadata = { title: 'PublicLayout' };

export default function PublicLayoutDemo() {
  return (
    <PublicLayout
      homeHref="/ui/"
      nav={
        <>
          <a href="#about">О проекте</a>
          <a href="#reports">Отчёты</a>
          <a href="#contacts">Контакты</a>
        </>
      }
      actions={<Button size="sm">Подать заявку</Button>}
      footer={<SiteFooter year={2026} />}
    >
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6">
        <h1 className="text-h1">Мониторинг здравоохранения</h1>
        <p className="text-lead text-muted-foreground">
          Лендинг на PublicLayout: шапка с логотипом ЦНИИОИЗ, содержимое, подвал с реквизитами.
        </p>
        <Button size="lg">Начать</Button>
      </section>
    </PublicLayout>
  );
}
