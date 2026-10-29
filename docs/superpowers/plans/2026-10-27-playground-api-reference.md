# Справочник по API и превью в playground — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать раздел «Установка» со страниц компонентов и блоков, сделать полный справочник по API (включая пропсы Base UI и брендовые блоки) и добавить превью всех видов и состояний.

**Architecture:** Генератор `scripts/gen-api.mjs` читает `.d.ts` пакета `@mednet/ui` (компоненты и бренд), кладёт в `src/api.json` все значимые пропсы вместе с готовым русским описанием (словарь `src/api-ru.json` + JSDoc кита). Страница рисует таблицу из `api.json`. Два скрипта-проверки (`check-api`, `check-demos`) не дают справочнику и превью разъехаться; Playwright-скрипт проверяет результат на живых страницах.

**Tech Stack:** Vite + React 19, react-router 8, TypeScript compiler API (`typescript`), `@mednet/ui` 2.x (Base UI), Playwright из `C:\A\mednet-kit\apps\docs\node_modules`.

Спек: `docs/superpowers/specs/2026-10-27-playground-api-reference-design.md`.

## Global Constraints

- Работаем только в `C:\A\mednet-playground\react`. В репозиторий кита (`packages/*`) ничего не вносим; в нём меняются только файлы `docs/superpowers/*`.
- Playground **не git-репозиторий**: «коммитов» нет. Точки отката — копии `react/src` (Task 1) и, после каждой задачи, зелёные проверки.
- Все пути ниже — от `C:\A\mednet-playground\react`, команды — `pnpm` оттуда же.
- Раздел «Установка» убирается только со страниц компонентов и блоков; страница `/docs/installation` и пункт сайдбара остаются.
- Справочник — полная таблица: пропсы кита (`variant`, `size`) и пропсы Base UI (`value`, `onValueChange`, `disabled`, `render`, …) с типом, значением по умолчанию и описанием на русском. Атрибуты HTML/SVG и DOM-события (`@types/react`) в таблицу не входят.
- Описание пропса: словарь `src/api-ru.json` (`components[id][prop]` → JSDoc кита, если пропс объявлен китом → `common[prop]`). Пропс без описания — ошибка `check:api`.
- Превью — вручную, файлы `src/demos/<id>--<slug>.tsx` с `export const meta = { title, description }`; для каждого значения `variant`/`size` из API должен быть пример (проверяет `check:demos`).
- Цвета и размеры — только классы токенов кита; иконки — `lucide-react`; другой элемент — проп `render`, не `asChild`.
- `@mednet/ui` в playground ставится из tarball в `C:\A\mednet-playground\.tarballs\`; в этом плане кит не меняется, поэтому tarball не пересобираем. Если кит изменится — пересобрать tarball и выполнить `pnpm gen:api`, иначе справочник устареет.

---

## Структура файлов

| Файл | Действие | Ответственность |
| --- | --- | --- |
| `src/docs/component-page.tsx` | изменить | убрать «Установку», перенести `extra`, новая таблица API |
| `src/docs/blocks-pages.tsx` | изменить | убрать «Установку» (шаг «Подключите кит») |
| `src/docs/ui.tsx` | изменить | `PropTable`: колонка «Описание», бейдж источника |
| `scripts/gen-api.mjs` | переписать | `components` + `brand`, все пропсы, `values`, `source`, `desc` |
| `src/api-ru.json` | создать | словарь описаний, `only` для больших библиотечных компонентов |
| `scripts/check-api.mjs` | создать | у каждого пропса есть описание; у `variant`/`size` есть `values` |
| `scripts/check-demos.mjs` | создать | покрытие `variant`/`size` примерами; режим `--report` |
| `scripts/demos-exceptions.json` | создать | осознанные исключения покрытия с причиной |
| `scripts/verify-docs.mjs` | создать | Playwright: обход страниц, проверки, скриншоты |
| `package.json` | изменить | скрипты `gen:api`, `check:api`, `check:demos`, `verify:docs` |
| `src/demos/*--*.tsx` | создать | примеры видов и состояний (Tasks 7–12) |

---

### Task 1: Страховочная копия и удаление «Установки»

**Files:**
- Modify: `src/docs/component-page.tsx:8,128-143`
- Modify: `src/docs/blocks-pages.tsx:83-102`

**Interfaces:**
- Produces: страницы без H2 «Установка»; `e.extra` выводится в «Использовании».

- [ ] **Step 1: Копия `src`**

```bash
cd /c/A/mednet-playground/react && cp -r src ../src.backup-2026-10-27
```

Expected: каталог `C:\A\mednet-playground\src.backup-2026-10-27` существует.

- [ ] **Step 2: Правка `component-page.tsx`** — убрать импорт `Install` и блок «Установка», перенести `extra`

В строке 8 заменить `import { Code, Install } from './code';` на `import { Code } from './code';`.

Заменить блок

```tsx
      <H2>Установка</H2>
      <P>
        Компонент входит в пакет <C>@mednet/ui</C>: копировать код в проект не нужно. Один раз установите пакет и подключите стили (см.{' '}
        <A href="/docs/installation">Установку</A>).
      </P>
      <div className="mt-4">
        <Install packages="@mednet/ui" />
      </div>
      {e.extra ? <P>Дополнительно: {e.extra}.</P> : null}

      <H2>Использование</H2>
      <P>Импортируйте нужные части по подпути:</P>
      <div className="mt-4">
        <Code code={imports || `import {} from '@mednet/ui/${e.id}';`} />
      </div>
      <P>Полный рабочий пример — на вкладке «Код» выше.</P>
```

на

```tsx
      <H2>Использование</H2>
      <P>
        Компонент входит в пакет <C>@mednet/ui</C> (<A href="/docs/installation">установка</A>). Импортируйте нужные части по подпути:
      </P>
      <div className="mt-4">
        <Code code={imports || `import {} from '@mednet/ui/${e.id}';`} />
      </div>
      <P>Полный рабочий пример — на вкладке «Код» выше.</P>
      {e.extra ? <P>Дополнительно: {e.extra}.</P> : null}
```

(Ссылка на страницу установки в одну фразу остаётся: это навигация, а не раздел.)

- [ ] **Step 3: Правка `blocks-pages.tsx`** — убрать шаг «Подключите кит», заголовок переименовать

Заменить

```tsx
      <H2>Установка</H2>
      <Steps>
        <Step title="Подключите кит">
          <P>
            Установите <C>@mednet/ui</C> и подключите стили — см. <A href="/docs/installation">Установку</A>.
          </P>
          <Install packages="@mednet/ui" />
        </Step>
        {extra.length ? (
```

на

```tsx
      <H2>Использование</H2>
      <Steps>
        {extra.length ? (
```

- [ ] **Step 4: Сборка и поиск остатков**

Run: `pnpm build`
Expected: exit 0 (если `tsc` ругается на неиспользуемый импорт `Install`/`A`/`C` в `blocks-pages.tsx` — убрать только неиспользуемые).

Run: `grep -n "Установка" src/docs/component-page.tsx src/docs/blocks-pages.tsx`
Expected: пусто.

---

### Task 2: Генератор API — брендовые блоки и все пропсы

**Files:**
- Rewrite: `scripts/gen-api.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `src/api.json` — `Record<id, { name: string; props: ApiProp[] }[]>`, где

```ts
type ApiProp = {
  name: string;
  type: string;                  // без import("...").
  default: string | null;        // готовая к показу запись: "horizontal", true, 42
  optional: boolean;
  source: 'kit' | 'lib';         // kit — объявлен в @mednet/ui или cva; lib — Base UI и др.
  values: string[] | null;       // для объединения строковых литералов
  doc: string;                   // JSDoc (если есть)
  desc: string | null;           // готовое описание (Task 3); до Task 3 — null
};
```

- Consumes (Task 3): `src/api-ru.json` — читается генератором, если файл есть.

- [ ] **Step 1: Переписать `scripts/gen-api.mjs`**

```js
import ts from 'typescript';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const root = resolve('node_modules/@mednet/ui/dist');
const dirs = ['components', 'brand'].map((d) => resolve(root, d));
const files = dirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.d.ts')).map((f) => resolve(d, f)));
const ruPath = resolve('src/api-ru.json');
const ru = existsSync(ruPath) ? JSON.parse(readFileSync(ruPath, 'utf8')) : {};

const program = ts.createProgram(files, {
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  baseUrl: resolve('.'),
  typeRoots: [resolve('node_modules/@types')],
});
const checker = program.getTypeChecker();

const norm = (f) => f.split('\\').join('/');
const isKit = (f) => norm(f).includes('/@mednet/ui/dist/') || f.includes('class-variance-authority');
/** Атрибуты HTML/SVG и DOM-события — в справочник не входят. */
const isDom = (f) => /\/@types\/react(-dom)?\/|\/typescript\/lib\//.test(norm(f));
const SKIP = new Set(['className', 'style', 'children', 'ref', 'key']);

