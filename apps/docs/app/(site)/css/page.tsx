import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'CSS для статики' };

const CDN = 'https://cdn.jsdelivr.net/npm/@mednet/css@1/dist';

const CONNECT = `<link rel="stylesheet" href="${CDN}/mednet.min.css">
<script src="${CDN}/mednet.js" defer></script>`;

const MARKUP = `<button class="btn">Подать заявку</button>
<button class="btn" data-variant="outline">Отмена</button>

<div class="card">
  <header><h3>Заголовок</h3><p>Описание</p></header>
  <section>Содержимое</section>
</div>`;

export default function CssPage() {
  return (
    <>
      <h1 className="text-h1">CSS для статики</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        <code>@mednet/css</code> — компоненты Basecoat (стиль Maia) в теме бренда, шрифт Montserrat
        и токены одним файлом. Без React и без сборки.
      </p>

      <h2 className="mt-12 text-h2">Подключение</h2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm">
        <code>{CONNECT}</code>
      </pre>
      <p className="mt-3 text-muted-foreground">
        Или скопируйте к себе папку <code>dist/</code> из пакета — шрифты подключаются
        относительными путями.
      </p>
      <p className="mt-3 max-w-3xl font-semibold">
        <code>mednet.css</code> — для новых страниц и сайтов без Bootstrap и других CSS-фреймворков:
        в нём есть сброс стилей, поэтому на существующий сайт подключайте только токены и шрифты
        (раздел «Внедрение»).
      </p>

      <h2 className="mt-12 text-h2">Разметка</h2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm">
        <code>{MARKUP}</code>
      </pre>
      <p className="mt-3 text-muted-foreground">
        Tailwind-утилит (<code>flex</code>, <code>p-4</code>) в файле нет — только компоненты.
      </p>

      <h2 className="mt-12 text-h2">Компоненты</h2>
      <iframe
        title="Демо компонентов @mednet/css"
        src="/static-demo/demo/index.html"
        className="mt-4 h-[1600px] w-full rounded-xl border border-border"
      />
    </>
  );
}
