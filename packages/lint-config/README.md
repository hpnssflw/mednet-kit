# @mednet/lint-config

ESLint и stylelint для проектов ЦНИИОИЗ: не пускают в проект чужие UI-библиотеки, примитивы мимо `@mednet/ui`, иконки не из `lucide-react` и цвета вне токенов бренда. Только встроенные правила — без своих плагинов.

## ESLint (Next 16)

```bash
npm i -D eslint@^9 eslint-config-next @mednet/lint-config
```

`eslint.config.mjs` — после конфигов Next:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import mednet from '@mednet/lint-config/eslint';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...mednet,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
```

**Vite / React без Next** — вместо конфигов Next берите `typescript-eslint` (`npm i -D typescript-eslint`):

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

Свои запреты **дополняйте**, а не объявляйте заново — правило с тем же именем заменяет наше целиком:

```js
import mednet, { restrictedImports } from '@mednet/lint-config/eslint';

// …после ...mednet:
{
  rules: {
    'no-restricted-imports': [
      'error',
      { ...restrictedImports, paths: [...restrictedImports.paths, { name: 'lodash', message: 'Берите lodash-es' }] },
    ],
  },
},
```

## stylelint

```bash
npm i -D stylelint @mednet/lint-config
```

`stylelint.config.mjs`:

```js
/** @type {import('stylelint').Config} */
const config = {
  extends: ['@mednet/lint-config/stylelint'],
  ignoreFiles: ['.next/**', 'out/**', 'build/**'],
};

export default config;
```

`package.json`: `"lint:css": "stylelint \"**/*.css\" --allow-empty-input"`. Не подключайте `stylelint-config-standard`: на Tailwind v4 он даёт ложные ошибки.

## Что не ловится

Цвет через переменную (`const c = '#fff'; style={{ color: c }}`), именованные цвета в `style`, `@apply bg-[#fff]` в CSS, динамический `import('antd')`. Это ловит ревью.

## Лицензия

MIT, © 2026 ФГБУ «ЦНИИОИЗ» Минздрава России.