/** Значения по умолчанию: cva `defaultVariants` и деструктуризация `{ a = 'x' }` в JS-файле компонента. */
function defaultsOf(file) {
  const js = file.replace(/\.d\.ts$/, '.js');
  if (!existsSync(js)) return {};
  const src = readFileSync(js, 'utf8');
  const r = {};
  const cva = src.match(/defaultVariants:\s*\{([^}]*)\}/);
  if (cva) for (const x of cva[1].matchAll(/(\w+):\s*["']([^"']+)["']/g)) r[x[1]] = JSON.stringify(x[2]);
  for (const m of src.matchAll(/function\s+\w+\(\s*\{([^}]*)\}/g)) {
    for (const x of m[1].matchAll(/(\w+)\s*=\s*("[^"]*"|'[^']*'|true|false|-?\d+(?:\.\d+)?)/g)) {
      r[x[1]] = x[2].startsWith("'") ? JSON.stringify(x[2].slice(1, -1)) : x[2];
    }
  }
  return r;
}

/** Объединение строковых литералов → список значений, иначе null. */
function literalValues(t) {
  const parts = t.isUnion() ? t.types : [t];
  const lits = parts.filter((x) => x.isStringLiteral()).map((x) => x.value);
  const rest = parts.filter((x) => !x.isStringLiteral() && !(x.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)));
  return lits.length > 1 && rest.length === 0 ? lits : null;
}

const describe = (id, name, source, doc) =>
  ru.components?.[id]?.[name] ?? (source === 'kit' && doc ? doc : null) ?? ru.common?.[name] ?? null;

