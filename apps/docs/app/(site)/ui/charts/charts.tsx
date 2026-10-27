'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@mednet/ui/chart';

// Анимации выключены везде: иначе скриншот снимается на недорисованном графике.
const STATIC = { isAnimationActive: false } as const;

const DISTRICTS = [
  { district: 'ЦФО', requests: 1284, approved: 902 },
  { district: 'СЗФО', requests: 642, approved: 410 },
  { district: 'ЮФО', requests: 511, approved: 366 },
  { district: 'ПФО', requests: 798, approved: 590 },
  { district: 'СФО', requests: 318, approved: 201 },
];
const DISTRICTS_CONFIG = {
  requests: { label: 'Заявок', color: 'var(--chart-1)' },
  approved: { label: 'Одобрено', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const MONTHS = [
  { month: 'Май', online: 186, offline: 80 },
  { month: 'Июн', online: 305, offline: 200 },
  { month: 'Июл', online: 237, offline: 120 },
  { month: 'Авг', online: 173, offline: 190 },
  { month: 'Сен', online: 409, offline: 130 },
  { month: 'Окт', online: 514, offline: 140 },
];
const MONTHS_CONFIG = {
  online: { label: 'Дистанционно', color: 'var(--chart-1)' },
  offline: { label: 'Очно', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const PROGRAMS = [
  { program: 'organization', students: 420, fill: 'var(--color-organization)' },
  { program: 'statistics', students: 310, fill: 'var(--color-statistics)' },
  { program: 'quality', students: 240, fill: 'var(--color-quality)' },
  { program: 'digital', students: 180, fill: 'var(--color-digital)' },
  { program: 'other', students: 90, fill: 'var(--color-other)' },
];
const PROGRAMS_CONFIG = {
  students: { label: 'Слушателей' },
  organization: { label: 'Организация здравоохранения', color: 'var(--chart-1)' },
  statistics: { label: 'Медицинская статистика', color: 'var(--chart-2)' },
  quality: { label: 'Качество помощи', color: 'var(--chart-3)' },
  digital: { label: 'Цифровое здравоохранение', color: 'var(--chart-4)' },
  other: { label: 'Другое', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const SKILLS = [
  { skill: 'Теория', now: 82, before: 60 },
  { skill: 'Практика', now: 70, before: 55 },
  { skill: 'Статистика', now: 91, before: 72 },
  { skill: 'Право', now: 64, before: 58 },
  { skill: 'Цифровые навыки', now: 78, before: 40 },
  { skill: 'Коммуникация', now: 86, before: 80 },
];
const SKILLS_CONFIG = {
  now: { label: 'После курса', color: 'var(--chart-1)' },
  before: { label: 'До курса', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const COMPLETION = [
  { group: 'basic', value: 92, fill: 'var(--color-basic)' },
  { group: 'advanced', value: 74, fill: 'var(--color-advanced)' },
  { group: 'expert', value: 51, fill: 'var(--color-expert)' },
];
const COMPLETION_CONFIG = {
  value: { label: 'Завершили, %' },
  basic: { label: 'Базовый', color: 'var(--chart-1)' },
  advanced: { label: 'Продвинутый', color: 'var(--chart-3)' },
  expert: { label: 'Экспертный', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const EXPERIENCE = [
  { years: 1, score: 61, group: 12 },
  { years: 2, score: 64, group: 18 },
  { years: 4, score: 70, group: 25 },
  { years: 5, score: 68, group: 14 },
  { years: 7, score: 77, group: 30 },
  { years: 9, score: 74, group: 16 },
  { years: 12, score: 85, group: 22 },
  { years: 15, score: 83, group: 10 },
  { years: 20, score: 90, group: 8 },
];
const EXPERIENCE_CONFIG = {
  score: { label: 'Балл', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const FUNNEL = [
  { stage: 'submitted', name: 'Подана', value: 1000, fill: 'var(--color-submitted)' },
  { stage: 'checked', name: 'Проверена', value: 780, fill: 'var(--color-checked)' },
  { stage: 'accepted', name: 'Одобрена', value: 560, fill: 'var(--color-accepted)' },
  { stage: 'enrolled', name: 'Зачислен', value: 430, fill: 'var(--color-enrolled)' },
];
const FUNNEL_CONFIG = {
  value: { label: 'Заявок' },
  submitted: { label: 'Подана', color: 'var(--chart-1)' },
  checked: { label: 'Проверена', color: 'var(--chart-3)' },
  accepted: { label: 'Одобрена', color: 'var(--chart-4)' },
  enrolled: { label: 'Зачислен', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const H = 'h-60 w-full';

export function BarVertical() {
  return (
    <ChartContainer config={DISTRICTS_CONFIG} className={H}>
      <BarChart data={DISTRICTS} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="district" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="requests" fill="var(--color-requests)" radius={8} {...STATIC} />
      </BarChart>
    </ChartContainer>
  );
}

export function BarHorizontal() {
  return (
    <ChartContainer config={DISTRICTS_CONFIG} className={H}>
      <BarChart data={DISTRICTS} layout="vertical" accessibilityLayer>
        <CartesianGrid horizontal={false} />
        <YAxis dataKey="district" type="category" tickLine={false} axisLine={false} width={48} />
        <XAxis type="number" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="requests" fill="var(--color-requests)" radius={8} {...STATIC} />
      </BarChart>
    </ChartContainer>
  );
}

export function BarGrouped() {
  return (
    <ChartContainer config={DISTRICTS_CONFIG} className={H}>
      <BarChart data={DISTRICTS} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="district" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="requests" fill="var(--color-requests)" radius={4} {...STATIC} />
        <Bar dataKey="approved" fill="var(--color-approved)" radius={4} {...STATIC} />
      </BarChart>
    </ChartContainer>
  );
}

export function BarStacked() {
  return (
    <ChartContainer config={MONTHS_CONFIG} className={H}>
      <BarChart data={MONTHS} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="online"
          stackId="a"
          fill="var(--color-online)"
          radius={[0, 0, 4, 4]}
          {...STATIC}
        />
        <Bar
          dataKey="offline"
          stackId="a"
          fill="var(--color-offline)"
          radius={[4, 4, 0, 0]}
          {...STATIC}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function LineSimple() {
  return (
    <ChartContainer config={MONTHS_CONFIG} className={H}>
      <LineChart data={MONTHS} margin={{ left: 12, right: 12 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="online"
          type="monotone"
          stroke="var(--color-online)"
          strokeWidth={2}
          dot={false}
          {...STATIC}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function LineMultiple() {
  return (
    <ChartContainer config={MONTHS_CONFIG} className={H}>
      <LineChart data={MONTHS} margin={{ left: 12, right: 12 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="online"
          type="monotone"
          stroke="var(--color-online)"
          strokeWidth={2}
          {...STATIC}
        />
        <Line
          dataKey="offline"
          type="monotone"
          stroke="var(--color-offline)"
          strokeWidth={2}
          {...STATIC}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function AreaSimple() {
  return (
    <ChartContainer config={MONTHS_CONFIG} className={H}>
      <AreaChart data={MONTHS} margin={{ left: 12, right: 12 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="online"
          type="natural"
          fill="var(--color-online)"
          fillOpacity={0.3}
          stroke="var(--color-online)"
          {...STATIC}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function AreaStacked() {
  return (
    <ChartContainer config={MONTHS_CONFIG} className={H}>
      <AreaChart data={MONTHS} margin={{ left: 12, right: 12 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="offline"
          type="natural"
          stackId="a"
          fill="var(--color-offline)"
          fillOpacity={0.4}
          stroke="var(--color-offline)"
          {...STATIC}
        />
        <Area
          dataKey="online"
          type="natural"
          stackId="a"
          fill="var(--color-online)"
          fillOpacity={0.4}
          stroke="var(--color-online)"
          {...STATIC}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function PieSimple() {
  return (
    <ChartContainer config={PROGRAMS_CONFIG} className="mx-auto h-60 w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="program" hideLabel />} />
        <Pie data={PROGRAMS} dataKey="students" nameKey="program" {...STATIC} />
        <ChartLegend content={<ChartLegendContent nameKey="program" />} />
      </PieChart>
    </ChartContainer>
  );
}

export function PieDonut() {
  const total = PROGRAMS.reduce((sum, item) => sum + item.students, 0);
  return (
    <div className="relative">
      <ChartContainer config={PROGRAMS_CONFIG} className="mx-auto h-60 w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="program" hideLabel />} />
          <Pie
            data={PROGRAMS}
            dataKey="students"
            nameKey="program"
            innerRadius={60}
            strokeWidth={4}
            {...STATIC}
          />
        </PieChart>
      </ChartContainer>
      {/* Итог в центре кольца: он не часть SVG, поэтому не зависит от размеров Recharts. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{total}</span>
        <span className="text-muted-foreground text-xs">слушателей</span>
      </div>
    </div>
  );
}

export function RadarSimple() {
  return (
    <ChartContainer config={SKILLS_CONFIG} className="mx-auto h-72 w-full">
      <RadarChart data={SKILLS}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey="skill" />
        <PolarGrid />
        <ChartLegend content={<ChartLegendContent />} />
        <Radar
          dataKey="before"
          fill="var(--color-before)"
          fillOpacity={0.3}
          stroke="var(--color-before)"
          {...STATIC}
        />
        <Radar
          dataKey="now"
          fill="var(--color-now)"
          fillOpacity={0.3}
          stroke="var(--color-now)"
          {...STATIC}
        />
      </RadarChart>
    </ChartContainer>
  );
}

export function RadialSimple() {
  return (
    <ChartContainer config={COMPLETION_CONFIG} className="mx-auto h-60 w-full">
      <RadialBarChart
        data={COMPLETION}
        innerRadius={30}
        outerRadius={110}
        startAngle={90}
        endAngle={-270}
      >
        <ChartTooltip content={<ChartTooltipContent nameKey="group" hideLabel />} />
        <RadialBar dataKey="value" background {...STATIC} />
      </RadialBarChart>
    </ChartContainer>
  );
}

export function ScatterSimple() {
  return (
    <ChartContainer config={EXPERIENCE_CONFIG} className={H}>
      <ScatterChart margin={{ left: 0, right: 12 }} accessibilityLayer>
        <CartesianGrid />
        <XAxis dataKey="years" type="number" name="Стаж, лет" tickLine={false} axisLine={false} />
        <YAxis
          dataKey="score"
          type="number"
          name="Балл"
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <ZAxis dataKey="group" range={[40, 240]} name="Слушателей" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Scatter data={EXPERIENCE} fill="var(--color-score)" fillOpacity={0.7} {...STATIC} />
      </ScatterChart>
    </ChartContainer>
  );
}

export function ComposedMixed() {
  return (
    <ChartContainer config={DISTRICTS_CONFIG} className={H}>
      <ComposedChart data={DISTRICTS} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="district" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="requests" fill="var(--color-requests)" radius={8} {...STATIC} />
        <Line
          dataKey="approved"
          type="monotone"
          stroke="var(--color-approved)"
          strokeWidth={2}
          {...STATIC}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

export function FunnelSimple() {
  return (
    <ChartContainer config={FUNNEL_CONFIG} className={H}>
      <FunnelChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="stage" hideLabel />} />
        <Funnel dataKey="value" nameKey="stage" data={FUNNEL} {...STATIC}>
          <LabelList position="right" dataKey="name" className="fill-foreground" stroke="none" />
        </Funnel>
      </FunnelChart>
    </ChartContainer>
  );
}
