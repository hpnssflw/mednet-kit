import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@mednet/ui/card';
import {
  AreaSimple,
  AreaStacked,
  BarGrouped,
  BarHorizontal,
  BarStacked,
  BarVertical,
  ComposedMixed,
  FunnelSimple,
  LineMultiple,
  LineSimple,
  PieDonut,
  PieSimple,
  RadarSimple,
  RadialSimple,
  ScatterSimple,
} from './charts';

export const metadata: Metadata = { title: 'Графики' };

function Demo({
  id,
  title,
  when,
  children,
}: {
  id: string;
  title: string;
  when: string;
  children: ReactNode;
}) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{when}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function ChartsPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-h1">Графики</h1>
        <p className="text-lead text-muted-foreground">
          Обёртка shadcn над Recharts: <code>ChartContainer</code> задаёт размер и цвета серий,{' '}
          <code>ChartTooltip</code> и <code>ChartLegend</code> подключаются по желанию. Цвета
          берутся из токенов <code>--chart-1</code> … <code>--chart-8</code>, поэтому в тёмной теме
          и при смене бренда графики перекрашиваются сами.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3">Как собрать график</h2>
        <ol className="list-decimal space-y-1 pl-6">
          <li>
            Опишите серии в <code>ChartConfig</code>: подпись (<code>label</code>) и цвет (
            <code>var(--chart-N)</code>).
          </li>
          <li>
            Оберните график из <code>recharts</code> в <code>ChartContainer</code> и задайте высоту
            через <code>className</code> (<code>h-60 w-full</code>).
          </li>
          <li>
            В <code>fill</code> и <code>stroke</code> указывайте <code>var(--color-ключ)</code>:
            ключ — имя серии из конфига.
          </li>
          <li>
            Для читателей скринридеров добавляйте <code>accessibilityLayer</code>, там где график
            его поддерживает.
          </li>
        </ol>
        <p className="text-muted-foreground">
          Не больше 5–6 серий на одном графике. Если категорий больше, берите столбцы, а не круговую
          диаграмму.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2">Столбцы</h2>
        <p className="text-muted-foreground">
          Сравнение значений между категориями: округа, программы, периоды.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <Demo
            id="bar"
            title="Вертикальные"
            when="Базовый случай: несколько категорий с короткими подписями."
          >
            <BarVertical />
          </Demo>
          <Demo
            id="bar-horizontal"
            title="Горизонтальные"
            when="Длинные подписи или много категорий, например рейтинг."
          >
            <BarHorizontal />
          </Demo>
          <Demo
            id="bar-grouped"
            title="Сгруппированные"
            when="Сравнить две-три метрики внутри одной категории: подано и одобрено."
          >
            <BarGrouped />
          </Demo>
          <Demo
            id="bar-stacked"
            title="С накоплением"
            when="Показать и общий итог, и вклад частей в него."
          >
            <BarStacked />
          </Demo>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2">Линии и области</h2>
        <p className="text-muted-foreground">Изменение значения во времени.</p>
        <div className="grid gap-6 md:grid-cols-2">
          <Demo id="line" title="Линия" when="Один показатель по периодам: динамика заявок.">
            <LineSimple />
          </Demo>
          <Demo
            id="line-multiple"
            title="Несколько линий"
            when="Сравнить тренды двух-трёх показателей."
          >
            <LineMultiple />
          </Demo>
          <Demo id="area" title="Область" when="Тот же тренд, но с акцентом на объём.">
            <AreaSimple />
          </Demo>
          <Demo
            id="area-stacked"
            title="Область с накоплением"
            when="Динамика суммы и вклад каждой части."
          >
            <AreaStacked />
          </Demo>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2">Доли</h2>
        <p className="text-muted-foreground">Из чего складывается целое.</p>
        <div className="grid gap-6 md:grid-cols-2">
          <Demo
            id="pie"
            title="Круговая"
            when="Две-пять долей, сумма которых 100%. Если долей больше, лучше столбцы."
          >
            <PieSimple />
          </Demo>
          <Demo
            id="donut"
            title="Кольцевая"
            when="То же, что круговая, плюс итоговое число в центре."
          >
            <PieDonut />
          </Demo>
          <Demo
            id="radial"
            title="Радиальная"
            when="Выполнение плана или прогресс по нескольким группам, в процентах."
          >
            <RadialSimple />
          </Demo>
          <Demo
            id="funnel"
            title="Воронка"
            when="Этапы процесса, на каждом остаётся меньше: подана — проверена — зачислен."
          >
            <FunnelSimple />
          </Demo>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2">Профили и связи</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Demo
            id="radar"
            title="Радар"
            when="Профиль по нескольким критериям: сравнение «до» и «после»."
          >
            <RadarSimple />
          </Demo>
          <Demo
            id="scatter"
            title="Точечная"
            when="Связь двух величин: стаж и балл. Размер точки — третий показатель."
          >
            <ScatterSimple />
          </Demo>
          <Demo
            id="composed"
            title="Составная"
            when="Столбцы и линия на одной оси: заявки и доля одобренных."
          >
            <ComposedMixed />
          </Demo>
        </div>
      </section>
    </div>
  );
}
