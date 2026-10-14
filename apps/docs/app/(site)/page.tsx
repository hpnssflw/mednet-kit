import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <h1 className="text-h1">Дизайн-система ЦНИИОИЗ</h1>
      <p className="mt-4 max-w-3xl text-lead text-muted-foreground">
        Токены бренда, CSS для статических сайтов и (скоро) React-компоненты, чтобы прототипы сразу
        выглядели по брендбуку.
      </p>
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        <li className="rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-h3">@mednet/tokens</h2>
          <p className="mt-2 text-muted-foreground">
            Палитра брендбука, семантика shadcn, тема Tailwind v4.
          </p>
          <Link href="/tokens/" className="mt-4 inline-block font-semibold text-primary underline">
            Токены
          </Link>
        </li>
        <li className="rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-h3">@mednet/css</h2>
          <p className="mt-2 text-muted-foreground">
            Компоненты для сайтов без React одной строкой подключения.
          </p>
          <Link href="/css/" className="mt-4 inline-block font-semibold text-primary underline">
            CSS для статики
          </Link>
        </li>
      </ul>
    </>
  );
}
