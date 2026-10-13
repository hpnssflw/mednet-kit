import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Внедрение в существующие сайты' };

const TOKENS_CDN = 'https://cdn.jsdelivr.net/npm/@mednet/tokens@0/dist/tokens.css';
const FONTS_CDN = 'https://cdn.jsdelivr.net/npm/@mednet/css@0/dist/fonts.css';

const PMSP = `<!-- после собственных стилей сайта -->
<link rel="stylesheet" href="${FONTS_CDN}">
<link rel="stylesheet" href="${TOKENS_CDN}">

<style>
  :root {
    --accent: var(--mn-primary);          /* было #2e6b52 / #8f3150 */
    --accent-dark: var(--mn-primary-hover);
    --accent-tint: var(--mn-red-100);
    --ink: var(--mn-foreground);
    --muted: var(--mn-muted-foreground);  /* у pmsp --muted — цвет текста */
    --line: var(--mn-border);
    --line-soft: var(--mn-beige-200);
    --bg-warm: var(--mn-beige-100);
    --font-display: var(--mn-font-sans);
    --font-text: var(--mn-font-sans);
  }
</style>`;

const MEDNET = `<!-- ПОСЛЕ bootstrap.min.css: Bootstrap 4 объявляет свой --primary -->
<link rel="stylesheet" href="${TOKENS_CDN}">

/* style_new.css: заменить литералы на переменные (без учёта регистра) */
#e06b65 → var(--mn-primary)        /* 108 вхождений; #e06b65 на белом — 3.25:1, не проходит AA */
#cf5a54 → var(--mn-primary-hover)
#3b3b3b → var(--mn-foreground)`;

const ANTD = `import { font, semantic } from '@mednet/tokens';
import type { ThemeConfig } from 'antd';

export const mednetTheme: ThemeConfig = {
  token: {
    colorPrimary: semantic.primary,
    colorError: semantic.destructive,
    colorSuccess: semantic.success,
    colorWarning: semantic.warning,
    colorInfo: semantic.info,
    colorText: semantic.foreground,
    colorTextSecondary: semantic['muted-foreground'],
    colorBorder: semantic.input,
    colorBgLayout: semantic.muted,
    fontFamily: font.sans,
    borderRadius: 16,
  },
};

// <ConfigProvider theme={mednetTheme}>…</ConfigProvider>`;

const TAILWIND = `@import "tailwindcss";
@import "@mednet/tokens/theme.css";`;

function Recipe({
  id,
  title,
  children,
  code,
}: {
  id: string;
  title: string;
  children: ReactNode;
  code: string;
}) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      <div className="mt-3 max-w-3xl text-muted-foreground">{children}</div>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-sm">
        <code>{code}</code>
      </pre>
    </section>
  );
}

export default function RecipesPage() {
  return (
    <>
      <h1 className="text-h1">Внедрение в существующие сайты</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Переписывать сайт не нужно. Главное правило: на чужом сайте используйте только переменные с
        префиксом <code>--mn-*</code> — имена без префикса (<code>--primary</code>,{' '}
        <code>--accent</code>, <code>--muted</code>) конфликтуют с Bootstrap и самописными темами.
      </p>

      <Recipe id="pmsp" title="Статика на CSS-переменных (pmsp-*)" code={PMSP}>
        У сайта уже есть свои переменные — достаточно переназначить их на токены бренда.
      </Recipe>

      <Recipe id="mednet" title="MODX + Bootstrap 4 (mednet.ru)" code={MEDNET}>
        Переменных нет — акцент вшит литералами. Подключаем токены и заменяем литералы.
      </Recipe>

      <Recipe id="antd" title="React + Ant Design (olimpiada)" code={ANTD}>
        Тема для <code>ConfigProvider</code> из JS-экспорта токенов.
      </Recipe>

      <Recipe id="tailwind" title="Любой проект на Tailwind v4" code={TAILWIND}>
        Стандартная палитра Tailwind заменится палитрой бренда.
      </Recipe>
    </>
  );
}
