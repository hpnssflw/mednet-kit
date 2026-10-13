import { color, semantic } from '@mednet/tokens';
import { wcagContrast } from 'culori';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Токены' };

const HUES = [
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'violet',
  'beige',
  'peach',
  'graphite',
  'danger',
] as const;

const ratio = (foreground: string, background: string) =>
  wcagContrast(foreground, background).toFixed(2);

export default function TokensPage() {
  return (
    <>
      <h1 className="text-h1">Токены</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Палитра брендбука v8: базовый цвет — шаг 500, оттенки брендбука стоят на 100–300 и 500–700,
        остальные шаги сгенерированы в OKLCH. Под каждым цветом — контраст с белым.
      </p>

      <section aria-labelledby="palette" className="mt-12">
        <h2 id="palette" className="text-h2">
          Палитра
        </h2>
        {HUES.map((hue) => (
          <div key={hue} className="mt-8">
            <h3 className="text-h4">{hue}</h3>
            <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
              {Object.entries(color[hue] as Record<string, string>).map(([step, hex]) => (
                <li key={step} className="text-xs">
                  <div
                    className="h-12 rounded-lg border border-border"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="mt-1 font-semibold">{step}</div>
                  <div className="text-muted-foreground">{hex}</div>
                  <div className="text-muted-foreground">{ratio(hex, '#ffffff')}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="semantic" className="mt-16">
        <h2 id="semantic" className="text-h2">
          Семантика
        </h2>
        <p className="mt-2 text-muted-foreground">
          В Tailwind — <code>bg-primary</code>, в CSS — <code>var(--primary)</code>, на чужих сайтах
          — <code>var(--mn-primary)</code>.
        </p>
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2">
                Токен
              </th>
              <th scope="col" className="py-2">
                Цвет
              </th>
              <th scope="col" className="py-2">
                HEX
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(semantic).map(([name, hex]) => (
              <tr key={name} className="border-b border-border">
                <td className="py-2 font-semibold">{name}</td>
                <td className="py-2">
                  <span
                    className="inline-block h-6 w-12 rounded-md border border-border align-middle"
                    style={{ backgroundColor: hex }}
                  />
                </td>
                <td className="py-2 text-muted-foreground">{hex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
