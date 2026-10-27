import type { Metadata } from 'next';
import { Badge } from '@mednet/ui';
import { Alert, AlertDescription, AlertTitle } from '@mednet/ui/alert';
import { Button, buttonVariants } from '@mednet/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mednet/ui/card';
import { Checkbox } from '@mednet/ui/checkbox';
import { Input } from '@mednet/ui/input';
import { Label } from '@mednet/ui/label';
import { Logo } from '@mednet/ui/logo';
import { SiteFooter } from '@mednet/ui/site-footer';
import { SiteHeader } from '@mednet/ui/site-header';
import { Switch } from '@mednet/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mednet/ui/tabs';
import { Textarea } from '@mednet/ui/textarea';
import { DemoChart, DemoDialog, DemoToast } from './demos';

export const metadata: Metadata = { title: 'React' };

export default function UiPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-h1">React: @mednet/ui</h1>
        <p className="text-lead text-muted-foreground">
          Весь набор shadcn/ui на Base UI в стиле Maia и теме бренда. Подключение — одна строка CSS
          и импорты по подпутям; правила для агентов — в node_modules/@mednet/ui/llms.md.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Кнопки</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Отправить заявку</Button>
          <Button variant="outline">Контурная</Button>
          <Button variant="secondary">Вторичная</Button>
          <Button variant="ghost">Прозрачная</Button>
          <Button variant="destructive">Удалить</Button>
          <Button variant="link">Ссылка</Button>
          <Button disabled>Недоступна</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Маленькая</Button>
          <Button size="lg">Большая</Button>
          {/* Ссылка с видом кнопки — классы кнопки на <a>, а не Button с render (у ссылки своя семантика). */}
          <a href="/recipes/" className={buttonVariants({ variant: 'outline' })}>
            Ссылка-кнопка
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Бейджи</h2>
        <div className="flex flex-wrap gap-3">
          <Badge>Новое</Badge>
          <Badge variant="secondary">Черновик</Badge>
          <Badge variant="outline">Архив</Badge>
          <Badge variant="destructive">Отклонено</Badge>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ui-name">ФИО</Label>
          <Input id="ui-name" placeholder="Иванова Мария Петровна" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ui-snils">СНИЛС</Label>
          <Input id="ui-snils" aria-invalid defaultValue="123-456-789 00" />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="ui-comment">Комментарий</Label>
          <Textarea id="ui-comment" placeholder="Текст" />
        </div>
        <div className="flex items-center gap-3">
          {/* aria-labelledby явно: имя должно быть уже в статическом HTML, Base UI подставляет его только после гидратации. */}
          <Checkbox id="ui-agree" defaultChecked aria-labelledby="ui-agree-label" />
          <Label id="ui-agree-label" htmlFor="ui-agree">
            Согласен на обработку данных
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="ui-notify" aria-labelledby="ui-notify-label" />
          <Label id="ui-notify-label" htmlFor="ui-notify">
            Уведомлять по почте
          </Label>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Заявка на обучение</CardTitle>
            <CardDescription>Программа «Организация здравоохранения»</CardDescription>
          </CardHeader>
          <CardContent>Приём документов до 31 октября.</CardContent>
          <CardFooter className="gap-3">
            <DemoDialog />
            <DemoToast />
          </CardFooter>
        </Card>
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Приём заявок открыт</AlertTitle>
            <AlertDescription>Заявки принимаются до 31 октября.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Проверьте СНИЛС</AlertTitle>
            <AlertDescription>Контрольная сумма не совпадает.</AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Вкладки и график</h2>
        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Заявки по округам</TabsTrigger>
            <TabsTrigger value="about">О данных</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <DemoChart />
          </TabsContent>
          <TabsContent value="about">Тестовые данные.</TabsContent>
        </Tabs>
        <p>
          Остальные типы —{' '}
          <a className="text-primary underline" href="/ui/charts/">
            галерея графиков
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Логотип</h2>
        <div className="flex flex-wrap items-end gap-10">
          <Logo className="h-14 w-auto" title="ЦНИИОИЗ" />
          <Logo variant="vertical" className="h-20 w-auto" title="ЦНИИОИЗ" />
          <Logo variant="mark" className="h-12 w-auto" title="ЦНИИОИЗ" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Шапка и подвал</h2>
        <p>
          Каркасы целиком:{' '}
          <a className="text-primary underline" href="/ui/public-layout/">
            PublicLayout
          </a>
          ,{' '}
          <a className="text-primary underline" href="/ui/app-shell/">
            AppShell
          </a>
          .
        </p>
        <div className="overflow-hidden rounded-2xl border border-border">
          <SiteHeader
            nav={
              <>
                <a href="#about">О проекте</a>
                <a href="#reports">Отчёты</a>
              </>
            }
            actions={<Button size="sm">Войти</Button>}
          />
          <SiteFooter year={2026} links={<a href="#privacy">Политика конфиденциальности</a>} />
        </div>
      </section>
    </div>
  );
}