const out = {};
for (const file of files) {
  const id = basename(file, '.d.ts');
  const sf = program.getSourceFile(file);
  const mod = sf && checker.getSymbolAtLocation(sf);
  if (!mod) continue;
  const defaults = defaultsOf(file);
  const only = ru.only?.[id];
  const list = [];
  for (const sym of checker.getExportsOfModule(mod)) {
    if (sym.name === 'default') continue;
    const decl = sym.valueDeclaration ?? sym.declarations?.[0];
    if (!decl) continue;
    const sig = checker.getTypeOfSymbolAtLocation(sym, decl).getCallSignatures()[0];
    if (!sig?.parameters[0]) continue;
    const pType = checker.getTypeOfSymbolAtLocation(sig.parameters[0], decl);
    const props = [];
    for (const p of checker.getPropertiesOfType(pType)) {
      const d = p.declarations?.[0];
      const df = d?.getSourceFile().fileName ?? '';
      if (!d || isDom(df) || SKIP.has(p.name)) continue;
      const source = isKit(df) ? 'kit' : 'lib';
      if (source === 'lib' && only && !only.includes(p.name)) continue;
      const pt = checker.getTypeOfSymbolAtLocation(p, d);
      const doc = ts.displayPartsToString(p.getDocumentationComment(checker));
      props.push({
        name: p.name,
        type: checker
          .typeToString(pt, d, ts.TypeFormatFlags.NoTruncation)
          .replace(/import\("[^"]+"\)\./g, '')
          .replace(/ \| undefined$/, '')
          .replace(/ \| null/g, ''),
        default: defaults[p.name] ?? null,
        optional: !!(p.flags & ts.SymbolFlags.Optional),
        source,
        values: literalValues(pt),
        doc,
        desc: describe(id, p.name, source, doc),
      });
    }
    props.sort((a, b) => (a.source === b.source ? 0 : a.source === 'kit' ? -1 : 1));
    list.push({ name: sym.name, props });
  }
  out[id] = list;
}
writeFileSync('src/api.json', JSON.stringify(out, null, 1));

const rows = Object.entries(out).map(([id, v]) => [id, v.reduce((n, c) => n + c.props.length, 0)]);
console.log(`записей: ${rows.length}, пустых: ${rows.filter(([, n]) => n === 0).map(([id]) => id).join(', ') || '—'}`);
console.log(`крупные (>25 пропсов): ${rows.filter(([, n]) => n > 25).map(([id, n]) => `${id}=${n}`).join(', ') || '—'}`);
```

- [ ] **Step 2: Скрипты в `package.json`**

В `scripts` добавить (после `"lint": "oxlint",`):

```json
    "gen:api": "node scripts/gen-api.mjs",
    "check:api": "node scripts/check-api.mjs",
    "check:demos": "node scripts/check-demos.mjs",
    "verify:docs": "node scripts/verify-docs.mjs",
```

- [ ] **Step 3: Запустить и убедиться, что брендовые блоки и Base UI попали**

Run: `pnpm gen:api`
Expected: строка «записей: 64 …» (61 компонентов + 3 бренда), ошибок нет.

Run:

```bash
node -e "const a=require('./src/api.json');const s=(id,c)=>(a[id].find(x=>x.name===c)||a[id][0]).props.map(p=>p.name+(p.values?'['+p.values+']':'')+':'+p.source).join(', ');console.log('logo:',s('logo','Logo'));console.log('slider:',s('slider','Slider'));console.log('checkbox:',s('checkbox','Checkbox'));console.log('site-header:',s('site-header','SiteHeader'))"
```

Expected: `logo:` содержит `variant[horizontal,vertical,mark]:kit` и `title:kit`; `slider:` содержит `value`, `onValueChange`, `min`, `max`, `step`, `disabled`, `orientation`, `render` с `:lib`; `checkbox:` — `checked`, `onCheckedChange`, `indeterminate`, `disabled`, …; `site-header:` — `homeHref`, `nav`, `actions`.

- [ ] **Step 4: Если в таблицах попали DOM-атрибуты или пропали нужные пропсы**

Если в `slider`/`checkbox`/`tooltip`/`select` есть `onClick`, `id`, `tabIndex` и т. п. — они объявлены не в `@types/react`, а, например, в `lib.dom`. Расширить `isDom` в `scripts/gen-api.mjs` путём (например `/\/lib\.dom/`) и перегенерировать. Повторять `pnpm gen:api` и просмотр Step 3, пока в таблицах нет DOM-шума. Это единственное место подгонки.

---

### Task 3: Словарь описаний и `check:api`

**Files:**
- Create: `src/api-ru.json`
- Create: `scripts/check-api.mjs`

**Interfaces:**
- Consumes: `api.json` из Task 2 (`desc`, `values`, `source`).
- Produces: `src/api-ru.json` — `{ common: Record<string,string>, components: Record<id, Record<prop,string>>, only: Record<id, string[]> }`; `pnpm check:api` с кодом 0, когда у каждого пропса есть описание.

- [ ] **Step 1: Начальный словарь `src/api-ru.json`**

```json
{
  "common": {
    "render": "Подставляет свой элемент вместо стандартного: `render={<a href=\"/\" />}`. Заменяет `asChild`.",
    "disabled": "Отключает компонент: он не реагирует на ввод и выглядит неактивным.",
    "readOnly": "Только чтение: значение видно и копируется, но не меняется.",
    "required": "Обязательное поле: форма не отправится без значения.",
    "name": "Имя поля в форме.",
    "value": "Текущее значение (управляемый режим). Используйте вместе с `onValueChange`.",
    "defaultValue": "Начальное значение (неуправляемый режим).",
    "onValueChange": "Вызывается при изменении значения.",
    "checked": "Отмечено ли поле (управляемый режим). Используйте вместе с `onCheckedChange`.",
    "defaultChecked": "Начальное состояние «отмечено» (неуправляемый режим).",
    "onCheckedChange": "Вызывается при смене состояния.",
    "pressed": "Нажата ли кнопка (управляемый режим).",
    "defaultPressed": "Начальное состояние «нажата».",
    "onPressedChange": "Вызывается при смене состояния «нажата».",
    "open": "Открыт ли компонент (управляемый режим). Используйте вместе с `onOpenChange`.",
    "defaultOpen": "Открыт ли компонент в начале (неуправляемый режим).",
    "onOpenChange": "Вызывается при открытии и закрытии.",
    "modal": "Блокирует остальную страницу, пока компонент открыт.",
    "orientation": "Направление: `horizontal` — по горизонтали, `vertical` — по вертикали.",
    "min": "Минимальное значение.",
    "max": "Максимальное значение.",
    "step": "Шаг изменения значения.",
    "side": "Сторона якоря, с которой открывается компонент.",
    "align": "Выравнивание относительно якоря: по началу, центру или концу.",
    "sideOffset": "Расстояние от якоря до компонента, px.",
    "alignOffset": "Сдвиг вдоль стороны якоря, px.",
    "delay": "Задержка перед открытием, мс.",
    "closeDelay": "Задержка перед закрытием, мс.",
    "keepMounted": "Оставляет содержимое в разметке, пока компонент закрыт.",
    "multiple": "Разрешает выбрать несколько значений.",
    "loop": "Переход с последнего элемента на первый и обратно.",
    "nativeButton": "Сообщает, что подставленный через `render` элемент — настоящая `<button>`.",
    "title": "Доступное имя. Без него элемент считается декоративным."
  },
  "components": {},
  "only": {}
}
```

- [ ] **Step 2: `scripts/check-api.mjs`**

```js
import { readFileSync } from 'node:fs';

const api = JSON.parse(readFileSync('src/api.json', 'utf8'));
const problems = [];
for (const [id, comps] of Object.entries(api)) {
  for (const c of comps) {
    for (const p of c.props) {
      if (!p.desc) problems.push(`нет описания: ${id}.${c.name}.${p.name}`);
      if ((p.name === 'variant' || p.name === 'size') && p.source === 'kit' && !p.values) {
        problems.push(`нет списка значений: ${id}.${c.name}.${p.name} (${p.type})`);
      }
    }
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\nОшибок: ${problems.length}. Добавьте описания в src/api-ru.json (components.<id>.<prop> или common.<prop>).`);
  process.exit(1);
}
console.log('check:api — ок');
```

- [ ] **Step 3: Прогнать, увидеть список недостающих описаний**

Run: `pnpm gen:api && pnpm check:api`
Expected: FAIL, список `нет описания: …`.

- [ ] **Step 4: Заполнять словарь, пока проверка не станет зелёной**

Правила:
- Свойство встречается у многих компонентов с одним смыслом → `common`.
- Смысл зависит от компонента (`variant`, `size`, `side`, `value` с особым типом) → `components.<id>.<prop>`, пример:

```json
"components": {
  "button": {
    "variant": "Вид кнопки: основная, контурная, вторичная, прозрачная, опасная, ссылка.",
    "size": "Размер кнопки."
  }
}
```

- Для библиотечных компонентов, у которых после фильтра больше 25 пропсов (генератор печатает их в строке «крупные»), в `only` перечислить пропсы, которые нужны пользователю кита, и описать только их, например:

```json
"only": { "calendar": ["mode", "selected", "onSelect", "defaultMonth", "locale", "disabled", "numberOfMonths", "showOutsideDays"] }
```

После каждой порции правок: `pnpm gen:api && pnpm check:api`. Цель — `check:api — ок`. Описания короткие (одно предложение), на русском, без терминов вроде «пропс» в тексте для пользователя.

- [ ] **Step 5: Финальный запуск**

Run: `pnpm gen:api && pnpm check:api`
Expected: `check:api — ок`.

---

### Task 4: Таблица API на странице

**Files:**
- Modify: `src/docs/ui.tsx:91-120` (`PropTable`)
- Modify: `src/docs/component-page.tsx:50-94` (типы и `Api`)

**Interfaces:**
- Consumes: `api.json` (Task 2–3): `ApiProp` с полями `source`, `values`, `desc`, `default`.
- Produces: `PropTable` принимает `rows: { name: string; badge?: ReactNode; type: ReactNode; def?: ReactNode; desc?: ReactNode }[]`; при наличии `desc` хотя бы у одной строки появляется четвёртая колонка `heads[3] ?? 'Описание'`.

- [ ] **Step 1: `PropTable` в `ui.tsx`** — заменить функцию целиком

```tsx
export function PropTable({
  rows,
  heads = ['Свойство', 'Тип', 'По умолчанию'],
}: {
  heads?: string[];
  rows: { name: string; badge?: ReactNode; type: ReactNode; def?: ReactNode; desc?: ReactNode }[];
}) {
  const hasDesc = rows.some((r) => r.desc);
  return (
    <div className="mt-4 rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{heads[0]}</TableHead>
            <TableHead>{heads[1]}</TableHead>
            {heads[2] ? <TableHead>{heads[2]}</TableHead> : null}
            {hasDesc ? <TableHead>{heads[3] ?? 'Описание'}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name} className="align-top">
              <TableCell className="font-mono text-xs text-primary-hover">
                <span className="flex flex-wrap items-center gap-1.5">
                  {r.name}
                  {r.badge}
                </span>
              </TableCell>
              <TableCell className="whitespace-normal font-mono text-xs">{r.type}</TableCell>
              {heads[2] ? <TableCell className="whitespace-normal font-mono text-xs text-muted-foreground">{r.def ?? '—'}</TableCell> : null}
              {hasDesc ? <TableCell className="min-w-56 whitespace-normal text-sm">{r.desc ?? '—'}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: `component-page.tsx`** — типы и `Api`

Добавить импорт `import { cn } from '@mednet/ui/utils';` и заменить блок от `type ApiProp` до конца функции `Api` на:

```tsx
type ApiProp = {
  name: string;
  type: string;
  default: string | null;
  optional: boolean;
  source: 'kit' | 'lib';
  values: string[] | null;
  desc: string | null;
};
type ApiComp = { name: string; props: ApiProp[] };

/** Значения-перечисления — чипами; значение по умолчанию выделено. */
function PropType({ p }: { p: ApiProp }) {
  if (!p.values) return <>{p.type}</>;
  return (
    <span className="flex flex-wrap gap-1">
      {p.values.map((v) => (
        <span
          key={v}
          className={cn('rounded border px-1.5 py-0.5', p.default === JSON.stringify(v) ? 'border-primary text-primary-hover' : 'border-border')}
        >
          {v}
        </span>
      ))}
    </span>
  );
}

function Api({ e }: { e: Entry }) {
  const comps = ((api as Record<string, ApiComp[]>)[e.id] ?? []).filter((c) => c.props.length);
  return (
    <>
      <H2>Справочник по API</H2>
      {comps.map((c) => (
        <div key={c.name}>
          <H3>{c.name}</H3>
          <PropTable
            rows={c.props.map((p) => ({
              name: p.name + (p.optional ? '' : '*'),
              badge: (
                <Badge variant={p.source === 'kit' ? 'secondary' : 'outline'} className="font-sans">
                  {p.source === 'kit' ? 'кит' : (e.ref?.name ?? 'библиотека')}
                </Badge>
              ),
              type: <PropType p={p} />,
              def: p.default ?? undefined,
              desc: p.desc ?? undefined,
            }))}
          />
        </div>
      ))}
      <P>
        Атрибуты базового HTML-элемента (<C>id</C>, <C>style</C>, <C>onClick</C>, <C>aria-*</C> и др.) передаются дальше
        {e.ref ? (
          <>
            {' '}
            — остальные свойства такие же, как у <A href={e.ref.url}>{e.ref.name}</A>.
          </>
        ) : (
          <>.</>
        )}{' '}
        Классы стилей кита задаются внутри компонента; цвета и размеры в <C>className</C> не переопределяйте.
      </P>
    </>
  );
}
```

- [ ] **Step 3: Сборка**

Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 4: Просмотр руками**

Run: `pnpm dev` (в фоне), открыть `http://localhost:5173/docs/components/logo`, `/slider`, `/checkbox`, `/button`.
Expected: у `logo` в таблице `variant` с тремя чипами, `horizontal` выделен рамкой; у `slider` — строки `value`, `onValueChange`, `min`, … с бейджем «Base UI» и описаниями; пустых таблиц и фразы «нет свойств, добавленных китом» нет.

---

### Task 5: `check:demos` и режим `--report`

**Files:**
- Create: `scripts/check-demos.mjs`
- Create: `scripts/demos-exceptions.json`

**Interfaces:**
- Consumes: `api.json`, `src/demos/*.tsx`.
- Produces: `pnpm check:demos` — код 1, если у какого-то `variant`/`size` (источник `kit`, не значение по умолчанию) нет примера; `pnpm check:demos -- --report` — таблица покрытия в Markdown.
- Формат исключения в `demos-exceptions.json`: `{ "<id>.<prop>.<value>": "причина" }`.

- [ ] **Step 1: `scripts/demos-exceptions.json`**

```json
{}
```

- [ ] **Step 2: `scripts/check-demos.mjs`**

```js
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const api = JSON.parse(readFileSync('src/api.json', 'utf8'));
const exceptions = JSON.parse(readFileSync('scripts/demos-exceptions.json', 'utf8'));
const dir = resolve('src/demos');
const names = readdirSync(dir).filter((f) => f.endsWith('.tsx'));
const ids = Object.keys(api).filter((id) => existsSync(resolve(dir, `${id}.tsx`)));
const sourceOf = (id) =>
  names
    .filter((f) => f === `${id}.tsx` || f.startsWith(`${id}--`))
    .map((f) => readFileSync(resolve(dir, f), 'utf8'))
    .join('\n');
const exampleCount = (id) => names.filter((f) => f.startsWith(`${id}--`)).length;

const report = [];
const missing = [];
for (const id of ids) {
  const src = sourceOf(id);
  const need = [];
  for (const c of api[id]) {
    for (const p of c.props) {
      if ((p.name !== 'variant' && p.name !== 'size') || p.source !== 'kit' || !p.values) continue;
      for (const v of p.values) {
        if (p.default === JSON.stringify(v)) continue;
        const key = `${id}.${p.name}.${v}`;
        const used = new RegExp(`${p.name}(=|:\\s*)\\{?["']${v}["']`).test(src);
        need.push({ key, used, excused: key in exceptions });
      }
    }
  }
  const lacking = need.filter((n) => !n.used && !n.excused);
  missing.push(...lacking.map((n) => n.key));
  report.push({ id, examples: exampleCount(id), total: need.length, lacking: lacking.map((n) => n.key.split('.').slice(1).join('=')) });
}

if (process.argv.includes('--report')) {
  console.log('| Компонент | Примеров | variant/size покрыто | Не хватает |');
  console.log('| --- | --- | --- | --- |');
  for (const r of report) {
    console.log(`| ${r.id} | ${r.examples} | ${r.total - r.lacking.length}/${r.total} | ${r.lacking.join(', ') || '—'} |`);
  }
  process.exit(0);
}
if (missing.length) {
  console.error(`Нет примеров для:\n${missing.join('\n')}\n\nДобавьте src/demos/<id>--<slug>.tsx или запишите причину в scripts/demos-exceptions.json.`);
  process.exit(1);
}
console.log('check:demos — ок');
```

- [ ] **Step 3: Проверка скрипта**

Run: `pnpm check:demos -- --report`
Expected: Markdown-таблица по всем компонентам, у которых есть `src/demos/<id>.tsx`; для `button` не покрытым может быть `size=icon` и т. п. — это нормально, это работа Tasks 7–12.

Run: `pnpm check:demos`
Expected: exit 1 со списком недостающего (пока примеров нет) — или `check:demos — ок`, если всё уже покрыто.

---

### Task 6: Превью логотипа (первый эталон)

**Files:**
- Create: `src/demos/logo--horizontal.tsx`
- Create: `src/demos/logo--vertical.tsx`
- Create: `src/demos/logo--mark.tsx`

**Interfaces:**
- Consumes: `Logo` из `@mednet/ui/logo` (`variant`: `'horizontal' | 'vertical' | 'mark'`, `title`, размер — классом высоты).
- Produces: образец формата примера `meta` + `Demo` для Tasks 7–12.

- [ ] **Step 1: `src/demos/logo--horizontal.tsx`**

```tsx
import { Logo } from '@mednet/ui/logo';

export const meta = {
  title: 'Горизонтальный — по умолчанию',
  description: 'Знак, название «ЦНИИОИЗ» и дескриптор. Для шапки сайта и документов, где хватает ширины.',
};

export default function Demo() {
  return (
    <a href="/" aria-label="ЦНИИОИЗ — на главную">
      <Logo variant="horizontal" className="h-14 w-auto" />
    </a>
  );
}
```

- [ ] **Step 2: `src/demos/logo--vertical.tsx`**

```tsx
import { Logo } from '@mednet/ui/logo';

export const meta = {
  title: 'Вертикальный',
  description: 'Знак и «ЦНИИОИЗ» друг под другом. Для узких колонок, обложек, страниц входа.',
};

export default function Demo() {
  return <Logo variant="vertical" className="h-24 w-auto" title="ЦНИИОИЗ" />;
}
```

- [ ] **Step 3: `src/demos/logo--mark.tsx`**

```tsx
import { Logo } from '@mednet/ui/logo';

export const meta = {
  title: 'Знак',
  description: 'Только знак. Для иконки приложения, аватара, мест, где название не помещается.',
};

export default function Demo() {
  return (
    <div className="flex items-end gap-6">
      <Logo variant="mark" className="size-8" title="ЦНИИОИЗ" />
      <Logo variant="mark" className="size-12" title="ЦНИИОИЗ" />
      <Logo variant="mark" className="size-20" title="ЦНИИОИЗ" />
    </div>
  );
}
```

- [ ] **Step 4: Проверки**

Run: `pnpm build && pnpm check:demos -- --report | grep -E "^\| logo "`
Expected: сборка зелёная; строка `| logo | 3 | 2/2 | — |`.

- [ ] **Step 5: Просмотр**

`http://localhost:5173/docs/components/logo` — в «Примерах» три блока с заголовками и описаниями, в «Справочнике» — таблица с `variant`.

---

### Task 7: Таблица покрытия — ОСТАНОВКА на согласование

**Files:** нет изменений.

- [ ] **Step 1: Сформировать таблицу**

Run: `pnpm check:demos -- --report`

- [ ] **Step 2: Показать владельцу таблицу и список запланированных примеров из Tasks 8–12**, дождаться «да» или правок списка. Только после этого — Tasks 8–12. Правки списка вносить в Tasks 8–12 до начала работы.

---

### Общий шаблон для Tasks 8–12

Каждый пример — отдельный файл `src/demos/<id>--<slug>.tsx`, формат как в Task 6: `export const meta = { title, description }` (по-русски, `description` — когда и зачем) и `export default function Demo()`. Импорты только `@mednet/ui/<подпуть>` и `lucide-react`. Тексты — реалистичные для ЦНИИОИЗ (заявки, отчёты, приём документов), не «Lorem ipsum». Для каждого значения `variant`/`size` — отдельный пример или строка в общем (проверка видит `variant="…"` в любом файле компонента).

Каждая из задач 8–12 заканчивается одинаково:

- [ ] **Проверка группы:** `pnpm build` (зелёная); `pnpm check:demos -- --report` — у компонентов группы колонка «Не хватает» пустая; `pnpm verify:docs -- --ids <id1,id2,…> --shots <каталог>` (скрипт — Task 13) — без ошибок, скриншоты просмотрены.

---

### Task 8: Превью — «Основы»

**Files (create):** `src/demos/` + файлы из таблицы.

| Компонент | Файлы-примеры (slug → что показывает) |
| --- | --- |
| `button` | `sizes` (все `size`, включая `icon`-варианты из отчёта), `variants-disabled` (каждый `variant` в `disabled`), `icon-only` (кнопка-иконка с `aria-label`), `as-link` и `loading` уже есть |
| `badge` | `variants` (все `variant`), `counter` (число рядом с текстом, например «Заявки 12»), `with-icon` уже есть |
| `avatar` | `sizes` (все `size`), `fallback` (инициалы вместо фото), `group` (стопка аватаров с «+3») |
| `kbd` | `combo` (`Ctrl` + `K`), `in-text` (клавиша внутри предложения) |
| `separator` | `horizontal-vertical` (обе ориентации), `in-list` (между пунктами меню) |
| `skeleton` | `card` (скелетон карточки), `text-lines` (3 строки разной длины) |
| `spinner` | `sizes` (все `size`/классы размеров), `inline` (внутри строки «Загрузка отчёта…») |
| `progress` | `values` (0 %, 40 %, 100 %), `with-label` (подпись и процент над полосой) |

**Образец (полный код) — `src/demos/avatar--group.tsx`:**

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@mednet/ui/avatar';

export const meta = { title: 'Группа', description: 'Стопка аватаров: участники рабочей группы, остальные — счётчиком.' };

export default function Demo() {
  return (
    <div className="flex -space-x-2">
      {['АП', 'ИС', 'МК'].map((initials) => (
        <Avatar key={initials} className="ring-2 ring-background">
          <AvatarImage alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
      <Avatar className="ring-2 ring-background">
        <AvatarFallback>+3</AvatarFallback>
      </Avatar>
    </div>
  );
}
```

- [ ] **Step 1:** создать файлы по таблице; сверяться с `pnpm check:demos -- --report` (там названы конкретные значения `size`/`variant`).
- [ ] **Step 2:** общая «Проверка группы» (ids: `button,badge,avatar,kbd,separator,skeleton,spinner,progress`).

---

### Task 9: Превью — «Формы»

| Компонент | Файлы-примеры |
| --- | --- |
| `input` | `states` (обычное, `disabled`, `aria-invalid`), `types` (`password`, `file`, `search`), `with-button` уже есть |
| `textarea` | `states` (обычное, `disabled`, `aria-invalid`), `with-counter` (счётчик символов под полем) |
| `label` | `with-field` (подпись, связанная с полем через `htmlFor`) |
| `field` | `horizontal` (подпись слева), `with-error` (ошибка под полем), `with-description` (подсказка), `form` уже есть |
| `input-group` | `with-icon`, `with-addon-text` (префикс «+7»), `with-button` |
| `checkbox` | `states` (отмечен, не отмечен, `indeterminate`, `disabled`), `with-label` |
| `radio-group` | `with-descriptions` (вариант с пояснением), `disabled-option`, `horizontal` |
| `switch` | `states` (вкл, выкл, `disabled`), `with-label` (настройка «Присылать уведомления») |
| `select` | `groups` (группы с заголовками), `disabled`, `invalid`, `placeholder` |
| `native-select` | `disabled`, `invalid` |
| `combobox` | `multiple` (если поддерживает `multiple`), `empty` (поиск без результатов) |
| `slider` | `range` (два бегунка), `step` (с шагом 10), `disabled`, `vertical` |
| `toggle` | `variants` (все `variant`), `sizes` (все `size`), `with-text`, `disabled` |
| `toggle-group` | `single`, `multiple`, `outline` (все `variant`), `sizes` |
| `input-otp` | `separator` (6 цифр с разделителем), `disabled` |
| `calendar` | `range` (период), `disabled-days` (выходные недоступны), `two-months` |
| `button-group` | `with-input`, `vertical` |

**Образец — `src/demos/checkbox--states.tsx`:**

```tsx
import { Checkbox } from '@mednet/ui/checkbox';
import { Label } from '@mednet/ui/label';

export const meta = { title: 'Состояния', description: 'Отмечен, не отмечен, частично отмечен и недоступен.' };

export default function Demo() {
  return (
    <div className="grid gap-3">
      <Label><Checkbox defaultChecked /> Отмечен</Label>
      <Label><Checkbox /> Не отмечен</Label>
      <Label><Checkbox indeterminate /> Частично отмечен</Label>
      <Label><Checkbox disabled /> Недоступен</Label>
    </div>
  );
}
```

- [ ] **Step 1:** создать файлы по таблице; если проп из таблицы отсутствует в API компонента (`multiple`, `indeterminate`, `vertical` и т. п. — это видно в справочнике Task 4), строку пропустить и записать причину в `scripts/demos-exceptions.json` только для `variant`/`size`.
- [ ] **Step 2:** «Проверка группы» (ids: `input,textarea,label,field,input-group,checkbox,radio-group,switch,select,native-select,combobox,slider,toggle,toggle-group,input-otp,calendar,button-group`).

---

### Task 10: Превью — «Содержимое»

| Компонент | Файлы-примеры |
| --- | --- |
| `card` | `with-image`, `with-action` (кнопка в `CardAction`), `stats` уже есть |
| `table` | `with-caption`, `selected-row` (`data-state="selected"`), `empty` (строка «Нет данных»), `with-actions` |
| `item` | `variants` (все `variant`), `sizes` (все `size`), `with-media` (иконка/аватар слева) |
| `empty` | `with-action`, `in-card` |
| `accordion` | `multiple`, `disabled-item` |
| `collapsible` | `with-trigger-button` |
| `tabs` | `vertical`, `with-counters`; `line` уже есть |
| `carousel` | `several-per-view`, `vertical` |
| `scroll-area` | `vertical`, `horizontal` |
| `aspect-ratio` | `ratios` (`16/9`, `4/3`, `1/1`) |
| `pagination` | `many-pages` (с многоточиями), `compact` |
| `breadcrumb` | `with-ellipsis`, `with-dropdown` |
| `chart` | примеры `01…14` уже есть — добавить `empty` (состояние «Нет данных») и `loading` (скелетон на месте графика) |

**Образец — `src/demos/table--empty.tsx`:**

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mednet/ui/table';

export const meta = { title: 'Пустая таблица', description: 'Если данных нет, оставьте шапку и объясните, что делать дальше.' };

export default function Demo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Заявка</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
            Заявок пока нет. Создайте первую.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 1:** создать файлы; правило про отсутствующие в API свойства — как в Task 9.
- [ ] **Step 2:** «Проверка группы» (ids: `card,table,item,empty,chart,accordion,collapsible,tabs,carousel,scroll-area,aspect-ratio,pagination,breadcrumb`).

---

### Task 11: Превью — «Обратная связь и оверлеи»

| Компонент | Файлы-примеры |
| --- | --- |
| `alert` | `variants` (все `variant`), `with-action`; `with-icon` уже есть |
| `dialog` | `form` (форма внутри), `long-content` (прокрутка), `no-close-button` |
| `alert-dialog` | `destructive` (опасное действие с красной кнопкой) |
| `sheet` | `sides` (все значения `side`), `with-form` |
| `drawer` | `directions` (все направления) |
| `popover` | `with-form`, `sides` |
| `tooltip` | `sides` (все `side`), `on-icon-button` |
| `hover-card` | `with-profile` (карточка сотрудника) |
| `dropdown-menu` | `radio`, `submenu`, `destructive-item`, `with-shortcuts`; `checkboxes` уже есть |
| `context-menu` | `with-submenu`, `with-checkboxes` |
| `menubar` | `with-shortcuts` |
| `navigation-menu` | `with-submenu` (список ссылок с описаниями) |
| `command` | `in-dialog` (по `Ctrl+K`), `groups` |
| `toast` | `with-action` (кнопка «Отменить»), `promise` (загрузка → успех/ошибка); `types` уже есть |

**Образец — `src/demos/alert-dialog--destructive.tsx`:** взять структуру из `src/demos/alert-dialog.tsx`, заменив текст на «Удалить заявку? Действие необратимо.» и кнопку подтверждения на `variant="destructive"`; открыть `alert-dialog.tsx` перед написанием и использовать те же компоненты (`AlertDialogTrigger render={<Button variant="outline" />}`).

- [ ] **Step 1:** создать файлы; открытие оверлея — через триггер в самом примере, чтобы превью было интерактивным.
- [ ] **Step 2:** «Проверка группы» (ids: `alert,dialog,alert-dialog,sheet,drawer,popover,tooltip,hover-card,dropdown-menu,context-menu,menubar,navigation-menu,command,toast`).

---

### Task 12: Превью — «Каркасы и бренд»

| Компонент | Файлы-примеры |
| --- | --- |
| `sidebar` | `collapsible-icon` (сворачивается в иконки), `floating`, `inset` (все значения `variant` из отчёта) |
| `resizable` | `vertical`, `with-handle` |
| `site-header` | `with-nav` (навигация), `with-actions` (кнопка «Войти»), `minimal` (только логотип) |
| `site-footer` | `with-links` (ссылки), `minimal` (только реквизиты) |

**Образец — `src/demos/site-header--with-actions.tsx`:**

```tsx
import { Button } from '@mednet/ui/button';
import { SiteHeader } from '@mednet/ui/site-header';

export const meta = { title: 'С навигацией и действием', description: 'Ссылки разделов по центру и кнопка входа справа.' };

export default function Demo() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border">
      <SiteHeader
        nav={
          <>
            <a href="#about">О проекте</a>
            <a href="#reports">Отчёты</a>
          </>
        }
        actions={<Button size="sm">Войти</Button>}
      />
    </div>
  );
}
```

- [ ] **Step 1:** создать файлы по таблице.
- [ ] **Step 2:** «Проверка группы» (ids: `sidebar,resizable,site-header,site-footer`).

---

### Task 13: Проверка на живых страницах (`verify-docs.mjs`)

**Files:**
- Create: `scripts/verify-docs.mjs`

**Interfaces:**
- Consumes: запущенный сайт (`BASE`, по умолчанию `http://localhost:4173` — `pnpm preview`); `src/registry.ts` (ids через regex `id: '…'`), `src/docs/blocks.ts` (ids блоков).
- Produces: `pnpm verify:docs -- [--ids a,b] [--shots <каталог>]` — код 1 при нарушении; скриншоты `<каталог>/<id>.png`.

- [ ] **Step 1: `scripts/verify-docs.mjs`**

```js
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire('C:/A/mednet-kit/apps/docs/package.json');
const { chromium } = require('@playwright/test');

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : null;
};
const BASE = process.env.BASE ?? 'http://localhost:4173';
const shots = arg('shots');
if (shots) mkdirSync(shots, { recursive: true });

const idsIn = (file) => [...readFileSync(file, 'utf8').matchAll(/\bid: '([^']+)'/g)].map((m) => m[1]);
const only = arg('ids')?.split(',');
const components = only ?? idsIn('src/registry.ts');
const blocks = only ? [] : idsIn('src/docs/blocks.ts');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

async function check(url, label, extra) {
  const before = errors.length;
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1');
  const h2 = await page.$$eval('h2', (els) => els.map((e) => e.textContent?.trim()));
  if (h2.includes('Установка')) errors.push(`${label}: есть раздел «Установка»`);
  if ((await page.textContent('body'))?.includes('нет свойств, добавленных китом')) errors.push(`${label}: старая фраза про пустой API`);
  if (extra) await extra(label);
  if (shots) await page.screenshot({ path: resolve(shots, `${label.replace('/', '-')}.png`), fullPage: true });
  if (errors.length > before) console.error(`✗ ${label}`);
}

for (const id of components) {
  await check(`/docs/components/${id}`, id, async (label) => {
    const hasApi = h2Has(await page.$$eval('h2', (els) => els.map((e) => e.textContent?.trim())));
    if (!hasApi) errors.push(`${label}: нет раздела «Справочник по API»`);
    const rows = await page.$$eval('table tbody tr', (r) => r.length);
    const noProps = new Set(['aspect-ratio', 'resizable']);
    if (rows === 0 && !noProps.has(id)) errors.push(`${label}: пустая таблица API`);
  });
}
function h2Has(list) {
  return list.includes('Справочник по API');
}

if (components.includes('logo')) {
  await page.goto(`${BASE}/docs/components/logo`, { waitUntil: 'networkidle' });
  const text = (await page.textContent('body')) ?? '';
  for (const v of ['horizontal', 'vertical', 'mark']) if (!text.includes(v)) errors.push(`logo: в API нет значения «${v}»`);
}

for (const id of blocks) await check(`/docs/blocks/${id}`, `blocks-${id}`);

await browser.close();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`verify:docs — ок (${components.length} компонентов, ${blocks.length} блоков)`);
```

- [ ] **Step 2: Собрать и запустить preview**

Run (фоном): `pnpm build && pnpm preview --port 4173`
Expected: сайт на `http://localhost:4173`.

- [ ] **Step 3: Прогнать на нескольких страницах**

Run: `pnpm verify:docs -- --ids logo,slider,checkbox,button --shots C:/Users/tigri/AppData/Local/Temp/claude/C--A-mednet-kit/6b819c9a-fb09-4273-a4c8-b865eb87eee6/scratchpad/shots`
Expected: `verify:docs — ок (4 компонентов, 0 блоков)`; скриншоты открыть и просмотреть.

Если у компонента без своих пропсов (`separator` и т. п.) проверка «пустая таблица API» срабатывает ложно, добавить его `id` в `noProps` (и только после того, как убедились в справочнике, что пропсов там действительно нет).

---

### Task 14: Финальная сквозная проверка

- [ ] **Step 1:** `pnpm gen:api && pnpm check:api && pnpm check:demos && pnpm lint && pnpm build` — всё зелёное.
- [ ] **Step 2:** `pnpm preview --port 4173` (фоном), затем `pnpm verify:docs -- --shots <scratchpad>/shots-final` — `verify:docs — ок`.
- [ ] **Step 3:** Открыть 6–8 скриншотов (логотип, слайдер, кнопка, диалог, таблица, форма-блок) и проверить глазами: нет «Установки», превью не обрезаны, чипы значений читаются, описания на русском.
- [ ] **Step 4:** Показать владельцу итог: что добавлено (число примеров), что в `demos-exceptions.json`, какие компоненты ограничены `only`. Резервная копия `C:\A\mednet-playground\src.backup-2026-10-27` остаётся, пока владелец не скажет удалить.

---

## Self-review (против спека)

- Р1 (убрать «Установку»): Task 1; проверка — Task 13 (нет H2 «Установка»).
- Р2 (полная таблица): Tasks 2–4; бренд — Task 2 (`brand/`), проверка `logo` — Tasks 2, 13.
- Р3 (превью вручную + защита покрытия): Tasks 5–12; согласование таблицы покрытия — Task 7.
- Р4 (русский словарь): Task 3; уточнение к спеку — для пропсов, объявленных в самом ките, JSDoc кита (он уже русский, например у `Logo` и `SiteHeader`) используется, если в `components.<id>` нет записи.
- Проверка результата и откат: Tasks 1, 13, 14.
- Вне объёма (кит, `static/`, тёмная тема, чат) — не затронуто.
