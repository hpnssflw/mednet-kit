## Линтеры — часть подключения, а не опция

Технические запреты — основная защита бренда: справка описывает правила, линтер их проверяет. Без `@mednet/lint-config` агент может незаметно уйти с бренда. **Ставьте его в каждый проект** с `@mednet/ui`, `@mednet/css` или `@mednet/tokens`.

```bash
npm i -D eslint@^9 stylelint @mednet/lint-config
```

**ESLint** (`eslint.config.mjs`). Next 16 — после конфигов Next:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import mednet from '@mednet/lint-config/eslint';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...mednet,
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts']),
]);
```

Vite/React — вместо конфигов Next берите `typescript-eslint` (`npm i -D typescript-eslint`):

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import mednet from '@mednet/lint-config/eslint';

export default defineConfig([
  ...tseslint.configs.recommended,
  ...mednet,
  globalIgnores(['dist/**']),
]);
```

**stylelint** (`stylelint.config.mjs`): `export default { extends: ['@mednet/lint-config/stylelint'] };`. Не подключайте `stylelint-config-standard` — на Tailwind v4 он даёт ложные ошибки.

В `package.json` должны быть скрипты `lint` (`eslint .`) и `lint:css` (`stylelint "**/*.css" --allow-empty-input`).

**Что запрещено:** цветовые литералы (`#fff`, `rgb()`, `hsl()`, `oklch()`) и произвольные цвета Tailwind (`bg-[#…]`) в классах, `style` и CSS; UI-библиотеки (`antd`, `@mui/*`, `@mantine/*`, `@chakra-ui/*`, `bootstrap`, `react-bootstrap`); прямой импорт `radix-ui`, `@radix-ui/*`, `@base-ui/*`; иконки не из `lucide-react`.

**Что линтер не ловит** (проверяйте сами): цвет через переменную (`const c = '#fff'`), именованные цвета в `style`, `@apply bg-[#fff]`, динамический `import('antd')`.

**Порядок работы:** прежде чем объявить работу готовой, запустите `lint`, `lint:css`, проверку типов и сборку. Ошибки линтера исправляйте кодом; `eslint-disable` / `stylelint-disable` не добавляйте — нужное исключение согласуйте с владельцами кита.
