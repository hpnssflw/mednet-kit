---
'@mednet/ui': minor
---

`lucide-react` и `react-day-picker` — peer-зависимости (как `recharts`), а не скрытые зависимости пакета. npm 7+ и pnpm 8+ ставят peer-зависимости сами, поэтому в проекте, который импортирует иконки из `lucide-react` или `ru` из `react-day-picker/locale`, они теперь попадают в его `package.json` и строгий pnpm их находит (раньше сборка в чистой установке падала с «Cannot find module 'lucide-react'»). Для yarn и отключённого `auto-install-peers`: `npm i recharts lucide-react react-day-picker`. Диапазоны те же: `lucide-react ^1.57.0`, `react-day-picker ^10.0.2`.
