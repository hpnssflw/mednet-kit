ESLint и stylelint для проектов ЦНИИОИЗ: не пускают в проект чужие UI-библиотеки, примитивы мимо `@mednet/ui`, иконки не из `lucide-react` и цвета мимо токенов. Это обязательная часть подключения кита, а не дополнение.

## Правила

1. Ставится в каждый проект с `@mednet/ui`, `@mednet/css` или `@mednet/tokens`; настройка (Next 16 и Vite), список запретов и что линтер не ловит — в разделе «Линтеры» ниже.
2. Свои запреты **дополняйте**, а не объявляйте заново — правило `no-restricted-imports` с тем же именем заменяет наше целиком:
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
3. Peer-зависимости: `eslint` ^9 или ^10, `stylelint` ^17.
