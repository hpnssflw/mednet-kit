import type { Metadata } from 'next';
import { Alert, AlertDescription, AlertTitle } from '@mednet/ui/alert';
import { Badge } from '@mednet/ui/badge';
import { Button } from '@mednet/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@mednet/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mednet/ui/select';
import { Switch } from '@mednet/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mednet/ui/tabs';
import { Textarea } from '@mednet/ui/textarea';

export const metadata: Metadata = { title: 'Паритет: React' };

const REGIONS = [
  { value: 'msk', label: 'Москва' },
  { value: 'spb', label: 'Санкт-Петербург' },
  { value: 'nsk', label: 'Новосибирская область' },
];

// Пары для tests/parity.spec.ts: data-testid совпадают с public/parity/static.html.
export default function ParityPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <h1 className="text-h2">@mednet/ui — пары для сверки со статикой</h1>
      <section className="space-y-3">
        <h2 className="text-h4">Кнопки</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button data-testid="btn-default">Основная</Button>
          <Button data-testid="btn-outline" variant="outline">
            Контурная
          </Button>
          <Button data-testid="btn-secondary" variant="secondary">
            Вторичная
          </Button>
          <Button data-testid="btn-ghost" variant="ghost">
            Прозрачная
          </Button>
          <Button data-testid="btn-destructive" variant="destructive">
            Удалить
          </Button>
          <Button data-testid="btn-link" variant="link">
            Ссылка
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button data-testid="btn-xs" size="xs">
            XS
          </Button>
          <Button data-testid="btn-sm" size="sm">
            Маленькая
          </Button>
          <Button>Обычная</Button>
          <Button data-testid="btn-lg" size="lg">
            Большая
          </Button>
          <Button data-testid="btn-icon" size="icon" aria-label="Иконка">
            +
          </Button>
          <Button data-testid="btn-disabled" disabled>
            Недоступна
          </Button>
          <Button variant="outline" disabled>
            Недоступна
          </Button>
          <Button data-testid="btn-invalid" variant="outline" aria-invalid>
            Ошибка
          </Button>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-h4">Бейджи</h2>
        <div className="flex flex-wrap gap-3">
          <Badge data-testid="badge-default">Новое</Badge>
          <Badge data-testid="badge-secondary" variant="secondary">
            Черновик
          </Badge>
          <Badge data-testid="badge-outline" variant="outline">
            Архив
          </Badge>
          <Badge data-testid="badge-destructive" variant="destructive">
            Отклонено
          </Badge>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name" data-testid="label">
            ФИО
          </Label>
          <Input id="name" data-testid="input" placeholder="Иванова Мария Петровна" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bad">С ошибкой</Label>
          <Input id="bad" data-testid="input-invalid" aria-invalid defaultValue="123" />
        </div>
        <div className="grid gap-2">
          <Label>Регион</Label>
          <Select items={REGIONS} defaultValue="msk">
            <SelectTrigger data-testid="select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea id="comment" data-testid="textarea" placeholder="Текст" />
        </div>
        <div className="flex items-center gap-3">
          <Checkbox data-testid="checkbox" id="c1" />
          <Label htmlFor="c1">Согласен</Label>
          <Checkbox data-testid="checkbox-checked" defaultChecked aria-label="Отмечено" />
          <Switch data-testid="switch" aria-label="Выключено" />
          <Switch data-testid="switch-checked" defaultChecked aria-label="Включено" />
        </div>
        <RadioGroup defaultValue="a" className="flex gap-4">
          <Label>
            <RadioGroupItem data-testid="radio-checked" value="a" /> Очно
          </Label>
          <Label>
            <RadioGroupItem data-testid="radio" value="b" /> Заочно
          </Label>
        </RadioGroup>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <Card data-testid="card">
          <CardHeader>
            <CardTitle data-testid="card-title">Заявка на обучение</CardTitle>
            <CardDescription data-testid="card-description">
              Программа «Организация здравоохранения»
            </CardDescription>
          </CardHeader>
          <CardContent>Содержимое карточки</CardContent>
          <CardFooter>
            <Button>Отправить</Button>
          </CardFooter>
        </Card>
        <div className="space-y-4">
          <Alert data-testid="alert">
            <AlertTitle data-testid="alert-title">Приём заявок открыт</AlertTitle>
            <AlertDescription>Заявки принимаются до 31 октября.</AlertDescription>
          </Alert>
          <Alert data-testid="alert-destructive" variant="destructive">
            <AlertTitle>Проверьте СНИЛС</AlertTitle>
            <AlertDescription>Контрольная сумма не совпадает.</AlertDescription>
          </Alert>
        </div>
      </section>
      <section>
        <Tabs defaultValue="t1" data-testid="tabs">
          <TabsList data-testid="tabs-list">
            <TabsTrigger data-testid="tab-active" value="t1">
              Обзор
            </TabsTrigger>
            <TabsTrigger data-testid="tab" value="t2">
              Детали
            </TabsTrigger>
          </TabsList>
          <TabsContent value="t1">Панель «Обзор»</TabsContent>
          <TabsContent value="t2">Панель «Детали»</TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
