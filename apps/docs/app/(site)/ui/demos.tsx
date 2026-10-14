'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Button } from '@mednet/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@mednet/ui/chart';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mednet/ui/dialog';
import { Input } from '@mednet/ui/input';
import { Label } from '@mednet/ui/label';
import { toast } from '@mednet/ui/toast';

export function DemoDialog() {
  return (
    <Dialog>
      {/* Base UI: render вместо asChild */}
      <DialogTrigger render={<Button variant="outline" />}>Открыть диалог</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заявка на обучение</DialogTitle>
          <DialogDescription>Проверьте данные перед отправкой.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="dialog-email">Эл. почта</Label>
          <Input id="dialog-email" type="email" placeholder="name@example.ru" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
          <Button>Отправить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DemoToast() {
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast.add({ title: 'Заявка отправлена', description: 'Номер 2026-0142', type: 'success' })
      }
    >
      Показать уведомление
    </Button>
  );
}

const DATA = [
  { district: 'ЦФО', requests: 1284 },
  { district: 'СЗФО', requests: 642 },
  { district: 'ЮФО', requests: 511 },
  { district: 'ПФО', requests: 798 },
  { district: 'СФО', requests: 318 },
];
const CONFIG = { requests: { label: 'Заявок', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function DemoChart() {
  return (
    <ChartContainer config={CONFIG} className="h-56 w-full">
      <BarChart data={DATA} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="district" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {/* Без анимации: иначе скриншот снимается на пустом графике (столбцы растут ~1,5 с). */}
        <Bar dataKey="requests" fill="var(--color-requests)" radius={8} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
